'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getNavigationLinks, getSiteLogo, getNewsTickerMessages, type NavLink } from '@/lib/database';

const defaultNavLinks: NavLink[] = [
  { id: 1, name: 'الرئيسية', link: '/', has_dropdown: false, dropdown_items: [], sort_order: 0, is_active: true },
  { id: 2, name: 'جميع المنتجات', link: '/products', has_dropdown: false, dropdown_items: [], sort_order: 1, is_active: true },
  { id: 3, name: 'الاكثر مبيعا', link: '/products/best-sellers', has_dropdown: false, dropdown_items: [], sort_order: 2, is_active: true },
  { id: 4, name: 'البخور والعود', link: '/products/oud', has_dropdown: true, dropdown_items: [
    { name: 'عود طبيعي', href: '/products/عود-طبيعي' },
    { name: 'عود محسن', href: '/products/عود-محسن' },
    { name: 'دهن العود', href: '/products/دهن-العود' },
    { name: 'ملحقات البخور', href: '/products/oud' },
  ], sort_order: 3, is_active: true },
  { id: 5, name: 'العطور', link: '/products/perfumes', has_dropdown: true, dropdown_items: [
    { name: 'توم فورد', href: '/products/perfumes' },
    { name: 'جوتشي', href: '/products/perfumes' },
    { name: 'ديور', href: '/products/perfumes' },
  ], sort_order: 4, is_active: true },
  { id: 6, name: 'عروضنا', link: '/products/best-offers', has_dropdown: false, dropdown_items: [], sort_order: 5, is_active: true },
];

