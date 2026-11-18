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
  phone_numbers: ['+966 58 009 0886'],
  whatsapp: '+966 58 009 0886',
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
    { id: 6, section: 'incense', name: 'عود طبيعي', link: '/products/natural-oud', sort_order: 0 },
    { id: 7, section: 'incense', name: 'عود محسن', link: '/products/enhanced-oud', sort_order: 1 },
    { id: 8, section: 'incense', name: 'عود مُسقّى', link: '/products/scented-oud', sort_order: 2 },
    { id: 9, section: 'incense', name: 'دهن العود', link: '/products/aloud', sort_order: 3 },
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
        links.filter(link => link.is_active !== false).forEach(link => {
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

        {/* Official Saudi Business Credentials & Trust Badges Strip */}
        <div className="mt-12 pt-8 border-t border-luxury-gold/15">
          <div className="bg-luxury-black/60 rounded-xl border border-luxury-gold/20 p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Entity & Official Registration Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4">
              <div className="w-12 h-12 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center shrink-0 text-luxury-gold">
                {/* Saudi Emblem Palm & Swords SVG */}
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a1 1 0 011 1v1.1c2.8.3 5 2.7 5 5.6 0 1.9-.9 3.6-2.3 4.6l1.8 1.8a1 1 0 01-1.4 1.4L13 14.4V21a1 1 0 11-2 0v-6.6l-3.1 3.1a1 1 0 01-1.4-1.4l1.8-1.8C6.9 13.3 6 11.6 6 9.7c0-2.9 2.2-5.3 5-5.6V3a1 1 0 011-1zm0 4.1C9.8 6.1 8 7.9 8 10.1c0 1.3.6 2.5 1.5 3.2L12 10.8l2.5 2.5c.9-.7 1.5-1.9 1.5-3.2 0-2.2-1.8-4-4-4z"/>
                </svg>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-white font-bold text-sm">مؤسسة طلائع الركب للتسويق الالكتروني</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    متجر موثق
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400 font-readex">
                  <span>س.ت: <strong className="text-luxury-gold font-mono" dir="ltr">1010624835</strong></span>
                  <span className="text-luxury-gold/30">•</span>
                  <span>الرقم الضريبي: <strong className="text-luxury-gold font-mono" dir="ltr">302225392200003</strong></span>
                  <span className="text-luxury-gold/30">•</span>
                  <span>توثيق التجارة الإلكترونية: <strong className="text-luxury-gold font-mono" dir="ltr">0000199532</strong></span>
                </div>
              </div>
            </div>

            {/* Official PDF Document Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="/docs/e-commerce-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="عرض شهادة توثيق التجارة الإلكترونية (المركز السعودي للأعمال)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-luxury-dark border border-luxury-gold/30 hover:border-luxury-gold text-xs text-gray-300 hover:text-white transition-all shadow-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-luxury-gold group-hover:scale-125 transition-transform" />
                <span>شهادة التوثيق (SBC)</span>
                <span className="text-luxury-gold text-[10px]">↗</span>
              </a>

              <a
                href="/docs/commercial-registration.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="عرض السجل التجاري الرسمي"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-luxury-dark border border-luxury-gold/30 hover:border-luxury-gold text-xs text-gray-300 hover:text-white transition-all shadow-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-luxury-gold group-hover:scale-125 transition-transform" />
                <span>السجل التجاري</span>
                <span className="text-luxury-gold text-[10px]">↗</span>
              </a>

              <a
                href="/docs/tax-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="عرض شهادة التسجيل في ضريبة القيمة المضافة (ZATCA)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-luxury-dark border border-luxury-gold/30 hover:border-luxury-gold text-xs text-gray-300 hover:text-white transition-all shadow-sm group"
              >
                <span className="w-2 h-2 rounded-full bg-luxury-gold group-hover:scale-125 transition-transform" />
                <span>الشهادة الضريبية</span>
                <span className="text-luxury-gold text-[10px]">↗</span>
              </a>
            </div>

          </div>

          {/* Payment Providers & Methods Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-luxury-gold/10">
            <span className="text-xs text-gray-400 font-readex">
              طرق دفع آمنة ومعتمدة في المملكة:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* mada */}
              <div className="h-7 px-2.5 rounded bg-white/95 flex items-center justify-center shadow-sm" title="مدى mada">
                <span className="text-xs font-bold text-[#004f2d] tracking-tighter">mada | مدى</span>
              </div>
              {/* Apple Pay */}
              <div className="h-7 px-2.5 rounded bg-white/95 flex items-center justify-center shadow-sm" title="Apple Pay">
                <span className="text-xs font-semibold text-black tracking-tight"> Pay</span>
              </div>
              {/* Visa */}
              <div className="h-7 px-2.5 rounded bg-white/95 flex items-center justify-center shadow-sm" title="Visa">
                <span className="text-xs font-extrabold text-[#1a1f71] italic tracking-wider">VISA</span>
              </div>
              {/* MasterCard */}
              <div className="h-7 px-2.5 rounded bg-white/95 flex items-center justify-center shadow-sm" title="MasterCard">
                <div className="flex items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#eb001b] -mr-1.5 opacity-90" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#f79e1b] opacity-90" />
                </div>
              </div>
              {/* Tabby */}
              <div className="h-7 px-2.5 rounded bg-[#3efe9f] text-black font-extrabold text-xs flex items-center justify-center shadow-sm" title="تابي Tabby">
                tabby
              </div>
              {/* Tamara */}
              <div className="h-7 px-2.5 rounded bg-[#ff735c] text-white font-extrabold text-xs flex items-center justify-center shadow-sm" title="تمارا Tamara">
                tamara
              </div>
              {/* ZATCA Tax Compliance Badge */}
              <a
                href="/docs/tax-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                title="شهادة ضريبة القيمة المضافة 15%"
                className="h-7 px-2 rounded bg-luxury-dark border border-luxury-gold/30 text-[10px] text-luxury-gold flex items-center gap-1 font-semibold hover:border-luxury-gold transition-colors"
              >
                <span>ضريبة القيمة المضافة 15%</span>
              </a>
            </div>
          </div>
        </div>

        {/* Legal & Policy Navigation Strip */}
        <div className="mt-12 pt-8 border-t border-luxury-gold/15 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-400 font-readex">
          <Link href="/return-policy" className="hover:text-luxury-gold transition-colors">
            سياسة الاستبدال والاسترجاع
          </Link>
          <span className="text-luxury-gold/30 hidden sm:inline">•</span>
          <Link href="/privacy-policy" className="hover:text-luxury-gold transition-colors">
            سياسة الخصوصية
          </Link>
          <span className="text-luxury-gold/30 hidden sm:inline">•</span>
          <Link href="/faq" className="hover:text-luxury-gold transition-colors">
            الأسئلة الشائعة
          </Link>
          <span className="text-luxury-gold/30 hidden sm:inline">•</span>
          <Link href="/about" className="hover:text-luxury-gold transition-colors">
            من نحن
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-luxury-gold/10 text-center flex flex-col items-center gap-1.5">
          <p className="text-gray-400 text-sm font-readex">
            © {new Date().getFullYear()} SH للبخور. {settings.copyright}.
          </p>
          <span className="text-luxury-gold/60 text-xs font-cormorant tracking-[0.25em] uppercase">
            SH BAKHUR · LUXURY ARABIAN ESSENCES & ROYAL PERFUMES
          </span>
        </div>
      </div>
    </footer>
  );
}
