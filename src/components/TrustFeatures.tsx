'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: (
      <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: 'شحن سريع ومجاني',
    description: 'شحن مجاني للطلبات فوق 250 ر.س وتوصيل سريع لكافة مدن المملكة',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'أصالة وجودة مضمونة 100%',
    description: 'أجود أنواع العود الطبيعي والبخور الفاخر المنتقى بعناية فائقة',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'تغليف فاخر ومحمي',
    description: 'تغليف ملكي محكم ومحمي بعناية لضمان سلامة وصول العطور والبخور',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: 'دفع آمن ومتعدد',
    description: 'خيارات دفع مشفرة ومتنوعة (مدى، فيزا، ماستركارد، تحويل بنكي)',
  },
];

export default function TrustFeatures() {
  return (
    <section className="relative z-20 -mt-10 sm:-mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#141414]/90 backdrop-blur-md border border-luxury-gold/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex items-start gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center flex-shrink-0 group-hover:bg-luxury-gold/20 group-hover:border-luxury-gold/60 transition-all duration-300">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm sm:text-base mb-1 group-hover:text-luxury-gold transition-colors">
                  {feature.title}
                </h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
