import { getSiteSettings } from '@/lib/data';

export default function AboutPage() {
  const settings = getSiteSettings();

  return (
    <div className="container-shell py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">Greeting</p>
        <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">인사말</h1>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="panel p-8">
            <p className="text-base leading-8 text-[#54463e] whitespace-pre-line">{settings.greeting}</p>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-[#2a241f]/10 bg-white/70 p-3 shadow-soft">
            <img src="/images/team-1.jpg" alt="jiyu design office" className="h-[420px] w-full rounded-[22px] object-cover" />
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-[28px] border border-[#2a241f]/10 bg-white/70 p-3 shadow-soft">
            <img src="/images/team-2.jpg" alt="jiyu design project team" className="h-[320px] w-full rounded-[22px] object-cover" />
          </div>
          <div className="panel p-8">
            <h2 className="text-2xl text-charcoal">jiyu design의 철학</h2>
            <p className="mt-4 text-base leading-8 text-[#54463e]">
              우리는 공간을 단순히 꾸미는 것이 아니라, 삶의 흐름과 감각을 설계합니다. 사용할 때 편안하고, 바라볼 때는 차분하고 따뜻한 공간을 만들기 위해 디자인과 실용성을 균형 있게 조화시킵니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
