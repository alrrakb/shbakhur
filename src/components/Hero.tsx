'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHeroSlides, getSiteSettings, type HeroSlide } from '@/lib/database';
import Link from 'next/link';
import Image from 'next/image';

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    title: 'لمسة من سحر الروائح في منزلك',
    subtitle: 'أجواء هادئة وأنيقة',
    description: 'أضف لمسة من الدفء والأناقة إلى مساحتك الخاصة مع مبخرة العود المزخرفة، التي تجمع بين التصميم الراقي والرائحة العذبة.',
    button_text: 'اطلب مبخرتك الآن',
    button_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1920&q=80',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 2,
    title: 'فخامة العود الأصيل',
    subtitle: 'تجربة عطرية لا تُنسى',
    description: 'انغمس في عبق العود الشرقي الفاخر، الذي تم انتقاؤه بعناية ليعطر لحظاتك برائحة التقاليد والرقي.',
    button_text: 'تسوق العود الآن',
    button_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 3,
    title: 'سحر العطور الفاخرة',
    subtitle: 'مجموعة استثنائية من الروائح',
    description: 'اكتشف سحر مجموعتنا الجديدة من العطور الفاخرة، حيث تمتزج ألوان الدخان برائحة العطور لتخلق تجربة حسية فريدة.',
    button_text: 'اكتشف المجموعة',
    button_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80',
    sort_order: 2,
    is_active: true,
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const [heroInfo, setHeroInfo] = useState<{ title: string; description: string; icon: string; is_active: boolean }>({
    title: 'شحن سريع ومضمون',
    description: 'خلال 2-4 أيام عمل',
    icon: '🚚',
    is_active: true
  });

  useEffect(() => {
    async function loadSlides() {
      // 1. Check localStorage first for instant display
      let cachedSlides: HeroSlide[] = [];
      let cachedHeroInfo = null;
      try {
        const stored = localStorage.getItem('sh_bakhoor_content');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.hero_slides && data.hero_slides.length > 0) {
            cachedSlides = data.hero_slides.filter((s: HeroSlide) => s.is_active !== false);
          }
          if (data.hero_info) {
            cachedHeroInfo = data.hero_info;
          }
        }
      } catch (e) {}

      // If we have cached slides, show them immediately (no flash)
      if (cachedSlides.length > 0) {
        setSlides(cachedSlides);
        if (cachedHeroInfo) setHeroInfo(cachedHeroInfo);
        setIsLoading(false);
      }

      // 2. Always fetch fresh from DB
      try {
        const [fetchedSlides, fetchedHeroInfo] = await Promise.all([
          getHeroSlides(),
          getSiteSettings('hero_info'),
        ]);
        if (fetchedHeroInfo) setHeroInfo(fetchedHeroInfo);
        if (fetchedSlides.length > 0) {
          const activeSlides = fetchedSlides.filter((s: HeroSlide) => s.is_active !== false);
          setSlides(activeSlides);
          setIsLoading(false);
          // Update cache
          try {
            const stored = localStorage.getItem('sh_bakhoor_content');
            const data = stored ? JSON.parse(stored) : {};
            data.hero_slides = activeSlides;
            localStorage.setItem('sh_bakhoor_content', JSON.stringify(data));
          } catch (e) {}
        } else if (cachedSlides.length === 0) {
          setSlides(defaultSlides);
          setIsLoading(false);
        }
      } catch (e) {
        if (cachedSlides.length === 0) {
          setSlides(defaultSlides);
        }
        setIsLoading(false);
      }
    }

    loadSlides();
  }, []);

  // Auto slide rotation (pauses on hover)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Keyboard Arrow Navigation (ArrowLeft = Next in RTL, ArrowRight = Prev in RTL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'ArrowRight') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped Left in RTL = Next
        handleNext();
      } else {
        // Swiped Right in RTL = Prev
        handlePrev();
      }
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="relative h-[84vh] min-h-[580px] max-h-[780px] flex items-center justify-center overflow-hidden pt-10 bg-luxury-black">
        <div className="absolute inset-0 bg-luxury-black animate-pulse" />
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center flex flex-col items-center">
          <div className="max-w-2xl space-y-4 w-full flex flex-col items-center">
            <div className="h-6 w-48 bg-luxury-gold/20 rounded animate-pulse" />
            <div className="h-16 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
            <div className="h-12 w-36 bg-luxury-gold/30 rounded animate-pulse mt-4" />
          </div>
        </div>
      </section>
    );
  }

  const activeSlide = slides[currentSlide] || defaultSlides[0];
  const hasContent = activeSlide && (activeSlide.title || activeSlide.subtitle || activeSlide.description || activeSlide.button_text);

  return (
    <section 
      className="group relative h-[84vh] min-h-[580px] max-h-[780px] flex items-center justify-center overflow-hidden pt-10 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Slides with Ken Burns transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {/* Centered Multi-Layered Luxury Gradient Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-black/40 to-black/60 z-10" />
          <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-luxury-black to-transparent z-10" />

          {activeSlide.image_url ? (
            <Image
              src={activeSlide.image_url}
              alt={activeSlide.title || 'SH للبخور والعطور'}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-luxury-dark" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hero Content Area - Centered Layout */}
      <div className="relative z-20 max-w-4xl mx-auto px-12 sm:px-16 md:px-24 w-full text-center flex flex-col items-center justify-center">
        {hasContent && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-4 sm:space-y-5 flex flex-col items-center"
            >
              {/* Floating Brand Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/15 border border-luxury-gold/35 backdrop-blur-md shadow-lg shadow-luxury-gold/5">
                <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
                <span className="text-luxury-gold text-xs sm:text-sm font-bold tracking-wide">
                  {activeSlide.subtitle || 'تشكيلة العود والعطور الفاخرة'}
                </span>
              </div>

              {/* Main Hero Title */}
              {activeSlide.title && (
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.25] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] max-w-3xl">
                  {activeSlide.title}
                </h1>
              )}

              {/* Hero Description */}
              {activeSlide.description && (
                <p className="text-gray-200 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {activeSlide.description}
                </p>
              )}

              {/* Action Buttons Group */}
              <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {activeSlide.button_text && (
                  <Link
                    href={activeSlide.button_link || '/products'}
                    className="inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold text-sm sm:text-base rounded-xl shadow-[0_4px_25px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_35px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <span>{activeSlide.button_text}</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                )}

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 bg-black/40 hover:bg-white/10 text-white font-bold text-sm sm:text-base rounded-xl border border-white/20 hover:border-luxury-gold/50 backdrop-blur-md transition-all duration-300"
                >
                  <span>تصفح جميع المنتجات</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Navigation Arrows (Desktop & Hover with clear spacing from centered text) */}
      {slides.length > 1 && (
        <>
          {/* RTL Next button on the Left */}
          <button
            onClick={handleNext}
            aria-label="الشريحة التالية"
            className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black border border-luxury-gold/30 hover:border-luxury-gold backdrop-blur-md items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-2xl hover:scale-110 active:scale-90 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* RTL Prev button on the Right */}
          <button
            onClick={handlePrev}
            aria-label="الشريحة السابقة"
            className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black border border-luxury-gold/30 hover:border-luxury-gold backdrop-blur-md items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-2xl hover:scale-110 active:scale-90 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
