'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getFooterLinks, getFooterSettings, type FooterLink } from '@/lib/database';

interface GroupedLinks {
  [key: string]: FooterLink[];
}

const DEFAULT_SETTINGS = {
  about_title: 'نحن',
  about_description: 'متجر SH للبخور متخصص في أجود أنواع البخور والعطور والعود الطبيعي والفاخر من جميع أنحاء العالم.',
  phone_numbers: ['+966 50 123 4567'],
  whatsapp: '+966501234567',
  copyright: 'جميع الحقوق محفوظة',
  is_active: true,
};

const DEFAULT_LINKS: GroupedLinks = {
  quick_links: [
    { id: 1, section: 'quick_links', name: 'الرئيسية', link: '/', sort_order: 0 },
    { id: 2, section: 'quick_links', name: 'جميع المنتجات', link: '/products', sort_order: 1 },
    { id: 3, section: 'quick_links', name: 'عروضنا', link: '/products/best-offers', sort_order: 2 },
  ],
  incense: [
    { id: 4, section: 'incense', name: 'عود طبيعي', link: '/products/عود-طبيعي', sort_order: 0 },
    { id: 5, section: 'incense', name: 'عود محسن', link: '/products/عود-محسن', sort_order: 1 },
    { id: 6, section: 'incense', name: 'دهن العود', link: '/products/دهن-العود', sort_order: 2 },
  ],
};

export default function Footer() {
  const [footerLinks, setFooterLinks] = useState<GroupedLinks>(DEFAULT_LINKS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    async function fetchData() {
      // Fetch both in parallel — Supabase is the source of truth
      const [links, footerSettings] = await Promise.all([
        getFooterLinks(),
        getFooterSettings(),
      ]);

      // Group footer links
      if (links && links.length > 0) {
        const grouped: GroupedLinks = {};
        links.forEach(link => {
          if (!grouped[link.section]) grouped[link.section] = [];
          grouped[link.section].push(link);
        });
        setFooterLinks(grouped);
      }

      // Apply footer settings
      if (footerSettings) {
        setSettings({
          about_title: footerSettings.about_title || DEFAULT_SETTINGS.about_title,
          about_description: footerSettings.about_description || DEFAULT_SETTINGS.about_description,
          phone_numbers: footerSettings.phone_numbers?.length > 0 ? footerSettings.phone_numbers : DEFAULT_SETTINGS.phone_numbers,
          whatsapp: footerSettings.whatsapp || DEFAULT_SETTINGS.whatsapp,
          copyright: footerSettings.copyright || DEFAULT_SETTINGS.copyright,
          is_active: footerSettings.is_active !== false,
        });
      }
    }

    fetchData();
  }, []);

  if (!settings.is_active) return null;

  const whatsappClean = settings.whatsapp.replace(/\D/g, '');

  return (
    <footer className="relative z-10 bg-luxury-black border-t border-luxury-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* About Column */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="text-xl font-bold text-luxury-gold mb-6">{settings.about_title}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">{settings.about_description}</p>
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }} viewport={{ once: true }}>
            <h3 className="text-xl font-bold text-luxury-gold mb-6">روابط سريعة</h3>
            <ul className="space-y-3">
              {(footerLinks.quick_links || []).map((link, index) => (
                <li key={link.id || `quick-${index}`}>
                  <Link href={link.link || '#'} className="text-gray-400 hover:text-luxury-gold transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Incense Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} viewport={{ once: true }}>
            <h3 className="text-xl font-bold text-luxury-gold mb-6">البخور</h3>
            <ul className="space-y-3">
              {(footerLinks.incense || []).map((link, index) => (
                <li key={link.id || `incense-${index}`}>
                  <Link href={link.link || '#'} className="text-gray-400 hover:text-luxury-gold transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} viewport={{ once: true }}>
            <h3 className="text-xl font-bold text-luxury-gold mb-6">تواصل معنا</h3>
            <div className="space-y-4">
              {/* WhatsApp */}
              <a href={`https://wa.me/${whatsappClean}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-luxury-gold transition-colors">
                <svg className="w-5 h-5 text-luxury-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 0C5.385 0 0 5.388 0 12c0 2.115.548 4.168 1.59 5.964L.073 23.47l5.659-1.484A11.956 11.956 0 0012.031 24c6.645 0 12.03-5.388 12.03-12s-5.385-12-12.03-12zm6.657 17.15c-.266.75-1.531 1.442-2.138 1.516-.541.066-1.25.176-3.565-.778-2.825-1.163-4.631-4.045-4.767-4.227-.137-.184-1.139-1.516-1.139-2.89s.718-2.046.974-2.316c.256-.27.556-.337.744-.337s.374-.006.536.002c.162.008.381-.061.595.459.214.52.73 1.782.796 1.916.066.135.111.293.023.472-.088.179-.133.291-.266.444-.133.153-.284.331-.403.454-.132.135-.27.284-.118.544.152.261.677 1.118 1.455 1.812.999.892 1.84 1.18 2.096 1.303.256.122.406.103.559-.069.153-.172.66-.77.838-1.036.178-.266.356-.22.589-.134.233.086 1.472.695 1.724.821.252.126.421.191.483.297.062.106.062.613-.204 1.363z"/>
                </svg>
                <span dir="ltr" className="font-sans tracking-wider">{settings.whatsapp}</span>
              </a>

              {/* Phone Numbers */}
              {settings.phone_numbers.map((phone, index) => (
                <a key={index} href={`tel:${phone}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-luxury-gold transition-colors">
                  <svg className="w-5 h-5 text-luxury-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span dir="ltr" className="font-sans tracking-wider">{phone}</span>
                </a>
              ))}

            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-luxury-gold/10 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 SH للبخور. {settings.copyright}.
          </p>
        </div>
      </div>
    </footer>
  );
}
