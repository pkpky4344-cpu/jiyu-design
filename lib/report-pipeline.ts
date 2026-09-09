import { getChatbotLeadById, updateChatbotLeadReportStatus } from './db';
import { generateReports } from './reports';
import { renderReportPdf } from './report-pdf';
import { sendReportEmail } from './email';

export async function processChatbotReport(leadId: number) {
  try {
    const lead = await getChatbotLeadById(leadId);
    if (!lead || !lead.email || !lead.consent1) return;

    const reports = await generateReports({
      hospitalType: lead.hospital_type,
      stage: lead.stage,
      sizeRange: lead.size_range,
      extraRequest: lead.extra_request,
    });

    const pdf = await renderReportPdf({
      name: lead.name,
      hospitalType: lead.hospital_type,
      stage: lead.stage,
      sizeRange: lead.size_range,
      reports,
    });

    await sendReportEmail({ to: lead.email, name: lead.name, pdf });

    await updateChatbotLeadReportStatus(leadId, 'sent');
  } catch (error) {
    console.error(`[chatbot report] lead ${leadId} failed:`, error);
    await updateChatbotLeadReportStatus(leadId, 'failed');
  }
}
