import { Resend } from 'resend';

function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendReportEmail(params: { to: string; name: string; pdf: Buffer }) {
  const resend = getClient();

  const { error } = await resend.emails.send({
    from: 'jiyu design <hello@jiyudesign.co.kr>',
    to: params.to,
    subject: '[jiyu design] 맞춤 상담 자료를 보내드립니다',
    text: `${params.name}님, 안녕하세요.\n\n요청하신 인테리어 상담 자료(참고 견적 / 맞춤 디자인 제안 / 트렌드 리포트)를 PDF로 정리해 첨부드립니다.\n\n감사합니다.\njiyu design 드림`,
    attachments: [{ filename: 'jiyu-design-consult-report.pdf', content: params.pdf }],
  });

  if (error) {
    throw new Error(`Resend 발송 실패: ${error.message}`);
  }
}
