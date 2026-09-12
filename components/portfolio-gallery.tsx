'use client';

import { useState, type ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function PortfolioGallery({
  title,
  coverImage,
  gallery,
  children,
}: {
  title: string;
  coverImage: string;
  gallery?: string[];
  children?: ReactNode;
}) {
  const images = gallery && gallery.length > 0 ? gallery : [coverImage];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = () => setOpenIndex(null);
  const showPrev = () => setOpenIndex((current) => (current === null ? null : (current - 1 + images.length) % images.length));
  const showNext = () => setOpenIndex((current) => (current === null ? null : (current + 1) % images.length));

  return (
    <>
      <img
        src={coverImage}
        alt={title}
        onClick={() => setOpenIndex(0)}
        className="h-72 w-full cursor-pointer object-cover"
      />

      {children}

      {gallery && gallery.length > 1 && (
        <div className="grid grid-cols-3 gap-2 px-6 pb-6">
          {gallery.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`${title} ${index + 1}`}
              onClick={() => setOpenIndex(index)}
              className="h-20 w-full cursor-pointer rounded-lg object-cover transition hover:opacity-80"
            />
          ))}
        </div>
      )}

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex h-[100dvh] w-[100dvw] items-center justify-center overflow-auto bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 text-white/80 transition hover:text-white"
            aria-label="닫기"
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:left-6"
              aria-label="이전 사진"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          <img
            src={images[openIndex]}
            alt={`${title} ${openIndex + 1}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[80dvh] max-w-[90dvw] rounded-lg object-contain"
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:right-6"
              aria-label="다음 사진"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
