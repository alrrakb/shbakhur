# SH للبخور - معايير المشروع

## نظرة عامة

| البند | التفاصيل |
|-------|----------|
| **المشروع** | متجر SH للبخور |
| **المسار** | `C:\xampp\sh-bakhoor` |
| **التقنيات** | Next.js 14, Tailwind CSS, TypeScript, Framer Motion |
| **اللغة** | Arabic (RTL) |
| **السمة** | فاخرة (أسود + ذهبي) |

---

## 1. معايير الكود

### 1.1 TypeScript
- ✅ استخدام `type` بدلاً من `interface` للمهرمات البسيطة
- ✅ تجنب `any` تماماً - استخدام الأنواع المناسبة
- ✅ تصدير الأنواع المستخدمة في أكثر من مكان

### 1.2 React
```typescript
// ✅ استخدام 'use client' للمكونات التفاعلية
'use client';

import { useState } from 'react';

// ❌ تجنب useClient في اسم الملف
// ✅ useClient Hooks -> use-hooks
```

### 1.3 التسمية
| النوع | القاعدة | مثال |
|-------|---------|------|
| المكونات | PascalCase | `Header.tsx` |
| الملفات العادية | kebab-case | `utils.ts` |
| المجلدات | kebab-case | `src/components/hero/` |
| المتغيرات | camelCase | `isActive` |

---

## 2. هيكل الملفات

```
src/
├── app/
│   ├── globals.css          # الأنماط العامة
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # الصفحة الرئيسية
│   └── [route]/
│       └── page.tsx        # صفحات إضافية
├── components/
│   ├── ui/                 # مكونات UI قابلة لإعادة الاستخدام
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── features/
│       ├── Hero.tsx
│       └── ProductCard.tsx
├── lib/
│   ├── api.ts              # استدعاءات API
│   └── utils.ts            # دوال مساعدة
├── types/
│   └── index.ts            # الأنواع المشتركة
└── data/
    └── products.ts         # بيانات ثابتة
```

---

## 3. Tailwind CSS

### 3.1 الألوان (مُعرّفة في globals.css)
```css
--color-luxury-black    #0a0a0a
--color-luxury-dark     #141414
--color-luxury-gold     #d4af37
--color-luxury-gold-light #f0d875
--color-text-secondary  #a0a0a0
```

### 3.2Classes المساعدة
```typescript
// بدلاً من تكرار الكلاسات
bg-luxury-black    // أسود فاخر
text-gold          // نص ذهبي
gold-border        // حدود ذهبية
gold-glow          // توهج ذهبي
```

### 3.3 القواعد
- ❌ تجنب CSS مخصص ما أمكن
- ✅ استخدام Tailwind أولاً
- ✅ إضافة كلاسات مخصصة فقط للوحات معقدة

---

## 4. المكونات

### 4.1 بنية المكون
```typescript
'use client';

import { motion } from 'framer-motion';

interface ComponentNameProps {
  title: string;
  onClick?: () => void;
}

export default function ComponentName({ title, onClick }: ComponentNameProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="..."
    >
      {title}
    </motion.div>
  );
}
```

### 4.2 قواعد Framer Motion
- ✅ استخدام `motion.` للعناصر التفاعلية
- ✅ `whileHover` و `whileTap` للأزرار
- ✅ `initial` + `animate` + `exit` للأنيميشن
- ❌ تجنب animations معقدة تؤثر على الأداء

---

## 5. Git

### 5.1 رسائل Commit
```
feat: إضافة slider الصفحة الرئيسية
fix: إصلاح مشكلة responsive في Header
refactor: إعادة هيكلة ProductCard
docs: تحديث التوثيق
```

### 5.2 الفروع
```
main              → الكود المنتج
develop           → التطوير
feature/اسم-الميزة → ميزات جديدة
fix/اسم-المشكلة   → إصلاحات
```

---

## 6. الأداء

### 6.1 التحسينات المطلوبة
- ✅ استخدام `next/image` للصور
- ✅ `next/font` للخطوط (اختياري)
- ✅ Static Generation للصفحات الثابتة
- ✅ Lazy loading للمكونات الثقيلة

