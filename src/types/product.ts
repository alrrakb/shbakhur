export interface ProductCategory {
  id: string | number;
  name: string;
  slug: string;
  taxonomy?: string;
  count?: number;
  parent_id?: string | null;
}

export interface Product {
  id: number | string;
  title: string;
  description: string;
  slug: string;
  price: string;
  sale_price?: string;
  regular_price?: string;
  sku?: string;
  image: string;
  short_description?: string;
  created_at?: string;
  categories: ProductCategory[];
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface CategoriesResponse {
  success: boolean;
  categories: ProductCategory[];
  total: number;
}

export interface ProductsByCategoryResponse {
  success: boolean;
  products: Product[];
  category: {
    id: number;
    slug: string;
  };
  total: number;
}

export interface ApiError {
  error: string;
}
