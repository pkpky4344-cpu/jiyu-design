import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { GeneratedReports } from './reports';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.6, color: '#2a241f', backgroundColor: '#f9f5f1' },
  brand: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  brandTag: { fontSize: 9, color: '#7b685e', marginBottom: 24, letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
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
        <Text style={styles.brand}>jiyu design</Text>
        <Text style={styles.brandTag}>INTERIOR STUDIO</Text>
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
