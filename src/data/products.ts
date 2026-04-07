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
    image: 'http://localhost/my-store/wp-content/uploads/2025/04/كلمنتانا-فاخر-شرايح-112.jpeg',
    category: 'بخور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 2,
    name: 'بخور سومطري بلس',
    price: 280,
    image: 'http://localhost/my-store/wp-content/uploads/2025/04/سومطري-بلس-113.jpeg',
    category: 'بخور',
    rating: 4,
  },
  {
    id: 3,
    name: 'بخور عود بابوه',
    price: 420,
    image: 'http://localhost/my-store/wp-content/uploads/2025/04/عود-بابوه-117.jpeg',
    category: 'بخور',
    rating: 5,
  },
  {
    id: 4,
    name: 'بخور ماليزي فاخر',
    price: 380,
    image: 'http://localhost/my-store/wp-content/uploads/2025/04/كلمنتانا-فاخر-شرايح-112.jpeg',
    category: 'بخور',
    rating: 4,
    isOnSale: true,
  },
  {
    id: 5,
    name: 'عود أصفهان الملكي',
    price: 1200,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/2a44e590-467f-4847-b838-26d271490297-1.png',
    category: 'عود طبيعي',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 6,
    name: 'عود هندي طبيعي',
    price: 850,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/16cd3800-b73a-49af-9d1b-f955778fcfbe.png',
    category: 'عود طبيعي',
    rating: 4,
  },
  {
    id: 7,
    name: 'عود بورمي فاخر',
    price: 1500,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/18fa536f-2388-41c5-bc90-53f4dc8b2a4e.png',
    category: 'عود طبيعي',
    rating: 5,
  },
  {
    id: 8,
    name: 'عود تايلاندي طبيعي',
    price: 950,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/0a365fea-e569-475e-ba47-c03b6720256c.png',
    category: 'عود طبيعي',
    rating: 4,
    isOnSale: true,
  },
  {
    id: 9,
    name: 'عود محسن تايلاندي',
    price: 650,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/0a365fea-e569-475e-ba47-c03b6720256c.png',
    category: 'عود محسن',
    rating: 4,
    isFeatured: true,
  },
  {
    id: 10,
    name: 'عود محسن إندونيسي',
    price: 580,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/26ae1cbf-293d-44c3-b183-7e6eb66aa522.png',
    category: 'عود محسن',
    rating: 4,
  },
  {
    id: 11,
    name: 'عود معطر فاخر',
    price: 450,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/2a2c0432-0eb8-4831-b153-ede66ed25f35-1.png',
    category: 'عود محسن',
    rating: 3,
    isOnSale: true,
  },
  {
    id: 12,
    name: 'دهن عود طبيعي',
    price: 450,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/2a2c0432-0eb8-4831-b153-ede66ed25f35-1.png',
    category: 'دهن العود',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 13,
    name: 'عطر توم فورد بلاك اوركيد',
    price: 950,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/9f8e9782-4280-486e-9e3b-b064fa96e734.png',
    category: 'عطور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 14,
    name: 'عطر ديور عود اصفهان',
    price: 780,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/8116bfcd-f629-44ab-a492-e91d7a2521b9.png',
    category: 'عطور',
    rating: 5,
  },
  {
    id: 15,
    name: 'عطر جوتشي بلوم',
    price: 650,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/18fa536f-2388-41c5-bc90-53f4dc8b2a4e.webp',
    category: 'عطور',
    rating: 4,
  },
  {
    id: 16,
    name: 'عطر توم فورد اودوري',
    price: 890,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/9f8e9782-4280-486e-9e3b-b064fa96e734.png',
    category: 'عطور',
    rating: 5,
    isOnSale: true,
  },
  {
    id: 17,
    name: 'عطر شانيل نمبر 5',
    price: 720,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/848edff6-288f-4179-afe3-f1ec0a89040c.png',
    category: 'عطور',
    rating: 5,
    isFeatured: true,
  },
  {
    id: 18,
    name: 'عطر ديور سافاج',
    price: 680,
    image: 'http://localhost/my-store/wp-content/uploads/2025/03/8116bfcd-f629-44ab-a492-e91d7a2521b9.png',
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
