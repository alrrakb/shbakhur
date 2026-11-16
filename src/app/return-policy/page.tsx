import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getStoreWhatsAppNumber } from '@/lib/database';

export const metadata: Metadata = {
  title: 'سياسة الاستبدال والاسترجاع | متجر SH للبخور والعطور الفاخرة',
  description:
    'تعرف على سياسة الاستبدال والاسترجاع المعتمدة لمتجر SH للبخور والعطور الفاخرة. الضمان الذهبي للأصالة، شروط تجربة العود، وخطوات الاسترجاع السلسة.',
  alternates: {
    canonical: '/return-policy',
  },
  openGraph: {
    title: 'سياسة الاستبدال والاسترجاع | متجر SH للبخور والعطور الفاخرة',
    description:
      'وثيقة الضمان الذهبي ورضا العملاء لمتجر SH للبخور. شروط الاسترجاع والاستبدال خلال 7 إلى 14 يوماً وفق أنظمة التجارة الإلكترونية السعودية.',
    url: 'https://shbkhur.com/return-policy',
    siteName: 'SH BAKHUR',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default async function ReturnPolicyPage() {
  const cleanPhone = await getStoreWhatsAppNumber();
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'السلام عليكم، أود تقديم طلب استبدال / استرجاع بخصوص طلبي من متجر SH للبخور.'
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'سياسة الاستبدال والاسترجاع - متجر SH للبخور',
    description: 'سياسة الاستبدال والاسترجاع وضمان رضا العملاء في متجر SH للبخور والعطور الفاخرة',
    url: 'https://shbkhur.com/return-policy',
    inLanguage: 'ar-SA',
    publisher: {
      '@type': 'Organization',
      name: 'متجر SH للبخور والعطور الفاخرة',
      url: 'https://shbkhur.com',
    },
  };

  return (
    <main className="min-h-screen bg-luxury-black text-right flex flex-col justify-between" dir="rtl">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <Header />

      <div className="pt-28 sm:pt-32 flex-grow">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'سياسة الاستبدال والاسترجاع' },
          ]}
        />

        {/* Hero Header */}
        <section className="py-12 sm:py-20 bg-luxury-dark border-b border-luxury-gold/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-luxury-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-block px-3.5 py-1 text-xs font-bold text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/25 rounded-full mb-4">
              وثيقة الضمان الذهبي ورضا العملاء
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              سياسة الاستبدال <span className="text-luxury-gold">والاسترجاع</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-readex">
              في متجر <strong className="text-white">SH للبخور والعطور الفاخرة</strong>، رضاكم هو غايتنا الأولى ومحور اهتمامنا. وضعنا هذه السياسة لضمان حقكم وتوفير تجربة تسوق راقية وموثوقة تتوافق مع لوائح التجارة الإلكترونية في المملكة العربية السعودية.
            </p>
          </div>
        </section>

        {/* 4 Core Pillars Grid */}
        <section className="py-10 bg-luxury-black/60 border-b border-luxury-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  🛡️
                </div>
                <h3 className="text-lg font-bold text-white mb-2">ضمان الأصالة 100%</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  نضمن نقاء وأصالة جميع أدهان العود وكسر البخور الطبيعي والمحسن الفاخر.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  ⏱️
                </div>
                <h3 className="text-lg font-bold text-white mb-2">7 إلى 14 يوماً</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  حق الاسترجاع خلال 7 أيام والاستبدال خلال 14 يوماً من استلام شحنتك.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  🚚
                </div>
                <h3 className="text-lg font-bold text-white mb-2">شحن عكسي سريع</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  إصدار بوليصات استرجاع معتمدة فورية عبر شركائنا المعتمدين في جميع مدن المملكة.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  💳
                </div>
                <h3 className="text-lg font-bold text-white mb-2">استرداد مالي مضمون</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  إعادة المبالغ المستحقة بنفس وسيلة الدفع أو عبر التحويل البنكي لحسابك مباشرة.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Detailed Articles Content */}
        <section className="py-14 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            {/* Article 1 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  المهلة الزمنية للاسترجاع والاستبدال
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  وفقاً لنظام وزارة التجارة السعودية وحماية المستهلك في التجارة الإلكترونية، يتاح لعملائنا الكرام:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 pr-2">
                  <li>
                    <strong className="text-luxury-gold">طلب الاسترجاع:</strong> خلال مدة أقصاها <span className="text-white font-bold">7 أيام</span> من تاريخ استلام الشحنة من شركة الشحن.
                  </li>
                  <li>
                    <strong className="text-luxury-gold">طلب الاستبدال:</strong> خلال مدة أقصاها <span className="text-white font-bold">14 يوماً</span> من تاريخ استلام الشحنة.
                  </li>
                  <li>
                    لا يمكن قبول طلبات الاسترجاع أو الاستبدال بعد انقضاء هذه المدة المحددة نظامياً.
                  </li>
                </ul>
              </div>
            </div>

            {/* Article 2 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  الشروط الخاصة بمنتجات البخور والعود والعطور
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-4 font-readex">
                <p>
                  نظراً لطبيعة منتجات العطور والبخور وحرصاً على معايير الصحة والسلامة وجودة المنتج الملكية، تسري الشروط والضوابط التالية:
                </p>
                
                <div className="p-4 bg-luxury-black/70 rounded border border-luxury-gold/15 space-y-2">
                  <h4 className="text-luxury-gold font-bold text-base flex items-center gap-2">
                    <span>🪵</span> خشب العود الطبيعي والمحسن:
                  </h4>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    يُسمح للعميل بتجربة كسر يسيرة جداً لا تتجاوز <strong>(1 إلى 2 جرام فقط)</strong> للتأكد من الرائحة وجودة التبخير. في حال استهلاك كمية أكبر أو نقص الوزن الصافي للأوقية، لا يُقبل الاسترجاع حفظاً للحقوق المشتركة.
                  </p>
                </div>

                <div className="p-4 bg-luxury-black/70 rounded border border-luxury-gold/15 space-y-2">
                  <h4 className="text-luxury-gold font-bold text-base flex items-center gap-2">
                    <span>💧</span> دهن العود والمخلطات الملكية:
                  </h4>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    تُشترط التجربة بنقطة واحدة على قماش خارجي أو منديل تجربة، <strong>ويُمنع ملامسة ميل المرود للجلد مباشرة</strong> لدواعي النظافة والصحة العامة المعتمدة من هيئة الغذاء والدواء.
                  </p>
                </div>

                <div className="p-4 bg-luxury-black/70 rounded border border-luxury-gold/15 space-y-2">
                  <h4 className="text-luxury-gold font-bold text-base flex items-center gap-2">
                    <span>✨</span> زجاجات العطور والرشاشات:
                  </h4>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    يجب أن تكون علبة العطر مغلفة بغلاف السلوفان الأصلي غير المفتوح ومحكمة الإغلاق. في حال تم إرفاق عينة تجربة مجانية خارج العلبة، يُرجى تجربة العينة أولاً قبل فض غلاف العطر الأساسي.
                  </p>
                </div>

                <div className="p-4 bg-luxury-black/70 rounded border border-luxury-gold/15 space-y-2">
                  <h4 className="text-luxury-gold font-bold text-base flex items-center gap-2">
                    <span>🏮</span> مباخر وإكسسوارات البخور:
                  </h4>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    يجب أن تكون سليمة تماماً، داخل كرتونها الأصلي، مع كافة ملحقاتها وأسلاكها وبدون أي آثار احتراق أو خدوش.
                  </p>
                </div>
              </div>
            </div>

            {/* Article 3 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  3
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  حالات التلف أو الخطأ في الشحنة (المسؤولية الكاملة)
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  إذا وصلتك الشحنة وبها عيب مصنعي، أو تلف ناتج عن عمليات النقل، أو استلمت منتجاً غير مطابق لطلبك:
                </p>
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded text-emerald-200 text-sm">
                  ✅ <strong>يتحمل متجر SH للبخور كافة تكاليف الشحن والاسترجاع بنسبة 100%</strong>، ويحق للعميل الاختيار بين استبدال المنتج فورياً بشحنة جديدة سريعة أو استرداد كامل المبلغ المدفوع شاملاً قيمة الشحن الأصلي.
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  * يُشترط إبلاغنا خلال 48 ساعة من استلام الشحنة وتزويدنا بصور واضحة للتلف مع صورة بوليصة الشحن الملصقة على الصندوق.
                </p>
              </div>
            </div>

            {/* Article 4 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  4
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  تكاليف الشحن عند الاسترجاع (الرغبة الشخصية)
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  في حال رغب العميل في استرجاع المنتج أو استبداله دون وجود أي عيب أو خطأ من قِبل المتجر:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 pr-2">
                  <li>
                    يتحمل العميل تكلفة بوليصة الشحن للإرجاع (والشحن الجديد في حالة الاستبدال).
                  </li>
                  <li>
                    إذا كان الطلب قد تم شحنه للعميل مع ميزة "شحن مجاني"، يتم خصم قيمة تكلفة الشحن الفعلي التي سُددت لشركة الشحن من إجمالي المبلغ المسترد.
                  </li>
                </ul>
              </div>
            </div>

            {/* Article 5 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  5
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  آلية وطرق استرداد الأموال (Refund Policy)
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  تتم مراجعة وفحص الشحنة المسترجعة في مستودعاتنا فور وصولها للتأكد من استيفائها الشروط، ثم تبدأ عملية إعادة الأموال على النحو التالي:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-white text-sm mb-1">💳 البطاقات الائتمانية و مدى و Apple Pay:</h5>
                    <p className="text-gray-400 text-xs">
                      يُعاد المبلغ مباشرة إلى نفس البطاقة أو المحفظة المستخدمة، ويظهر في كشف حساب العميل خلال 3 إلى 7 أيام عمل (حسب سياسة البنك المصدر للبطاقة).
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-white text-sm mb-1">🏦 التحويل البنكي والدفع عند الاستلام:</h5>
                    <p className="text-gray-400 text-xs">
                      يتم تحويل المبلغ إلى الحساب البنكي الرسمي للعميل (داخل المملكة) برقم الآيبان IBAN خلال 3 إلى 5 أيام عمل بعد تزويدنا بالبيانات البنكية المعتمدة.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 sm:col-span-2">
                    <h5 className="font-bold text-white text-sm mb-1">🛍️ برامج التقسيط (تابي / تمارا):</h5>
                    <p className="text-gray-400 text-xs">
                      يتم تسوية وتحديث خطة الدفع تلقائياً؛ فإما يتم إلغاء الأقساط المتبقية أو استرداد ما تم دفعه في حساب العميل لدى تابي أو تمارا حسب آلية مزود الخدمة.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article 6: Step by Step */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  6
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  خطوات تقديم طلب الاسترجاع أو الاستبدال
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 font-readex">
                <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                  <div className="text-2xl text-luxury-gold mb-2 font-sans font-bold">01</div>
                  <h4 className="text-white font-bold text-sm mb-1">تواصل معنا</h4>
                  <p className="text-gray-400 text-xs">
                    راسل خدمة العملاء عبر الواتساب برقم طلبك واسمك المسجل.
                  </p>
                </div>
                <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                  <div className="text-2xl text-luxury-gold mb-2 font-sans font-bold">02</div>
                  <h4 className="text-white font-bold text-sm mb-1">إرسال الصور</h4>
                  <p className="text-gray-400 text-xs">
                    تزويدنا بصورة واضحة للمنتج والغلاف وحالته الحالية.
                  </p>
                </div>
                <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                  <div className="text-2xl text-luxury-gold mb-2 font-sans font-bold">03</div>
                  <h4 className="text-white font-bold text-sm mb-1">بوليصة الشحن</h4>
                  <p className="text-gray-400 text-xs">
                    نصدر لك بوليصة استرجاع إلكترونية لتسليمها لشركة الشحن.
                  </p>
                </div>
                <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                  <div className="text-2xl text-luxury-gold mb-2 font-sans font-bold">04</div>
                  <h4 className="text-white font-bold text-sm mb-1">الفحص والتعويض</h4>
                  <p className="text-gray-400 text-xs">
                    فور استلام الطرد وفحصه، يُرسل البديل أو يُسترد المبلغ فوراً.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CTA Contact Section */}
        <section className="py-14 sm:py-18 bg-luxury-dark/80 border-t border-luxury-gold/15">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-luxury-gold/10 border border-luxury-gold/25 text-luxury-gold mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              هل ترغب في بدء طلب استبدال أو استرجاع الآن؟
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-readex">
              فريق العناية الملكية بالعملاء في متجر SH متواجد لخدمتك ومساعدتك في إتمام طلبك بكل سهولة ويسر.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#25D366] text-white font-bold rounded-sm hover:bg-[#20BD5A] transition-all shadow-lg hover:shadow-emerald-900/30 text-sm sm:text-base w-full sm:w-auto"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 0C5.385 0 0 5.388 0 12c0 2.115.548 4.168 1.59 5.964L.073 23.47l5.659-1.484A11.956 11.956 0 0012.031 24c6.645 0 12.03-5.388 12.03-12s-5.385-12-12.03-12zm6.657 17.15c-.266.75-1.531 1.442-2.138 1.516-.541.066-1.25.176-3.565-.778-2.825-1.163-4.631-4.045-4.767-4.227-.137-.184-1.139-1.516-1.139-2.89s.718-2.046.974-2.316c.256-.27.556-.337.744-.337s.374-.006.536.002c.162.008.381-.061.595.459.214.52.73 1.782.796 1.916.066.135.111.293.023.472-.088.179-.133.291-.266.444-.133.153-.284.331-.403.454-.132.135-.27.284-.118.544.152.261.677 1.118 1.455 1.812.999.892 1.84 1.18 2.096 1.303.256.122.406.103.559-.069.153-.172.66-.77.838-1.036.178-.266.356-.22.589-.134.233.086 1.472.695 1.724.821.252.126.421.191.483.297.062.106.062.613-.204 1.363z"/>
                </svg>
                <span>محادثة فورية مع خدمة العملاء</span>
              </a>
              <Link
                href="/faq"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-luxury-dark border border-luxury-gold/30 text-luxury-gold font-bold rounded-sm hover:bg-luxury-gold/10 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                <span>الأسئلة الشائعة حول الطلبات</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
