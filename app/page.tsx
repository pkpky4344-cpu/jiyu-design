import Link from 'next/link';
import { MapPin, Sparkles } from 'lucide-react';
import { getSiteSettings, getPortfolioHighlights, getHeroSlides } from '@/lib/data';
import { InlineConsultForm } from '@/components/inline-consult-form';

export default function HomePage() {
  const settings = getSiteSettings();
  const heroSlides = getHeroSlides();
  const featuredProjects = getPortfolioHighlights();

  return (
    <>
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0">
          <img src="/images/hero-bg-2.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f9f5f1] via-[#f9f5f1]/40 to-transparent" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(184,154,112,0.2),_transparent_30%)]" />
        <div className="container-shell relative py-10 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <img src="/logo-jiyu.svg" alt="jiyu design" className="h-12 w-[210px] object-contain object-left" />
              <h1 className="mt-6 max-w-xl text-5xl leading-[1.05] text-charcoal sm:text-6xl">
                {settings.heroTitle}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#54463e] sm:text-lg">
                {settings.heroSubtitle}
              </p>
              <Link href="/portfolio" className="btn-secondary mt-8">포트폴리오 보기</Link>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-[#3f342e]/10 bg-white/50 p-3 shadow-soft">
              <div className="overflow-hidden rounded-[26px]">
                <img
                  src={heroSlides[0].image}
                  alt="jiyu design interior project"
                  className="h-[560px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7b685e]">Our portfolio</p>
            <h2 className="section-title mt-3">감각적인 공간을 설계합니다.</h2>
          </div>
          <Link href="/portfolio" className="hidden text-sm font-medium text-[#433a35] underline-offset-4 hover:underline sm:inline-flex">
            전체 보기
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredProjects.map((project) => (
            <article key={project.id} className="panel overflow-hidden">
              <div className="overflow-hidden">
                <img src={project.coverImage} alt={project.title} className="h-80 w-full object-cover transition duration-500 hover:scale-[1.02]" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-[#7b685e]">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>
                <h3 className="mt-4 text-2xl text-charcoal">{project.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#564d48]">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f0e7e1] py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-3">
          {[
            { title: 'Commercial', text: '브랜드 경험과 사용성을 높이는 상업공간 설계를 제안합니다.' },
            { title: 'Renovation', text: '기존 공간의 가치를 살리면서 새롭고 고급스러운 완성도를 더합니다.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[30px] border border-[#2a241f]/10 bg-white/60 p-8 shadow-soft">
              <div className="mb-6 inline-flex rounded-full border border-[#9d7a5f]/30 bg-[#f9f3ee] p-3 text-[#9d7a5f]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-2xl text-charcoal">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#564d48]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-[28px] border border-[#2a241f]/10 bg-white/60 p-3 shadow-soft">
            <img src="/images/about.jpg" alt="jiyu design team" className="h-[520px] w-full rounded-[22px] object-cover" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">About us</p>
            <h2 className="section-title mt-3">고급스러움은 과하지 않아야 합니다.</h2>
            <p className="mt-6 text-base leading-8 text-[#54463e]">
              jiyu design은 아름다움과 실용성을 함께 추구하는 인테리어 스튜디오입니다. 작은 디테일의 차이가 공간의 품격을 완성하고, 사용자의 라이프스타일에 맞는 안락함을 설계합니다.
            </p>
            <div className="mt-8 space-y-5 text-[#433a35]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[#9d7a5f]" />
                  <p>서울/수도권 중심으로 상업 공간 인테리어를 설계하고 시공합니다.</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[#9d7a5f]" />
                <p>디자인, 시공, 마감, 리모델링까지 통합적으로 관리하여 고객 만족도를 높입니다.</p>
              </div>
            </div>
            <Link href="/about" className="btn-secondary mt-8">인사말 보기</Link>
          </div>
        </div>
      </section>

      <InlineConsultForm />
    </>
  );
}
