'use client';

import { useState } from 'react';

interface Props {
  onRefresh: () => void | Promise<void>;
  loading?: boolean;
}

export default function DashboardRefreshButton({ onRefresh, loading = false }: Props) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning || loading) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      // Keep spin visible for at least 600ms so the user sees it
      setTimeout(() => setSpinning(false), 600);
    }
  };

  const isActive = spinning || loading;

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      title="تحديث البيانات"
      className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-luxury-gold/20 text-gray-400 hover:text-luxury-gold hover:border-luxury-gold/50 hover:bg-luxury-gold/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      <svg
        className={`w-4 h-4 flex-shrink-0 ${isActive ? 'animate-spin' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="hidden sm:inline">{isActive ? 'جاري التحديث...' : 'تحديث'}</span>
    </button>
  );
}
