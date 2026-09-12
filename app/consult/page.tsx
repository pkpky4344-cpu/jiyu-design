"use client";

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

const consentText = {
  consent1: `개인정보 수집 및 이용 동의 (placeholder)

본인은 jiyu design이 상담 목적을 위해 성명, 주소, 연락처 등의 개인정보를 수집·이용하는 것에 동의합니다.
수집 목적: 상담 및 견적 안내
보유 기간: 관련 법령에 따라 보관
제공받는 자: jiyu design 내부 담당자

※ 실제 법무 검토 후 내용 교체가 필요합니다.`,
  consent2: `제3자 정보 제공 동의 (placeholder)

본인은 상담 진행을 위해 필요한 경우 일부 정보를 관련 협력업체 또는 외부 전문가에게 제공하는 것에 동의합니다.
보유 기간: 상담 완료 후 삭제 또는 보관 기준에 따라 처리
제공받는 자: 시공/설계 협력 파트너

※ 실제 법무 검토 후 내용 교체가 필요합니다.`
};

export default function ConsultPage() {
  const [form, setForm] = useState(initialForm);
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({
    consent1: false,
    consent2: false,
  });
  const [status, setStatus] = useState('');

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddressSearch = () => {
    if (!window.daum) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress }));
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.consent1 || !form.consent2) {
      setStatus('개인정보 수집 및 제3자 제공 동의는 필수입니다.');
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
    if (response.ok) {
      setStatus('상담 신청이 완료되었습니다.');
      setForm(initialForm);
    } else {
      setStatus(data.message || '신청 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container-shell py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">Consult</p>
        <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">상담 신청</h1>

        <form onSubmit={handleSubmit} className="panel mt-10 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#403a36]">성함</span>
              <input
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none ring-0 focus:border-[#9d7a5f]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#403a36]">연락처</span>
              <input
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="010-1234-5678"
                className="w-full rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none ring-0 focus:border-[#9d7a5f]"
              />
            </label>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-[#403a36]">주소</span>
            <div className="flex gap-2">
              <input
                required
                readOnly
                value={form.address}
                placeholder="주소 찾기 버튼을 눌러주세요"
                onClick={openAddressSearch}
                className="w-full cursor-pointer rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none ring-0 focus:border-[#9d7a5f]"
              />
              <button
                type="button"
                onClick={openAddressSearch}
                className="btn-secondary shrink-0 whitespace-nowrap px-4"
              >
                주소 찾기
              </button>
            </div>
            <input
              value={form.addressDetail}
              onChange={(e) => handleChange('addressDetail', e.target.value)}
              placeholder="상세 주소 (동/호수 등)"
              className="mt-2 w-full rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none ring-0 focus:border-[#9d7a5f]"
            />
          </label>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-[#403a36]">요청사항</span>
            <textarea
              value={form.request}
              onChange={(e) => handleChange('request', e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none ring-0 focus:border-[#9d7a5f]"
            />
          </label>

          <div className="mt-8 space-y-5">
            {(['consent1', 'consent2'] as const).map((key) => (
              <div key={key} className="rounded-2xl border border-[#2a241f]/10 bg-[#f8f2ee] p-4">
                <label className="flex items-start gap-3 text-sm text-[#433a35]">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#9d7a5f]"
                    required
                  />
                  <span>
                    {key === 'consent1' ? '개인정보 수집 및 이용 동의' : '제3자 정보 제공 동의'}에 동의합니다.
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMore((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="mt-3 text-xs font-medium text-[#8a6a52] underline underline-offset-4"
                >
                  자세히 보기
                </button>
                {showMore[key] && (
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white/80 p-4 text-xs leading-6 text-[#54463e]">
                    {consentText[key]}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {status && <p className="mt-6 text-sm text-[#433a35]">{status}</p>}

          <button type="submit" className="btn-primary mt-8 w-full sm:w-auto">
            상담 신청하기
          </button>
        </form>
      </div>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
    </div>
  );
}
