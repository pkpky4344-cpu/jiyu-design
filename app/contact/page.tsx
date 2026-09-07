import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { getSiteSettings } from '@/lib/data';

export default function ContactPage() {
  const settings = getSiteSettings();

  return (
    <div className="container-shell py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">Contact us</p>
        <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">연락처</h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="panel p-6">
            <Mail className="h-8 w-8 text-[#9d7a5f]" />
            <h2 className="mt-5 text-xl text-charcoal">Email</h2>
            <p className="mt-3 text-sm text-[#54463e]">{settings.email}</p>
          </div>

          <div className="panel p-6">
            <MapPin className="h-8 w-8 text-[#9d7a5f]" />
            <h2 className="mt-5 text-xl text-charcoal">Location</h2>
            <p className="mt-3 text-sm leading-7 text-[#54463e]">{settings.address}</p>
          </div>

          <div className="panel p-6">
            <MessageCircle className="h-8 w-8 text-[#9d7a5f]" />
            <h2 className="mt-5 text-xl text-charcoal">Kakao</h2>
            <a href={`https://pf.kakao.com/${settings.kakaoChannel}`} className="mt-3 inline-block text-sm text-[#54463e] underline underline-offset-4">
              @{settings.kakaoChannel}
            </a>
          </div>

          <div className="panel p-6">
            <Phone className="h-8 w-8 text-[#9d7a5f]" />
            <h2 className="mt-5 text-xl text-charcoal">대표이사</h2>
            <p className="mt-3 text-sm text-[#54463e]">{settings.ceoName}</p>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[28px] border border-[#2a241f]/10 bg-white/70 p-3 shadow-soft">
          <iframe
            title="map"
            src="https://www.google.com/maps?q=seoul&output=embed"
            className="h-[420px] w-full rounded-[22px] border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
