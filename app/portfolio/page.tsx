import Link from 'next/link';
import { getPortfolioProjects } from '@/lib/data';
import { PortfolioGallery } from '@/components/portfolio-gallery';

export default function PortfolioPage() {
  const projects = getPortfolioProjects();

  return (
    <div className="container-shell py-16 sm:py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#7b685e]">Portfolio</p>
          <h1 className="mt-4 text-4xl text-charcoal sm:text-5xl">시공 사례</h1>
        </div>
        <Link href="/consult" className="btn-secondary">상담 신청</Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="panel overflow-hidden">
            <PortfolioGallery
              title={project.title}
              coverImage={project.coverImage}
              gallery={'gallery' in project ? project.gallery : undefined}
            >
              <div className="p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#7b685e]">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>
                <h2 className="mt-4 text-2xl text-charcoal">{project.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#564d48]">{project.description}</p>
              </div>
            </PortfolioGallery>
          </article>
        ))}
      </div>
    </div>
  );
}
