import { supabase } from '@/lib/supabase';
import type {
  Product,
  ProductCategory,
} from '@/types/product';

export async function getProducts(options?: { limit?: number; offset?: number }): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, product_categories(categories(id, name, slug, taxonomy))')
      .order('id', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const products: Product[] = (data || []).map(p => {
      const extractedCats = (p.product_categories || [])
        .map((pc: any) => pc.categories)
        .filter(Boolean);

      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        short_description: p.short_description || '',
        slug: p.slug,
        price: p.price || '0',
        sale_price: p.sale_price || p.price || '0',
        regular_price: p.regular_price,
        sku: p.sku,
        image: p.image || '',
        created_at: p.created_at,
        categories: extractedCats,
        stock_status: p.stock_status || 'instock'
      };
    });

    return products;
  } catch (error) {
    return [];
  }
}

async function getProductCategories(productId: number | string): Promise<ProductCategory[]> {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('category_id, categories(id, name, slug, taxonomy)')
      .eq('product_id', productId);

    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.categories.id,
      name: d.categories.name,
      slug: d.categories.slug,
      taxonomy: d.categories.taxonomy
    }));
  } catch {
    return [];
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_categories(categories(id, name, slug, taxonomy))')
      .eq('id', id)
      .single();

    if (error) throw error;

    const categories = (data.product_categories || [])
      .map((pc: any) => pc.categories)
      .filter(Boolean);

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      short_description: data.short_description || '',
      slug: data.slug,
      price: data.price || '0',
      sale_price: data.sale_price || data.price || '0',
      regular_price: data.regular_price,
      sku: data.sku,
      image: data.image || '',
      created_at: data.created_at,
      categories
    };
  } catch (error) {
    return null;
  }
}

export async function getCategories(): Promise<ProductCategory[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      taxonomy: c.taxonomy,
      count: c.count,
      parent_id: c.parent_id
    }));
  } catch (error) {
    return [];
  }
}

