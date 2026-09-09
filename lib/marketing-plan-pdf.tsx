import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import path from 'path';

const koreanFontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansKR-Variable.ttf');
Font.register({
  family: 'Noto Sans KR',
  fonts: [
    { src: koreanFontPath, fontWeight: 'normal' },
    { src: koreanFontPath, fontWeight: 'bold' },
  ],
});

const serifFontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSerifKR-Variable.ttf');
Font.register({ family: 'Noto Serif KR', fonts: [{ src: serifFontPath }] });

const brandFontPath = path.join(process.cwd(), 'assets', 'fonts', 'VarelaRound-Regular.ttf');
Font.register({ family: 'Brand Rounded', fonts: [{ src: brandFontPath }] });

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 10.5,
    lineHeight: 1.6,
    color: '#2a241f',
    backgroundColor: '#f9f5f1',
    fontFamily: 'Noto Sans KR',
  },
  brand: { fontFamily: 'Brand Rounded', fontSize: 22, color: '#2a241f', marginBottom: 20 },
  eyebrow: { fontSize: 8, color: '#9d7a5f', letterSpacing: 1.6, fontWeight: 'bold', marginBottom: 8 },
  title: { fontFamily: 'Noto Serif KR', fontSize: 22, marginBottom: 6, lineHeight: 1.3 },
  meta: { fontSize: 9, color: '#7b685e', marginBottom: 24 },
  divider: { height: 1, backgroundColor: '#ddccb4', marginBottom: 20 },
  h2: { fontSize: 13, fontWeight: 'bold', color: '#2a241f', marginTop: 22, marginBottom: 10 },
  h3: { fontSize: 10.5, fontWeight: 'bold', color: '#9d7a5f', marginTop: 12, marginBottom: 5 },
  p: { marginBottom: 6, color: '#403a36' },
  qaBlock: { marginBottom: 12 },
  qaQ: { fontSize: 9.5, fontWeight: 'bold', color: '#9d7a5f', marginBottom: 3 },
  qaA: { fontSize: 9.5, color: '#403a36' },
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bulletDot: { width: 10, color: '#9d7a5f' },
  bulletText: { flex: 1, color: '#403a36' },
  disclaimer: {
    fontSize: 8.5,
    color: '#a99987',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8dac7',
    borderTopStyle: 'solid',
  },
});

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function MarketingPlanDocument() {
  const dateLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>jiyu.</Text>
        <Text style={styles.eyebrow}>MARKETING PLAN</Text>
        <Text style={styles.title}>인스타그램 · 유튜브 마케팅 실행안</Text>
        <Text style={styles.meta}>{dateLabel} · jiyu design 내부 검토용</Text>
        <View style={styles.divider} />

        <Text style={styles.h2}>1. 전략 가설</Text>
        <View style={styles.qaBlock}>
          <Text style={styles.qaQ}>클라이언트에게 가장 필요한 것은 무엇인가?</Text>
          <Text style={styles.qaA}>
            신규 개원·이전을 준비하는 원장이 "이 시공사에 맡겨도 안전하다"는 확신을 가질 수 있는 근거 — 실제
            완성된 병의원 공간의 결과물을 눈으로 확인하는 것입니다. 병의원 인테리어는 일반 상업공간보다
            의료장비·동선·위생 기준이 얽혀있어, 유사 업종 시공 이력이 신뢰의 핵심 근거가 됩니다.
          </Text>
        </View>
        <View style={styles.qaBlock}>
          <Text style={styles.qaQ}>클라이언트의 가장 큰 고민은 무엇인가?</Text>
          <Text style={styles.qaA}>
            예산 초과, 개원 일정 지연, 그리고 "설명은 들었지만 실제로 어떤 느낌일지 모르겠다"는 불확실성입니다.
            특히 첫 개원이거나 이전 시공 경험이 없는 원장일수록 이 불안감이 크게 작용합니다.
          </Text>
        </View>
        <View style={styles.qaBlock}>
          <Text style={styles.qaQ}>어떤 타겟(페르소나)이 필요한가?</Text>
          <Text style={styles.qaA}>
            30대 후반~50대 초반, 신규 개원 또는 이전·리모델링을 준비 중인 병의원 원장(치과·한의원·피부과·성형외과
            중심). 인테리어 레퍼런스는 인스타그램에서 비주얼 위주로 탐색하고, 시공 과정·비용 감각 같은 정보성
            콘텐츠는 유튜브에서 소비하는 경향이 있어 두 채널을 상호보완적으로 운영하는 것이 유효합니다.
          </Text>
        </View>

        <Text style={styles.h2}>2. 인스타그램 실행안</Text>
        <Text style={styles.h3}>콘텐츠 축</Text>
        <Bullet>비포·애프터: 시공 전후 비교 (병의원 인테리어에서 가장 반응이 좋은 포맷)</Bullet>
        <Bullet>공정 하이라이트: 철거~마감까지 과정을 짧게 요약한 릴스</Bullet>
        <Bullet>무드보드 카드: 프로젝트별 컬러 팔레트·마감재 조합을 정리한 카드뉴스형 피드</Bullet>
        <Bullet>원장 인터뷰 캡션: 실제 클라이언트의 후기를 짧은 인터뷰 형식으로 caption에 녹여 신뢰도 보강</Bullet>

        <Text style={styles.h3}>운영 리듬 (권장 최소 기준)</Text>
        <Bullet>피드 게시: 주 2~3회 (완성 사례 위주)</Bullet>
        <Bullet>릴스: 주 2회 (공정 과정, 15~30초 내외)</Bullet>
        <Bullet>스토리 하이라이트 4종: 시공사례 / 견적 안내 / 자주 묻는 질문 / 오시는 길</Bullet>

        <Text style={styles.h3}>해시태그·태깅</Text>
        <Bullet>지역+업종 조합(예: #강남치과인테리어) + 병의원 인테리어 일반 태그를 병행</Bullet>
        <Bullet>완공 후 클라이언트 계정 태그 요청 — 상호 노출 효과</Bullet>

        <Text style={styles.h2}>3. 유튜브 실행안</Text>
        <Text style={styles.h3}>숏츠 (우선순위 높음)</Text>
        <Bullet>"OO평 병의원 인테리어, 예산은 얼마나 들까?" 류의 정보성 짧은 영상</Bullet>
        <Bullet>시공 비하인드 타임랩스 (30초 내외)</Bullet>
        <Text style={styles.h3}>롱폼 (선택, 월 1~2회)</Text>
        <Bullet>완료 프로젝트 케이스 스터디 — 원장 인터뷰 + 비포/애프터 풀 투어</Bullet>

        <Text style={styles.disclaimer}>
          jiyu design 내부 검토용 자료입니다. 다음 페이지의 기대효과는 실제 성과를 보장하지 않는 보수적 정성
          평가이며, 구체적 수치 예측이 아닙니다.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>4. 기대효과 (보수적 추정)</Text>
        <Text style={styles.p}>
          비포·애프터 및 공정 콘텐츠는 인테리어 업종에서 일반적으로 저장·공유가 잘 일어나는 포맷으로 알려져 있어,
          꾸준히 게시할 경우 브랜드 인지도 축적과 문의 전환에 점진적으로 기여하는 경향이 있습니다. 다만 계정 초기
          단계에서는 노출이 제한적일 수 있고, 성과는 콘텐츠 품질과 게시 꾸준함에 따라 크게 달라지므로 특정 수치
          (팔로워 수, 문의 건수 등)를 약속드리지는 않습니다.
        </Text>

        <Text style={styles.h2}>5. 리스크</Text>
        <Bullet>촬영·편집 리소스 필요 — 현장 사진/영상을 시공 단계별로 확보하는 프로세스가 선행되어야 함</Bullet>
        <Bullet>초기 계정 성장은 시간이 걸리며, 알고리즘 변화에 따라 노출이 변동될 수 있음</Bullet>
        <Bullet>과장된 성과 표현(표시광고법 저촉 소지)은 지양 — 실제 시공 사례 기반 콘텐츠만 사용 권장</Bullet>

        <Text style={styles.h2}>6. 다음 단계 제안</Text>
        <Bullet>완료·진행 중 프로젝트 중 콘텐츠화 가능한 현장부터 촬영 우선순위 선정</Bullet>
        <Bullet>4주 콘텐츠 캘린더 초안 작성 (요청 시 별도로 준비 가능)</Bullet>
        <Bullet>인스타그램 하이라이트·프로필 정비 (홈페이지 링크, 상담 신청 CTA 연결)</Bullet>

        <Text style={styles.disclaimer}>jiyu design · Marketing Task Force 초안</Text>
      </Page>
    </Document>
  );
}

export async function renderMarketingPlanPdf(): Promise<Buffer> {
  return renderToBuffer(<MarketingPlanDocument />);
}
