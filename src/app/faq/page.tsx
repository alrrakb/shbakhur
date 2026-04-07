'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const faqs = [
  {
    question: 'كم مدة التوصيل؟',
    answer: 'عادةً ما تستغرق الطلبات 2-4 أيام عمل للتوصيل داخل المملكة. سنقدم لك رقمTracking لمتابعة طلبك.',
  },
  {
    question: 'هل الشحن مجاني؟',
    answer: 'نعم، نقدم الشحن المجاني لجميع الطلبات داخل المملكة العربية السعودية.',
  },
  {
    question: 'هل يمكنني إرجاع أو استبدال المنتج؟',
    answer: 'نعتذر، لا يوجد لدينا سياسة إرجاع أو استبدال. يرجى التواصل معنا قبل الطلب للتأكد من اختيار المنتج المناسب.',
  },
  {
    question: 'كيف أتواصل معكم لطلب منتج معين؟',
    answer: 'يمكنك التواصل معنا عبر واتساب على الأرقام الموضحة في الصفحة، وسوف نرد عليك في أقرب وقت.',
  },
  {
    question: 'هل منتجاتكم أصلية؟',
    answer: 'نعم، جميع منتجاتنا أصلية ومضمونة 100%. نحن نحرص على sourcing من موردين موثوقين ومعتمدين.',
  },
  {
    question: 'كيف أحفظ البخور والعطور بشكل صحيح؟',
    answer: 'يُحفظ في مكان بارد وجاف بعيداً عن أشعة الشمس المباشرة. يُفضل إغلاق العبوة بإحكام بعد كل استخدام.',
  },
];

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-luxury-dark border border-luxury-gold/20 rounded-sm overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-right hover:bg-luxury-gold/5 transition-colors"
      >
        <span className="text-white font-medium text-lg">{question}</span>
        <svg
          className={`w-6 h-6 text-luxury-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-luxury-gold/10 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      
      <div className="pt-32">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-luxury-dark border-b border-luxury-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-luxury-gold mb-6">
              الأسئلة الشائعة
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              إجابات على أكثر الأسئلة شيوعاً حول منتجاتنا وخدماتنا
            </p>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 relative z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} {...faq} index={index} />
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-luxury-dark/50 border-t border-luxury-gold/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              لم تجد إجابة لسؤالك؟
            </h2>
            <p className="text-gray-400 mb-8">
              تواصل معنا مباشرة عبر واتساب وسنرد على استفسارك
            </p>
            <a
              href="https://wa.me/966501234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-bold rounded-sm hover:bg-[#20BD5A] transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.149-.198.297-.769.967-.941 1.165-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.891-.687-1.414-1.523-1.58-1.782-.174-.297-.019-.46.13-.606.134-.133.298-.347.446-.521.151-.172.2-.298.298-.397.049-.097.024-.186-.025-.261-.049-.074-.437-1.072-.598-1.448-.165-.375-.32-.323-.437-.332-.104-.009-.224-.009-.324-.009-.195 0-.512.074-.777.371-.264.297-.903 1.008-1.003 1.076-.095.069-.809.255-.809.608 0 .353.465.705.986.984.523.279 1.108.627 1.443.714.347.089.608.069.834.268.225.198.771.714.869.859.098.145.196.348.098.521-.098.174-.435.741-1.059 1.412-.621.671-1.307 1.178-1.472 1.377-.165.198-.019.299.124.395.143.095.318.296.477.445.159.149.211.249.296.347.085.099.042.198-.016.347-.058.149-.101.323-.101.498 0 .174.008.348.008.497 0 .025.015.174.015.199 0 .025-.009.124-.009.174 0 .149-.049.323-.049.497 0 .174.024.347.073.497.05.149.149.299.298.448.149.149.323.298.497.397.174.099.371.174.556.223.185.049.347.124.497.173.149.049.298.124.396.173.099.049.198.124.297.198.099.074.174.149.247.223l.025.025c.147.147.297.297.446.397.149.099.372.249.621.174.248-.074 1.307-.631 1.577-1.039.271-.409.542-.817.792-1.181.271-.397.521-.753.768-1.074.049-.074.099-.149.149-.223.396-.596.793-1.191 1.19-1.786.049-.074.099-.149.149-.223-.025-.149-.025-.297-.025-.446z"/>
              </svg>
              تواصل عبر واتساب
            </a>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
}
