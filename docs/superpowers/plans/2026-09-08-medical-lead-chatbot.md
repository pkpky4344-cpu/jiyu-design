# 병의원 리드 큐레이션 챗봇 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈페이지 우측 하단에 병의원(치과/한의원 등) 방문자를 버튼형 문진으로 안내하고, 관련 시공 사례를 보여준 뒤, 상담 신청 폼과는 완전히 분리된 리드로 저장하는 채팅 위젯을 추가한다.

**Architecture:** Next.js App Router 안에 클라이언트 컴포넌트(`components/chatbot-widget.tsx`)로 상태 기반 문진 흐름을 구현하고, 기존 `lib/db.ts`의 Turso(libsql) 클라이언트에 새 테이블 `chatbot_leads`를 추가한다. 공개 제출 API 1개, 관리자 조회/상태변경 API 2개를 신설하고, `/admin` 페이지에 탭을 추가해 기존 상담 신청 목록과 나란히(그러나 별도로) 보여준다.

**Tech Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · `@libsql/client` (Turso) · `zod`

**Spec:** [docs/superpowers/specs/2026-09-08-medical-lead-chatbot-design.md](../specs/2026-09-08-medical-lead-chatbot-design.md)

## Global Constraints

- 새 색상 추가 금지 — `tailwind.config.ts`의 기존 토큰만 사용: `charcoal #2a241f`, `bronze #9d7a5f`, `sand #e8dac7`, `mocha #54463e`, 배경 `#f9f5f1`, `shadow-soft`, `.panel`/`.btn-primary`/`.btn-secondary`(`app/globals.css`)
- LLM/AI API 연동 없음 — 순수 규칙 기반 버튼 문진 (스펙 "범위 외" 참조)
- 상담 신청(`leads`/`customers`)과 챗봇 리드(`chatbot_leads`)는 완전히 분리된 테이블/API/관리자 탭으로 유지
- 이 프로젝트에는 자동화 테스트 프레임워크가 없음(Jest/Vitest/Playwright 미설치, `package.json` 확인됨) — 새로 추가하지 않는다. 검증은 (a) API/서버 렌더링은 `curl`로, (b) 브라우저 상호작용이 필요한 부분은 수동 클릭 체크리스트로 확인한다 (이번 세션에서 다른 기능들도 동일한 방식으로 검증해옴)
- 로컬 개발 서버는 `.env.local`의 `ADMIN_PASSWORD`, (선택) `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` 사용. `TURSO_DATABASE_URL` 미설정 시 `lib/db.ts`가 자동으로 `data/jiyu.db` 로컬 파일로 폴백하므로 Turso 계정 없이도 로컬 테스트 가능
- 개발 서버 실행: 프로젝트에 시스템 PATH상 node/npm이 없을 수 있음 — 있다면 `npm run dev`, 없다면 번들된 로컬 Node(`node-bin/node-v20.17.0-win-x64/`)를 PATH에 추가해 실행
- 커밋은 각 태스크 마지막 단계에 포함되어 있으나, 실제 `git commit`/`git push` 실행은 사용자에게 먼저 확인받는다 (이 프로젝트의 기존 작업 관례)

---

## Task 1: 챗봇 리드 DB 스키마 + 공개 제출 API

**Files:**
- Modify: `lib/db.ts`
- Create: `app/api/chatbot/lead/route.ts`

**Interfaces:**
- Produces: `createChatbotLead(lead: { hospitalType: string; stage: string; sizeRange: string; timing: string; extraRequest: string; name: string; phone: string }): Promise<number>` (반환값은 새로 생성된 행의 id)
- Produces: `getChatbotLeads(): Promise<any[]>`
- Produces: `updateChatbotLeadStatus(id: number, status: string): Promise<void>`
- Produces: `POST /api/chatbot/lead` — body `{ hospitalType, stage, size, timing, extraRequest?, name, phone }`, 성공 시 `{ ok: true, leadId: number }` (200), 필수값 누락 시 `{ message: string }` (400)

