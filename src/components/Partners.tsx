'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getPartners, type Partner } from '@/lib/database';

const DEFAULT_PARTNERS: Partner[] = [
  { id: 1, name: 'توم فورد', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 1 },
  { id: 2, name: 'ديور', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 2 },
  { id: 3, name: 'شانيل', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 3 },
  { id: 4, name: 'غوتشي', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 4 },
  { id: 5, name: 'لانكوم', country: 'Beauty', logo_url: '', is_active: true, sort_order: 5 },
  { id: 6, name: 'إيف سان لوران', country: 'Fragrance', logo_url: '', is_active: true, sort_order: 6 },
];

const defaultSettings = {
  section_title: 'شركاؤنا',
  section_description: 'موردين موثوقين · أفضل العلامات العالمية · شراكات استراتيجية',
  is_active: true,
};

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>(DEFAULT_PARTNERS);
  const [sectionSettings, setSectionSettings] = useState(defaultSettings);

  useEffect(() => {
    async function fetchData() {
      const [fetchedPartners, settingsResult] = await Promise.all([
        getPartners(),
        supabase.from('partners_settings').select('*').limit(1).maybeSingle(),
      ]);

      // Only override defaults if DB actually has data
      if (fetchedPartners.length > 0) {
        setPartners(fetchedPartners.filter(p => p.is_active !== false));
      }

      if (settingsResult.data) {
        setSectionSettings({
          section_title: settingsResult.data.section_title || 'شركاؤنا',
          section_description: settingsResult.data.section_description || '',
          is_active: settingsResult.data.is_active !== false,
        });
      }
    }

    fetchData();
  }, []);

  if (!sectionSettings.is_active) return null;
  if (partners.length === 0) return null;


  return (
    <section className="py-16 relative z-10 bg-luxury-black border-y border-luxury-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {sectionSettings.section_title}
          </h2>
          <p className="text-gray-400">{sectionSettings.section_description}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id || `partner-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group flex flex-col items-center justify-center p-6 bg-luxury-dark border border-luxury-gold/10 hover:border-luxury-gold/30 transition-all duration-300"
            >
              {partner.logo_url ? (
                <div className="h-12 w-full relative mb-3">
                  <Image
                    src={partner.logo_url}
                    alt={partner.name}
                    fill
                    unoptimized
                    className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              ) : (
                <span className="text-3xl mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                  ✦
                </span>
              )}
              <h3 className="text-luxury-gold font-semibold text-lg text-center">
                {partner.name}
              </h3>
              {partner.country && (
                <p className="text-gray-500 text-sm mt-1 text-center">
                  {partner.country}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
