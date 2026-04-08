'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Stats {
  productsCount: number;
  customersCount: number;
  ordersCount: number;
}

interface RecentProduct {
  id: number;
  title: string;
  price: string;
  image: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({ productsCount: 0, customersCount: 0, ordersCount: 0 });
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('customers').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          productsCount: productsRes.count || 0,
          customersCount: customersRes.count || 0,
          ordersCount: ordersRes.count || 0,
        });

        const [recentProd, recentOrd] = await Promise.all([
          supabase.from('products').select('id, title, price, image').order('id', { ascending: false }).limit(5),
          supabase.from('orders').select('id, order_number, total_amount, status, created_at, customers(name)').order('created_at', { ascending: false }).limit(6),
        ]);

        if (recentProd.data) setRecentProducts(recentProd.data);
        if (recentOrd.data) setRecentOrders(recentOrd.data as any);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statCards = [
    { label: 'الطلبات', value: stats.ordersCount, icon: '📦', color: 'from-blue-600 to-indigo-500', href: '/dashboard/orders' },
    { label: 'العملاء', value: stats.customersCount, icon: '👥', color: 'from-purple-600 to-pink-500', href: '/dashboard/customers' },
    { label: 'المنتجات', value: stats.productsCount, icon: '🛍️', color: 'from-amber-600 to-yellow-500', href: '/dashboard/products' },
  ];

  const quickActions = [
    { label: '+ إضافة منتج', href: '/dashboard/products/add', style: 'bg-luxury-gold text-luxury-black font-bold hover:bg-luxury-gold/80' },
    { label: '+ إضافة طلب', href: '/dashboard/orders/add', style: 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30' },
    { label: '+ إضافة عميل', href: '/dashboard/customers', style: 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30' },
    { label: '+ إضافة كوبون', href: '/dashboard/discounts', style: 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30' },
    { label: 'تحرير المحتوى', href: '/dashboard/content', style: 'border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10' },
    { label: 'إعدادات SEO', href: '/dashboard/seo', style: 'border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-white' },
    { label: 'الشعارات والمظهر', href: '/dashboard/media', style: 'border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-white' },
    { label: 'عرض الموقع', href: '/', style: 'border border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300' },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
          لوحة التحكم <span className="text-luxury-gold">SH للبخور</span>
        </h1>
        <p className="text-gray-400 text-sm">مرحباً بك في لوحة تحكم المتجر</p>
      </motion.div>

      {/* Stats Cards — 2 cols on mobile, 3 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={stat.href}
              className="flex bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6 relative overflow-hidden group hover:border-luxury-gold/50 transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
              <div className="flex items-center justify-between w-full gap-2">
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">{stat.label}</p>
                  <p className="text-2xl sm:text-4xl font-bold text-luxury-gold">
                    {loading ? <span className="animate-pulse">...</span> : stat.value}
                  </p>
                </div>
                <span className="text-2xl sm:text-4xl opacity-50 group-hover:scale-110 transition-transform flex-shrink-0">
                  {stat.icon}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-medium transition-all duration-200 ${action.style}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Orders + Recent Products Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">آخر الطلبات</h2>
            <Link href="/dashboard/orders" className="text-luxury-gold hover:text-luxury-gold/80 transition-colors text-sm">
              عرض الكل →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-luxury-black/50 rounded animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const shortId = order.id?.toString().slice(-6) ?? '------';
                return (
                  <div
                    key={order.id}
                    className="flex items-center p-2.5 sm:p-3 bg-luxury-black rounded-sm border border-luxury-gold/10 gap-3"
                  >
                    {/* Order ID — fixed width column */}
                    <span className="text-luxury-gold/60 font-mono text-xs whitespace-nowrap flex-shrink-0 w-16 text-center">
                      #{shortId}
                    </span>

                    {/* Customer name + date — takes remaining space */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">
                        {order.customers?.name || 'عميل غير معروف'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>

                    {/* Price + status — right end */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-luxury-gold font-bold text-xs sm:text-sm whitespace-nowrap">
                        {order.total_amount} ر.س
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد طلبات بعد</div>
          )}
        </motion.div>

        {/* Recent Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">آخر المنتجات</h2>
            <Link href="/dashboard/products" className="text-luxury-gold hover:text-luxury-gold/80 transition-colors text-sm">
              عرض الكل →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-square bg-luxury-black/50 rounded animate-pulse" />
              ))}
            </div>
          ) : recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {recentProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/dashboard/products/${product.id}`}
                  className="group bg-luxury-black rounded-sm p-2 border border-luxury-gold/10 hover:border-luxury-gold/30 transition-colors"
                >
                  <div className="aspect-square mb-2 overflow-hidden rounded-sm bg-black/50">
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-white text-xs font-medium truncate group-hover:text-luxury-gold transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-luxury-gold text-xs">{product.price} ر.س</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد منتجات بعد</div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
