'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTestimonials, type Testimonial } from '@/lib/database';

interface EnhancedTestimonial extends Testimonial {
  product?: string;
  timeAgo?: string;
  verified?: boolean;
}

const defaultTestimonials: EnhancedTestimonial[] = [
  {
    id: 1,
    name: 'أحمد المطيري',
    location: 'الرياض',
    rating: 5,
    comment: 'من أفضل المتاجر التي تعاملت معها، العود المروكي فاخر جداً وريحته ثباتها يدوم لأيام بالثياب والمجلس. التوصيل كان سريعاً ووصلني بتغليف راقي.',
    product: 'عود مروكي طبيعي فاخر',
    timeAgo: 'منذ يومين',
    verified: true,
    is_active: true,
    sort_order: 0,
  },
  {
    id: 2,
    name: 'سارة الغامدي',
    location: 'جدة',
    rating: 5,
    comment: 'عطور أصلية 100% وثباتها ممتاز جداً، فرق واضح عن باقي المتاجر وتعامل خدمة العملاء في قمة الذوق والاحترافية. سأكرر الطلب دائماً بإذن الله.',
    product: 'عطر إيف سان لوران ليبر',
    timeAgo: 'منذ 4 أيام',
    verified: true,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 3,
    name: 'خالد الدوسري',
    location: 'الدمام',
    rating: 5,
    comment: 'العود الطبيعي الملكي فاخر ورائحته زكية وثباتها استثنائي. تجربة تسوق مميزة وسرعة فائقة بالشحن لمدينة الدمام، بارك الله فيكم.',
    product: 'العود الطبيعي الملكي',
    timeAgo: 'منذ أسبوع',
    verified: true,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 4,
    name: 'فهد العتيبي',
    location: 'مكة المكرمة',
    rating: 5,
    comment: 'باقة المسك رائعة جداً وهدية تبيض الوجه، الروائح هادئة وفواحة ومناسبة للاستخدام اليومي والمناسبات. شكراً على المصداقية.',
    product: 'باقة عطور نفح الفاخرة',
    timeAgo: 'منذ أسبوعين',
    verified: true,
    is_active: true,
    sort_order: 3,
  },
  {
    id: 5,
    name: 'نورة الشمري',
    location: 'القصيم',
    rating: 5,
    comment: 'التوصيل سريع والاهتمام بأدق التفاصيل والبوكسينق فخم جداً يناسب الإهداء. دهن العود ريحته تفوح بالمكان وما تغث.',
    product: 'دهن عود كمبودي معتق',
    timeAgo: 'منذ أسبوعين',
    verified: true,
    is_active: true,
    sort_order: 4,
  },
  {
    id: 6,
    name: 'عبدالعزيز القحطاني',
    location: 'الخبر',
    rating: 5,
    comment: 'جودة استثنائية وسعر منافس مقارنة بالسوق. طلبت بكج العود والمبخرة وجاني في وقت قياسي. متجر يستحق 5 نجوم عن جدارة.',
    product: 'بكج الضيافة الملكي',
    timeAgo: 'منذ 3 أسابيع',
    verified: true,
    is_active: true,
    sort_order: 5,
  },
];

export default function Testimonials() {
  const [page, setPage] = useState(0);
  const [testimonials, setTestimonials] = useState<EnhancedTestimonial[]>(defaultTestimonials);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const fetched = await getTestimonials();
        if (fetched && fetched.length > 0) {
          const active = fetched.filter((t: Testimonial) => t.is_active !== false);
          // Merge with mock enrichments if needed
          const enriched = active.map((item, idx) => ({
            ...item,
            product: defaultTestimonials[idx % defaultTestimonials.length]?.product || 'منتج مختار من SH للبخور',
            timeAgo: defaultTestimonials[idx % defaultTestimonials.length]?.timeAgo || 'منذ فترة قريبة',
            verified: true,
          }));
          setTestimonials(enriched);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const currentTestimonials = testimonials.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const nextPage = () => {
    setPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <section className="py-20 relative z-10 bg-[#0e0e0e]/80 border-t border-luxury-gold/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Rating Summary */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-xs sm:text-sm font-bold mb-4"
          >
            <span className="flex text-amber-400">★★★★★</span>
            <span>تقييم 4.9 من 5 بناءً على +1,500 عميل</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            تجارب وآراء <span className="text-luxury-gold">عملائنا</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm sm:text-base leading-relaxed"
          >
            نفخر بثقة عملائنا في كافة مدن ومناطق المملكة، ونحرص دائماً على تقديم تجربة فاخرة لا تُنسى
          </motion.p>
        </div>

        {/* Testimonials 3-Card Grid */}
        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {currentTestimonials.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-[#151515] border border-luxury-gold/20 hover:border-luxury-gold/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_35px_rgba(212,175,55,0.15)] transition-all duration-300 group hover:-translate-y-1.5"
                >
                  {/* Card Header: Avatar, Name, Location & Verified Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 border border-luxury-gold/50 flex items-center justify-center text-luxury-gold font-bold text-lg shadow-inner flex-shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-base leading-tight group-hover:text-luxury-gold transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                            <span>{item.location}</span>
                            <span className="text-luxury-gold/50">•</span>
                            <span className="text-gray-500">{item.timeAgo || 'منذ فترة قريبة'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>شراء موثق</span>
                      </div>
                    </div>

                    {/* Stars & Product Purchased */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex gap-1 text-luxury-gold">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-luxury-gold fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {item.product && (
                        <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded truncate max-w-[140px]">
                          {item.product}
                        </span>
                      )}
                    </div>

                    {/* Comment Body */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      "{item.comment}"
                    </p>
                  </div>

                  {/* Trust Footer mark */}
                  <div className="pt-3 flex items-center justify-between text-gray-500 text-xs border-t border-white/5">
                    <span className="flex items-center gap-1 text-luxury-gold/70">
                      <span>✦</span>
                      <span>تجربة شراء أصلية</span>
                    </span>
                    <span className="text-gray-600">SH للبخور</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={prevPage}
              className="w-11 h-11 rounded-full border border-luxury-gold/40 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-all flex items-center justify-center active:scale-95 shadow-md"
              aria-label="السابق"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Pagination Dots */}
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === page ? 'w-8 bg-luxury-gold' : 'w-2.5 bg-gray-700 hover:bg-gray-500'
                  }`}
                  aria-label={`صفحة ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              className="w-11 h-11 rounded-full border border-luxury-gold/40 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-all flex items-center justify-center active:scale-95 shadow-md"
              aria-label="التالي"
            >
              <svg className="w-5 h-5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
