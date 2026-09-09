import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatbotLead } from '@/lib/db';
import { processChatbotReport } from '@/lib/report-pipeline';

const HOSPITAL_TYPES = ['치과', '한의원', '피부과·성형외과', '일반의원', '기타'] as const;
const STAGES = ['신규개원', '이전', '리모델링', '부분공사'] as const;
const SIZES = ['20평 이하', '20~40평', '40평 이상'] as const;
const TIMINGS = ['1개월 이내', '3개월 이내', '6개월 이내', '미정'] as const;

// AI 리포트 생성(웹검색 포함) + PDF + 이메일 발송을 응답 전에 끝까지 기다린다 (Vercel의
// waitUntil은 트래픽이 적을 때 백그라운드 작업이 조용히 유실될 수 있어 신뢰할 수 없음 —
// 요청-응답 안에서 확실히 끝내거나 확실히 실패로 기록하는 쪽을 택함).
export const maxDuration = 60;

const schema = z.object({
  hospitalType: z.enum(HOSPITAL_TYPES),
  stage: z.enum(STAGES),
  size: z.enum(SIZES),
  timing: z.enum(TIMINGS),
  extraRequest: z.string().max(1000).optional().default(''),
  name: z.string().min(1).max(50),
  phone: z.string().min(1).max(30),
  email: z.string().email().max(100),
  consent1: z.boolean(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  if (!parsed.data.consent1) {
    return NextResponse.json({ message: '개인정보 수집 및 이용에 동의해주세요.' }, { status: 400 });
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
      email: parsed.data.email,
      consent1: parsed.data.consent1,
    });

    const reportStatus = await processChatbotReport(leadId);

    return NextResponse.json({ ok: true, leadId, reportStatus });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '챗봇 상담 접수 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
