const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const staticSeoData = [
    {
      page_path: '/',
      title: 'SH للبخور | أفخم درجات البخور والعود الطبيعي المضمون',
      description: 'متجر SH للبخور هو وجهتك الأولى لأجود أنواع البخور، العود الطبيعي الإندونيسي، العود المحسن، والعطور الفاخرة. اطلب الآن مع ضمان الجودة وتوصيل سريع للرياض.',
      keywords: 'بخور، عود طبيعي، متجر بخور الرياض، عود مروكي، بخور هندي، دهن عود، عطور شرقية، عود محسن، مباخر',
      og_image: ''
    },
    {
      page_path: '/products',
      title: 'جميع المنتجات | متجر SH للبخور للعود والعطور',
      description: 'تصفح التشكيلة الكاملة لمتجر SH للبخور التي تضم أجود أنواع العود الطبيعي، دهن العود، العطور الغربية والشرقية، مع ضمان الجودة والأسعار التنافسية.',
      keywords: 'تسوق بخور، منتجات العود، دهن العود للبيع، عطور فخمة، متجر عطور وبخور، مباخر ذكية، بكجات هدايا عود',
      og_image: ''
    },
    {
      page_path: '/products/bakhour',
      title: 'بخور فاخر ومسقى | SH للبخور',
      description: 'اخترنا لكم تشكيلة فاخرة من البخور المسقى والمعمول برائحة ثابتة وفوحان يدوم طويلاً للمنازل والمناسبات. اطلب بخورك المفضل الآن من SH للبخور.',
      keywords: 'بخور مسقى، معمول دوسري، مبثوث ملكي، بخور للمناسبات، بخور يومي، بخور عرايسي',
      og_image: ''
    },
    {
      page_path: '/products/ouud',
      title: 'العود الطبيعي | SH للبخور',
      description: 'نقدم لك أفضل أنواع العود الطبيعي كالمروكي والهندي والكلمنتان بجودة عالية ورائحة زكية وثابتة. استمتع بأصالة العود مع SH للبخور.',
      keywords: 'عود مروكي طبيعي، عود كلمنتان طبيعي، عود هندي اصلي، خشب العود، عود للمناسبات، أوقية عود',
      og_image: ''
    },
    {
      page_path: '/products/ouud-enhanced',
      title: 'العود المحسن | خيارات اقتصادية فاخرة | SH للبخور',
      description: 'اكتشف مجموعة العود المحسن الفائق الجودة. ثبات عالي وريحة مماثلة للطبيعي بأسعار في متناول الجميع، مثالية للتبخير اليومي والمساجد.',
      keywords: 'عود مروكي محسن، عود كلمنتان محسن، عود محسن فاخر، بخور مساجد، عود اقتصادية، بخور يومي',
      og_image: ''
    },
    {
      page_path: '/products/perfumes',
      title: 'عطور شرقية وغربية فاخرة | متجر SH للبخور',
      description: 'تسوق أفضل العطور الفاخرة التي تمزج بين الأصالة الشرقية للعود والحداثة الغربية. عطور بثبات عالي وفوحان يناسب أصحاب الذوق الرفيع.',
      keywords: 'عطور رجالية، عطور نسائية، دهن عود فرنسي، عطر باتشولي، عطر شرقي غالي، هدايا عطور',
      og_image: ''
    },
    {
      page_path: '/products/sale',
      title: 'تخفيضات وعروض متجر SH للبخور | اطلب الآن',
      description: 'لا تفوت أقوى العروض والتخفيضات الحصرية من SH للبخور على البخور، العود، والعطور. تسوق الآن واحصل على هدايا وأسعار لا تقبل المنافسة.',
      keywords: 'عروض البخور، تخفيضات العود، كود خصم بخور، عروض اليوم الوطني عود، بكجات عود مخفضة',
      og_image: ''
    },
    {
      page_path: '/products/featured',
      title: 'ترشيحاتنا المتميزة لك | SH للبخور',
      description: 'منتجات منتقاة بعناية تعتبر الأفضل مبيعاً والأعلى تقييماً في متجر SH للبخور. جرب المنتجات المتميزة والمضمونة للتبخير وللإهداء الفاخر.',
      keywords: 'أفضل بخور، بخور الأكثر مبيعاً، بخور مجرب، هدايا فاخرة، عود ملكي',
      og_image: ''
    },
    {
      page_path: '/about',
      title: 'من نحن | قصة متجر SH للبخور',
      description: 'تعرف على قصة متجر SH للبخور ورؤيتنا في تقديم أنقى وأفضل أنواع البخور والعود المستورد مباشرة. نحن نسعى لنشر الطيب بأعلى معايير الجودة.',
      keywords: 'عن SH للبخور، من نحن متجر بخور، قصة متجر عود',
      og_image: ''
    },
    {
      page_path: '/faq',
      title: 'الأسئلة الشائعة | مساعدة SH للبخور',
      description: 'هل لديك استفسار حول سياسة الاسترجاع أو مدة التوصيل؟ اقرأ صفحة الأسئلة الشائعة لمعرفة كل تفاصيل التسوق والشحن من SH للبخور.',
      keywords: 'استفسارات SH للبخور، استرجاع البخور، توصيل عود للرياض، دعم متجر بخور',
      og_image: ''
    },
    {
      page_path: '/cart',
      title: 'سلة المشتريات | راجع طلبك | SH للبخور',
      description: 'راجع منتجاتك في سلة المشتريات من SH للبخور قبل إتمام عملية الدفع. نضمن لك عملية شراء آمنة وتجربة تسوق سلسة من البداية للنهاية.',
      keywords: 'سلة المشتريات متجر بخور',
      og_image: ''
    },
    {
      page_path: '/checkout',
      title: 'الدفع المأمون | إتمام طلبك | SH للبخور',
      description: 'أتمم طلبك الآن بآمان وسهولة من SH للبخور واستمتع بأفضل العود والعطور يصلك لباب بيتك بأسعار تنافسية وخيارات دفع متنوعة.',
      keywords: 'دفع الكتروني بخور، اتمام الطلب',
      og_image: ''
    }
  ];

  try {
    await client.connect();
    let count = 0;
    for (const seo of staticSeoData) {
      await client.query(`
        INSERT INTO seo_settings (page_path, title, description, keywords, og_image, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (page_path) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          keywords = EXCLUDED.keywords,
          updated_at = NOW();
      `, [seo.page_path, seo.title, seo.description, seo.keywords, seo.og_image]);
      count++;
    }
    console.log(`Successfully upserted ${count} SEO settings.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
