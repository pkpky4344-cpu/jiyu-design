"use client";

import { useState } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setError('관리자 비밀번호가 올바르지 않습니다.');
      return;
    }
    document.cookie = 'admin_session=enabled; path=/; max-age=3600';
    window.location.href = '/admin';
  };

  return (
    <div className="container-shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="panel w-full max-w-md p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">Admin</p>
        <h1 className="mt-4 text-3xl text-charcoal">관리자 로그인</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-[#433a35]">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#2a241f]/10 bg-white/80 px-4 py-3 outline-none focus:border-[#9d7a5f]"
            />
          </label>
          {error && <p className="text-sm text-[#7d3d3d]">{error}</p>}
          <button type="submit" className="btn-primary w-full">로그인</button>
        </form>
      </div>
    </div>
  );
}
