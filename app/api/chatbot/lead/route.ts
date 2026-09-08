import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatbotLead } from '@/lib/db';

const schema = z.object({
  hospitalType: z.string().min(1),
  stage: z.string().min(1),
  size: z.string().min(1),
  timing: z.string().min(1),
  extraRequest: z.string().optional().default(''),
  name: z.string().min(1),
  phone: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  try {
    const leadId = await createChatbotLead({
      hospitalType: parsed.data.hospitalType,
      stage: parsed.data.stage,
      sizeRange: parsed.data.size,
      timing: parsed.data.timing,
      extraRequest: parsed.data.extraRequest,
      name: parsed.data.name,
      phone: parsed.data.phone,
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '챗봇 상담 접수 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
