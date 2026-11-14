export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

export const products: Product[] = [
  {
    id: 1,
    name: 'بخور كلمنتانا فاخر شرايح',
    price: 350,
    image: '/og-image.png',
    category: 'بخور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 2,
    name: 'بخور سومطري بلس',
    price: 280,
    image: '/og-image.png',
    category: 'بخور',
    rating: 4,
  },
  {
    id: 3,
    name: 'بخور عود بابوه',
    price: 420,
    image: '/og-image.png',
    category: 'بخور',
    rating: 5,
  },
  {
    id: 4,
    name: 'بخور ماليزي فاخر',
    price: 380,
    image: '/og-image.png',
    category: 'بخور',
    rating: 4,
    isOnSale: true,
  },
  {
    id: 5,
    name: 'عود أصفهان الملكي',
    price: 1200,
    image: '/og-image.png',
    category: 'عود طبيعي',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 6,
    name: 'عود هندي طبيعي',
    price: 850,
    image: '/og-image.png',
    category: 'عود طبيعي',
    rating: 4,
  },
  {
    id: 7,
    name: 'عود بورمي فاخر',
    price: 1500,
    image: '/og-image.png',
    category: 'عود طبيعي',
    rating: 5,
  },
  {
    id: 8,
    name: 'عود تايلاندي طبيعي',
    price: 950,
    image: '/og-image.png',
    category: 'عود طبيعي',
    rating: 4,
    isOnSale: true,
  },
  {
    id: 9,
    name: 'عود محسن تايلاندي',
    price: 650,
    image: '/og-image.png',
    category: 'عود محسن',
    rating: 4,
    isFeatured: true,
  },
  {
    id: 10,
    name: 'عود محسن إندونيسي',
    price: 580,
    image: '/og-image.png',
    category: 'عود محسن',
    rating: 4,
  },
  {
    id: 11,
    name: 'عود معطر فاخر',
    price: 450,
    image: '/og-image.png',
    category: 'عود محسن',
    rating: 3,
    isOnSale: true,
  },
  {
    id: 12,
    name: 'دهن عود طبيعي',
    price: 450,
    image: '/og-image.png',
    category: 'دهن العود',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 13,
    name: 'عطر توم فورد بلاك اوركيد',
    price: 950,
    image: '/og-image.png',
    category: 'عطور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 14,
    name: 'عطر ديور عود اصفهان',
    price: 780,
    image: '/og-image.png',
    category: 'عطور',
    rating: 5,
  },
  {
    id: 15,
    name: 'عطر جوتشي بلوم',
    price: 650,
    image: '/og-image.png',
    category: 'عطور',
    rating: 4,
  },
  {
    id: 16,
    name: 'عطر توم فورد اودوري',
    price: 890,
    image: '/og-image.png',
    category: 'عطور',
    rating: 5,
    isOnSale: true,
  },
  {
    id: 17,
    name: 'عطر شانيل نمبر 5',
    price: 720,
    image: '/og-image.png',
    category: 'عطور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 18,
    name: 'عطر ديور سافاج',
    price: 680,
    image: '/og-image.png',
    category: 'عطور',
    rating: 4,
  },
];

export const categories = [
  { id: 'all', name: 'جميع المنتجات', href: '/products' },
  { id: 'oud', name: 'البخور والعود', href: '/products/oud' },
  { id: 'عود-طبيعي', name: 'العود الطبيعي', href: '/products/عود-طبيعي' },
  { id: 'عود-محسن', name: 'العود المحسن', href: '/products/عود-محسن' },
  { id: 'perfumes', name: 'العطور', href: '/products/perfumes' },
  { id: 'best-sellers', name: 'الاكثر مبيعا', href: '/products/best-sellers' },
  { id: 'best-offers', name: 'عروضنا', href: '/products/best-offers' },
];

export function getProductsByCategory(category: string): Product[] {
  if (category === 'best-sellers' || category === 'featured') {
    return products.filter(p => p.isFeatured);
  }
  if (category === 'best-offers' || category === 'sale') {
    return products.filter(p => p.isOnSale);
  }
  if (category === 'oud' || category === 'bakhour') {
    return products.filter(p => p.category === 'بخور' || p.category === 'عود');
  }
  return products.filter(p => p.category === category);
}

export function getProductById(id: number): Product | undefined {
  return products.find(p => p.id === id);
}

