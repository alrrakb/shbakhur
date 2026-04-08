'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHeroSlides, type HeroSlide } from '@/lib/database';
import Link from 'next/link';
import Image from 'next/image';

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    title: 'شحن سريع ومضمون',
    subtitle: 'أجود أنواع البخور والعطور',
    description: ' delivery within 2-4 business days',
    button_text: 'تسوق الآن',
    button_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1920&q=80',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 2,
    title: 'العود الطبيعي',
    subtitle: 'فاخر ومميز',
    description: 'أجود قطع العود الطبيعي من تايلاند وإندونيسيا',
    button_text: 'تسوق الآن',
    button_link: '/products',
    image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 3,
    title: 'عطور عالمية',
    subtitle: 'أفضل الماركات',
    description: 'شانيل، ديور، غوتشي، توم فورد والمزيد',
    button_text: 'تسوق الآن',
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
        const fetchedSlides = await getHeroSlides();
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
          // Nothing in cache AND nothing in DB → show defaults
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

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden pt-10 bg-luxury-black">
        <div className="absolute inset-0 bg-luxury-black animate-pulse" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl space-y-4">
            <div className="h-6 w-48 bg-luxury-gold/20 rounded animate-pulse" />
            <div className="h-16 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
            <div className="h-12 w-36 bg-luxury-gold/30 rounded animate-pulse mt-4" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden pt-10">
      {/* Background Images */}
      <AnimatePresence mode="wait">
        {(() => {
          const slide = slides[currentSlide];
          const hasLink = slide.button_link && slide.button_link !== '#' && slide.button_link !== '';
          const Container = hasLink ? Link : 'div';
          const containerProps = hasLink ? { href: slide.button_link } : {};

          return (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <Container {...(containerProps as any)} className="block w-full h-full relative">
                {(() => {
                  const slide = slides[currentSlide];
                  const hasContent = slide.title || slide.subtitle || slide.description || slide.button_text;
                  
                  if (!hasContent) {
                    return (
                      <Image
                        src={slide.image_url}
                        alt="Hero"
                        fill
                        priority
                        unoptimized
                        sizes="100vw"
                        className="object-cover"
                      />
                    );
                  }
                  
                  return (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-luxury-black via-luxury-black/80 to-transparent z-10" />
                      <Image
                        src={slide.image_url}
                        alt={slide.title || 'Hero'}
                        fill
                        priority
                        unoptimized
                        sizes="100vw"
                        className="object-cover"
                      />
                    </>
                  );
                })()}
              </Container>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Content - Only show if there's content */}
      {(() => {
        const slide = slides[currentSlide];
        const hasContent = slide.title || slide.subtitle || slide.description || slide.button_text;
        
        if (!hasContent) {
          return null;
        }
        
        return (
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {slide.subtitle && (
                    <h2 className="text-luxury-gold text-xl md:text-2xl font-medium mb-2 tracking-wider">
                      {slide.subtitle}
                    </h2>
                  )}
                  {slide.title && (
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                      {slide.title}
                    </h1>
                  )}
                  {slide.description && (
                    <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl">
                      {slide.description}
                    </p>
                  )}
                  {slide.button_text && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-luxury-gold text-luxury-black font-bold text-lg rounded-none hover:bg-luxury-gold-light transition-colors duration-300"
                    >
                      {slide.button_text || 'تسوق الآن'}
                    </motion.button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        );
      })()}

      {/* Pagination Dots - Only show if there's content */}
      {(() => {
        const slide = slides[currentSlide];
        const hasContent = slide.title || slide.subtitle || slide.description || slide.button_text;
        
        if (!hasContent) {
          return null;
        }
        
        return (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-luxury-gold w-8'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        );
      })()}

      {/* Shipping Badge - Only show if there's content */}
      {(() => {
        const slide = slides[currentSlide];
        const hasContent = slide.title || slide.subtitle || slide.description || slide.button_text;
        
        if (!hasContent || heroInfo.is_active === false) {
          return null;
        }
        
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-8 z-20 hidden lg:block"
          >
            <div className="bg-luxury-dark/80 backdrop-blur-sm border border-luxury-gold/30 px-6 py-4 rounded-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/20 flex items-center justify-center text-2xl">
                  {heroInfo.icon || '🚚'}
                </div>
                <div>
                  <p className="text-luxury-gold font-bold">{heroInfo.title || 'شحن سريع ومضمون'}</p>
                  <p className="text-gray-400 text-sm">{heroInfo.description || 'خلال 2-4 أيام عمل'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </section>
  );
}
