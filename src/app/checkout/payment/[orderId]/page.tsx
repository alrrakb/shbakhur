'use client';

import { use, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function BankTransferPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    senderName: '',
    senderBank: '',
    senderAccount: '',
  });
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankDetails = {
    bankName: "مصرف الراجحي",
    accountName: "مؤسسة طلائع الركب للتسويق الالكتروني",
    accountNumber: "215608010987718",
    iban: "SA9280000215608010987718"
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
        return;
      }
      setReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `transfers/${resolvedParams.orderId}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senderName || !formData.senderBank || !formData.senderAccount || !receiptImage) {
      showToast('يرجى تعبئة جميع الحقول وإرفاق صورة الإيصال', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload the receipt image
      const receiptUrl = await uploadReceipt(receiptImage);

      // 2. Update the order with payment details
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          transfer_receipt_url: receiptUrl,
          sender_name: formData.senderName,
          sender_bank: formData.senderBank,
          sender_account: formData.senderAccount,
        })
        .eq('id', resolvedParams.orderId);

      if (updateError) throw updateError;

      // 3. Navigate to success
      router.push(`/checkout/success/${resolvedParams.orderId}`);
    } catch (error) {
      console.error('Error submitting payment:', error);
      showToast('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
        <section className="py-8 sm:py-12 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-10"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">تأكيد الدفع</h1>
            <p className="text-gray-400 mb-2 text-sm sm:text-base">رقم الطلب: <span className="text-luxury-gold font-bold">{resolvedParams.orderId.slice(-6).toUpperCase()}</span></p>
            <p className="text-gray-400 text-sm sm:text-base">الرجاء إتمام التحويل البنكي لحساب المؤسسة وإرفاق الإيصال لتأكيد طلبك.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-luxury-dark rounded-xl overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.1)] border border-luxury-gold/30 sticky top-32 h-fit relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              {/* Card Header */}
              <div className="bg-luxury-black/50 p-6 flex justify-between items-center text-white border-b border-luxury-gold/20">
                <h3 className="text-2xl font-bold text-luxury-gold">مصرف الراجحي</h3>
                <div className="w-12 h-12 bg-luxury-gold/10 border border-luxury-gold/30 rounded-md flex items-center justify-center">
                  <svg className="w-8 h-8 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>

              <div className="p-5 sm:p-8 text-white text-center relative z-10">
                <h2 className="text-lg sm:text-2xl font-bold mb-5 sm:mb-8 text-white">{bankDetails.accountName}</h2>
                <div className="space-y-4 text-base sm:text-xl">
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between border-b pb-4 border-luxury-gold/20 gap-1 sm:gap-2">
                    <span className="font-bold text-gray-400">رقم الحساب:</span>
                    <span className="font-mono tracking-wider text-luxury-gold text-sm sm:text-base">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between pt-2 gap-1 sm:gap-2">
                    <span className="font-bold text-gray-400">الايبان:</span>
                    <span className="font-mono tracking-wider text-sm sm:text-lg text-luxury-gold break-all">{bankDetails.iban}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Transfer Details Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="bg-luxury-dark border border-luxury-gold/20 rounded-xl p-5 sm:p-8 space-y-4 sm:space-y-6">
                <h3 className="text-xl font-bold text-luxury-gold border-b border-luxury-gold/20 pb-4">بيانات التحويل المرسل</h3>

                <div>
                  <label className="block text-white mb-2">اسم صاحب الحساب *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="مثال: أحمد محمد عبد الله"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">اسم البنك *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderBank}
                    onChange={(e) => setFormData({ ...formData, senderBank: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="مثال: البنك الأهلي، مصرف الإنماء، إلخ"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">رقم الحساب الخاص بك *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderAccount}
                    onChange={(e) => setFormData({ ...formData, senderAccount: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white font-mono text-left focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="رقم الحساب أو الآيبان"
                    dir="ltr"
                  />
                </div>

                <div className="pt-4">
                  <label className="block text-white mb-2">صورة إيصال التحويل *</label>
                  <div
                    className={`border-2 border-dashed ${previewUrl ? 'border-luxury-gold/50' : 'border-gray-600'} rounded-lg p-6 text-center cursor-pointer hover:border-luxury-gold/50 transition-colors bg-luxury-black/50`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                      required={!previewUrl}
                    />

                    {previewUrl ? (
                      <div className="relative w-full aspect-video rounded overflow-hidden">
                        <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-contain bg-black" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold bg-black/80 px-4 py-2 rounded">تغيير الصورة</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-gray-400 font-medium">اضغط هنا لرفع صورة الإيصال</p>
                        <p className="text-gray-500 text-sm mt-2">JPG, PNG, WEBP (الحد الأقصى 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-luxury-gold text-luxury-black font-bold py-4 rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin"></div>
                        جاري الإرسال وتأكيد الطلب...
                      </>
                    ) : (
                      'أرفق البيانات وأتمم الطلب'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