### 6.2 أبعاد الصور
```typescript
// good
<Image 
  src="/product.jpg"
  width={400}
  height={400}
  alt="..."
/>

// bad - بدون أبعاد
<Image src="/product.jpg" />
```

---

## 7.Accessibility

- ✅ جميع الصور بها `alt`
- ✅ استخدام `aria-label` للأزرار التفاعلية
- ✅ التركيز مرئي (`focus-visible`)
- ✅ ألوان بتباين كافٍ (4.5:1)

---

## 8. الاختبار

### 8.1 ESLint
```bash
npm run lint
```

### 8.2 TypeScript
```bash
npx tsc --noEmit
```

---

## 9. قبل إرسال الكود

- [ ] `npm run lint` نجح
- [ ] `npm run build` نجح
- [ ] جميع الصور بها أبعاد
- [ ] لا توجد `console.log`
- [ ] كود TypeScript صحيح
- [ ] Responsive يعمل

---

## 10. مصادر المشروع

| المورد | المسار |
|--------|--------|
| قاعدة البيانات | `C:\xampp\htdocs\my-store\wp-content` |
| الصور | `C:\xampp\htdocs\my-store\wp-content\uploads` |
| المنتجات | من جدول `wp_posts` |
| التصنيفات | من جدول `wp_terms` |

---

## 11. السجلات (Logs)

### 11.1 مجلد السجلات
```
logs/
├── app.log          # سجلات التطبيق
├── error.log        # سجلات الأخطاء
└── access.log       # سجلات الوصول
```

### 11.2 قواعد التسجيل
- ✅ استخدام `console.error` للأخطاء فقط
- ❌ تجنب `console.log` في الكود النهائي
- ✅ إنشاء logger مخصص للبيئة الإنتاجية
- ✅ تسجيل الأخطاء مع timestamp و stack trace

### 11.3 بنية Logger
```typescript
// lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export function logger(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
```

### 11.4 التعامل مع الأخطاء
```typescript
// ✅ نمط صحيح
try {
  await fetchProduct(id);
} catch (error) {
  logger('error', 'فشل جلب المنتج', { productId: id, error: error.message });
  throw error;
}
```

---

## 12. السمة (Theme): أسود + ذهبي

### 12.1 الألوان
| css | hex | الاستخدام |
|-----|-----|-----------|
| `bg-luxury-black` | #0a0a0a | الخلفية الرئيسية |
| `bg-luxury-dark` | #1a1a1a | بطاقات المنتجات |
| `text-luxury-gold` | #D4AF37 | النصوص المميزة |
| `bg-luxury-gold` | #D4AF37 | الأزرار |

### 12.2 ProductCard التخطيط (مهم!)
```tsx
// البطاقة الرئيسية
<motion.div className="... flex flex-col h-full">

  // صورة مع رابط (لا يحتوي على زر)
  <Link href={`/product/${slug}`} className="... relative overflow-hidden">
    <img ... />
    {/* زر إضاف للسلة - يظهر عند الـ hover على desktop */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20">
      <button>إضافة للسلة</button>
    </div>
  </Link>

  // معلومات المنتج مع رابط (لا يحتوي على زر)
  <Link href={`/product/${slug}`} className="... flex-grow p-4">
    <h3>...</h3>
    {/* وصف مختصر */}
    {product.short_description && <p className="text-zinc-400 text-sm line-clamp-2">...</p>}
    {/* السعر والتقييم - 必须 mt-auto ليكون في الأسفل */}
    <div className="... mt-auto">...</div>
  </Link>

  // زر الهاتف - ظاهر دائماً خارج الرابط
  <div className="lg:hidden"><button>إضافة للسلة</button></div>
</motion.div>
```

### 12.3 القواعد الأساسية
- البطاقة: `flex flex-col h-full`
- قسم المعلومات: `flex-grow`
- السعر والتقييم: `mt-auto` (يدفعهم للأسفل)
- زر الـ hover: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20`
- **لا توضع زر داخل Link** - يسبب خطأ HTML

---

> آخر تحديث: إبريل 2025
