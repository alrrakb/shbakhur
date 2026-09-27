'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SAUDI_CITIES, POPULAR_CITY_NAMES, filterSaudiCities, SaudiCity } from '@/lib/saudi-cities';

interface CityComboboxProps {
  value: string;
  onChange: (cityName: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
}

export default function CityCombobox({
  value,
  onChange,
  onBlur,
  error,
  touched,
}: CityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredCities = useMemo(() => {
    return filterSaudiCities(searchQuery);
  }, [searchQuery]);

  const handleSelectCity = (cityName: string) => {
    onChange(cityName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Determine border and highlight state
  const isInvalid = touched && !!error;
  const isValid = touched && !error && !!value;

  const triggerBorderClass = isInvalid
    ? 'border-red-500/80 bg-red-950/10 focus:border-red-400'
    : isValid
    ? 'border-emerald-500/60 bg-emerald-950/10 focus:border-emerald-400'
    : 'border-luxury-gold/30 hover:border-luxury-gold/60 focus:border-luxury-gold';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ── Main Trigger Button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-luxury-black border rounded-lg text-right text-white transition-all duration-200 outline-none select-none ${triggerBorderClass}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-luxury-gold flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          {value ? (
            <span className="font-medium text-white truncate">{value}</span>
          ) : (
            <span className="text-gray-400 text-sm truncate">اختر مدينتك أو ابحث عنها...</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => e.key === 'Enter' && handleClear(e as any)}
              className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="إلغاء التحديد"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-luxury-gold' : ''}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>

      {/* ── Dropdown Popover ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-gradient-to-b from-[#161616] to-[#0f0f0f] border border-luxury-gold/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
          >
            {/* 1. Search Bar */}
            <div className="p-3 border-b border-luxury-gold/15 bg-luxury-black/60">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن المدينة (مثال: الرياض، جدة، تبوك...)"
                  className="w-full bg-[#1e1e1e] border border-luxury-gold/30 rounded-lg pr-9 pl-8 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-luxury-gold transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-gold/70 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-full transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* 2. Popular Cities Quick Chips */}
              {!searchQuery && (
                <div className="mt-2.5">
                  <p className="text-[11px] font-medium text-luxury-gold/80 mb-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3 text-luxury-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    المدن الأكثر طلباً:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                    {POPULAR_CITY_NAMES.map(popName => (
                      <button
                        key={popName}
                        type="button"
                        onClick={() => handleSelectCity(popName)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                          value === popName
                            ? 'bg-luxury-gold text-black font-semibold border-luxury-gold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-luxury-gold/20 hover:text-white hover:border-luxury-gold/50'
                        }`}
                      >
                        {popName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Filtered City List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {filteredCities.length > 0 ? (
                filteredCities.map(city => {
                  const isSelected = value === city.name;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city.name)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-right transition-colors ${
                        isSelected
                          ? 'bg-luxury-gold/15 text-luxury-gold font-semibold'
                          : 'text-gray-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{city.name}</span>
                        {city.isPopular && (
                          <span className="text-[10px] bg-luxury-gold/20 text-luxury-gold px-1.5 py-0.5 rounded border border-luxury-gold/30">
                            رئيسية
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{city.region}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">لم نجد مدينة مطابقة لـ &quot;{searchQuery}&quot;</p>
                  {searchQuery.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => handleSelectCity(searchQuery.trim())}
                      className="inline-flex items-center gap-1.5 text-xs bg-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold hover:text-black px-3 py-1.5 rounded-lg border border-luxury-gold/40 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      استخدام &quot;{searchQuery.trim()}&quot; كمدينة مخصصة
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
