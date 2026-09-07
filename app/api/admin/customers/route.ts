import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/db';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const session = cookieHeader.match(/admin_session=([^;]+)/)?.[1];

  if (!session || !process.env.ADMIN_PASSWORD || session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const customers = await getCustomers();
  return NextResponse.json({ customers });
}
