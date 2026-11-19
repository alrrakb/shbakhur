'use client';

import React, { useState } from 'react';
import { getCategoryRichContent } from '@/lib/categoryContent';
import { motion, AnimatePresence } from 'framer-motion';

interface CategoryContentBoxProps {
  categorySlug: string;
}

export default function CategoryContentBox({ categorySlug }: CategoryContentBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = getCategoryRichContent(categorySlug);

  if (!guide) return null;

  return (
    <section 
      aria-label="دليل وتفاصيل القسم" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6"
    >
      <div className="bg-[#141414]/90 border border-luxury-gold/20 rounded-xl p-4 sm:p-5 text-gray-300 shadow-md relative overflow-hidden backdrop-blur-sm">
        {/* Subtle decorative gold line */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-luxury-gold/40 to-transparent" />

        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-luxury-gold/10">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-luxury-gold shrink-0 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-luxury-gold">
                {guide.title}
              </h2>
            </div>
            {guide.subtitle && (
              <p className="text-xs text-gray-400 font-readex">
                {guide.subtitle}
              </p>
            )}
          </div>

          {(guide.buyingTips?.length || guide.keywords?.length) ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-semibold border border-luxury-gold/25 transition-colors shrink-0"
            >
              <span>{isExpanded ? 'طي التفاصيل' : 'دليل الاستخدام والنصائح'}</span>
              <svg 
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Concise Intro */}
        <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed mt-3">
          {guide.intro}
        </p>

        {/* Compact Features Strip (Horizontal Pills) */}
        {guide.keyFeatures && guide.keyFeatures.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3.5">
            {guide.keyFeatures.map((feat, idx) => (
              <div 
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-luxury-black/70 border border-luxury-gold/15 text-xs text-gray-300"
                title={feat.desc}
              >
                <span className="text-luxury-gold text-xs">✦</span>
                <span className="font-semibold text-white">{feat.title}</span>
                <span className="text-gray-400 hidden md:inline text-[11px]">({feat.desc})</span>
              </div>
            ))}
          </div>
        )}

        {/* Expandable Tips & Keywords Area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-luxury-gold/10 space-y-3">
                {/* Buying Tips */}
                {guide.buyingTips && guide.buyingTips.length > 0 && (
                  <div className="bg-luxury-gold/5 border border-luxury-gold/15 rounded-lg p-3 sm:p-4">
                    <h4 className="text-xs font-bold text-luxury-gold flex items-center gap-1.5 mb-2">
                      <span>💡</span>
                      <span>نصائح خبراء SH للبخور للاستخدام الأمثل:</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {guide.buyingTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-luxury-gold font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords Tags */}
                {guide.keywords && guide.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-500 font-medium ml-1">الكلمات الدلالية:</span>
                    {guide.keywords.map((kw, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] sm:text-[11px] text-luxury-gold/75 bg-luxury-gold/5 px-2 py-0.5 rounded-full border border-luxury-gold/15"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
