'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPortfolioProjects } from '@/lib/data';

type Step = 'gate' | 'hospitalType' | 'stage' | 'size' | 'timing' | 'contact' | 'done' | 'declined';

type Message =
  | { id: string; from: 'bot' | 'user'; kind: 'text'; text: string }
  | { id: string; from: 'bot'; kind: 'case'; project?: { title: string; category: string; coverImage: string } };

const HOSPITAL_TYPES = ['치과', '한의원', '피부과·성형외과', '일반의원', '기타'];
const STAGES = ['신규개원', '이전', '리모델링', '부분공사'];
const SIZES = ['20평 이하', '20~40평', '40평 이상'];
const TIMINGS = ['1개월 이내', '3개월 이내', '6개월 이내', '미정'];

function matchCaseStudy(hospitalType: string) {
  const projects = getPortfolioProjects();
  const exact = projects.find((p) => p.category === hospitalType);
  if (exact) return { tier: 1 as const, project: exact };
  const fallback = projects.find((p) => p.category === '상업공간');
  if (fallback) return { tier: 2 as const, project: fallback };
  return { tier: 3 as const, project: undefined };
}

let msgCounter = 0;
function nextId() {
  msgCounter += 1;
  return `m${msgCounter}`;
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('gate');
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), from: 'bot', kind: 'text', text: '안녕하세요, jiyu design입니다. 병원·의원 인테리어 상담이신가요?' },
  ]);
  const [hospitalType, setHospitalType] = useState('');
  const [stage, setStage] = useState('');
  const [size, setSize] = useState('');
  const [timing, setTiming] = useState('');
  const [extraRequest, setExtraRequest] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const addBotText = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), from: 'bot', kind: 'text', text }]);
  };

  const addUserText = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), from: 'user', kind: 'text', text }]);
  };

  const handleGate = (yes: boolean) => {
    addUserText(yes ? '네' : '아니오');
    if (!yes) {
      addBotText('네, 알겠습니다. 일반 상담 신청 페이지로 안내드릴게요.');
      setStep('declined');
      return;
    }
    addBotText('어떤 진료과목이신가요?');
    setStep('hospitalType');
  };

  const handleHospitalType = (value: string) => {
    setHospitalType(value);
    addUserText(value);

    const match = matchCaseStudy(value);
    if (match.tier === 1 && match.project) {
      setMessages((prev) => [...prev, { id: nextId(), from: 'bot', kind: 'case', project: match.project }]);
    } else if (match.tier === 2 && match.project) {
      addBotText('아직 이 진료과목 전용 사례는 준비 중이지만, 저희가 진행한 상업공간 시공은 이런 느낌입니다.');
      setMessages((prev) => [...prev, { id: nextId(), from: 'bot', kind: 'case', project: match.project }]);
    } else {
      addBotText('정확한 시공 사례는 상담 시 실제 사진으로 안내드리겠습니다.');
    }

    addBotText('진행 단계를 알려주세요.');
    setStep('stage');
  };

  const handleStage = (value: string) => {
    setStage(value);
    addUserText(value);
    addBotText('평수는 어느 정도인가요?');
    setStep('size');
  };

  const handleSize = (value: string) => {
    setSize(value);
    addUserText(value);
    addBotText('희망하시는 시기를 알려주세요.');
    setStep('timing');
  };

  const handleTiming = (value: string) => {
    setTiming(value);
    addUserText(value);
    addBotText('마지막으로 추가로 전달하고 싶은 내용과 연락처를 남겨주세요.');
    setStep('contact');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    setSubmitError('');

    const response = await fetch('/api/chatbot/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalType, stage, size, timing, extraRequest, name, phone }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setSubmitError('제출 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    addUserText(`${name} / ${phone}${extraRequest ? ` / ${extraRequest}` : ''}`);
    addBotText('감사합니다. 담당자가 확인 후 빠르게 연락드리겠습니다.');
    setStep('done');
  };

  if (!open) {
    return (
      <button
        type="button"
        aria-label="인테리어 상담 시작하기"
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-[#f9f5f1] shadow-soft transition hover:bg-[#1d1a18]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex h-[576px] max-h-[calc(100vh-4rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border border-[#2a241f]/10 bg-[#f9f5f1] shadow-soft">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2a241f]/8 px-5 py-[18px]">
        <div className="flex items-center gap-[10px]">
          <div className="text-lg font-bold text-charcoal">jiyu<span className="text-xs">.</span></div>
          <div className="h-4 w-px bg-[#2a241f]/15" />
          <div className="text-[11px] uppercase tracking-[0.14em] text-[#7b685e]">인테리어 상담</div>
        </div>
        <button type="button" aria-label="닫기" onClick={() => setOpen(false)} className="text-mocha">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          if (m.kind === 'case') {
            return (
              <div key={m.id} className="w-[82%] overflow-hidden rounded-2xl border border-[#2a241f]/8 bg-white">
                {m.project && <img src={m.project.coverImage} alt={m.project.title} className="h-[88px] w-full object-cover" />}
                <div className="px-3 py-[10px]">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-bronze">관련 시공 사례</div>
                  {m.project && <div className="mt-[3px] text-[12.5px] font-semibold text-charcoal">{m.project.title} · {m.project.category}</div>}
                </div>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={
                m.from === 'bot'
                  ? 'max-w-[82%] rounded-2xl rounded-bl-[4px] border border-[#2a241f]/6 bg-white px-[14px] py-[10px] text-[13px] leading-[1.55] text-charcoal'
                  : 'ml-auto max-w-[70%] rounded-2xl rounded-br-[4px] bg-charcoal px-[14px] py-[10px] text-[13px] text-[#f9f5f1]'
              }
            >
              {m.text}
            </div>
          );
        })}
      </div>

      <div className="flex-shrink-0 px-5 pb-4">
        {step === 'gate' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => handleGate(true)} className="btn-secondary flex-1 !py-2 text-xs">네</button>
            <button type="button" onClick={() => handleGate(false)} className="btn-secondary flex-1 !py-2 text-xs">아니오</button>
          </div>
        )}
        {step === 'hospitalType' && (
          <div className="flex flex-wrap gap-2">
            {HOSPITAL_TYPES.map((v) => (
              <button key={v} type="button" onClick={() => handleHospitalType(v)} className="rounded-full border border-[#2a241f]/18 px-4 py-[9px] text-[12.5px] text-charcoal">{v}</button>
            ))}
          </div>
        )}
        {step === 'stage' && (
          <div className="flex flex-wrap gap-2">
            {STAGES.map((v) => (
              <button key={v} type="button" onClick={() => handleStage(v)} className="rounded-full border border-[#2a241f]/18 px-4 py-[9px] text-[12.5px] text-charcoal">{v}</button>
            ))}
          </div>
        )}
        {step === 'size' && (
          <div className="flex flex-wrap gap-2">
            {SIZES.map((v) => (
              <button key={v} type="button" onClick={() => handleSize(v)} className="rounded-full border border-[#2a241f]/18 px-4 py-[9px] text-[12.5px] text-charcoal">{v}</button>
            ))}
          </div>
        )}
        {step === 'timing' && (
          <div className="flex flex-wrap gap-2">
            {TIMINGS.map((v) => (
              <button key={v} type="button" onClick={() => handleTiming(v)} className="rounded-full border border-[#2a241f]/18 px-4 py-[9px] text-[12.5px] text-charcoal">{v}</button>
            ))}
          </div>
        )}
        {step === 'contact' && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={extraRequest}
              onChange={(e) => setExtraRequest(e.target.value)}
              placeholder="추가 요청사항 (선택)"
              rows={2}
              className="w-full rounded-2xl border border-[#2a241f]/12 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-bronze"
            />
            <div className="flex gap-2">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                className="w-1/2 rounded-full border border-[#2a241f]/12 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-bronze"
              />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="연락처"
                className="w-1/2 rounded-full border border-[#2a241f]/12 bg-white px-3 py-2 text-[12.5px] outline-none focus:border-bronze"
              />
            </div>
            {submitError && <p className="text-[11px] text-[#7d3d3d]">{submitError}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-2 text-xs disabled:opacity-60">
              {submitting ? '전송 중...' : '상담 신청하기'}
            </button>
          </form>
        )}
        {step === 'declined' && (
          <Link href="/consult" className="btn-secondary block text-center !py-2 text-xs">상담 신청 페이지로 이동</Link>
        )}
        {step === 'done' && (
          <div className="rounded-full bg-[#eee3d8] px-4 py-[9px] text-center text-[12.5px] text-charcoal">상담 신청이 접수되었습니다</div>
        )}
      </div>
    </div>
  );
}
