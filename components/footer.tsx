import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#2a241f]/10 bg-[#f5efe9]">
      <div className="container-shell flex flex-col gap-8 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <img src="/logo-jiyu.svg" alt="jiyu design" className="h-12 w-[210px]" />
          <p className="mt-2 text-sm text-[#54463e]">Warm luxury interior design studio</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-[#54463e]">
          <Link href="/about">Greeting</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/consult">Consultation</Link>
        </div>
      </div>
    </footer>
  );
}
