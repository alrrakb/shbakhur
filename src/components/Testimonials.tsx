'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTestimonials, type Testimonial } from '@/lib/database';

const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'أحمد محمد',
    location: 'الرياض',
    rating: 5,
    comment: 'من أفضل المتاجر التي تعاملت معها. جودة البخور ممتازة والتوصيل كان سريعا جداً. أنصح الجميع بالتعامل مع SH للبخور.',
    is_active: true,
    sort_order: 0,
  },
  {
    id: 2,
    name: 'سارة علي',
    location: 'جدة',
    rating: 5,
    comment: 'العطور أصيلة بأسعار مناسبة. خدمة العملاء متميزة والاستجابة سريعة. شكراً فريق SH للبخور.',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 3,
    name: 'خالد عمر',
    location: 'الدمام',
    rating: 5,
    comment: '购买的عود الطبيعي真的很棒！质量上乘，香气浓郁。强烈推荐给所有喜欢沉香的朋友。',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 4,
    name: 'فاطمة أحمد',
    location: 'الامارات',
    rating: 5,
    comment: 'تجربة تسوق رائعة. المنتجات كما هو موضح والصور الحقيقية. شكراً على الجهد والتخصص.',
    is_active: true,
    sort_order: 3,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);

  useEffect(() => {
    const stored = localStorage.getItem('sh_bakhoor_content');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials.filter((t: Testimonial) => t.is_active !== false));
        }
      } catch (e) {
        console.log('Error reading from localStorage');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchTestimonials() {
      const fetched = await getTestimonials();
      if (fetched.length > 0) {
        setTestimonials(fetched.filter((t: Testimonial) => t.is_active !== false));
      }
    }
    fetchTestimonials();
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 relative z-10 bg-luxury-dark/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            آراء <span className="text-gold">عملائنا</span>
          </h2>
          <p className="text-gray-400 text-lg">
            ماذا يقول عملاؤنا عن تجربتهم مع متجر SH للبخور
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-luxury-black border border-luxury-gold/20 rounded-sm p-8 md:p-12"
            >
              {/* Quote Icon */}
              <div className="text-luxury-gold/30 text-8xl font-serif leading-none mb-4">"</div>

              {/* Testimonial Text */}
              <p className="text-gray-300 text-lg md:text-xl text-center mb-8 leading-relaxed">
                {testimonials[currentIndex].comment}
              </p>

              {/* Customer Info */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-luxury-gold bg-luxury-dark flex items-center justify-center">
                  <span className="text-luxury-gold text-2xl font-bold">{testimonials[currentIndex].name.charAt(0)}</span>
                </div>
                <div className="text-right">
                  <h4 className="text-white font-bold text-lg">{testimonials[currentIndex].name}</h4>
                  <p className="text-gray-400 text-sm">{testimonials[currentIndex].location}</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-luxury-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full border border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full border border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-luxury-gold w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
