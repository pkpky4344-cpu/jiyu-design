import { getChatbotLeadById, updateChatbotLeadReportStatus } from './db';
import { generateReports } from './reports';
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

    const reports = await generateReports({
      hospitalType: lead.hospital_type,
      stage: lead.stage,
      sizeRange: lead.size_range,
      extraRequest: lead.extra_request,
    });
    mark('generateReports done');

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
