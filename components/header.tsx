 'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/about', label: 'Greeting' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/consult', label: 'Consultation' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a241f]/5 bg-[#f9f5f1]/80 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between gap-4">
        <Link href="/" aria-label="jiyu design 홈" className="shrink-0">
          <img src="/logo-jiyu.svg" alt="jiyu design" className="h-12 w-[210px]" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-[#3f342e] transition hover:text-[#1d1a18]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="md:hidden">
          <button
            type="button"
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full border border-[#2a241f]/10 bg-white/70 p-2 text-[#3f342e]"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-[#2a241f]/5 bg-[#f9f5f1] px-4 py-4 md:hidden" aria-label="모바일 메뉴">
          <div className="container-shell flex flex-col gap-1 px-0">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-[#3f342e] hover:bg-white/70"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
