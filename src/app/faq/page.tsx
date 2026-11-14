import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import FAQAccordion from './FAQAccordion';
import { FAQ_ITEMS } from './faqs';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة | متجر SH للبخور والعطور الفاخرة',
  description:
    'إجابات شاملة حول الشحن السريع، سياسة الاستبدال والاسترجاع، ضمان أصالة العود والبخور، وطرق العناية بالعطور الملكية في متجر SH للبخور.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'الأسئلة الشائعة | متجر SH للبخور والعطور الفاخرة',
    description:
      'إجابات شاملة حول الشحن السريع، سياسة الاستبدال والاسترجاع، ضمان أصالة العود والبخور، وطرق العناية بالعطور الملكية في متجر SH للبخور.',
    url: 'https://shbakhur.com/faq',
    siteName: 'SH BAKHUR',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function FAQPage() {
  // 1. Construct Google-compliant FAQPage JSON-LD schema
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  // 2. Resolve official WhatsApp support channel
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966500000000';
  const cleanPhone = rawPhone.replace(/\D/g, '') || '966500000000';
  const defaultGreeting = encodeURIComponent(
    'السلام عليكم ورحمة الله، أود الاستفسار عن منتجات متجر SH للبخور والعطور الفاخرة.'
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${defaultGreeting}`;

  return (
    <main className="min-h-screen bg-luxury-black text-right flex flex-col justify-between" dir="rtl">
      {/* Rich Snippets Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      <Header />

      <div className="pt-28 sm:pt-32 flex-grow">
        {/* Breadcrumb Navigation & Schema */}
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'الأسئلة الشائعة' },
          ]}
        />

        {/* Hero Section */}
        <section className="py-12 sm:py-20 bg-luxury-dark border-b border-luxury-gold/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-luxury-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-block px-3.5 py-1 text-xs font-bold text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/25 rounded-full mb-4">
              مركز المساعدة والخدمة الملكية
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              الأسئلة <span className="text-luxury-gold">الشائعة</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
              إجابات شاملة وموثقة حول الشحن والتوصيل، سياسة الاسترجاع، ضمان جودة العود الطبيعي، وخدمات متجر SH الفاخرة.
            </p>
          </div>
        </section>

        {/* FAQs Interactive Accordion */}
        <section className="py-12 sm:py-16 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <FAQAccordion />
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-14 sm:py-18 bg-luxury-dark/60 border-t border-luxury-gold/15">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-luxury-gold/10 border border-luxury-gold/25 text-luxury-gold mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              هل لديك استفسار خاص لم تجد إجابته هنا؟
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              يسعد مستشارو العطور والبخور الملكيون في متجر SH بخدمتكم وتلبية كافة طلباتكم الخاصة على مدار الساعة عبر الواتساب.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#25D366] text-white font-bold rounded-sm hover:bg-[#20BD5A] transition-all shadow-lg hover:shadow-emerald-900/30 text-sm sm:text-base"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.149-.198.297-.769.967-.941 1.165-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.891-.687-1.414-1.523-1.58-1.782-.174-.297-.019-.46.13-.606.134-.133.298-.347.446-.521.151-.172.2-.298.298-.397.049-.097.024-.186-.025-.261-.049-.074-.437-1.072-.598-1.448-.165-.375-.32-.323-.437-.332-.104-.009-.224-.009-.324-.009-.195 0-.512.074-.777.371-.264.297-.903 1.008-1.003 1.076-.095.069-.809.255-.809.608 0 .353.465.705.986.984.523.279 1.108.627 1.443.714.347.089.608.069.834.268.225.198.771.714.869.859.098.145.196.348.098.521-.098.174-.435.741-1.059 1.412-.621.671-1.307 1.178-1.472 1.377-.165.198-.019.299.124.395.143.095.318.296.477.445.159.149.211.249.296.347.085.099.042.198-.016.347-.058.149-.101.323-.101.498 0 .174.008.348.008.497 0 .025.015.174.015.199 0 .025-.009.124-.009.174 0 .149-.049.323-.049.497 0 .174.024.347.073.497.05.149.149.299.298.448.149.149.323.298.497.397.174.099.371.174.556.223.185.049.347.124.497.173.149.049.298.124.396.173.099.049.198.124.297.198.099.074.174.149.247.223l.025.025c.147.147.297.297.446.397.149.099.372.249.621.174.248-.074 1.307-.631 1.577-1.039.271-.409.542-.817.792-1.181.271-.397.521-.753.768-1.074.049-.074.099-.149.149-.223.396-.596.793-1.191 1.19-1.786.049-.074.099-.149.149-.223-.025-.149-.025-.297-.025-.446z" />
              </svg>
              <span>محادثة فورية عبر واتساب</span>
            </a>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