const defaultAnnouncements = [
  'الشحن مجاني',
  'التوصيل للرياض فقط',
  'خصم 20% على الطلبات الأولى',
  'توصيل سريع خلال 2-4 أيام عمل',
  'للطلب يرجى التواصل واتساب',
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks);
  const [announcements, setAnnouncements] = useState<string[]>(defaultAnnouncements);
  const [siteLogo, setSiteLogo] = useState('http://localhost/my-store/wp-content/uploads/2025/03/sh-logo-1-300x300.png');
  const [storeName, setStoreName] = useState('SH للبخور');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { totalItems } = useCart();

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    async function fetchData() {
      const links = await getNavigationLinks();
      if (links.length > 0) {
        setNavLinks(links.filter((n: NavLink) => n.is_active !== false));
      } else {
        setNavLinks(defaultNavLinks.filter((n: NavLink) => n.is_active !== false));
      }
      const logoData = await getSiteLogo();
      if (logoData) {
        if (logoData.logo_url) setSiteLogo(logoData.logo_url);
        if (logoData.store_name) setStoreName(logoData.store_name);
      }
      const newsMessages = await getNewsTickerMessages();
      if (newsMessages.length > 0) {
        setAnnouncements(newsMessages.filter((m: any) => m.is_active !== false).map(m => m.message));
      } else {
        setAnnouncements(defaultAnnouncements);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tickerContent = [...announcements, ...announcements, ...announcements, ...announcements].map((item, index) => (
    <span key={index} className="inline-flex items-center gap-4 text-gray-400 text-sm px-4 whitespace-nowrap">
      <span className="text-luxury-gold">●</span>
      {item}
    </span>
  ));

  return (
    <>
      {/* News Ticker - Topmost */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-10 bg-[#1a1a1a] border-b border-luxury-gold/20 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#1a1a1a] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#1a1a1a] to-transparent z-10" />
        
        <div
          className="flex items-center h-full w-max"
          style={{
            animation: 'marquee-rtl 40s linear infinite',
          }}
        >
          {tickerContent}
          {tickerContent}
        </div>
      </div>

      {/* Header - Below Ticker */}
      <motion.header
        ref={dropdownRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-10 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-luxury-black/95 backdrop-blur-md shadow-lg shadow-luxury-gold/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <img
                  src={siteLogo}
                  alt={storeName}
                  className="h-16 w-16 object-contain"
                />
                <span className="text-2xl font-bold text-gold hidden sm:block">{storeName}</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link, index) => (
                <div 
                  key={link.id} 
                  className="relative"
                  onMouseEnter={() => link.has_dropdown && setOpenDropdown(link.name)}
                  onMouseLeave={() => link.has_dropdown && setOpenDropdown(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      href={link.link || '#'}
                      className="relative flex items-center gap-1 text-gray-300 hover:text-luxury-gold transition-colors duration-300 text-lg font-medium py-2 group cursor-pointer"
                    >
                      {link.name}
                      {link.has_dropdown && (
                        <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdown === link.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-luxury-gold group-hover:w-full transition-all duration-300" />
                    </Link>
                  </motion.div>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {link.has_dropdown && openDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-luxury-dark border border-luxury-gold/30 shadow-xl shadow-luxury-gold/10"
                      >
                        {/* Gold Corner */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-r-2 border-luxury-gold" />
                        
                        <div className="p-4">
                          {(() => {
                            const items = typeof link.dropdown_items === 'string' 
                              ? JSON.parse(link.dropdown_items || '[]') 
                              : (link.dropdown_items || []);
                            return items.map((item: any, idx: number) => (
                              <div key={idx}>
                                {item.category ? (
                                  <div className="mb-3">
                                    <h4 className="text-luxury-gold font-semibold text-sm mb-2">{item.category}</h4>
                                    <div className="space-y-2">
                                      {item.items?.map((subItem: string, subIdx: number) => (
                                        <Link
                                          key={subIdx}
                                          href="#"
                                          className="block text-gray-400 hover:text-luxury-gold hover:bg-luxury-gold/10 px-2 py-1 rounded text-sm transition-colors"
                                        >
                                          {subItem}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <Link
                                    href={item.href || item.link || '#'}
                                    className="block text-gray-400 hover:text-luxury-gold hover:bg-luxury-gold/10 px-2 py-2 rounded transition-colors"
                                  >
                                    {item.name}
                                  </Link>
                                )}
                                {idx < items.length - 1 && <div className="border-b border-luxury-gold/10 my-2" />}
                              </div>
                            ));
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-luxury-gold transition-colors"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>

              <Link
                href="/cart"
                className="p-2 text-gray-300 hover:text-luxury-gold transition-colors relative"
                aria-label="Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 8a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-luxury-gold text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-gray-300 hover:text-luxury-gold"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-luxury-dark border-t border-luxury-gold/20 max-h-[70vh] overflow-y-auto"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {navLinks.map((link) => (
                  <div key={link.id}>
                    <Link
                      href={link.link || '#'}
                      className="text-gray-300 hover:text-luxury-gold transition-colors text-lg font-medium py-3 block"
                    >
                      {link.name}
                    </Link>
                    {link.has_dropdown && link.dropdown_items && link.dropdown_items.map((item: any, idx: number) => (
                      <div key={idx} className="pr-4 space-y-1 border-r-2 border-luxury-gold/30">
                        {item.category ? (
                          <>
                            <span className="text-luxury-gold text-sm block py-2">{item.category}</span>
                            {item.items?.map((subItem: string, subIdx: number) => (
                              <Link key={subIdx} href="#" className="text-gray-500 text-sm block py-1 hover:text-luxury-gold">
                                {subItem}
                              </Link>
                            ))}
                          </>
                        ) : (
                          <Link href={item.href || '#'} className="text-gray-500 text-sm block py-2 hover:text-luxury-gold">
                            {item.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-luxury-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="w-full max-w-2xl bg-luxury-dark border border-luxury-gold/30 rounded-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="ابحث عن منتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-transparent text-white text-xl placeholder-gray-500 focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="hidden">بحث</button>
                </form>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-luxury-gold"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {searchQuery && (
                <div className="border-t border-luxury-gold/20 p-4 flex justify-between items-center cursor-pointer hover:bg-luxury-gold/5 transition-colors"
                     onClick={() => handleSearchSubmit()}>
                  <p className="text-gray-500 text-sm">عرض النتائج عن: "{searchQuery}"</p>
                  <span className="text-luxury-gold text-sm font-bold">بحث &larr;</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
