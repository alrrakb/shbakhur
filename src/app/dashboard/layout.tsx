'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <CartProvider>
      <ToastProvider>
        <div className="min-h-screen bg-luxury-black flex">
      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginRight: sidebarOpen ? 260 : 80 }}
        className="flex-1 min-h-screen p-8 transition-all duration-300"
      >
        {children}
      </motion.main>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="fixed right-0 top-0 h-screen bg-[#0f0f0f] border-r border-luxury-gold/20 z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="p-4 border-b border-luxury-gold/20">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="http://localhost/my-store/wp-content/uploads/2025/03/sh-logo-1-300x300.png"
              alt="SH للبخور"
              className="w-10 h-10 object-contain"
            />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-luxury-gold font-bold whitespace-nowrap overflow-hidden"
                >
                  SH للبخور
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30'
                    : 'text-gray-400 hover:bg-luxury-gold/5 hover:text-luxury-gold'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden font-medium"
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
        <div className="p-4 border-t border-luxury-gold/20">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-luxury-gold transition-colors"
          >
            <span className="text-xl">🌐</span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  عرض الموقع
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-luxury-gold rounded-full flex items-center justify-center text-luxury-black hover:bg-luxury-gold-light transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </motion.aside>
    </div>
    </ToastProvider>
    </CartProvider>
  );
}
