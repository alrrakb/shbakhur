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

            {/* Official Credentials & Store Verification Section */}
            <div className="mt-24 pt-16 border-t border-luxury-gold/20">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-xs font-semibold mb-4">
                  <span>🛡️</span>
                  <span>كيان سعودي مرخص وموثق رسمياً 🇸🇦</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                  بيانات التوثيق والاعتماد القانوني
                </h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  نؤمن في متجر SH للبخور بأن الشفافية هي جوهر الثقة. متجرنا يمارس أعماله بموجب سجلات وتراخيص نظامية معتمدة من وزارة التجارة، والمركز السعودي للأعمال، وهيئة الزكاة والضريبة والجمارك.
                </p>
              </div>

              {/* Legal Entity Banner */}
              <div className="bg-gradient-to-r from-luxury-dark via-luxury-black to-luxury-dark border border-luxury-gold/30 rounded-xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-luxury-gold/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4 text-right">
                    <div className="w-16 h-16 rounded-xl bg-luxury-gold/10 border border-luxury-gold/40 flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8 text-luxury-gold" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-widest text-luxury-gold block mb-1">
                        الاسم القانوني للمنشأة التجارية
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        مؤسسة طلائع الركب للتسويق الالكتروني
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        المالك والمشغل الرسمي لمتجر SH للبخور · المملكة العربية السعودية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-luxury-black/80 px-4 py-2.5 rounded-lg border border-luxury-gold/20 text-center">
                      <span className="text-[11px] text-gray-400 block">الرقم الوطني الموحد (700)</span>
                      <span className="text-sm font-mono font-bold text-luxury-gold tracking-wider" dir="ltr">
                        7016764560
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Detailed Verified Credential Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: Commercial Registration */}
                <div className="bg-luxury-dark/80 rounded-xl border border-luxury-gold/25 p-6 hover:border-luxury-gold/50 transition-all duration-300 flex flex-col justify-between group shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded bg-luxury-gold/15 text-luxury-gold text-xs font-semibold border border-luxury-gold/30">
                        وزارة التجارة
                      </span>
                      <span className="text-2xl">📜</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">السجل التجاري</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      سجل تجاري إلكتروني نظامي ساري المفعول صادر عن وزارة التجارة بالمملكة العربية السعودية.
                    </p>
                    <div className="bg-luxury-black/90 rounded-lg p-3 border border-luxury-gold/15">
                      <span className="text-[11px] text-gray-400 block mb-0.5">رقم السجل التجاري:</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-luxury-gold tracking-wider block" dir="ltr">
                        1010624835
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: E-Commerce Authentication (Saudi Business Center) */}
                <div className="bg-luxury-dark/80 rounded-xl border border-luxury-gold/40 p-6 hover:border-luxury-gold/60 transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-28 h-28 bg-luxury-gold/10 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded bg-luxury-gold text-luxury-black text-xs font-bold shadow-md">
                        المركز السعودي للأعمال
                      </span>
                      <span className="text-2xl">🛡️</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">شهادة توثيق التجارة الإلكترونية</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      شهادة توثيق المتجر الإلكتروني الرسمية برقم موثق معتمد صادر من المركز السعودي للأعمال (SBC).
                    </p>
                    <div className="bg-luxury-black/90 rounded-lg p-3 border border-luxury-gold/15">
                      <span className="text-[11px] text-gray-400 block mb-0.5">رقم التوثيق المعتمد:</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-luxury-gold tracking-wider block" dir="ltr">
                        0000199532
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Tax / VAT Certificate */}
                <div className="bg-luxury-dark/80 rounded-xl border border-luxury-gold/25 p-6 hover:border-luxury-gold/50 transition-all duration-300 flex flex-col justify-between group shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded bg-luxury-gold/15 text-luxury-gold text-xs font-semibold border border-luxury-gold/30">
                        هيئة الزكاة والضريبة والجمارك
                      </span>
                      <span className="text-2xl">📑</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">الشهادة الضريبية (VAT)</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      شهادة تسجيل معتمدة في ضريبة القيمة المضافة صادرة عن هيئة الزكاة والضريبة والجمارك (ZATCA).
                    </p>
                    <div className="bg-luxury-black/90 rounded-lg p-3 border border-luxury-gold/15">
                      <span className="text-[11px] text-gray-400 block mb-0.5">الرقم الضريبي (الحساب الضريبي):</span>
                      <span className="text-base sm:text-lg font-mono font-bold text-luxury-gold tracking-wider block" dir="ltr">
                        302225392200003
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
}
