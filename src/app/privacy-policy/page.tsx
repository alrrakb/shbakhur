import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية وسرية المعلومات | متجر SH للبخور والعطور الفاخرة',
  description:
    'تعرف على سياسة الخصوصية وحماية البيانات الشخصية لمتجر SH للبخور وفقاً لنظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية. أمان وتشفير فائق.',
  alternates: {
    canonical: '/privacy-policy',
  },
  openGraph: {
    title: 'سياسة الخصوصية وسرية المعلومات | متجر SH للبخور والعطور الفاخرة',
    description:
      'نلتزم في متجر SH للبخور بأعلى معايير التشفير والأمان لحماية خصوصيتك وبياناتك الشخصية ومعاملاتك المالية وفق اللوائح والأنظمة السعودية.',
    url: 'https://shbkhur.com/privacy-policy',
    siteName: 'SH BAKHUR',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966500000000';
  const cleanPhone = rawPhone.replace(/\D/g, '') || '966500000000';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'السلام عليكم، أود الاستفسار حول سياسة الخصوصية وحماية البيانات في متجر SH للبخور.'
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'سياسة الخصوصية وسرية المعلومات - متجر SH للبخور',
    description: 'سياسة الخصوصية وسرية البيانات الشخصية في متجر SH للبخور والعطور الفاخرة',
    url: 'https://shbkhur.com/privacy-policy',
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
            { label: 'سياسة الخصوصية وسرية المعلومات' },
          ]}
        />

        {/* Hero Header */}
        <section className="py-12 sm:py-20 bg-luxury-dark border-b border-luxury-gold/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-luxury-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="inline-block px-3.5 py-1 text-xs font-bold text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/25 rounded-full mb-4">
              نظام حماية البيانات الشخصية (PDPL)
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              سياسة الخصوصية <span className="text-luxury-gold">وسرية المعلومات</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-readex">
              نولي في متجر <strong className="text-white">SH للبخور والعطور الفاخرة</strong> خصوصية وأمان بيانات عملائنا أقصى درجات العناية والالتزام. توضح هذه الوثيقة بوضوح وشفافية كيفية جمع، واستخدام، وحماية بياناتكم الشخصية وفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية.
            </p>
          </div>
        </section>

        {/* 4 Core Pillars Grid */}
        <section className="py-10 bg-luxury-black/60 border-b border-luxury-gold/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  🔒
                </div>
                <h3 className="text-lg font-bold text-white mb-2">تشفير بنكي 256-Bit</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  اتصال آمن ومشفر بالكامل عبر بروتوكولات SSL/TLS وحماية Cloudflare السحابية.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  💳
                </div>
                <h3 className="text-lg font-bold text-white mb-2">معايير أمان PCI-DSS</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  لا نحتفظ ببيانات بطاقتك الائتمانية أو السرية نهائياً في خوادمنا ومستودعاتنا.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  🚫
                </div>
                <h3 className="text-lg font-bold text-white mb-2">سرية تامة 100%</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  لن يتم أبداً بيع، تأجير، أو مشاركة بياناتك مع أي شركات تسويقية أو جهات تجارية.
                </p>
              </div>

              <div className="bg-luxury-dark/90 p-6 rounded-md border border-luxury-gold/20 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold text-2xl mb-4">
                  🇸🇦
                </div>
                <h3 className="text-lg font-bold text-white mb-2">امتثال للأنظمة السعودية</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  متوافقون تماماً مع نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي السعودي.
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
                  البيانات الشخصية التي نقوم بجمعها
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  عند استخدامكم لمتجر SH للبخور أو إتمام طلب شراء، قد نقوم بجمع البيانات الضرورية لتقديم الخدمة:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 pr-2">
                  <li>
                    <strong className="text-white">بيانات التواصل والهوية:</strong> الاسم الكامل، رقم الجوال للتواصل وتأكيد الشحنة، والبريد الإلكتروني لإرسال فواتير الشراء الرسمية.
                  </li>
                  <li>
                    <strong className="text-white">بيانات التوصيل والعنوان:</strong> المدينة، الحي، واسم الشارع أو تفاصيل العنوان الوطني لإصدار بوليصة الشحن وتسليم الطلب إلى باب منزلك بدقة.
                  </li>
                  <li>
                    <strong className="text-white">سجل المشتريات والطلبات:</strong> تفاصيل المنتجات المشتراة، تاريخ الطلب، وقيمته لتسهيل خدمة ما بعد البيع والاستفادة من عروض الضمان وبرامج الولاء.
                  </li>
                  <li>
                    <strong className="text-white">البيانات التقنية:</strong> عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، ومعلومات الجلسة التي تُجمع تلقائياً لأغراض الأمان السيبراني ومكافحة الاحتيال.
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
                  أغراض استخدام ومعالجة البيانات
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  نستخدم البيانات المجمعة حصرياً للأغراض المشروعة والتنفيذية التالية:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-luxury-gold text-sm mb-1">📦 إتمام الطلب والعمليات اللوجستية:</h5>
                    <p className="text-gray-400 text-xs">
                      تجهيز وتغليف طلبات العود والبخور وإصدار بوليصة الشحن مع شركاء التوصيل وتتبع مسارها حتى الاستلام.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-luxury-gold text-sm mb-1">📱 الإشعارات وخدمة العملاء:</h5>
                    <p className="text-gray-400 text-xs">
                      إرسال رسائل تحديث الشحن عبر الواتساب، والرد على استفساراتكم وتقديم الدعم الفني الملكي السريع.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-luxury-gold text-sm mb-1">🛡️ الحماية والأمان السيبراني:</h5>
                    <p className="text-gray-400 text-xs">
                      التحقق من صحة المعاملات، ومنع الأنشطة الاحتيالية وهجمات الروبوتات الضارة عبر جدار حماية Cloudflare.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15">
                    <h5 className="font-bold text-luxury-gold text-sm mb-1">✨ تحسين تجربة التسوق:</h5>
                    <p className="text-gray-400 text-xs">
                      تطوير واجهات وسرعة المتجر لضمان تجربة تصفح فائقة السلاسة على الهواتف الذكية والأجهزة المختلفة.
                    </p>
                  </div>
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
                  أمان المعاملات المالية والدفع الإلكتروني
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  نحرص على أقصى درجات الأمان المالي وفق المعايير البنكية العالمية:
                </p>
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded text-emerald-200 text-sm">
                  💳 <strong>عدم تخزين أرقام البطاقات:</strong> تتم معالجة كافة المدفوعات (مدى، Apple Pay، فيزا، ماستركارد، تابي، تمارا) عبر قنوات بوابات دفع بنكية معتمدة ومرخصة من قِبل البنك المركزي السعودي (ساما - SAMA). لا يمكن لموظفي متجر SH أو خوادمنا الاطلاع على أو تخزين أرقام بطاقاتك الائتمانية أو رموز الأمان (CVV).
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  كافة صفحات السلة وإنهاء الطلب محمية بتشفير من طرف إلى طرف (End-to-End Encryption) لمنع أي اعتراض للبيانات.
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
                  مشاركة البيانات مع الأطراف الثالثة المعتمدة
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  نحن ملتزمون بعدم مشاركة، إفشاء، أو بيع بياناتكم الشخصية مع أي جهات خارجية باستثناء الحالات التشغيلية الضرورية التالية:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 pr-2">
                  <li>
                    <strong className="text-luxury-gold">شركات الشحن والخدمات اللوجستية المعتمدة (Bolesa):</strong> يتم تزويدهم فقط بالبيانات اللازمة لتوصيل الشحنة (الاسم، الجوال، المدينة، والعنوان).
                  </li>
                  <li>
                    <strong className="text-luxury-gold">بوابات الدفع الإلكتروني المرخصة:</strong> لتأكيد ومصادقة عمليات الشراء وسداد الفواتير إلكترونياً.
                  </li>
                  <li>
                    <strong className="text-luxury-gold">الجهات الحكومية والقضائية:</strong> فقط في حال طُلب منا ذلك بموجب أنظمة وقوانين المملكة العربية السعودية أو أوامر قضائية رسمية.
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
                  ملفات تعريف الارتباط (Cookies)
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  يستخدم متجر SH للبخور ملفات تعريف ارتباط خفيفة (Cookies) لتحسين أداء المتجر:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 pr-2">
                  <li>
                    <strong className="text-white">ملفات الكوكيز الأساسية:</strong> ضرورية لعمل سلة المشتريات وحفظ منتجاتك المفضلة أثناء تنقلك بين صفحات المتجر.
                  </li>
                  <li>
                    <strong className="text-white">ملفات الأداء والتحليل:</strong> تساعدنا على قياس سرعة فتح الصفحات وفهم المنتجات الأكثر طلباً لتحسين التجربة، وتُجمع هذه البيانات بشكل مجهول الهوية دون الكشف عن هوية المستخدم.
                  </li>
                </ul>
              </div>
            </div>

            {/* Article 6 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  6
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  حقوقك كصاحب بيانات بموجب الأنظمة السعودية
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  يمنحكم نظام حماية البيانات الشخصية (PDPL) بالمملكة العربية السعودية الحقوق التالية:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                    <div className="text-2xl text-luxury-gold mb-2">👁️</div>
                    <h5 className="text-white font-bold text-sm mb-1">حق الوصول والعلم</h5>
                    <p className="text-gray-400 text-xs">
                      الاطلاع على بياناتك الشخصية المخزنة لدينا وكيفية معالجتها.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                    <div className="text-2xl text-luxury-gold mb-2">✏️</div>
                    <h5 className="text-white font-bold text-sm mb-1">حق التصحيح والتحديث</h5>
                    <p className="text-gray-400 text-xs">
                      تعديل وتحديث أي بيانات شخصية غير دقيقة أو طرأ عليها تغيير.
                    </p>
                  </div>
                  <div className="p-4 bg-luxury-black/60 rounded border border-luxury-gold/15 text-center">
                    <div className="text-2xl text-luxury-gold mb-2">🗑️</div>
                    <h5 className="text-white font-bold text-sm mb-1">حق الحذف والإتلاف</h5>
                    <p className="text-gray-400 text-xs">
                      طلب حذف بياناتك بعد انتهاء الغرض منها واكتمال المعاملات القانونية.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article 7 */}
            <div className="bg-luxury-dark p-6 sm:p-8 rounded-lg border border-luxury-gold/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4 border-b border-luxury-gold/10 pb-3">
                <span className="w-8 h-8 rounded-full bg-luxury-gold text-luxury-black font-bold flex items-center justify-center text-sm font-sans">
                  7
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  التعديل على سياسة الخصوصية والتواصل
                </h2>
              </div>
              <div className="text-gray-300 text-sm sm:text-base leading-relaxed space-y-3 font-readex">
                <p>
                  يحتفظ متجر SH للبخور بالحق في تحديث هذه السياسة دورياً لمواكبة المتطلبات التنظيمية أو التقنية. يتم نشر أي تحديث مباشرة على هذه الصفحة مع تحديث تاريخ المراجعة.
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  إذا كان لديكم أي استفسار أو رغبة في ممارسة حقوقكم المتعلقة بالبيانات، يسعدنا تواصلكم المباشر مع فريق الخصوصية والدعم الفني عبر وسائل الاتصال الرسمية للمتجر.
                </p>
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              هل لديك استفسار حول أمان وسرية بياناتك؟
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-readex">
              فريق العناية بالعملاء في متجر SH متواجد للإجابة على كافة تساؤلاتكم وتوفير تجربة تسوق آمنة ومريحة.
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
                <span>تواصل معنا عبر واتساب</span>
              </a>
              <Link
                href="/return-policy"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-luxury-dark border border-luxury-gold/30 text-luxury-gold font-bold rounded-sm hover:bg-luxury-gold/10 transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                <span>سياسة الاستبدال والاسترجاع</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
