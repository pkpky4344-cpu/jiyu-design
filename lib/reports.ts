import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MODEL = 'claude-sonnet-5';

type ChatbotLeadInput = {
  hospitalType: string;
  stage: string;
  sizeRange: string;
  extraRequest: string;
};

export type PaletteColor = { hex: string; label: string };
export type ReportItem = { label: string; value: string };

export type GeneratedReports = {
  estimateHeadline: string;
  estimateItems: ReportItem[];
  designItems: ReportItem[];
  trendItems: ReportItem[];
  palette: PaletteColor[];
};

function thisMonthLabel() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

const ESTIMATE_MARKER = '===견적===';
const DESIGN_MARKER = '===디자인===';
const TREND_MARKER = '===트렌드===';
const PALETTE_MARKER = '===팔레트===';

function extractSection(fullText: string, startMarker: string, endMarker: string | null): string {
  const startIndex = fullText.indexOf(startMarker);
  if (startIndex === -1) return '';
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? fullText.indexOf(endMarker, contentStart) : -1;
  const raw = endIndex === -1 ? fullText.slice(contentStart) : fullText.slice(contentStart, endIndex);
  return raw.trim();
}

const HEX_LINE = /#([0-9a-fA-F]{6})\s*\|\s*([^\n|]+)/;

// 모델이 형식을 어겨도(줄 순서, 여분 텍스트 등) 죽지 않도록 한 줄씩 정규식으로만 파싱하고,
// 유효한 줄만 채택한다 — 2개 미만이면 스와치 블록 자체를 렌더링하지 않는다(report-pdf.tsx에서 처리).
function parsePalette(sectionText: string): PaletteColor[] {
  const colors: PaletteColor[] = [];
  for (const line of sectionText.split('\n')) {
    const match = line.match(HEX_LINE);
    if (match) {
      colors.push({ hex: `#${match[1]}`, label: match[2].trim() });
    }
    if (colors.length >= 3) break;
  }
  return colors;
}

const ITEM_LINE = /^([^|\n]{1,20})\|(.{1,80})$/;
const HEADLINE_LINE = /^총평\s*:\s*(.+)$/;

// "라벨 | 내용" 형식 줄만 채택 — 라벨 길이를 20자로 제한해 문단이 통째로
// 한 줄에 들어와 파싱되는 것(형식 위반)을 걸러낸다.
function parseItems(sectionText: string, maxItems: number): ReportItem[] {
  const items: ReportItem[] = [];
  for (const line of sectionText.split('\n')) {
    const match = line.trim().match(ITEM_LINE);
    if (match) {
      items.push({ label: match[1].trim(), value: match[2].trim() });
    }
    if (items.length >= maxItems) break;
  }
  return items;
}

function parseHeadline(sectionText: string): string {
  for (const line of sectionText.split('\n')) {
    const match = line.trim().match(HEADLINE_LINE);
    if (match) return match[1].trim();
  }
  return '';
}

// 3개 요청을 동시에(병렬) 보내면 신규/저등급 Anthropic 계정의 분당 요청 한도에 걸려
// 재시도가 반복되며 크게 느려질 수 있어, 한 번의 호출로 모든 섹션을 받는다.
export async function generateReports(lead: ChatbotLeadInput): Promise<GeneratedReports> {
  const month = thisMonthLabel();

  const prompt = `당신은 인테리어 시공 회사 jiyu design의 상담 자료 작성 담당자입니다. 아래 조건의 고객에게 보낼 상담 자료를 작성하세요. 이 자료는 PPT 슬라이드처럼 시각적으로 훑어보는 용도이므로, 문단 설명 대신 짧은 항목 단위로 작성합니다.

병원 종류: ${lead.hospitalType}
진행 단계: ${lead.stage}
평수: ${lead.sizeRange}
추가 요청: ${lead.extraRequest || '없음'}

웹 검색은 **반드시 1회 수행**하여 ${month} 기준 최신 병의원 인테리어 시중 단가(자재비·인건비 등)를 확인한 뒤, 그 결과를 견적 항목(${ESTIMATE_MARKER} 섹션)에 반영하세요. 검색 결과를 그대로 나열하지 말고 핵심 수치만 자연스럽게 요약해 사용하세요. 검색은 이 1회로 제한되며, 트렌드 등 다른 섹션은 검색 없이 보유 지식으로 작성하세요.

아래 형식 그대로, 각 마커를 정확히 포함해서 순서대로 작성하세요 (마커 앞뒤에 다른 텍스트를 추가하지 마세요, 마크다운 문법(#, *, **, |표 등)은 절대 쓰지 마세요 — "|"는 오직 라벨과 내용을 구분하는 구분자로만 사용):

${ESTIMATE_MARKER}
총평: 전체 평당 공사비 대략적 범위만 담은 한 문장. 병원 종류나 평수는 절대 다시 언급하지 말 것(이미 다른 곳에 표시됨) — "평당 O~O만원 수준의 참고용 개산 추정치입니다" 형식만 지킬 것. 반드시 "참고용 개산 추정치" 표현 포함.
공종 라벨(6자 이내) | 비용 범위(예: 평당 O~O만원)
(공종당 한 줄씩, 철거/전기·조명/설비/목공·마감 등 최대 4개 줄. 근거 없는 수치를 지어내지 말고 일반적인 시세 감각 범위로 제시)

${DESIGN_MARKER}
라벨(6자 이내) | 한 문장 제안(30자 내외)
(정확히 3줄: 공간배치 / 컬러·마감재 / 동선 순서로. 이 평수의 병의원 공간에 어울리는 맞춤 제안)

${PALETTE_MARKER}
바로 위 ${DESIGN_MARKER}에서 제안한 컬러와 일치하는 팔레트 정확히 3가지, 한 줄에 하나씩:
#RRGGBB | 색상 한글명
실제 인테리어 마감재에 쓰이는 현실적인 색상의 HEX 코드를 사용하세요(예: 웜 아이보리 #F1E9DC 계열, 우드톤 #B08968 계열, 딥그린 #47584A 계열 등 실제 톤에 맞게).

${TREND_MARKER}
라벨(6자 이내) | 한 문장(30자 내외, ${month} 기준 업계 전반의 흐름, ${DESIGN_MARKER}와 겹치지 않게)
(정확히 3줄: 마감재 / 동선 / 컬러 순서로)

중요: 검색 사용 여부, 도구 한도, "AI가 작성했다" 등 작성 과정이나 시스템 내부 사정에 대한 언급은 절대 출력에 포함하지 마세요. 고객은 최종 결과물만 봅니다.`;

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

  const estimateSection = extractSection(fullText, ESTIMATE_MARKER, DESIGN_MARKER);

  return {
    estimateHeadline: parseHeadline(estimateSection),
    estimateItems: parseItems(estimateSection, 4),
    designItems: parseItems(extractSection(fullText, DESIGN_MARKER, PALETTE_MARKER), 3),
    palette: parsePalette(extractSection(fullText, PALETTE_MARKER, TREND_MARKER)),
    trendItems: parseItems(extractSection(fullText, TREND_MARKER, null), 3),
  };
}

