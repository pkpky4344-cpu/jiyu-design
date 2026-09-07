"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/admin/customers');
      if (!response.ok) {
        setStatus('unauthorized');
        return;
      }
      const data = await response.json();
      setCustomers(data.customers || []);
      setStatus('authorized');
    };
    load();
  }, []);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthorized') {
    return (
      <div className="container-shell py-20 text-center text-lg text-[#433a35]">
        관리자 로그인이 필요합니다.
        <div className="mt-4">
          <Link href="/admin/login" className="btn-secondary">로그인하러 가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-16">
      <h1 className="text-4xl text-charcoal">관리자 대시보드</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">신규 상담</p>
          <p className="mt-3 text-3xl text-charcoal">{customers.filter((c) => c.status === '신규상담').length}</p>
        </div>
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">견적발송</p>
          <p className="mt-3 text-3xl text-charcoal">{customers.filter((c) => c.status === '견적발송').length}</p>
        </div>
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">계약완료</p>
          <p className="mt-3 text-3xl text-charcoal">{customers.filter((c) => c.status === '계약완료').length}</p>
        </div>
      </div>

      <div className="mt-10 panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f6efe9] text-[#54463e]">
              <tr>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">주소</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">접수일</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[#2a241f]/5">
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">{customer.address}</td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={customer.status}
                      className="rounded-lg border border-[#2a241f]/10 bg-white px-2 py-1"
                    >
                      {['신규상담','상담완료','견적발송','계약완료','시공중','시공완료','보류','이탈'].map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