- [ ] **Step 1: `lib/db.ts`의 `ensureSchema()` SQL에 `chatbot_leads` 테이블 추가**

`lib/db.ts`의 `ensureSchema` 함수 안, 기존 `customer_notes` 테이블 생성 SQL 뒤(58번째 줄, 마지막 백틱 `` ` `` 앞)에 추가:

```sql
      CREATE TABLE IF NOT EXISTS chatbot_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hospital_type TEXT NOT NULL,
        stage TEXT NOT NULL,
        size_range TEXT NOT NULL,
        timing TEXT NOT NULL,
        extra_request TEXT DEFAULT '',
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '신규상담',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
```

- [ ] **Step 2: `lib/db.ts` 파일 맨 끝에 3개 함수 추가**

```ts
export async function createChatbotLead(lead: {
  hospitalType: string;
  stage: string;
  sizeRange: string;
  timing: string;
  extraRequest: string;
  name: string;
  phone: string;
}) {
  await ensureSchema();
  const now = new Date().toISOString();
  const result = await client.execute({
    sql: `
      INSERT INTO chatbot_leads (hospital_type, stage, size_range, timing, extra_request, name, phone, status, created_at, updated_at)
      VALUES (:hospital_type, :stage, :size_range, :timing, :extra_request, :name, :phone, '신규상담', :created_at, :updated_at)
    `,
    args: {
      hospital_type: lead.hospitalType,
      stage: lead.stage,
      size_range: lead.sizeRange,
      timing: lead.timing,
      extra_request: lead.extraRequest,
      name: lead.name,
      phone: lead.phone,
      created_at: now,
      updated_at: now,
    },
  });
  return Number(result.lastInsertRowid);
}

export async function getChatbotLeads() {
  await ensureSchema();
  const result = await client.execute('SELECT * FROM chatbot_leads ORDER BY id DESC');
  return result.rows as any[];
}

export async function updateChatbotLeadStatus(id: number, status: string) {
  await ensureSchema();
  await client.execute({
    sql: 'UPDATE chatbot_leads SET status = :status, updated_at = :updated_at WHERE id = :id',
    args: { status, updated_at: new Date().toISOString(), id },
  });
}
```

- [ ] **Step 3: `app/api/chatbot/lead/route.ts` 생성**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatbotLead } from '@/lib/db';

const schema = z.object({
  hospitalType: z.string().min(1),
  stage: z.string().min(1),
  size: z.string().min(1),
  timing: z.string().min(1),
  extraRequest: z.string().optional().default(''),
  name: z.string().min(1),
  phone: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: '필수 항목이 누락되었습니다.' }, { status: 400 });
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
    });

    return NextResponse.json({ ok: true, leadId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '챗봇 상담 접수 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
```

- [ ] **Step 4: 개발 서버 실행 후 정상 제출 확인**

`jiyu-design` 디렉터리에서 개발 서버 실행 후:

```bash
curl -s -w "\nstatus: %{http_code}\n" -X POST http://localhost:3000/api/chatbot/lead \
  -H "Content-Type: application/json" \
  -d '{"hospitalType":"치과","stage":"신규개원","size":"20~40평","timing":"3개월 이내","extraRequest":"주차공간 문의","name":"테스트","phone":"010-1111-2222"}'
```

Expected: `status: 200`, 응답 본문에 `"ok":true`와 숫자 `leadId` 포함

- [ ] **Step 5: 필수값 누락 시 400 확인**

```bash
curl -s -w "\nstatus: %{http_code}\n" -X POST http://localhost:3000/api/chatbot/lead \
  -H "Content-Type: application/json" \
  -d '{"hospitalType":"치과"}'
```

Expected: `status: 400`

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts "app/api/chatbot/lead/route.ts"
git commit -m "feat: add chatbot_leads table and public submission API"
```

---

## Task 2: 관리자용 챗봇 리드 조회/상태변경 API

**Files:**
- Create: `app/api/admin/chatbot-leads/route.ts`
- Create: `app/api/admin/chatbot-leads/[id]/route.ts`

**Interfaces:**
- Consumes: `getChatbotLeads()`, `updateChatbotLeadStatus(id, status)` (Task 1), `isAdminAuthorized(request: Request): boolean` (기존 `lib/admin-auth.ts`)
- Produces: `GET /api/admin/chatbot-leads` — 인증 없으면 401, 있으면 `{ leads: any[] }` (200)
- Produces: `PATCH /api/admin/chatbot-leads/[id]` — body `{ status }`, 인증 없으면 401, 있으면 `{ ok: true }` (200)

- [ ] **Step 1: `app/api/admin/chatbot-leads/route.ts` 생성**

```ts
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
```

- [ ] **Step 2: `app/api/admin/chatbot-leads/[id]/route.ts` 생성**

```ts
import { NextResponse } from 'next/server';
import { updateChatbotLeadStatus } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { status } = await request.json();
  if (typeof status !== 'string' || !status) {
    return NextResponse.json({ message: '상태 값이 필요합니다.' }, { status: 400 });
  }

  await updateChatbotLeadStatus(Number(params.id), status);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 인증 없이 401 확인**

```bash
curl -s -w "\nstatus: %{http_code}\n" http://localhost:3000/api/admin/chatbot-leads
```

Expected: `status: 401`

- [ ] **Step 4: 로그인 후 목록 조회 + 상태변경 확인**

```bash
curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"<.env.local의 ADMIN_PASSWORD 값>"}' \
  -c /tmp/plan-cookies.txt -o /dev/null -w "login: %{http_code}\n"

curl -s -w "\nstatus: %{http_code}\n" http://localhost:3000/api/admin/chatbot-leads -b /tmp/plan-cookies.txt
```

Expected: `status: 200`, Task 1에서 만든 테스트 리드가 목록에 보임 (id 확인해서 아래에 사용)

```bash
curl -s -w "\nstatus: %{http_code}\n" -X PATCH http://localhost:3000/api/admin/chatbot-leads/<위에서 확인한 id> \
  -H "Content-Type: application/json" -d '{"status":"견적발송"}' -b /tmp/plan-cookies.txt
```

Expected: `status: 200`, 이후 목록 조회 시 해당 리드의 `status`가 `"견적발송"`으로 바뀌어 있음

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/chatbot-leads
git commit -m "feat: add admin chatbot leads list and status-update endpoints"
```

---

## Task 3: 챗봇 위젯 컴포넌트 + 전역 마운트

**Files:**
- Create: `components/chatbot-widget.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `getPortfolioProjects(): { id: number; title: string; category: string; year: string; description: string; coverImage: string }[]` (기존 `lib/data.ts`), `POST /api/chatbot/lead` (Task 1)
- Produces: `ChatbotWidget` — named export, props 없음, `app/layout.tsx`에서 렌더링

- [ ] **Step 1: `components/chatbot-widget.tsx` 생성**

```tsx
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
```

- [ ] **Step 2: `app/layout.tsx`에 위젯 마운트**

`app/layout.tsx` 상단 import에 추가:

```ts
import { ChatbotWidget } from '@/components/chatbot-widget';
```

`<Footer />` 바로 뒤에 추가 (기존 3번째 `import` 아래, `RootLayout` 반환문 안):

```tsx
          <Footer />
          <ChatbotWidget />
```

- [ ] **Step 3: 서버 렌더링 확인 (닫힌 상태 버튼이 정상 렌더링되는지)**

```bash
curl -s http://localhost:3000/ | grep -o '인테리어 상담 시작하기'
```

Expected: `인테리어 상담 시작하기` 한 줄 출력 (버튼의 `aria-label`이 HTML에 포함되어 있다는 뜻)

- [ ] **Step 4: 수동 브라우저 클릭 체크리스트** (이 프로젝트엔 브라우저 자동화 도구가 없어 사람이 직접 확인)

`http://localhost:3000`을 브라우저로 열고:
- [ ] 우측 하단 원형 버튼 클릭 → 패널이 열리고 첫 질문(예/아니오)이 보이는지
- [ ] "아니오" 클릭 → `/consult`로 이동하는 링크가 뜨는지
- [ ] 다시 열어서 "네" → 병원 종류 → 진행 단계 → 평수 순서로 버튼이 잘 넘어가는지, 병원 종류 선택 직후 사례 카드(또는 대체 문구)가 뜨는지
- [ ] 마지막 단계에서 이름/연락처 입력 후 제출 → "감사합니다" 메시지로 바뀌는지
- [ ] 모바일 폭(브라우저 개발자도구로 375px 정도)에서 패널이 화면 밖으로 안 나가는지

- [ ] **Step 5: Commit**

```bash
git add components/chatbot-widget.tsx app/layout.tsx
git commit -m "feat: add medical lead chatbot widget"
```

---

## Task 4: 관리자 대시보드 탭 분리 (상담 신청 / 챗봇 리드)

**Files:**
- Modify: `app/admin/page.tsx` (전체 교체)

**Interfaces:**
- Consumes: `GET /api/admin/customers` (기존), `GET /api/admin/chatbot-leads` (Task 2), `PATCH /api/admin/customers/[id]` (기존), `PATCH /api/admin/chatbot-leads/[id]` (Task 2)

- [ ] **Step 1: `app/admin/page.tsx` 전체를 아래 내용으로 교체**

```tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSULT_COLUMNS = ['이름', '연락처', '주소', '상태', '접수일'];
const CHATBOT_COLUMNS = ['이름', '연락처', '병원종류', '진행단계', '평수', '희망시기', '상태', '접수일'];
const STATUS_OPTIONS = ['신규상담', '상담완료', '견적발송', '계약완료', '시공중', '시공완료', '보류', '이탈'];

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [tab, setTab] = useState<'consult' | 'chatbot'>('consult');
  const [customers, setCustomers] = useState<any[]>([]);
  const [chatbotLeads, setChatbotLeads] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [customersRes, chatbotRes] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/chatbot-leads'),
      ]);

      if (!customersRes.ok || !chatbotRes.ok) {
        setStatus('unauthorized');
        return;
      }

      const customersData = await customersRes.json();
      const chatbotData = await chatbotRes.json();
      setCustomers(customersData.customers || []);
      setChatbotLeads(chatbotData.leads || []);
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
```

- [ ] **Step 2: 로그인 후 브라우저로 `/admin` 접속해 확인**

- [ ] "상담 신청" / "챗봇 리드" 탭 버튼 둘 다 보이고, 각 탭 옆 괄호 숫자가 실제 건수와 맞는지
- [ ] "챗봇 리드" 탭 클릭 시 Task 1~3에서 만든 테스트 리드가 병원종류/진행단계/평수/희망시기까지 정확히 표시되는지
- [ ] 챗봇 리드 탭에서 상태 드롭다운 변경 → 새로고침해도 유지되는지 (Task 2 API로 저장됨)
- [ ] "상담 신청" 탭이 기존과 동일하게 정상 동작하는지 (회귀 확인)

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: split admin dashboard into consult and chatbot lead tabs"
```

---

## Self-Review 결과

- **스펙 커버리지**: 대화 흐름 7단계(Task 3), 사례 매칭 3단계 로직(Task 3 `matchCaseStudy`), `chatbot_leads` 데이터 모델(Task 1), API 3개(Task 1·2), 관리자 탭 분리(Task 4), 색상 토큰 재사용(전 태스크) 모두 커버함. "범위 외" 항목(LLM 연동, 통합 통계, 병의원 사진 등록)은 의도적으로 태스크에 없음.
- **플레이스홀더 스캔**: 없음 — 전 코드 블록 실행 가능한 완성 코드.
- **타입/시그니처 일관성**: `createChatbotLead`/`getChatbotLeads`/`updateChatbotLeadStatus`의 이름·매개변수가 Task 1 정의와 Task 2·3의 사용처에서 동일함. `chatbot_leads`의 컬럼명(`hospital_type`, `size_range` 등 snake_case)과 API 응답 필드명이 Task 4의 `lead.hospital_type` 등 참조와 일치함.
