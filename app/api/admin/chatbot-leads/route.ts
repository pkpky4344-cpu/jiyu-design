import { NextResponse } from 'next/server';
import { getChatbotLeads } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const leads = await getChatbotLeads();
  return NextResponse.json({ leads });
}
