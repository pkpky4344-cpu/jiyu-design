import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MODEL = 'claude-sonnet-5';

const FORMAT_INSTRUCTIONS =
  '마크다운 문법(#, *, **, |표 등)은 쓰지 말고 일반 텍스트 문단으로만 작성하세요. 한국어로, 고객에게 보내는 정중한 톤으로 작성하세요.';

type ChatbotLeadInput = {
  hospitalType: string;
  stage: string;
  sizeRange: string;
  extraRequest: string;
};

function thisMonthLabel() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

async function generateSection(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }],
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n')
    .trim();
}

export type GeneratedReports = {
  estimate: string;
  design: string;
  trend: string;
};

export async function generateReports(lead: ChatbotLeadInput): Promise<GeneratedReports> {
  const month = thisMonthLabel();

  const [estimate, design, trend] = await Promise.all([
    generateSection(`당신은 인테리어 시공 회사 jiyu design의 견적 담당자입니다. ${month} 기준 한국의 시중 인테리어 공사 단가를 웹 검색으로 확인한 뒤, 아래 조건에 맞는 참고용 개산 견적을 작성하세요.

병원 종류: ${lead.hospitalType}
진행 단계: ${lead.stage}
평수: ${lead.sizeRange}
추가 요청: ${lead.extraRequest || '없음'}

반드시 지킬 것:
- 문서 맨 앞에 "이 자료는 정식 견적이 아니라 참고용 개산 추정치이며, 실제 견적은 현장 실측과 상담 후 확정됩니다"라는 안내를 명시할 것
- 근거 없는 수치를 지어내지 말고, 검색으로 확인한 자료를 바탕으로 평당 대략적인 범위로 제시할 것
- 철거/전기/설비/목공/마감 등 공종별 대략적인 항목과 비용 범위를 문단으로 정리할 것

${FORMAT_INSTRUCTIONS}`),

    generateSection(`당신은 인테리어 디자이너입니다. 아래 조건의 병의원 공간에 어울리는 맞춤 디자인 방향을 제안하세요.

병원 종류: ${lead.hospitalType}
평수: ${lead.sizeRange}
추가 요청: ${lead.extraRequest || '없음'}

이 평수에 맞는 공간 배치, 추천 컬러와 마감재, 대기·진료 동선 제안을 포함하세요.

${FORMAT_INSTRUCTIONS}`),

    generateSection(`당신은 인테리어 트렌드 분석가입니다. ${month} 기준 최신 ${lead.hospitalType} 인테리어 트렌드를 웹 검색으로 확인한 뒤 정리하세요. 최근 유행하는 디자인 스타일, 소재, 컬러, 공간 구성 트렌드를 포함하세요.

${FORMAT_INSTRUCTIONS}`),
  ]);

  return { estimate, design, trend };
}
