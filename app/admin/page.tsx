"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSULT_COLUMNS = ['이름', '연락처', '주소', '상태', '접수일'];
const CHATBOT_COLUMNS = ['이름', '연락처', '이메일', '병원종류', '진행단계', '평수', '희망시기', '상태', '자료발송', '접수일'];

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: '발송중',
  sent: '발송완료',
  failed: '발송실패',
};
const STATUS_OPTIONS = ['신규상담', '상담완료', '견적발송', '계약완료', '시공중', '시공완료', '보류', '이탈'];

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [tab, setTab] = useState<'consult' | 'chatbot'>('consult');
  const [customers, setCustomers] = useState<any[]>([]);
  const [chatbotLeads, setChatbotLeads] = useState<any[]>([]);
  const [customersError, setCustomersError] = useState(false);
  const [chatbotError, setChatbotError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [customersRes, chatbotRes] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/chatbot-leads'),
      ]);

      if (customersRes.status === 401 || chatbotRes.status === 401) {
        setStatus('unauthorized');
        return;
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);
      } else {
        setCustomersError(true);
      }

      if (chatbotRes.ok) {
        const chatbotData = await chatbotRes.json();
        setChatbotLeads(chatbotData.leads || []);
      } else {
        setChatbotError(true);
      }

      setStatus('authorized');
    };
    load();
  }, []);

  const updateStatus = async (kind: 'consult' | 'chatbot', id: number, newStatus: string) => {
    const endpoint = kind === 'consult' ? `/api/admin/customers/${id}` : `/api/admin/chatbot-leads/${id}`;
    const setList = kind === 'consult' ? setCustomers : setChatbotLeads;

    setList((prev) => prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row)));

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const refreshed = await fetch(kind === 'consult' ? '/api/admin/customers' : '/api/admin/chatbot-leads');
      if (refreshed.ok) {
        const data = await refreshed.json();
        setList(kind === 'consult' ? data.customers || [] : data.leads || []);
      }
    }
  };

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

  const rows = tab === 'consult' ? customers : chatbotLeads;
  const columns = tab === 'consult' ? CONSULT_COLUMNS : CHATBOT_COLUMNS;

  return (
    <div className="container-shell py-16">
      <h1 className="text-4xl text-charcoal">관리자 대시보드</h1>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('consult')}
          className={tab === 'consult' ? 'btn-primary !py-2 text-sm' : 'btn-secondary !py-2 text-sm'}
        >
          상담 신청 ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('chatbot')}
          className={tab === 'chatbot' ? 'btn-primary !py-2 text-sm' : 'btn-secondary !py-2 text-sm'}
        >
          챗봇 리드 ({chatbotLeads.length})
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">신규 상담</p>
          <p className="mt-3 text-3xl text-charcoal">{rows.filter((r) => r.status === '신규상담').length}</p>
        </div>
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">견적발송</p>
          <p className="mt-3 text-3xl text-charcoal">{rows.filter((r) => r.status === '견적발송').length}</p>
        </div>
        <div className="panel p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">계약완료</p>
          <p className="mt-3 text-3xl text-charcoal">{rows.filter((r) => r.status === '계약완료').length}</p>
        </div>
      </div>

      {((tab === 'consult' && customersError) || (tab === 'chatbot' && chatbotError)) && (
        <p className="mt-6 text-sm text-[#7d3d3d]">목록을 불러오지 못했습니다.</p>
      )}

      <div className="mt-10 panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f6efe9] text-[#54463e]">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === 'consult'
                ? customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-[#2a241f]/5">
                      <td className="px-4 py-3">{customer.name}</td>
                      <td className="px-4 py-3">{customer.phone}</td>
                      <td className="px-4 py-3">{customer.address}</td>
                      <td className="px-4 py-3">
                        <select
                          value={customer.status}
                          onChange={(e) => updateStatus('consult', customer.id, e.target.value)}
                          className="rounded-lg border border-[#2a241f]/10 bg-white px-2 py-1"
                        >
                          {STATUS_OPTIONS.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">{new Date(customer.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                : chatbotLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-[#2a241f]/5">
                      <td className="px-4 py-3">{lead.name}</td>
                      <td className="px-4 py-3">{lead.phone}</td>
                      <td className="px-4 py-3">{lead.email}</td>
                      <td className="px-4 py-3">{lead.hospital_type}</td>
                      <td className="px-4 py-3">{lead.stage}</td>
                      <td className="px-4 py-3">{lead.size_range}</td>
                      <td className="px-4 py-3">{lead.timing}</td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus('chatbot', lead.id, e.target.value)}
                          className="rounded-lg border border-[#2a241f]/10 bg-white px-2 py-1"
                        >
                          {STATUS_OPTIONS.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">{REPORT_STATUS_LABEL[lead.report_status] ?? lead.report_status}</td>
                      <td className="px-4 py-3">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