// 생성된 초안을 그대로 마커 형식 텍스트로 되돌린다 — 교정 호출의 출력도 같은
// 형식이므로 위의 parseHeadline/parseItems/parsePalette를 그대로 재사용할 수 있다.
function serializeForProofread(reports: GeneratedReports): string {
  const estimateLines = [
    `총평: ${reports.estimateHeadline}`,
    ...reports.estimateItems.map((item) => `${item.label} | ${item.value}`),
  ].join('\n');
  const designLines = reports.designItems.map((item) => `${item.label} | ${item.value}`).join('\n');
  const paletteLines = reports.palette.map((color) => `${color.hex} | ${color.label}`).join('\n');
  const trendLines = reports.trendItems.map((item) => `${item.label} | ${item.value}`).join('\n');

  return `${ESTIMATE_MARKER}\n${estimateLines}\n\n${DESIGN_MARKER}\n${designLines}\n\n${PALETTE_MARKER}\n${paletteLines}\n\n${TREND_MARKER}\n${trendLines}`;
}

// 발송 전 최종 오타/어색한 표현 교정 단계. 실패하거나 형식을 벗어나면(파싱 결과가
// 원본보다 항목이 적으면) 해당 필드는 원본을 그대로 유지한다 — 교정 단계의 실패가
// 발송 자체를 막아서는 안 된다.
export async function proofreadReports(reports: GeneratedReports): Promise<GeneratedReports> {
  const draft = serializeForProofread(reports);

  const prompt = `아래는 병의원 인테리어 상담 자료 초안입니다. 오타와 어색한 표현만 자연스럽게 다듬어 주세요.

규칙:
- 형식(마커, "라벨 | 내용" 구조, 줄바꿈)을 절대 바꾸지 마세요.
- 숫자, HEX 색상 코드, 비용 범위는 절대 바꾸지 마세요 — 표현만 다듬으세요.
- 이미 자연스러운 줄은 그대로 두세요.
- 다른 설명 없이 같은 형식으로만 전체를 다시 출력하세요.

${draft}`;

  const callStart = Date.now();
  console.log('[reports] calling proofread pass...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  });
  console.log(`[reports] proofread pass finished in ${Date.now() - callStart}ms, stop_reason=${response.stop_reason}`);

  const fullText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n\n')
    .trim();

  const estimateSection = extractSection(fullText, ESTIMATE_MARKER, DESIGN_MARKER);
  const headline = parseHeadline(estimateSection);
  const estimateItems = parseItems(estimateSection, 4);
  const designItems = parseItems(extractSection(fullText, DESIGN_MARKER, PALETTE_MARKER), 3);
  const palette = parsePalette(extractSection(fullText, PALETTE_MARKER, TREND_MARKER));
  const trendItems = parseItems(extractSection(fullText, TREND_MARKER, null), 3);

  return {
    estimateHeadline: headline || reports.estimateHeadline,
    estimateItems: estimateItems.length >= reports.estimateItems.length ? estimateItems : reports.estimateItems,
    designItems: designItems.length >= reports.designItems.length ? designItems : reports.designItems,
    palette: palette.length >= reports.palette.length ? palette : reports.palette,
    trendItems: trendItems.length >= reports.trendItems.length ? trendItems : reports.trendItems,
  };
}
