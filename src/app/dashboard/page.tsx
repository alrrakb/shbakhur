'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Stats {
  productsCount: number;
  categoriesCount: number;
  ordersCount: number;
}

interface RecentProduct {
  id: number;
  title: string;
  price: string;
  image: string;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({ productsCount: 0, categoriesCount: 0, ordersCount: 0 });
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          productsCount: productsRes.count || 0,
          categoriesCount: categoriesRes.count || 0,
          ordersCount: ordersRes.count || 0,
        });

        const { data: recent } = await supabase
          .from('products')
          .select('id, title, price, image')
          .order('id', { ascending: false })
          .limit(5);

        if (recent) {
          setRecentProducts(recent);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statCards = [
    { label: 'المنتجات', value: stats.productsCount, icon: '🛍️', color: 'from-amber-600 to-yellow-500' },
    { label: 'التصنيفات', value: stats.categoriesCount, icon: '📁', color: 'from-emerald-600 to-teal-500' },
    { label: 'الطلبات', value: stats.ordersCount, icon: '📦', color: 'from-blue-600 to-indigo-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          لوحة التحكم <span className="text-luxury-gold">SH للبخور</span>
        </h1>
        <p className="text-gray-400">مرحباً بك في لوحة تحكم المتجر</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6 relative overflow-hidden group hover:border-luxury-gold/50 transition-all duration-300"
          >
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-luxury-gold">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform">
                {stat.icon}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/products/add"
            className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
          >
            + إضافة منتج جديد
          </Link>
          <Link
            href="/dashboard/content"
            className="px-6 py-3 border border-luxury-gold/30 text-luxury-gold rounded-sm hover:bg-luxury-gold/10 transition-colors"
          >
            تحرير المحتوى
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors"
          >
            عرض الموقع
          </Link>
        </div>
      </motion.div>

      {/* Recent Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">آخر المنتجات</h2>
          <Link
            href="/dashboard/products"
            className="text-luxury-gold hover:text-luxury-gold-light transition-colors text-sm"
          >
            عرض الكل →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="bg-luxury-black rounded-sm p-3 border border-luxury-gold/10 hover:border-luxury-gold/30 transition-colors"
              >
                <div className="aspect-square mb-2 overflow-hidden rounded-sm">
                  <img
                    src={product.image || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-white text-sm font-medium truncate">{product.title}</h3>
                <p className="text-luxury-gold text-sm">{product.price} ر.س</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            لا توجد منتجات بعد
          </div>
        )}
      </motion.div>
    </div>
  );
}
