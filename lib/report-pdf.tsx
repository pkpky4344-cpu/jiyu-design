import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import path from 'path';
import type { GeneratedReports } from './reports';

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

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    lineHeight: 1.6,
    color: '#2a241f',
    backgroundColor: '#f9f5f1',
    fontFamily: 'Noto Sans KR',
  },
  brandRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 28 },
  brandTagCol: { flexDirection: 'column', paddingBottom: 3 },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  meta: { fontSize: 10, color: '#54463e', marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 20, marginBottom: 8, color: '#9d7a5f' },
  paragraph: { marginBottom: 8 },
  disclaimer: {
    fontSize: 9,
    color: '#7b685e',
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8dac7',
    borderTopStyle: 'solid',
  },
});

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

function Section({ title, content }: { title: string; content: string }) {
  const paragraphs = content.split('\n').filter((line) => line.trim().length > 0);
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
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
        <Text style={styles.title}>{params.name}님을 위한 맞춤 상담 자료</Text>
        <Text style={styles.meta}>
          {dateLabel} · {params.hospitalType} · {params.stage} · {params.sizeRange}
        </Text>

        <Section title="참고 견적" content={params.reports.estimate} />
        <Section title="맞춤 디자인 제안" content={params.reports.design} />
        <Section title="인테리어 트렌드" content={params.reports.trend} />

        <Text style={styles.disclaimer}>
          본 자료의 견적은 참고용 개산 추정치이며, 실제 견적은 현장 실측 및 상담 후 확정됩니다. 문의: hello@jiyudesign.co.kr
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
