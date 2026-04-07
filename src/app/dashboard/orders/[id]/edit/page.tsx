'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/context/ToastContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CartItem { product_id: string; product_name: string; quantity: number; unit_price: number; total_price: number; }
interface StoreProduct { id: number; title: string; price: string; sale_price: string; image: string; }

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', additional_phone: '', area: '', street: '', house_number: '', notes: '',
    discount_type: 'none' as 'none' | 'fixed' | 'percentage',
    discount_value: '',
  });

  useEffect(() => {
    supabase.from('products').select('id, title, price, sale_price, image').eq('is_active', true)
      .order('title').then(({ data }) => setProducts((data as any) || []));
  }, []);

  useEffect(() => {
    async function loadOrder() {
      try {
        const { data: orderData, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers(id, name, phone, additional_phone, email, address, city),
            order_items(product_id, product_name, quantity, unit_price, total_price)
          `)
          .eq('id', orderId)
          .single();

        if (error || !orderData) throw error || new Error('Order not found');

        setOrder(orderData);
        if (orderData.customers) {
          const rawAddress = orderData.customers.address || '';
          const match = rawAddress.match(/^(.*?)(?:\s*\((.*?)\))?$/);
          const streetStr = match ? match[1].trim() : rawAddress;
          const houseStr = match && match[2] ? match[2].trim() : '';

          setForm({
            name: orderData.customers.name || '',
            phone: orderData.customers.phone || '',
            additional_phone: orderData.customers.additional_phone || '',
            area: orderData.customers.city || '',
            street: streetStr,
            house_number: houseStr,
            notes: orderData.notes?.replace('ملاحظات العميل: ', '') || '',
            discount_type: orderData.discount_type || 'none',
            discount_value: orderData.discount_value ? String(orderData.discount_value) : '',
          });
        }

        if (orderData.order_items) {
          setCart(orderData.order_items.map((i: any) => ({
            product_id: String(i.product_id),
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price
          })));
        }

      } catch (err) {
        showToast('فشل تحميل بيانات الطلب', 'error');
        router.push('/dashboard/orders');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) loadOrder();
  }, [orderId, router, showToast]);

  const subtotal = cart.reduce((s, i) => s + i.total_price, 0);
  const discountAmount = (() => {
    const v = Number(form.discount_value) || 0;
    if (form.discount_type === 'fixed') return Math.min(v, subtotal);
    if (form.discount_type === 'percentage') return subtotal * v / 100;
    return 0;
  })();
  const total = subtotal - discountAmount;

  function addProduct(p: StoreProduct) {
    const price = Number(p.sale_price && p.sale_price !== '0' ? p.sale_price : p.price) || 0;
    setCart(prev => {
      const existing = prev.find(i => i.product_id === String(p.id));
      if (existing) {
        return prev.map(i => i.product_id === String(p.id)
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
          : i);
      }
      return [...prev, { product_id: String(p.id), product_name: p.title, quantity: 1, unit_price: price, total_price: price }];
    });
    setProductSearch('');
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product_id !== productId)); return; }
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty, total_price: qty * i.unit_price } : i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('الاسم ورقم الجوال مطلوبان', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('أضف منتجاً واحداً على الأقل', 'error');
      return;
    }

    setSaving(true);
    try {
      // 1. Update customer
      if (order?.customer_id) {
        const combinedAddress = form.house_number ? `${form.street || ''} (${form.house_number})`.trim() : form.street;
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            name: form.name,
            phone: form.phone,
            additional_phone: form.additional_phone || null,
            address: combinedAddress || null,
            city: form.area || null
          })
          .eq('id', order.customer_id);

        if (customerError) throw customerError;
      }

      const finalNotes = form.notes ? `ملاحظات العميل: ${form.notes}` : '';

      // 2. Update order totals and notes
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          subtotal,
          discount_amount: discountAmount,
          total_amount: total,
          notes: finalNotes || null,
          discount_type: form.discount_type,
          discount_value: form.discount_type !== 'none' ? Number(form.discount_value) : null,
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 3. Sync order_items (delete old, insert new)
      const { error: delError } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (delError) throw delError;

      const { error: insError } = await supabase.from('order_items').insert(cart.map(i => ({
        order_id: orderId,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
      })));
      if (insError) throw insError;

      showToast('تم تحديث بيانات الطلب بنجاح', 'success');
      router.push('/dashboard/orders');
    } catch (err: any) {
      showToast(err?.message || 'فشل تحديث الطلب', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-luxury-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-1">تعديل الطلب {order?.order_number}</h1>
        <p className="text-gray-400">تحديث منتجات وبيانات أو خصومات الطلب الحالية</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm p-6">
          <h2 className="text-luxury-gold font-bold text-lg mb-4">معلومات العميل</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'الاسم الكامل *', key: 'name', placeholder: 'مثال: محمد أحمد' },
              { label: 'رقم الجوال *', key: 'phone', placeholder: 'مثال: 05XXXXXXXX' },
              { label: 'رقم جوال إضافي', key: 'additional_phone', placeholder: 'مثال: 05XXXXXXXX' },
              { label: 'المنطقة (الحي)', key: 'area', placeholder: 'مثال: الملقا' },
              { label: 'الشارع', key: 'street', placeholder: 'مثال: شارع الملك فهد' },
              { label: 'رقم المنزل/الشقة *', key: 'house_number', placeholder: 'مثال: شقة 3، الطابق الأول' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-gray-400 text-sm mb-1">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm p-6">
          <h2 className="text-luxury-gold font-bold text-lg mb-4">المنتجات</h2>

          {/* Search */}
          <div className="relative mb-4">
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="ابحث وأضف منتجاً..."
              className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
            {productSearch && filteredProducts.length > 0 && (
              <div className="absolute top-full right-0 left-0 bg-[#111] border border-luxury-gold/20 rounded-sm mt-1 z-10 max-h-60 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)}
                    className="w-full text-right px-4 py-3 hover:bg-luxury-gold/10 transition-colors border-b border-luxury-gold/10 last:border-0">
                    <div className="text-white text-sm">{p.title}</div>
                    <div className="text-luxury-gold text-xs">{p.sale_price && p.sale_price !== '0' ? p.sale_price : p.price} ر.س</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">تم تفريغ منتجات الطلب بالكامل</div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-4 bg-luxury-black/50 rounded-sm p-3">
                  <div className="flex-1">
                    <div className="text-white">{item.product_name}</div>
                    <div className="text-gray-400 text-sm">{item.unit_price} ر.س للوحدة</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 flex items-center justify-center">—</button>
                    <span className="w-8 text-center text-white">{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 flex items-center justify-center">+</button>
                  </div>
                  <div className="text-luxury-gold font-bold w-24 text-left">{item.total_price.toFixed(0)} ر.س</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Discount + Notes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm p-6 space-y-4">
          <h2 className="text-luxury-gold font-bold text-lg">الخصم والملاحظات</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">نوع الخصم</label>
              <select value={form.discount_type} onChange={e => setForm(x => ({ ...x, discount_type: e.target.value as any }))}
                className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none">
                <option value="none">بدون خصم</option>
                <option value="fixed">مبلغ ثابت</option>
                <option value="percentage">نسبة مئوية %</option>
              </select>
            </div>
            {form.discount_type !== 'none' && (
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  القيمة {form.discount_type === 'percentage' ? '(%)' : '(ر.س)'}
                </label>
                <input type="number" min="0" value={form.discount_value}
                  onChange={e => setForm(x => ({ ...x, discount_value: e.target.value }))}
                  className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))}
              rows={3} placeholder="أي ملاحظات خاصة بالطلب..."
              className="w-full px-4 py-2 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none resize-none" />
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>المجموع الفرعي</span><span>{subtotal.toFixed(0)} ر.س</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>الخصم</span><span>-{discountAmount.toFixed(0)} ر.س</span>
            </div>
          )}
          <div className="flex justify-between text-white font-bold text-xl border-t border-luxury-gold/20 pt-3">
            <span>الإجمالي</span><span className="text-luxury-gold">{total.toFixed(0)} ر.س</span>
          </div>
        </motion.div>

        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 border border-gray-600 text-gray-400 rounded-sm hover:border-gray-500">
            إلغاء
          </button>
          <button type="submit" disabled={saving || cart.length === 0}
            className="flex-1 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold/80 disabled:opacity-50 transition-colors">
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}
