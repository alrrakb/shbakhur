'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CheckoutSuccess({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <div className="pt-24 sm:pt-28 lg:pt-32">
        <section className="py-10 sm:py-20 text-center relative z-10 px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-luxury-gold shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <svg className="w-12 h-12 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-3xl md:text-4xl font-bold text-luxury-gold mb-4 sm:mb-6 tracking-wide px-2"
          >
            تم استلام طلبك ومرفقات الدفع بنجاح!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-sm sm:text-lg mb-6 sm:mb-8 max-w-lg mx-auto px-2"
          >
            شكرًا لتسوقك من SH للبخور. سنقوم بمراجعة بيانات التحويل البنكي وتأكيد طلبك في أقرب وقت.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm px-6 sm:px-10 py-4 sm:py-6 mb-6 sm:mb-8 shadow-lg"
          >
            <p className="text-luxury-gold/70 mb-2 font-medium text-sm sm:text-base">رقم الطلب الخاص بك</p>
            <p className="text-2xl sm:text-4xl font-bold text-white tracking-widest">{resolvedParams.orderId.slice(-6).toUpperCase()}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-md mx-auto mb-8 sm:mb-10 bg-luxury-dark border-r-4 border-luxury-gold rounded-sm p-4 sm:p-5 text-right shadow-md"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-luxury-gold flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-white font-bold mb-1 sm:mb-2 text-base sm:text-lg">تنبيه هام</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  لأي استفسار عن الطلبية أو تعديلها، يرجى التواصل معنا عبر الواتساب وإرسال (رقم الطلب) لخدمتكم بشكل أسرع.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link 
              href="/products" 
              className="inline-block px-7 sm:px-10 py-3.5 sm:py-4 bg-luxury-gold text-luxury-black font-bold text-base sm:text-lg rounded-sm hover:bg-luxury-gold-light hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              متابعة التسوق
            </Link>
          </motion.div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
