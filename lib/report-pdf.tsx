import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import path from 'path';
import type { GeneratedReports, PaletteColor, ReportItem } from './reports';

// 기본 PDF 폰트(Helvetica)는 한글을 지원하지 않아 별도의 한글 폰트를 등록한다.
// 가변 폰트 파일 하나를 normal/bold 양쪽에 등록 — 굵기 구분은 안 되지만 렌더링은 정상 동작한다.
const koreanFontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansKR-Variable.ttf');
Font.register({
  family: 'Noto Sans KR',
  fonts: [
    { src: koreanFontPath, fontWeight: 'normal' },
    { src: koreanFontPath, fontWeight: 'bold' },
  ],
});

// 로고 워드마크("jiyu." / INTERIOR / STUDIO)는 영문 전용이라 한글 폰트 대신
// 실제 로고 폰트(Arial Rounded MT Bold, 라이선스 폰트라 임베드 불가)와 가장 가까운
// 무료 라운드 지오메트릭 서체(Varela Round, 단일 정적 굵기)를 별도로 등록해 사용한다.
const brandFontPath = path.join(process.cwd(), 'assets', 'fonts', 'VarelaRound-Regular.ttf');
Font.register({
  family: 'Brand Rounded',
  fonts: [{ src: brandFontPath }],
});

// 참고 무드보드(우아한 세리프 타이틀 + 넘버링 프로세스 레이아웃)를 재현하기 위한
// 한글 세리프 폰트. 가변 폰트라 굵기 구분은 안 되지만 타이틀/넘버 용도라 문제없다.
const serifFontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSerifKR-Variable.ttf');
Font.register({
  family: 'Noto Serif KR',
  fonts: [{ src: serifFontPath }],
});

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    lineHeight: 1.6,
    color: '#2a241f',
    backgroundColor: '#f9f5f1',
    fontFamily: 'Noto Sans KR',
  },
  brandRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 30 },
  brandTagCol: { flexDirection: 'column', paddingBottom: 3 },
  // letterSpacing이 붙은 라벨은 pdfkit에서 첫 글자가 살짝 잘려 보이는 경우가 있어
  // paddingLeft로 여유를 준다 — 값도 과도하지 않게 낮춰 안전하게 조정.
  eyebrow: { fontSize: 8, color: '#9d7a5f', letterSpacing: 1.2, paddingLeft: 1, fontWeight: 'bold', marginBottom: 8 },
  title: { fontFamily: 'Noto Serif KR', fontSize: 27, marginBottom: 10, lineHeight: 1.35, color: '#2a241f' },
  meta: { fontSize: 9, color: '#7b685e', letterSpacing: 0.5, marginBottom: 14 },
  divider: { height: 1, width: 64, backgroundColor: '#9d7a5f', marginBottom: 30 },

  // 표지처럼 — 컬러 스토리를 큼직한 컬러 밴드로 최상단에 배치
  paletteBand: { flexDirection: 'row', marginBottom: 32 },
  paletteBandItem: { flex: 1, marginRight: 14 },
  paletteBandSwatch: { height: 74, borderRadius: 4, marginBottom: 8 },
  paletteBandLabel: { fontSize: 8, color: '#7b685e', letterSpacing: 0.3 },

  // 총평 — 풀 쿼트 스타일 헤드라인. 별도의 얇은 바 View를 텍스트와 같은 행(row)에 두면
  // pdfkit에서 텍스트 시작 부분이 잘려 보이는 렌더링 버그가 있어, border 속성으로 대체한다
  // (border는 박스 자체의 내재 속성이라 별도 크기 계산이 필요 없어 안전하다).
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#9d7a5f',
    borderLeftStyle: 'solid',
    paddingLeft: 16,
    marginBottom: 34,
  },
  quoteLabel: { fontSize: 8, color: '#9d7a5f', letterSpacing: 1.2, fontWeight: 'bold', marginBottom: 8 },
  quoteValue: { fontSize: 15, fontWeight: 'bold', color: '#2a241f', lineHeight: 1.5 },

  // 디자인 & 트렌드 — 참고 무드보드의 넘버링 프로세스 스타일 (세로 라인 + 큰 세리프 숫자)
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 6, marginBottom: 20, color: '#2a241f', letterSpacing: 0.5, paddingLeft: 1 },
  timeline: { borderLeftWidth: 1, borderLeftColor: '#ddccb4', borderLeftStyle: 'solid', marginLeft: 4 },
  pointItem: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 22, marginBottom: 22 },
  pointDot: { position: 'absolute', left: -4.5, top: 4, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#f9f5f1' },
  pointNumber: { fontFamily: 'Noto Serif KR', fontSize: 22, color: '#d3c1a6', marginRight: 14, lineHeight: 1 },
  pointBody: { flex: 1 },
  pointBadgeText: { fontSize: 7, letterSpacing: 0.4, paddingLeft: 1, marginBottom: 4, fontWeight: 'bold' },
  pointLabel: { fontSize: 10.5, fontWeight: 'bold', color: '#2a241f', marginBottom: 3 },
  pointValue: { fontSize: 9.5, color: '#54463e', lineHeight: 1.5 },

  // 참고 견적 — 페이지 하단의 보조 스펙 시트 (강조하지 않음)
  specSheet: { marginTop: 6 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8dac7',
    borderBottomStyle: 'solid',
  },
  specLabel: { fontSize: 8.5, color: '#7b685e' },
  specValue: { fontSize: 8.5, color: '#2a241f' },
  specNote: { fontSize: 7.5, color: '#9d7a5f', marginTop: 8 },

  disclaimer: {
    fontSize: 8.5,
    color: '#a99987',
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e8dac7',
    borderTopStyle: 'solid',
  },
});

