import { getChatbotLeadById, updateChatbotLeadReportStatus } from './db';
import { generateReports, proofreadReports } from './reports';
import { renderReportPdf } from './report-pdf';
import { sendReportEmail } from './email';

export type ReportOutcome = 'sent' | 'failed' | 'skipped';

export async function processChatbotReport(leadId: number): Promise<ReportOutcome> {
  const t0 = Date.now();
  const mark = (label: string) => console.log(`[chatbot report] lead ${leadId} — ${label} at +${Date.now() - t0}ms`);

  try {
    const lead = await getChatbotLeadById(leadId);
    mark('fetched lead');
    if (!lead || !lead.email || !lead.consent1) return 'skipped';

    const draftReports = await generateReports({
      hospitalType: lead.hospital_type,
      stage: lead.stage,
      sizeRange: lead.size_range,
      extraRequest: lead.extra_request,
    });
    mark('generateReports done');

    // 발송 전 최종 오타/표현 교정 — 이 단계 자체가 실패해도 발송을 막지 않고
    // 교정 전 초안으로 계속 진행한다(이미 검증된 콘텐츠이므로 발송 가능한 품질).
    let reports = draftReports;
    try {
      reports = await proofreadReports(draftReports);
      mark('proofreadReports done');
    } catch (error) {
      mark(`proofreadReports failed, using draft: ${error instanceof Error ? error.message : String(error)}`);
    }

    const pdf = await renderReportPdf({
      name: lead.name,
      hospitalType: lead.hospital_type,
      stage: lead.stage,
      sizeRange: lead.size_range,
      reports,
    });
    mark('renderReportPdf done');

    await sendReportEmail({ to: lead.email, name: lead.name, pdf });
    mark('sendReportEmail done');

    await updateChatbotLeadReportStatus(leadId, 'sent');
    return 'sent';
  } catch (error) {
    mark(`failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[chatbot report] lead ${leadId} failed:`, error);
    await updateChatbotLeadReportStatus(leadId, 'failed');
    return 'failed';
  }
}
