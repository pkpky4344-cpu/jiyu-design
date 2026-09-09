import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MODEL = 'claude-sonnet-5';

type ChatbotLeadInput = {
  hospitalType: string;
  stage: string;
  sizeRange: string;
  extraRequest: string;
};

export type GeneratedReports = {
  estimate: string;
  design: string;
  trend: string;
};

function thisMonthLabel() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

const ESTIMATE_MARKER = '===견적===';
const DESIGN_MARKER = '===디자인===';
const TREND_MARKER = '===트렌드===';

function extractSection(fullText: string, startMarker: string, endMarker: string | null): string {
  const startIndex = fullText.indexOf(startMarker);
  if (startIndex === -1) return '';
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? fullText.indexOf(endMarker, contentStart) : -1;
  const raw = endIndex === -1 ? fullText.slice(contentStart) : fullText.slice(contentStart, endIndex);
  return raw.trim();
}

// 3개 요청을 동시에(병렬) 보내면 신규/저등급 Anthropic 계정의 분당 요청 한도에 걸려
// 재시도가 반복되며 크게 느려질 수 있어, 한 번의 호출로 3개 섹션을 모두 받는다.
export async function generateReports(lead: ChatbotLeadInput): Promise<GeneratedReports> {
  const month = thisMonthLabel();

  const prompt = `당신은 인테리어 시공 회사 jiyu design의 상담 자료 작성 담당자입니다. 아래 조건의 고객에게 보낼 3가지 자료를 작성하세요.

병원 종류: ${lead.hospitalType}
진행 단계: ${lead.stage}
평수: ${lead.sizeRange}
추가 요청: ${lead.extraRequest || '없음'}

웹 검색은 전체를 통틀어 **최대 1회만** 사용할 수 있습니다 (${month} 기준 최신 시중 인테리어 단가 또는 트렌드 중 더 중요하다고 판단되는 것 하나만 확인). 검색 결과는 핵심 정보만 짧게 참고하고, 검색 없이도 보유 지식으로 충분히 답할 수 있는 부분은 검색하지 마세요.

세 자료를 아래 형식 그대로, 각 마커를 정확히 포함해서 순서대로 작성하세요 (마커 앞뒤에 다른 텍스트를 추가하지 마세요):

${ESTIMATE_MARKER}
참고용 개산 견적을 작성하세요.
- 맨 앞에 "이 자료는 정식 견적이 아니라 참고용 개산 추정치이며, 실제 견적은 현장 실측과 상담 후 확정됩니다"라는 안내를 명시할 것
- 근거 없는 수치를 지어내지 말고, 알고 있는 일반적인 시세 감각을 바탕으로 평당 대략적인 범위로 제시할 것
- 철거/전기/설비/목공/마감 등 공종별 대략적인 항목과 비용 범위를 문단으로 정리할 것

${DESIGN_MARKER}
이 평수의 병의원 공간에 어울리는 맞춤 디자인 방향을 제안하세요. 공간 배치, 추천 컬러와 마감재, 대기·진료 동선 제안을 포함하세요.

${TREND_MARKER}
${month} 기준 ${lead.hospitalType} 인테리어 트렌드를, 뭉뚱그린 스타일 설명 말고 아래 내용 위주로 **짧고 구체적으로** 정리하세요:
- 요즘 많이 쓰이는 마감재를 소재명 수준으로 1~2개 구체적으로 언급 (예: 특정 종류의 스톤, 우드톤, 도장 마감 등)
- 병의원 특화 동선 구조 트렌드 한 가지 (접수·대기·진료 공간 배치 방식)
- 유행하는 컬러 팔레트 한 가지

${DESIGN_MARKER} 섹션과 내용이 겹치지 않도록, 트렌드 섹션은 "요즘 업계 전반의 흐름"에, 디자인 섹션은 "이 고객 공간에 대한 제안"에 집중하세요.

각 섹션 모두: 마크다운 문법(#, *, **, |표 등)은 쓰지 말고 일반 텍스트 문단으로만, 한국어로, 고객에게 보내는 정중한 톤으로, **문단마다 2~3문장 이내로 간결하게** 작성하세요. 모든 섹션 2문단 이내.

중요: 검색 사용 여부, 도구 한도, "AI가 작성했다" 등 작성 과정이나 시스템 내부 사정에 대한 언급은 절대 출력에 포함하지 마세요. 검색 결과를 못 받아왔더라도 그 사실을 언급하지 말고, 보유 지식으로 자연스럽게 완결된 문장만 작성하세요. 고객은 최종 결과물만 봅니다.`;

  const callStart = Date.now();
  console.log('[reports] calling Anthropic messages.create...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4500,
    output_config: { effort: 'low' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 1 }],
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`[reports] Anthropic call finished in ${Date.now() - callStart}ms, stop_reason=${response.stop_reason}, usage=${JSON.stringify(response.usage)}`);

  const fullText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n')
    .trim();

  return {
    estimate: extractSection(fullText, ESTIMATE_MARKER, DESIGN_MARKER),
    design: extractSection(fullText, DESIGN_MARKER, TREND_MARKER),
    trend: extractSection(fullText, TREND_MARKER, null),
  };
}
