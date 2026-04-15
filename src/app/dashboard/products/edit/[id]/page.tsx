'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Infinity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import RichTextEditor from '@/components/RichTextEditor';
import { sanitizeFilename } from '@/lib/storage';

interface Product {
  id: number;
  wp_id: string;
  title: string;
  description: string;
  short_description: string;
  slug: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  stock: string;
  stock_quantity?: number | null;
  stock_status: string;
  manage_stock: string;
  featured_image: string;
  gallery_images: string[];
  categories: string[];
  is_active: boolean;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [allCategories, setAllCategories] = useState<{id: string; name: string; parent_id?: string | null}[]>([]);
  const initialLoadDone = useRef(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isInfiniteStock, setIsInfiniteStock] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: 0,
    wp_id: '',
    title: '',
    description: '',
    short_description: '',
    slug: '',
    sku: '',
    regular_price: '',
    sale_price: '',
    stock: '0',
    stock_status: 'instock',
    manage_stock: 'no',
    featured_image: '',
    gallery_images: [],
    categories: [],
    is_active: true,
  });

  // DEBUG: Track formData changes
  useEffect(() => {
    console.log('📝 formData changed - featured_image:', formData.featured_image || '(empty)');
    if (!formData.featured_image) {
      console.log('⚠️⚠️⚠️ featured_image RESET detected! Stack:', new Error().stack);
    }
  }, [formData.featured_image]);

  // DEBUG: Track component mount/unmount
  useEffect(() => {
    console.log('🚀 Component MOUNTED');
    return () => console.log('💥 Component UNMOUNTED');
  }, []);

  useEffect(() => {
    // Prevent re-fetching and overwriting user changes after initial load
    if (initialLoadDone.current) {
      console.log('⏭️ Skipping fetch - initial load already done');
      return;
    }

    async function fetchData() {
      try {
        const [productRes, categoriesRes, productCatsRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', productId).single(),
          supabase.from('categories').select('id, name, parent_id').order('name'),
          supabase.from('product_categories').select('category_id').eq('product_id', productId)
        ]);

        if (productRes.error) throw productRes.error;

        if (productRes.data) {
          console.log('📥 Initial load - setting form data from DB');
          // Check if stock is null/undefined (infinite stock)
          const hasInfiniteStock = productRes.data.stock === null || productRes.data.stock === undefined;
          setIsInfiniteStock(hasInfiniteStock);

          setFormData({
            id: productRes.data.id,
            wp_id: productRes.data.wp_id || '',
            title: productRes.data.title || '',
            description: productRes.data.description || '',
            short_description: productRes.data.short_description || '',
            slug: productRes.data.slug || '',
            sku: productRes.data.sku || '',
            regular_price: productRes.data.regular_price || productRes.data.price || '',
            sale_price: productRes.data.sale_price || '',
            stock: hasInfiniteStock ? '∞' : (productRes.data.stock || '0'),
            stock_quantity: productRes.data.stock, // Keep original for reference
            stock_status: productRes.data.stock_status || 'instock',
            manage_stock: productRes.data.manage_stock || 'no',
            featured_image: productRes.data.image || productRes.data.featured_image || '',
            gallery_images: Array.isArray(productRes.data.gallery_images) ? productRes.data.gallery_images : [],
            categories: Array.isArray(productRes.data.categories) ? productRes.data.categories : [],
            is_active: productRes.data.is_active !== false,
          });
          
          if (categoriesRes.data) {
            setAllCategories(categoriesRes.data);
          }
          
          if (productCatsRes.data) {
            setSelectedCategories(productCatsRes.data.map((c: any) => c.category_id));
          }
        }
        initialLoadDone.current = true;
      } catch (error) {
        console.error('Error fetching product:', error);
        showToast('فشل تحميل بيانات المنتج', 'error');
      } finally {
        setInitialLoading(false);
      }
    }

    fetchData();
  }, [productId]); // Removed showToast to prevent re-fetching

  const uploadToSupabaseStorage = async (file: File, bucket: string, folder: string): Promise<string> => {
    // Use storage-safe filename sanitizer to handle Arabic and special characters
    const fileName = sanitizeFilename(file.name, folder);
    console.log('Uploading file:', file.name, '→', fileName, 'to bucket:', bucket);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`فشل رفع الملف: ${error.message}`);
    }

    if (!data || !data.path) {
      console.error('Upload succeeded but no path returned:', data);
      throw new Error('فشل رفع الملف: لم يتم استلام مسار الملف');
    }

    console.log('Upload successful, path:', data.path);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleUploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('🔥 handleUploadFeaturedImage called, file:', file ? file.name : 'NO FILE');
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToSupabaseStorage(file, 'products', 'featured');
      console.log('Uploaded image URL:', imageUrl);
      
      setFormData(prev => {
        const newState = { ...prev, featured_image: imageUrl };
        console.log('Updated formData:', newState);
        return newState;
      });
      
      // CRITICAL: Reset file input to prevent stray change events
      if (featuredInputRef.current) {
        featuredInputRef.current.value = '';
        console.log('✅ File input reset');
      }
      
      showToast('تم رفع الصورة بنجاح', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('فشل رفع الصورة', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadGalleryImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const imageUrl = await uploadToSupabaseStorage(files[i], 'products', 'gallery');
        setFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, imageUrl]
        }));
      }
      showToast('تم رفع الصور بنجاح', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('فشل رفع الصور', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeFeaturedImage = () => {
    setFormData(prev => ({ ...prev, featured_image: '' }));
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        slug: formData.slug,
        sku: formData.sku,
        regular_price: formData.regular_price ? parseFloat(formData.regular_price) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        price: (formData.regular_price || formData.sale_price) ? parseFloat(formData.regular_price || formData.sale_price) : null,
        stock: isInfiniteStock ? null : (formData.stock ? parseInt(formData.stock) : 0),
        stock_status: formData.stock_status,
        image: formData.featured_image,
        gallery_images: formData.gallery_images,
        is_active: formData.is_active,
        category_id: selectedCategories.length > 0 ? selectedCategories[0] : null,
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', formData.id);

      if (error) throw error;

      await supabase.from('product_categories').delete().eq('product_id', formData.id);
      
      if (selectedCategories.length > 0) {
        const categoryLinks = selectedCategories.map(catId => ({
          product_id: formData.id,
          category_id: catId
        }));
        await supabase.from('product_categories').insert(categoryLinks);
      }

      showToast('تم تحديث المنتج بنجاح', 'success');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('حدث خطأ في تحديث المنتج', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`🎯 handleChange called: name="${name}", value="${value?.substring(0, 50)}..."`);
    if (name === 'featured_image') {
      console.log('⚠️ featured_image changed via handleChange! Stack:', new Error().stack);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">تعديل المنتج</h1>
        <p className="text-gray-400">قم بتعديل بيانات المنتج</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] rounded-sm border border-luxury-gold/20 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              اسم المنتج <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="أدخل اسم المنتج"
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              الرابط (Slug)
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="product-slug"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-white font-medium mb-2">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="أدخل SKU"
            />
          </div>

          {/* Categories */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-4">التصنيفات</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-luxury-black border border-luxury-gold/20 p-6 rounded-sm">
              {allCategories.filter(c => !c.parent_id).map(parent => {
                const children = allCategories.filter(c => c.parent_id === parent.id);
                return (
                  <div key={parent.id} className="space-y-3">
                    <label className="flex items-center gap-3 font-bold text-luxury-gold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(parent.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCategories([...selectedCategories, parent.id]);
                          else setSelectedCategories(selectedCategories.filter(id => id !== parent.id));
                        }}
                        className="w-5 h-5 rounded border-luxury-gold/50"
                      />
                      {parent.name}
                    </label>
                    {children.length > 0 && (
                      <div className="mr-8 space-y-3 border-r-2 border-luxury-gold/20 pr-4 mt-2">
                        {children.map(child => (
                          <label key={child.id} className="flex items-center gap-3 text-white text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(child.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCategories([...selectedCategories, child.id]);
                                else setSelectedCategories(selectedCategories.filter(id => id !== child.id));
                              }}
                              className="w-4 h-4 rounded border-gray-600"
                            />
                            {child.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {allCategories.length === 0 && (
                <p className="text-gray-500 text-sm">لا توجد تصنيفات</p>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <label className="block text-white font-medium mb-2">
              حالة المخزون
            </label>
            <select
              name="stock_status"
              value={formData.stock_status}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
            >
              <option value="instock">متوفر</option>
              <option value="outofstock">غير متوفر</option>
              <option value="onbackorder">طلب مسبق</option>
            </select>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-white font-medium mb-2">
              كمية المخزون
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsInfiniteStock(!isInfiniteStock);
                  if (!isInfiniteStock) {
                    setFormData(prev => ({ ...prev, stock: '∞' }));
                  } else {
                    setFormData(prev => ({ ...prev, stock: '0' }));
                  }
                }}
                className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-sm transition-all duration-200 ${
                  isInfiniteStock
                    ? 'text-luxury-gold bg-luxury-gold/20'
                    : 'text-gray-500 hover:text-luxury-gold hover:bg-luxury-gold/10'
                }`}
                title={isInfiniteStock ? 'تعطيل المخزون اللانهائي' : 'تفعيل المخزون اللانهائي'}
              >
                <Infinity className="w-5 h-5" />
              </button>
              <input
                type={isInfiniteStock ? 'text' : 'number'}
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                disabled={isInfiniteStock}
                className={`w-full px-4 py-3 bg-luxury-black border rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors ${
                  isInfiniteStock
                    ? 'border-luxury-gold/50 pl-12 text-luxury-gold font-medium'
                    : 'border-luxury-gold/20 pl-12'
                }`}
                placeholder="0"
              />
              {isInfiniteStock && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-gold/70 text-sm">
                  مخزون لانهائي
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {isInfiniteStock
                ? 'المنتج متاح دائماً (مخزون غير محدود)'
                : 'انقر على أيقونة اللا نهاية لتفعيل المخزون اللانهائي'}
            </p>
          </div>

          {/* Regular Price */}
          <div>
            <label className="block text-white font-medium mb-2">
              السعر الأصلي (قبل الخصم)
            </label>
            <input
              type="number"
              name="regular_price"
              value={formData.regular_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-white font-medium mb-2">
              السعر المخفض (بعد الخصم)
            </label>
            <input
              type="number"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="أدخل السعر المخفض (اختياري)"
            />
          </div>

          {/* Featured Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              صورة المنتج الرئيسية
            </label>
            
            {formData.featured_image ? (
              <div className="relative inline-block">
                <img
                  key={formData.featured_image}
                  src={formData.featured_image}
                  alt="Featured"
                  className="w-32 h-32 object-cover rounded-sm border border-luxury-gold/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm font-bold"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <input
                  ref={featuredInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFeaturedImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => featuredInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                </button>
                <span className="text-gray-400 text-sm">أو</span>
                <input
                  type="url"
                  name="featured_image"
                  value={formData.featured_image}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                  placeholder="أدخل رابط الصورة"
                />
              </div>
            )}
          </div>

          {/* Gallery Images Upload */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              صور المعرض (صور إضافية)
            </label>
            
            {formData.gallery_images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {formData.gallery_images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-sm border border-luxury-gold/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadGalleryImages}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-colors disabled:opacity-50"
              >
                {uploading ? 'جاري الرفع...' : 'رفع صور'}
              </button>
            </div>
          </div>

          {/* Short Description */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              الوصف المختصر
            </label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
              placeholder="أدخل وصف مختصر للمنتج"
              rows={3}
            />
          </div>

          {/* Full Description */}
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              الوصف الكامل <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="أدخل وصف المنتج الكامل"
              rows={8}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500 hover:text-white transition-colors"
          >
            إلغاء
          </button>
        </div>
      </motion.form>
    </div>
  );
}
