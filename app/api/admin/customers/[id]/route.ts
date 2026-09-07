import { NextResponse } from 'next/server';
import { updateCustomerStatus } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { status } = await request.json();
  if (typeof status !== 'string' || !status) {
    return NextResponse.json({ message: '상태 값이 필요합니다.' }, { status: 400 });
  }

  await updateCustomerStatus(Number(params.id), status);
  return NextResponse.json({ ok: true });
}
