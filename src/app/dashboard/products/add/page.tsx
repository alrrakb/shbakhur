'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Infinity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import RichTextEditor from '@/components/RichTextEditor';
import { sanitizeFilename } from '@/lib/storage';

export default function AddProduct() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isInfiniteStock, setIsInfiniteStock] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    slug: '',
    sku: '',
    regular_price: '',
    sale_price: '',
    stock: '0',
    stock_status: 'instock',
    featured_image: '',
    gallery_images: [] as string[],
    categories: [] as string[],
    is_active: true,
  });

  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string, parent_id: string | null}[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('id, name, parent_id').order('name');
      if (data) setAvailableCategories(data);
    }
    fetchCategories();
  }, []);

  // DEBUG: Track formData changes
  useEffect(() => {
    console.log('📝 formData changed - featured_image:', formData.featured_image || '(empty)');
  }, [formData.featured_image]);

  // DEBUG: Track component mount/unmount
  useEffect(() => {
    console.log('🚀 Component MOUNTED');
    return () => console.log('💥 Component UNMOUNTED');
  }, []);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId)
    }));
  };

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
      
      // Update form state with new image URL
      console.log('Setting featured_image to:', imageUrl);
      setFormData(prev => {
        const newState = { ...prev, featured_image: imageUrl };
        console.log('Old state featured_image:', prev.featured_image);
        console.log('New state featured_image:', newState.featured_image);
        console.log('State update successful:', newState.featured_image === imageUrl ? 'YES' : 'NO');
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
        slug: formData.slug || formData.title.replace(/\([^)]+\)/g, '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        sku: formData.sku,
        regular_price: formData.regular_price || formData.sale_price || '',
        sale_price: formData.sale_price,
        price: formData.regular_price || formData.sale_price || '',
        stock: isInfiniteStock ? null : (formData.stock ? parseInt(formData.stock) : 0),
        stock_status: formData.stock_status,
        image: formData.featured_image,
        gallery_images: formData.gallery_images,
        is_active: formData.is_active,
      };

      console.log('Submitting product with image:', formData.featured_image);
      console.log('Product data:', productData);

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Product insert error:', error);
        throw error;
      }

      console.log('Product created successfully:', newProduct);

      if (formData.categories.length > 0) {
        const catInserts = formData.categories.map(categoryId => ({
          product_id: newProduct.id,
          category_id: categoryId
        }));
        await supabase.from('product_categories').insert(catInserts);
      }

      showToast('تم إضافة المنتج بنجاح', 'success');
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('حدث خطأ في إضافة المنتج', 'error');
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">إضافة منتج جديد</h1>
        <p className="text-gray-400">أضف منتج جديد إلى المتجر</p>
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
              {availableCategories.filter(c => !c.parent_id).map(parent => {
                const children = availableCategories.filter(c => c.parent_id === parent.id);
                return (
                  <div key={parent.id} className="space-y-3">
                    <label className="flex items-center gap-3 font-bold text-luxury-gold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(parent.id)}
                        onChange={(e) => handleCategoryChange(parent.id, e.target.checked)}
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
                              checked={formData.categories.includes(child.id)}
                              onChange={(e) => handleCategoryChange(child.id, e.target.checked)}
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
              {availableCategories.length === 0 && (
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
                : 'انقر على أيقونة اللانهاية لتفعيل المخزون اللانهائي'}
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