const DESIGN_ACCENT_COLOR = '#9d7a5f';
const TREND_ACCENT_COLOR = '#6f7d68';

// Varela Round은 정적 굵은 굵기 파일이 없어, 텍스트를 살짝 겹쳐 그려("페이크 볼드")
// 실제 로고(Arial Rounded MT Bold)에 가까운 두께를 낸다.
const brandMarkStyle = { fontFamily: 'Brand Rounded', fontSize: 40, lineHeight: 1, color: '#2a241f' };
const brandTagStyle = { fontFamily: 'Brand Rounded', fontSize: 9, lineHeight: 1.5, color: '#54463e', letterSpacing: 0.6 };

function BoldBrandText({ style, offset, children }: { style: Style; offset: number; children: string }) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={style}>{children}</Text>
      <Text style={{ ...style, position: 'absolute', top: 0, left: offset }}>{children}</Text>
    </View>
  );
}

// 최소 2개 색상이 있어야 컬러 밴드를 보여준다 — 모델이 형식을 어겨 1개 이하만
// 파싱됐을 때는 빈 밴드만 남는 대신 아예 렌더링하지 않는다.
function PaletteBand({ colors }: { colors: PaletteColor[] }) {
  if (colors.length < 2) return null;
  return (
    <View style={styles.paletteBand}>
      {colors.map((color, index) => (
        <View key={index} style={{ ...styles.paletteBandItem, marginRight: index === colors.length - 1 ? 0 : 10 }}>
          <View style={{ ...styles.paletteBandSwatch, backgroundColor: color.hex }} />
          <Text style={styles.paletteBandLabel}>{color.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SpecSheet({ items }: { items: ReportItem[] }) {
  return (
    <View style={styles.specSheet}>
      {items.map((item, index) => (
        <View key={index} style={styles.specRow}>
          <Text style={styles.specLabel}>{item.label}</Text>
          <Text style={styles.specValue}>{item.value}</Text>
        </View>
      ))}
      <Text style={styles.specNote}>* 참고용 개산 추정치 — 실제 견적은 현장 실측 후 확정</Text>
    </View>
  );
}

function PointItem({
  item,
  badge,
  accentColor,
  number,
}: {
  item: ReportItem;
  badge: string;
  accentColor: string;
  number: number;
}) {
  return (
    <View style={styles.pointItem}>
      <View style={{ ...styles.pointDot, backgroundColor: accentColor }} />
      <Text style={styles.pointNumber}>{String(number).padStart(2, '0')}</Text>
      <View style={styles.pointBody}>
        <Text style={{ ...styles.pointBadgeText, color: accentColor }}>{badge}</Text>
        <Text style={styles.pointLabel}>{item.label}</Text>
        <Text style={styles.pointValue}>{item.value}</Text>
      </View>
    </View>
  );
}

export async function renderReportPdf(params: {
  name: string;
  hospitalType: string;
  stage: string;
  sizeRange: string;
  reports: GeneratedReports;
}) {
  const dateLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View style={{ marginRight: 10 }}>
            <BoldBrandText style={brandMarkStyle} offset={0.5}>jiyu.</BoldBrandText>
          </View>
          <View style={styles.brandTagCol}>
            <BoldBrandText style={brandTagStyle} offset={0.3}>INTERIOR</BoldBrandText>
            <BoldBrandText style={brandTagStyle} offset={0.3}>STUDIO</BoldBrandText>
          </View>
        </View>
        <Text style={styles.eyebrow}>CONSULTING BRIEF</Text>
        <Text style={styles.title}>{params.name}님을 위한{'\n'}맞춤 상담 자료</Text>
        <Text style={styles.meta}>
          {dateLabel} · {params.hospitalType} · {params.stage} · {params.sizeRange}
        </Text>
        <View style={styles.divider} />

        <PaletteBand colors={params.reports.palette} />

        {params.reports.estimateHeadline ? (
          <View style={styles.quote}>
            <Text style={styles.quoteLabel}>PROJECT SUMMARY</Text>
            <Text style={styles.quoteValue}>{params.reports.estimateHeadline}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>DESIGN & TREND POINTS</Text>
        <View style={styles.timeline}>
          {params.reports.designItems.map((item, index) => (
            <PointItem
              key={`design-${index}`}
              item={item}
              badge="맞춤 제안"
              accentColor={DESIGN_ACCENT_COLOR}
              number={index + 1}
            />
          ))}
          {params.reports.trendItems.map((item, index) => (
            <PointItem
              key={`trend-${index}`}
              item={item}
              badge="트렌드"
              accentColor={TREND_ACCENT_COLOR}
              number={params.reports.designItems.length + index + 1}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>참고 견적</Text>
        <SpecSheet items={params.reports.estimateItems} />

        <Text style={styles.disclaimer}>
          본 자료의 견적은 참고용 개산 추정치이며, 실제 견적은 현장 실측 및 상담 후 확정됩니다. 문의: nokks680627@naver.com
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
