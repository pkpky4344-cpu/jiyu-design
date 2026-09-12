'use client';

import { useState } from 'react';
import Script from 'next/script';

const initialForm = {
  name: '',
  address: '',
  addressDetail: '',
  phone: '',
  request: '',
  consent1: false,
  consent2: false,
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: { roadAddress: string; jibunAddress: string }) => void }) => {
        open: () => void;
      };
    };
  }
}

export function InlineConsultForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddressSearch = () => {
    if (!window.daum) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((current) => ({ ...current, address: data.roadAddress || data.jibunAddress }));
      },
    }).open();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');

    if (!form.consent1 || !form.consent2) {
      setStatus('개인정보 수집 및 제3자 제공 동의가 필요합니다.');
      return;
    }

    const response = await fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        address: `${form.address} ${form.addressDetail}`.trim(),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || '신청 처리 중 오류가 발생했습니다.');
      return;
    }

    setStatus('상담 신청이 완료되었습니다.');
    setForm(initialForm);
  };

  return (
    <section className="bg-[#2a241f] py-20 text-white">
      <div className="container-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#d2b496]">Start a conversation</p>
          <h2 className="mt-4 text-3xl leading-tight text-white sm:text-4xl">공간에 대한 이야기를<br />들려주세요.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#e8dac7]">성함과 연락처를 남겨주시면 jiyu design이 확인 후 차분히 연락드리겠습니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-[#f7f2ed]">성함</span>
              <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#d2b496]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[#f7f2ed]">연락처</span>
              <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="010-1234-5678" className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#d2b496]" />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm text-[#f7f2ed]">주소</span>
            <div className="flex gap-2">
              <input
                required
                readOnly
                value={form.address}
                placeholder="주소 찾기 버튼을 눌러주세요"
                onClick={openAddressSearch}
                className="w-full cursor-pointer rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#d2b496]"
              />
              <button
                type="button"
                onClick={openAddressSearch}
                className="shrink-0 whitespace-nowrap rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/20"
              >
                주소 찾기
              </button>
            </div>
            <input
              value={form.addressDetail}
              onChange={(event) => updateField('addressDetail', event.target.value)}
              placeholder="상세 주소 (동/호수 등)"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[#d2b496]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-[#f7f2ed]">요청사항</span>
            <textarea value={form.request} onChange={(event) => updateField('request', event.target.value)} rows={4} className="w-full resize-y rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none focus:border-[#d2b496]" />
          </label>

          <div className="grid gap-3 text-sm text-[#e8dac7] sm:grid-cols-2">
            <label className="flex items-start gap-2"><input required type="checkbox" checked={form.consent1} onChange={(event) => updateField('consent1', event.target.checked)} className="mt-1 accent-[#d2b496]" />개인정보 수집 및 이용 동의</label>
            <label className="flex items-start gap-2"><input required type="checkbox" checked={form.consent2} onChange={(event) => updateField('consent2', event.target.checked)} className="mt-1 accent-[#d2b496]" />제3자 정보 제공 동의</label>
          </div>

          {status && <p role="status" className="text-sm text-[#f0d7b8]">{status}</p>}
          <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-[#d2b496] px-6 py-3 text-sm font-semibold text-[#2a241f] transition hover:bg-[#e2c9a9]">상담 신청하기</button>
        </form>
      </div>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    </section>
  );
}
