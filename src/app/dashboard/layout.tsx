'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

const navItems = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: '📊' },
  { name: 'المحتوى', href: '/dashboard/content', icon: '📝' },
  { name: 'المنتجات', href: '/dashboard/products', icon: '🛍️' },
  { name: 'التصنيفات', href: '/dashboard/categories', icon: '📁' },
  { name: 'تحسين SEO', href: '/dashboard/seo', icon: '🔍' },
  { name: 'الطلبات', href: '/dashboard/orders', icon: '📦' },
  { name: 'العملاء', href: '/dashboard/customers', icon: '👥' },
  { name: 'الخصومات', href: '/dashboard/discounts', icon: '🎫' },
];

// Hamburger icon component
function HamburgerIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('SH للبخور');

  // Fetch logo from Supabase
  useEffect(() => {
    async function fetchLogo() {
      try {
        const { data, error } = await supabase
          .from('site_logo')
          .select('logo_url, store_name')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        
        if (data && !error) {
          if (data.logo_url) setLogoUrl(data.logo_url);
          if (data.store_name) setStoreName(data.store_name);
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      }
    }
    fetchLogo();
  }, []);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const SIDEBAR_W_OPEN  = 260;
  const SIDEBAR_W_CLOSED = 72;

  const currentPage = navItems.find(
    n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
  );

  /* ─── Sidebar Inner Content ─── */
  const SidebarContent = () => (
    <>
      {/* Logo row — hamburger toggle on the left, logo in the middle/right */}
      <div className="h-14 px-3 border-b border-luxury-gold/20 flex items-center gap-2 flex-shrink-0">
        {/* Toggle button — always visible, leftmost */}
        <button
          onClick={() => isMobile ? setMobileOpen(false) : setSidebarOpen(prev => !prev)}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-gray-400 hover:text-luxury-gold hover:bg-luxury-gold/10 transition-all flex-shrink-0"
          title={sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
        >
          <HamburgerIcon />
        </button>

        {/* Logo + name — only when open */}
        <AnimatePresence initial={false}>
          {(sidebarOpen || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="w-8 h-8 object-contain flex-shrink-0"
                    onError={(e) => {
                      console.error('Logo failed to load:', logoUrl);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-luxury-gold/20 rounded-sm flex items-center justify-center flex-shrink-0">
                    <span className="text-luxury-gold text-xs font-bold">SH</span>
                  </div>
                )}
                <span className="text-luxury-gold font-bold whitespace-nowrap text-sm">{storeName}</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 ${
                isActive
                  ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30'
                  : 'text-gray-400 hover:bg-luxury-gold/5 hover:text-luxury-gold'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <AnimatePresence initial={false}>
                {(sidebarOpen || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap font-medium text-sm overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer Links */}
      <div className="p-2 border-t border-luxury-gold/20 flex-shrink-0 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-luxury-gold transition-colors rounded-sm hover:bg-luxury-gold/5"
        >
          <span className="text-lg flex-shrink-0">🌐</span>
          <AnimatePresence>
            {(sidebarOpen || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap text-sm overflow-hidden"
              >
                عرض الموقع
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await signOut();
            router.push('/login');
            router.refresh();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-sm"
        >
          <span className="text-lg flex-shrink-0">🚪</span>
          <AnimatePresence>
            {(sidebarOpen || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap text-sm overflow-hidden"
              >
                تسجيل الخروج
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );

  return (
    <CartProvider>
      <ToastProvider>
        <div className="min-h-screen bg-luxury-black flex font-cairo" dir="rtl">

          {/* ── MOBILE: Top Bar ── */}
          {isMobile && (
            <div className="fixed top-0 right-0 left-0 z-50 h-14 bg-[#0f0f0f] border-b border-luxury-gold/20 flex items-center px-4 gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-gray-400 hover:text-luxury-gold transition-colors"
              >
                <HamburgerIcon className="w-6 h-6" />
              </button>
              <span className="text-luxury-gold font-bold text-sm">
                {currentPage?.name ?? 'لوحة التحكم'}
              </span>
            </div>
          )}

          {/* ── MOBILE: Drawer Overlay ── */}
          <AnimatePresence>
            {isMobile && mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 z-40 bg-black/70"
                />
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed right-0 top-0 h-screen w-64 bg-[#0f0f0f] border-l border-luxury-gold/20 z-50 flex flex-col"
                >
                  <SidebarContent />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* ── DESKTOP: Fixed Sidebar ── */}
          {!isMobile && (
            <motion.aside
              initial={false}
              animate={{ width: sidebarOpen ? SIDEBAR_W_OPEN : SIDEBAR_W_CLOSED }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed right-0 top-0 h-screen bg-[#0f0f0f] border-l border-luxury-gold/20 z-40 flex flex-col overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          )}

          {/* ── Main Content ── */}
          <motion.main
            initial={false}
            animate={{
              marginRight: isMobile ? 0 : (sidebarOpen ? SIDEBAR_W_OPEN : SIDEBAR_W_CLOSED)
            }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={`flex-1 min-h-screen p-4 sm:p-6 lg:p-8 ${isMobile ? 'pt-16' : ''} w-full`}
          >
            {children}
          </motion.main>

        </div>
      </ToastProvider>
    </CartProvider>
  );
}
