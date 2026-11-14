'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQ_ITEMS, type FAQItemData } from './faqs';

interface FAQAccordionProps {
  items?: FAQItemData[];
}

export default function FAQAccordion({ items = FAQ_ITEMS }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default for rich UX

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="bg-luxury-dark border border-luxury-gold/20 rounded-sm overflow-hidden transition-colors hover:border-luxury-gold/40 shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              aria-expanded={isOpen}
              className="w-full min-h-[56px] flex items-center justify-between p-5 sm:p-6 text-right hover:bg-luxury-gold/5 transition-colors focus:outline-none focus:ring-1 focus:ring-luxury-gold/50"
            >
              <span className={`font-semibold text-base sm:text-lg transition-colors ${isOpen ? 'text-luxury-gold' : 'text-white'}`}>
                {item.question}
              </span>
              <span
                className={`p-1.5 rounded-sm bg-luxury-black/60 border border-luxury-gold/20 text-luxury-gold transition-transform duration-300 mr-4 shrink-0 ${
                  isOpen ? 'rotate-180 bg-luxury-gold/10' : ''
                }`}
                aria-hidden="true"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 sm:px-6 pb-6 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-luxury-gold/10 pt-4 font-normal">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
