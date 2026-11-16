import { Metadata } from 'next';
import Image from 'next/image';
import Header from '@/components/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'من نحن | SH للبخور',
  description: 'تعرف على متجر SH للبخور - متخصص في أجود أنواع البخور والعطور والعود الطبيعي',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      
      <div className="pt-32">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'من نحن' },
          ]}
        />
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-luxury-dark border-b border-luxury-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-luxury-gold mb-6">
              من نحن
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              متجر SH للبخور هو وجهتكم الأولى لأجود أنواع البخور والعطور والعود الطبيعي من جميع أنحاء العالم
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Image */}
              <div className="relative aspect-square md:aspect-[4/3] bg-luxury-dark rounded-md overflow-hidden border border-luxury-gold/30 shadow-2xl group">
                <Image
                  src="/about-luxury-oud.jpg"
                  alt="متجر SH للبخور والعطور الفاخرة - عود طبيعي ومبخرة ملكية"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 right-4 left-4 p-3 bg-luxury-black/80 backdrop-blur-md rounded border border-luxury-gold/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-cormorant tracking-widest text-luxury-gold block">
                      ROYAL ESSENCE · SH BAKHUR
                    </span>
                    <span className="text-xs font-bold text-white font-readex">
                      أصالة العود الطبيعي والبخور الملكي
                    </span>
                  </div>
                  <span className="text-luxury-gold text-lg">✦</span>
                </div>
              </div>

              {/* Text */}
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  شغفنا هو تقديم أفضل منتجات البخور والعطور
                </h2>
                
                <div className="space-y-4 text-gray-400 leading-relaxed">
                  <p>
                    تأسس متجر SH للبخور بهدف توفير أجود أنواع البخور والعود والعطور لعشاق الرائحة العربية الأصيلة. نحن نحرص على اختيار أفضل المنتجات من مصادر موثوقة حول العالم.
                  </p>
                  <p>
                    تشمل تشكيلتنا مجموعة متنوعة من:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-luxury-gold">●</span>
                      البخور الفاخر (كلمنتانا، سومطري، عود بابوه)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-luxury-gold">●</span>
                      العطور العالمية (توم فورد، ديور، جوتشي، شانيل)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-luxury-gold">●</span>
                      العود الطبيعي من تايلاند وإندونيسيا والهند
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-luxury-gold">●</span>
                      العود المحسن والعود المعطر
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-luxury-gold">●</span>
                      دهن العود الطبيعي
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-luxury-dark p-8 rounded-sm border border-luxury-gold/20 text-center">
                <div className="text-4xl mb-4 text-luxury-gold">✓</div>
                <h3 className="text-xl font-bold text-white mb-2">جودة مضمونة</h3>
                <p className="text-gray-400">نختار أفضل المنتجات لضمان رضاكم</p>
              </div>
              <div className="bg-luxury-dark p-8 rounded-sm border border-luxury-gold/20 text-center">
                <div className="text-4xl mb-4 text-luxury-gold">🚚</div>
                <h3 className="text-xl font-bold text-white mb-2">توصيل سريع</h3>
                <p className="text-gray-400">خلال 2-4 أيام عمل لجميع الطلبات</p>
              </div>
              <div className="bg-luxury-dark p-8 rounded-sm border border-luxury-gold/20 text-center">
                <div className="text-4xl mb-4 text-luxury-gold">💎</div>
                <h3 className="text-xl font-bold text-white mb-2">أسعار مناسبة</h3>
                <p className="text-gray-400">نقدم أفضل قيمة مقابل المال</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
}
