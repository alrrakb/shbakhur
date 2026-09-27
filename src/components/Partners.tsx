'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getPartners, type Partner } from '@/lib/database';

interface DynamicPartner {
  id: number | string;
  name: string;
  country?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

const BRAND_METADATA: Record<string, { enName: string; crest: string }> = {
  'توم فورد': { enName: 'TOM FORD', crest: 'TF' },
  'ديور': { enName: 'DIOR', crest: 'CD' },
  'شانيل': { enName: 'CHANEL', crest: 'CC' },
  'غوتشي': { enName: 'GUCCI', crest: 'GG' },
  'إيف سان لوران': { enName: 'YVES SAINT LAURENT', crest: 'YSL' },
  'العود الطبيعي': { enName: 'ROYAL NATURAL OUD', crest: 'عود' },
  'العود الطبيعي الملكي': { enName: 'ROYAL NATURAL OUD', crest: 'عود' },
};

const defaultSettings = {
  section_title: 'شركاؤنا والعلامات التجارية',
  section_description: 'نخبة من أرقى الدور العالمية وأجود مصادر العود الطبيعي المعتمدة 100%',
  is_active: true,
};

export default function Partners() {
  const [sectionSettings, setSectionSettings] = useState(defaultSettings);
  const [partners, setPartners] = useState<DynamicPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, partnersRes] = await Promise.all([
          supabase.from('partners_settings').select('*').limit(1).maybeSingle(),
          getPartners(),
        ]);

        if (settingsRes.data) {
          setSectionSettings({
            section_title: settingsRes.data.section_title || defaultSettings.section_title,
            section_description: settingsRes.data.section_description || defaultSettings.section_description,
            is_active: settingsRes.data.is_active !== false,
          });
        }

        if (partnersRes && partnersRes.length > 0) {
          setPartners(partnersRes.filter((p: any) => p.is_active !== false));
        } else {
          setPartners([
            { id: 1, name: 'توم فورد', country: 'عطور نيش فاخرة' },
            { id: 2, name: 'ديور', country: 'دار العطور الفرنسية' },
            { id: 3, name: 'شانيل', country: 'أيقونات العطور الكلاسيكية' },
            { id: 4, name: 'غوتشي', country: 'العطور الإيطالية الراقية' },
            { id: 5, name: 'إيف سان لوران', country: 'العطور العالمية المميزة' },
            { id: 6, name: 'العود الطبيعي الملكي', country: 'أجود مصادر العود المعتمدة' },
          ]);
        }
      } catch (e) {
        console.error('Error fetching partners data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!sectionSettings.is_active || partners.length === 0) return null;

  return (
    <section className="py-20 relative z-10 bg-[#0a0a0a] border-t border-luxury-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-xs sm:text-sm font-bold mb-4">
            <span>✦</span>
            <span>نخبة الدور العالمية والشركاء المعتمدين</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            {sectionSettings.section_title}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {sectionSettings.section_description}
          </p>
        </motion.div>

        {/* Brands Grid - Pure Logo-Only Luxury Showcase with Hover Tooltip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {partners.map((partner, index) => {
            const meta = BRAND_METADATA[partner.name] || {
              enName: partner.name,
              crest: partner.name.slice(0, 2),
            };

            return (
              <motion.div
                key={partner.id || index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 6) * 0.05, duration: 0.35 }}
                whileHover={{ y: -5 }}
                className="group relative bg-[#131313] hover:bg-[#1a1814] border border-white/10 hover:border-luxury-gold/60 rounded-2xl h-24 sm:h-28 shadow-sm hover:shadow-[0_12px_30px_rgba(212,175,55,0.18)] transition-all duration-300 cursor-pointer select-none"
              >
                {/* Inner Content: Deep Black Background with Seamless Logo Display */}
                <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-black">
                  {partner.logo_url ? (
                    <div className="w-full h-full flex items-center justify-center p-3 relative bg-black">
                      <img 
                        src={partner.logo_url} 
                        alt={partner.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-b from-[#161616] to-[#0c0c0c]">
                      {partner.name === 'توم فورد' ? (
                        <span className="font-sans font-black tracking-[0.25em] text-base sm:text-lg text-white group-hover:text-luxury-gold transition-colors">
                          TOM FORD
                        </span>
                      ) : partner.name === 'ديور' ? (
                        <span className="font-serif font-black tracking-[0.25em] text-xl sm:text-2xl text-white group-hover:text-luxury-gold transition-colors">
                          DIOR
                        </span>
                      ) : partner.name === 'شانيل' ? (
                        <span className="font-sans font-black tracking-[0.28em] text-base sm:text-lg text-white group-hover:text-luxury-gold transition-colors">
                          CHANEL
                        </span>
                      ) : partner.name === 'غوتشي' ? (
                        <span className="font-serif font-bold tracking-[0.25em] text-base sm:text-lg text-white group-hover:text-luxury-gold transition-colors">
                          GUCCI
                        </span>
                      ) : partner.name === 'إيف سان لوران' ? (
                        <span className="font-sans font-extrabold tracking-[0.15em] text-xs sm:text-sm text-white group-hover:text-luxury-gold transition-colors">
                          YVES SAINT LAURENT
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-serif font-black text-sm sm:text-base text-luxury-gold tracking-widest group-hover:scale-105 transition-transform">
                          <span>ROYAL OUD</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subtle Ambient Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Floating Luxury Tooltip on Hover */}
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-top-13 pointer-events-none transition-all duration-300 z-30 whitespace-nowrap">
                  <div className="bg-[#121212]/95 backdrop-blur-xl border border-luxury-gold/60 px-3.5 py-1.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.9)] flex items-center gap-2">
                    <span className="text-white font-bold text-xs">{partner.name}</span>
                    <span className="text-luxury-gold/50 text-xs">•</span>
                    <span className="text-luxury-gold font-mono text-[11px] font-bold tracking-wider">{meta.enName}</span>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="w-2 h-2 bg-[#121212] border-r border-b border-luxury-gold/60 rotate-45 mx-auto -mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Trust Guarantee Strip */}
        <div className="mt-12 pt-8 border-t border-luxury-gold/15 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-gray-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>منتجات وعطور أصلية 100% معتمدة</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>مصادر عود طبيعي منتقاة ومفحوصة</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>شحن وحفظ آمن بعبوات مخصصة</span>
          </div>
        </div>

      </div>
    </section>
  );
}
