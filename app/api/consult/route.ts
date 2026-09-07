import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createLead, upsertCustomerFromLead } from '@/lib/db';

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  request: z.string().optional().default(''),
  consent1: z.boolean(),
  consent2: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    if (!parsed.consent1 || !parsed.consent2) {
      return NextResponse.json({ message: '필수 동의 항목을 모두 체크해 주세요.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const leadId = await createLead({
      name: parsed.name,
      address: parsed.address,
      phone: parsed.phone,
      request: parsed.request,
      consent1: parsed.consent1,
      consent2: parsed.consent2,
      created_at: now,
    });

    const customer = await upsertCustomerFromLead({
      id: leadId,
      name: parsed.name,
      address: parsed.address,
      phone: parsed.phone,
      request: parsed.request,
      created_at: now,
    });

    return NextResponse.json({ ok: true, leadId, customerId: customer.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '상담 신청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
