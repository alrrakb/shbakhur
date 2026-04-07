-- Supabase Database Schema for SH Bakhoor E-commerce

-- Settings table (for site content management)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  wp_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  price TEXT DEFAULT '0',
  sale_price TEXT DEFAULT '0',
  regular_price TEXT,
  sku TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  wp_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  taxonomy TEXT DEFAULT 'product_cat',
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product-Category relationship table
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(product_id, category_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  notes TEXT,
  total_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Section settings for controlling visibility
CREATE TABLE IF NOT EXISTS section_settings (
  id SERIAL PRIMARY KEY,
  section_name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hero slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id SERIAL PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category cards for homepage
CREATE TABLE IF NOT EXISTS category_cards (
  id SERIAL PRIMARY KEY,
  icon TEXT,
  name TEXT NOT NULL,
  description TEXT,
  page_link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products display settings
CREATE TABLE IF NOT EXISTS products_settings (
  id SERIAL PRIMARY KEY,
  section_title TEXT,
  section_description TEXT,
  items_per_section INTEGER DEFAULT 4,
  sort_order TEXT DEFAULT 'newest',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partners display settings
CREATE TABLE IF NOT EXISTS partners_settings (
  id SERIAL PRIMARY KEY,
  section_title TEXT,
  section_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Footer display settings
CREATE TABLE IF NOT EXISTS footer_settings (
  id SERIAL PRIMARY KEY,
  about_title TEXT,
  about_description TEXT,
  phone_numbers TEXT,
  whatsapp TEXT,
  copyright TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Footer links
CREATE TABLE IF NOT EXISTS footer_links (
  id SERIAL PRIMARY KEY,
  section TEXT NOT NULL,
  name TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News ticker messages
CREATE TABLE IF NOT EXISTS news_ticker_messages (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation links
CREATE TABLE IF NOT EXISTS navigation_links (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT,
  has_dropdown BOOLEAN DEFAULT false,
  dropdown_items JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site logo
CREATE TABLE IF NOT EXISTS site_logo (
  id SERIAL PRIMARY KEY,
  logo_url TEXT,
  store_name TEXT DEFAULT 'SH للبخور',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE section_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_ticker_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_logo ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read section_settings" ON section_settings FOR SELECT USING (true);
CREATE POLICY "Public can read hero_slides" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Public can read category_cards" ON category_cards FOR SELECT USING (true);
CREATE POLICY "Public can read products_settings" ON products_settings FOR SELECT USING (true);
CREATE POLICY "Public can read partners_settings" ON partners_settings FOR SELECT USING (true);
CREATE POLICY "Public can read footer_settings" ON footer_settings FOR SELECT USING (true);
CREATE POLICY "Public can read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public can read partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Public can read footer_links" ON footer_links FOR SELECT USING (true);
CREATE POLICY "Public can read news_ticker_messages" ON news_ticker_messages FOR SELECT USING (true);
CREATE POLICY "Public can read navigation_links" ON navigation_links FOR SELECT USING (true);
CREATE POLICY "Public can read site_logo" ON site_logo FOR SELECT USING (true);

-- Public read access (for anon clients)
CREATE POLICY "Public can read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can read product_categories" ON product_categories FOR SELECT USING (true);

-- Insert policies for orders (service role only for write)
CREATE POLICY "Service role can manage orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_wp_id ON products(wp_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
