'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ImportConflict } from '@/lib/import-utils';

interface ImportConflictModalProps {
  conflict: ImportConflict;
  currentIndex: number;
  totalConflicts: number;
  onOverwrite: () => void;
  onSkip: () => void;
  onCancel: () => void;
  onOverwriteAll: () => void;
  onSkipAll: () => void;
}

export function ImportConflictModal({
  conflict,
  currentIndex,
  totalConflicts,
  onOverwrite,
  onSkip,
  onCancel,
  onOverwriteAll,
  onSkipAll,
}: ImportConflictModalProps) {
  const { importProduct, existingProduct, differences } = conflict;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a1a] border border-luxury-gold/30 rounded-sm p-6 max-w-2xl w-full z-[10000] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">تعارض في الاستيراد</h3>
            <span className="px-3 py-1 bg-luxury-gold/20 text-luxury-gold rounded-sm text-sm font-medium">
              {currentIndex + 1} من {totalConflicts}
            </span>
          </div>

          {/* Product Info */}
          <div className="bg-luxury-black rounded-sm p-4 mb-6 border border-luxury-gold/20">
            <h4 className="text-lg font-semibold text-white mb-2">{importProduct.title}</h4>
            <p className="text-gray-400 text-sm">
              SKU الحالي: <span className="text-luxury-gold">{existingProduct.sku || 'غير محدد'}</span>
            </p>
          </div>

          {/* Differences */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-400 mb-3">الاختلافات المكتشفة:</h5>
            {differences.length > 0 ? (
              <div className="space-y-2">
                {differences.map((diff, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-300 bg-luxury-black/50 p-2 rounded-sm"
                  >
                    <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{diff}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-400 bg-green-500/10 p-3 rounded-sm">
                ✅ جميع الحقول متطابقة - لا يوجد اختلافات
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Overwrite Option */}
            <button
              onClick={onOverwrite}
              className="group p-4 bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm hover:bg-luxury-gold/20 transition-all text-right"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-luxury-gold/20 rounded-full flex items-center justify-center group-hover:bg-luxury-gold/30 transition-colors">
                  <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="font-bold text-white">المزامنة (Overwrite)</span>
              </div>
              <p className="text-xs text-gray-400">
                {differences.length > 0
                  ? 'تحديث قاعدة البيانات بالقيم الجديدة من الملف'
                  : 'تخطي - لا توجد تغييرات مطلوبة'}
              </p>
            </button>

            {/* Skip Option */}
            <button
              onClick={onSkip}
              className="group p-4 bg-gray-800/50 border border-gray-600/30 rounded-sm hover:bg-gray-800 transition-all text-right"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="font-bold text-gray-300">تخطي (Cancel)</span>
              </div>
              <p className="text-xs text-gray-500">الاحتفاظ بالبيانات الحالية في قاعدة البيانات</p>
            </button>
          </div>

          {/* Bulk Actions - Skip All / Overwrite All */}
          {totalConflicts > 1 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4 pt-4 border-t border-luxury-gold/10">
              <button
                onClick={onOverwriteAll}
                className="flex-1 px-4 py-3 bg-luxury-gold/20 border border-luxury-gold/40 rounded-sm text-luxury-gold font-medium hover:bg-luxury-gold/30 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                الكل للمزامنة ({totalConflicts - currentIndex})
              </button>
              <button
                onClick={onSkipAll}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-sm text-gray-300 font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                تخطي الكل ({totalConflicts - currentIndex})
              </button>
            </div>
          )}

          {/* Cancel All */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              إلغاء الاستيراد بالكامل
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