export async function getProductsByCategory(
  categorySlug: string,
  options?: { limit?: number; offset?: number }
): Promise<Product[]> {
  try {
    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (catError || !categoryData) return [];

    const { data: childCats } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', categoryData.id);

    const targetCategoryIds = [categoryData.id];
    if (childCats && childCats.length > 0) {
      targetCategoryIds.push(...childCats.map(c => c.id));
    }

    const { data: relData, error: relError } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_id', targetCategoryIds);

    if (relError || !relData) return [];

    const productIds = relData.map(r => r.product_id);

    let query = supabase
      .from('products')
      .select('*, product_categories(categories(id, name, slug, taxonomy))')
      .in('id', productIds)
      .order('id', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(p => {
      const extractedCats = (p.product_categories || [])
        .map((pc: any) => pc.categories)
        .filter(Boolean);

      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        short_description: p.short_description || '',
        slug: p.slug,
        price: p.price || '0',
        sale_price: p.sale_price || p.price || '0',
        image: p.image || '',
        created_at: p.created_at,
        categories: extractedCats
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getAllProducts(options?: { limit?: number; offset?: number }): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, product_categories(categories(name))')
      .order('id', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(p => {
      const extractedCats = (p.product_categories || [])
        .map((pc: any) => pc.categories)
        .filter(Boolean);

      return {
        id: p.id ? p.id.toString() : '',
        title: p.title || '',
        slug: p.slug || '',
        description: p.description || '',
        price: p.price?.toString() || p.regular_price?.toString() || '0',
        sale_price: p.sale_price?.toString() || '',
        image: p.image || '',
        short_description: p.short_description || '',
        stock_status: p.stock_status,
        is_active: p.is_active !== false,
        categories: extractedCats
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getSaleProducts(options?: { limit?: number; offset?: number }): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*, product_categories(categories(name))')
      .not('sale_price', 'is', null)
      .not('sale_price', 'eq', '')
      .not('price', 'is', null)
      .not('price', 'eq', '')
      .order('id', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const filteredData = (data || []).filter(p => {
      const price = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
      const salePrice = parseFloat(String(p.sale_price).replace(/[^0-9.]/g, ''));
      return salePrice > 0 && salePrice < price;
    });

    return filteredData.map(p => {
      const extractedCats = (p.product_categories || [])
        .map((pc: any) => pc.categories)
        .filter(Boolean);

      return {
        id: p.id ? p.id.toString() : '',
        title: p.title || '',
        slug: p.slug || '',
        description: p.description || '',
        price: p.price?.toString() || p.regular_price?.toString() || '0',
        sale_price: p.sale_price?.toString() || '',
        image: p.image || '',
        short_description: p.short_description || '',
        stock_status: p.stock_status,
        is_active: p.is_active !== false,
        categories: extractedCats
      };
    });
  } catch (error) {
    return [];
  }
}

export async function createOrder(orderData: {
  customer_name: string;
  customer_phone: string;
  customer_area?: string;
  customer_street?: string;
  additional_phone?: string;
  notes?: string;
  discount_amount?: number;
  items: { product_id: number | string; product_name: string; quantity: number; price: number; image?: string }[];
}): Promise<{ success: boolean; order_id?: string; order_number?: string; error?: string }> {
  try {
    const phone = orderData.customer_phone.trim();
    
    const combinedAddress = [orderData.customer_area, orderData.customer_street].filter(Boolean).join(' - ');
    const finalNotes = orderData.notes ? `ملاحظات العميل: ${orderData.notes}` : '';

    // 1. Find or create customer by phone
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update name/address in case they changed
      await supabase.from('customers').update({
        name: orderData.customer_name,
        additional_phone: orderData.additional_phone || null,
        city: orderData.customer_area || null,
        address: orderData.customer_street || null,
      }).eq('id', customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: orderData.customer_name,
          phone,
          additional_phone: orderData.additional_phone || null,
          city: orderData.customer_area || null,
          address: orderData.customer_street || null,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) throw customerError || new Error('Failed to create customer');
      customerId = newCustomer.id;
    }

    // 2. Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = orderData.discount_amount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    // 3. Generate unique order number
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${datePart}-${randPart}`;

    // 4. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount_amount: discount,
        total_amount: totalAmount,
        notes: finalNotes || null,
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) throw orderError || new Error('Failed to create order');

    // 5. Create order items using real product UUID
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: String(item.product_id),
      product_name: item.product_name,
      product_image: item.image || null,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return { success: true, order_id: order.id, order_number: order.order_number };
  } catch (error: any) {
    console.error('createOrder error:', error);
    return { success: false, error: error?.message || 'Failed to create order' };
  }
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numPrice.toLocaleString('ar-SA')} ر.س`;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  is_active: boolean;
  sort_order: number;
}

export interface Partner {
  id: number;
  name: string;
  country: string;
  logo_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface NavLink {
  id: number;
  name: string;
  link: string;
  has_dropdown: boolean;
  dropdown_items: any[];
  sort_order: number;
  is_active: boolean;
}

export interface FooterLink {
  id: number;
  section: string;
  name: string;
  link: string;
  sort_order: number;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function saveHeroSlides(slides: HeroSlide[]): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('hero_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const inserts = slides.map((slide, index) => ({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
      image_url: slide.image_url || '',
      sort_order: slide.sort_order || index + 1,
      is_active: slide.is_active !== false
    }));

    const { error } = await supabase.from('hero_slides').insert(inserts);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function savePartners(partners: Partner[]): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete all existing partners
    await supabase.from('partners').delete().neq('id', 0);

    if (partners.length === 0) return { success: true };

    const inserts = partners.map((p, index) => ({
      name: p.name || '',
      country: p.country || null,
      logo_url: p.logo_url || null,
      is_active: p.is_active !== false,
      sort_order: p.sort_order || index + 1,
    }));

    const { error } = await supabase.from('partners').insert(inserts);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('savePartners error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPartnersSettings() {
  try {
    const { data, error } = await supabase
      .from('partners_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
}

export async function savePartnersSettings(settings: {
  section_title: string;
  section_description: string;
  is_active: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Upsert the single settings row (id=1)
    const { error } = await supabase
      .from('partners_settings')
      .upsert({ id: 1, ...settings }, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('savePartnersSettings error:', error);
    return { success: false, error: error.message };
  }
}


export async function getNavigationLinks(): Promise<NavLink[]> {
  try {
    const { data, error } = await supabase
      .from('navigation_links')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function saveNavigationLinks(links: NavLink[]): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('navigation_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const inserts = links.map((link, index) => {
      let dropdownItems: any[] = [];
      try {
        const rawItems = typeof link.dropdown_items === 'string' 
          ? JSON.parse(link.dropdown_items) 
          : (link.dropdown_items || []);
        dropdownItems = rawItems.map((item: any) => ({
          name: item.name,
          href: item.link || item.href || ''
        }));
      } catch {
        dropdownItems = [];
      }
      
      return {
        name: link.name,
        link: link.link,
        has_dropdown: link.has_dropdown,
        dropdown_items: JSON.stringify(dropdownItems),
        sort_order: link.sort_order || index + 1,
        is_active: link.is_active !== false
      };
    });

    const { error } = await supabase.from('navigation_links').insert(inserts);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFooterLinks(): Promise<FooterLink[]> {
  try {
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function saveFooterLinks(links: FooterLink[]): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deleteError } = await supabase.from('footer_links').delete().neq('id', 0);
    
    const inserts = links.map((link, index) => ({
      section: link.section,
      name: link.name,
      link: link.link,
      sort_order: link.sort_order || index + 1
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from('footer_links').insert(inserts);
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface FooterSettings {
  about_title: string;
  about_description: string;
  phone_numbers: string[];
  whatsapp: string;
  copyright: string;
  is_active: boolean;
}

export async function getFooterSettings(): Promise<FooterSettings | null> {
  try {
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      about_title: data.about_title || 'نحن',
      about_description: data.about_description || '',
      phone_numbers: Array.isArray(data.phone_numbers) ? data.phone_numbers : [],
      whatsapp: data.whatsapp || '',
      copyright: data.copyright || 'جميع الحقوق محفوظة',
      is_active: data.is_active !== false,
    };
  } catch (error) {
    return null;
  }
}

export async function saveFooterSettings(settings: FooterSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('footer_settings')
      .upsert({
        id: 1,
        about_title: settings.about_title,
        about_description: settings.about_description,
        phone_numbers: settings.phone_numbers,
        whatsapp: settings.whatsapp,
        copyright: settings.copyright,
        is_active: settings.is_active,
      }, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('saveFooterSettings error:', error);
    return { success: false, error: error.message };
  }
}


export interface SiteLogo {
  logo_url: string;
  store_name: string;
}

export async function getSiteLogo(): Promise<SiteLogo | null> {
  try {
    const { data, error } = await supabase
      .from('site_logo')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
}

export async function saveSiteLogo(logo: SiteLogo): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('site_logo')
      .upsert({ id: 1, ...logo }, { onConflict: 'id' });
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface NewsMessage {
  id: number;
  message: string;
  is_active: boolean;
  sort_order: number;
}

export async function getNewsTickerMessages(): Promise<NewsMessage[]> {
  try {
    const { data, error } = await supabase
      .from('news_ticker_messages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}
