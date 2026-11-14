import React from 'react';
import { getCategoryRichContent } from '@/lib/categoryContent';

interface CategoryContentBoxProps {
  categorySlug: string;
}

export default function CategoryContentBox({ categorySlug }: CategoryContentBoxProps) {
  const guide = getCategoryRichContent(categorySlug);

  if (!guide) return null;

  return (
    <section 
      aria-label="دليل وتفاصيل القسم" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
    >
      <div className="bg-[#161616] border border-luxury-gold/20 rounded-xl p-5 sm:p-7 text-gray-300 leading-relaxed shadow-xl relative overflow-hidden">
        {/* Subtle decorative gold glow line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-luxury-gold/50 to-transparent" />

        {/* Header Area */}
        <div className="mb-5 pb-4 border-b border-luxury-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-luxury-gold animate-pulse" />
            <span className="text-xs font-semibold text-luxury-gold uppercase tracking-wider">
              دليل الشراء والضيافة الملكية
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-luxury-gold mb-1.5">
            {guide.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-medium">
            {guide.subtitle}
          </p>
        </div>

        {/* Substantive Intro Copy (Combatting Thin Content) */}
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 text-justify">
          {guide.intro}
        </p>

        {/* Key Features Grid */}
        {guide.keyFeatures && guide.keyFeatures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {guide.keyFeatures.map((feat, idx) => (
              <div 
                key={idx}
                className="bg-luxury-black/60 border border-luxury-gold/10 rounded-lg p-4 hover:border-luxury-gold/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-luxury-gold text-base">✨</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 leading-normal">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Buying Tips & Usage Guidelines */}
        {guide.buyingTips && guide.buyingTips.length > 0 && (
          <div className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg p-4 sm:p-5">
            <h4 className="text-xs sm:text-sm font-bold text-luxury-gold flex items-center gap-2 mb-3">
              <span>💡</span>
              <span>نصائح خبراء SH للبخور للاقتناء والاستخدام الأمثل:</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              {guide.buyingTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-luxury-gold font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Semantic Keyword Tags for Search Crawlers */}
        {guide.keywords && guide.keywords.length > 0 && (
          <div className="mt-5 pt-4 border-t border-luxury-gold/10 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium ml-1">الكلمات الدلالية:</span>
            {guide.keywords.map((kw, idx) => (
              <span 
                key={idx}
                className="text-[11px] sm:text-xs text-luxury-gold/80 bg-luxury-gold/10 px-2.5 py-1 rounded-full border border-luxury-gold/20"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
