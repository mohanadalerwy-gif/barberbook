import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import promo1 from '../assets/promos/promo1.png';
// import promo2 from '../assets/promos/promo2.png'; // ← swap slide 2 here when ready
// import promo3 from '../assets/promos/promo3.png'; // ← swap slide 3 here when ready

// ── PROMO SLIDES DATA ─────────────────────────────────────────────────────────
// To add a real image for slide 2: uncomment the promo2 import above and set image: promo2
// To add a real image for slide 3: uncomment the promo3 import above and set image: promo3
// When SLIDES.length === 1, autoplay, dots, and dragging are all disabled automatically.
// ─────────────────────────────────────────────────────────────────────────────
interface Slide {
  id: number;
  image: string;
  alt: string;
  link: string;
}

const SLIDES: Slide[] = [
  { id: 1, image: promo1, alt: 'عرض ترويجي',   link: '' },
  { id: 2, image: promo1, alt: 'عرض ترويجي',   link: '' }, // replace promo1 → promo2 when ready
  { id: 3, image: promo1, alt: 'عرض ترويجي',   link: '' }, // replace promo1 → promo3 when ready
];

const multiple = SLIDES.length > 1;

const autoplayPlugin = Autoplay({ delay: 4000, stopOnInteraction: false });

export default function PromoCarousel() {
  const [, navigate] = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: multiple,
      direction: 'rtl',
      align: 'center',
      watchDrag: multiple,
    },
    multiple ? [autoplayPlugin] : [],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  if (SLIDES.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* ── Embla viewport ──────────────────────────────────────────────── */}
      <div
        ref={emblaRef}
        className="rounded-2xl overflow-hidden select-none"
        style={{ boxShadow: '0 4px 20px rgba(176,132,66,0.14)' }}
      >
        {/* Embla container — flex row, RTL order handled by Embla */}
        <div className="flex">
          {SLIDES.map(slide => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0"
            >
              <div
                className="aspect-[2/1] cursor-pointer"
                onClick={() => { if (slide.link) navigate(slide.link); }}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  draggable={false}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pagination dots — hidden for single slide ───────────────────── */}
      {multiple && (
        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="عروض ترويجية"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`الشريحة ${i + 1}`}
              onClick={() => scrollTo(i)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08442]"
              style={{
                width: 8,
                height: 8,
                flexShrink: 0,
                background: i === selectedIndex ? '#B08442' : '#9ca3af',
                opacity: i === selectedIndex ? 1 : 0.45,
                transition: 'background 0.25s ease, opacity 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
