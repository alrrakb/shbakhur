export interface SaudiCity {
  id: string;
  name: string;
  nameEn: string;
  region: string;
  isPopular?: boolean;
}

export const POPULAR_CITY_NAMES = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الخبر',
  'الأحساء',
  'الطائف',
  'بريدة',
  'تبوك',
  'أبها',
  'خميس مشيط',
] as const;

export const SAUDI_CITIES: SaudiCity[] = [
  // ── المدن الرئيسية والأكثر طلباً ──────────────────────────────────────────
  { id: 'riyadh', name: 'الرياض', nameEn: 'Riyadh', region: 'منطقة الرياض', isPopular: true },
  { id: 'jeddah', name: 'جدة', nameEn: 'Jeddah', region: 'منطقة مكة المكرمة', isPopular: true },
  { id: 'makkah', name: 'مكة المكرمة', nameEn: 'Makkah', region: 'منطقة مكة المكرمة', isPopular: true },
  { id: 'madinah', name: 'المدينة المنورة', nameEn: 'Madinah', region: 'منطقة المدينة المنورة', isPopular: true },
  { id: 'dammam', name: 'الدمام', nameEn: 'Dammam', region: 'المنطقة الشرقية', isPopular: true },
  { id: 'khobar', name: 'الخبر', nameEn: 'Khobar', region: 'المنطقة الشرقية', isPopular: true },
  { id: 'ahsa', name: 'الأحساء (الهفوف والمبرز)', nameEn: 'Al-Ahsa', region: 'المنطقة الشرقية', isPopular: true },
  { id: 'taif', name: 'الطائف', nameEn: 'Taif', region: 'منطقة مكة المكرمة', isPopular: true },
  { id: 'buraidah', name: 'بريدة', nameEn: 'Buraidah', region: 'منطقة القصيم', isPopular: true },
  { id: 'tabuk', name: 'تبوك', nameEn: 'Tabuk', region: 'منطقة تبوك', isPopular: true },
  { id: 'abha', name: 'أبها', nameEn: 'Abha', region: 'منطقة عسير', isPopular: true },
  { id: 'khamis_mushait', name: 'خميس مشيط', nameEn: 'Khamis Mushait', region: 'منطقة عسير', isPopular: true },

  // ── المنطقة الشرقية ───────────────────────────────────────────────────────
  { id: 'dhahran', name: 'الظهران', nameEn: 'Dhahran', region: 'المنطقة الشرقية' },
  { id: 'jubail', name: 'الجبيل', nameEn: 'Jubail', region: 'المنطقة الشرقية' },
  { id: 'qatif', name: 'القطيف', nameEn: 'Qatif', region: 'المنطقة الشرقية' },
  { id: 'hafar_al_batin', name: 'حفر الباطن', nameEn: 'Hafar Al Batin', region: 'المنطقة الشرقية' },
  { id: 'khafji', name: 'الخفجي', nameEn: 'Khafji', region: 'المنطقة الشرقية' },
  { id: 'ras_tanura', name: 'رأس تنورة', nameEn: 'Ras Tanura', region: 'المنطقة الشرقية' },
  { id: 'buqayq', name: 'بقيق', nameEn: 'Buqayq', region: 'المنطقة الشرقية' },
  { id: 'nairyah', name: 'النعيرية', nameEn: 'Al Nairyah', region: 'المنطقة الشرقية' },
  { id: 'saihat', name: 'سيهات', nameEn: 'Saihat', region: 'المنطقة الشرقية' },
  { id: 'tarout', name: 'تاروت', nameEn: 'Tarout', region: 'المنطقة الشرقية' },
  { id: 'safwa', name: 'صفوى', nameEn: 'Safwa', region: 'المنطقة الشرقية' },
  { id: 'anak', name: 'عنك', nameEn: 'Anak', region: 'المنطقة الشرقية' },
  { id: 'qaryat_al_ulya', name: 'قرية العليا', nameEn: 'Qaryat Al Ulya', region: 'المنطقة الشرقية' },

  // ── منطقة الرياض ──────────────────────────────────────────────────────────
  { id: 'kharj', name: 'الخرج', nameEn: 'Al-Kharj', region: 'منطقة الرياض' },
  { id: 'diriyah', name: 'الدرعية', nameEn: 'Diriyah', region: 'منطقة الرياض' },
  { id: 'majmaah', name: 'المجمعة', nameEn: 'Al Majmaah', region: 'منطقة الرياض' },
  { id: 'zulfi', name: 'الزلفي', nameEn: 'Al Zulfi', region: 'منطقة الرياض' },
  { id: 'duwadimi', name: 'الدوادمي', nameEn: 'Al Duwadimi', region: 'منطقة الرياض' },
  { id: 'shaqra', name: 'شقراء', nameEn: 'Shaqra', region: 'منطقة الرياض' },
  { id: 'quwayiyah', name: 'القويعية', nameEn: 'Al Quwayiyah', region: 'منطقة الرياض' },
  { id: 'wadi_dawasir', name: 'وادي الدواسر', nameEn: 'Wadi Ad Dawasir', region: 'منطقة الرياض' },
  { id: 'sulayyil', name: 'السليل', nameEn: 'As Sulayyil', region: 'منطقة الرياض' },
  { id: 'aflaj', name: 'الأفلاج (ليلى)', nameEn: 'Al Aflaj', region: 'منطقة الرياض' },
  { id: 'hawtat_bani_tamim', name: 'حوطة بني تميم', nameEn: 'Hawtat Bani Tamim', region: 'منطقة الرياض' },
  { id: 'hariq', name: 'الحريق', nameEn: 'Al Hariq', region: 'منطقة الرياض' },
  { id: 'muzahmiyah', name: 'المزاحمية', nameEn: 'Al Muzahmiyah', region: 'منطقة الرياض' },
  { id: 'dhurma', name: 'ضرما', nameEn: 'Dhurma', region: 'منطقة الرياض' },
  { id: 'thadiq', name: 'ثادق', nameEn: 'Thadiq', region: 'منطقة الرياض' },
  { id: 'huraymila', name: 'حريملاء', nameEn: 'Huraymila', region: 'منطقة الرياض' },
  { id: 'rumah', name: 'رماح', nameEn: 'Rumah', region: 'منطقة الرياض' },
  { id: 'ghat', name: 'الغاط', nameEn: 'Al Ghat', region: 'منطقة الرياض' },
  { id: 'afif', name: 'عفيف', nameEn: 'Afif', region: 'منطقة الرياض' },

  // ── منطقة مكة المكرمة ─────────────────────────────────────────────────────
  { id: 'yanbu', name: 'ينبع', nameEn: 'Yanbu', region: 'منطقة المدينة المنورة' },
  { id: 'rabigh', name: 'رابغ', nameEn: 'Rabigh', region: 'منطقة مكة المكرمة' },
  { id: 'qunfudhah', name: 'القنفذة', nameEn: 'Al Qunfudhah', region: 'منطقة مكة المكرمة' },
  { id: 'lith', name: 'الليث', nameEn: 'Al Lith', region: 'منطقة مكة المكرمة' },
  { id: 'jumum', name: 'الجموم', nameEn: 'Al Jumum', region: 'منطقة مكة المكرمة' },
  { id: 'khulais', name: 'خليص', nameEn: 'Khulais', region: 'منطقة مكة المكرمة' },
  { id: 'kamil', name: 'الكامل', nameEn: 'Al Kamil', region: 'منطقة مكة المكرمة' },
  { id: 'khurmah', name: 'الخرمة', nameEn: 'Al Khurmah', region: 'منطقة مكة المكرمة' },
  { id: 'ranyah', name: 'رنية', nameEn: 'Ranyah', region: 'منطقة مكة المكرمة' },
  { id: 'turbah', name: 'تربة', nameEn: 'Turbah', region: 'منطقة مكة المكرمة' },
  { id: 'ardiyat', name: 'العرضيات', nameEn: 'Al Ardiyat', region: 'منطقة مكة المكرمة' },
  { id: 'adham', name: 'أضم', nameEn: 'Adham', region: 'منطقة مكة المكرمة' },
  { id: 'maysan', name: 'ميسان', nameEn: 'Maysan', region: 'منطقة مكة المكرمة' },
  { id: 'bahrah', name: 'بحرة', nameEn: 'Bahrah', region: 'منطقة مكة المكرمة' },

  // ── منطقة المدينة المنورة ──────────────────────────────────────────────────
  { id: 'ula', name: 'العلا', nameEn: 'Al Ula', region: 'منطقة المدينة المنورة' },
  { id: 'badr', name: 'بدر', nameEn: 'Badr', region: 'منطقة المدينة المنورة' },
  { id: 'khaybar', name: 'خيبر', nameEn: 'Khaybar', region: 'منطقة المدينة المنورة' },
  { id: 'hinakiyah', name: 'الحناكية', nameEn: 'Al Hinakiyah', region: 'منطقة المدينة المنورة' },
  { id: 'mahd', name: 'المهد', nameEn: 'Al Mahd', region: 'منطقة المدينة المنورة' },
  { id: 'ais', name: 'العيص', nameEn: 'Al Ais', region: 'منطقة المدينة المنورة' },
  { id: 'wadi_fara', name: 'وادي الفرع', nameEn: 'Wadi Al Fara', region: 'منطقة المدينة المنورة' },

  // ── منطقة القصيم ──────────────────────────────────────────────────────────
  { id: 'unaizah', name: 'عنيزة', nameEn: 'Unaizah', region: 'منطقة القصيم' },
  { id: 'rass', name: 'الرس', nameEn: 'Ar Rass', region: 'منطقة القصيم' },
  { id: 'mithnab', name: 'المذنب', nameEn: 'Al Mithnab', region: 'منطقة القصيم' },
  { id: 'bukayriyah', name: 'البكيرية', nameEn: 'Al Bukayriyah', region: 'منطقة القصيم' },
  { id: 'badayea', name: 'البدائع', nameEn: 'Al Badayea', region: 'منطقة القصيم' },
  { id: 'riyadh_khabra', name: 'رياض الخبراء', nameEn: 'Riyadh Al Khabra', region: 'منطقة القصيم' },
  { id: 'uyun_jawa', name: 'عيون الجواء', nameEn: 'Uyun Al Jawa', region: 'منطقة القصيم' },
  { id: 'nabhaniyah', name: 'النبهانية', nameEn: 'Al Nabhaniyah', region: 'منطقة القصيم' },
  { id: 'shamasiyah', name: 'الشماسية', nameEn: 'Ash Shamasiyah', region: 'منطقة القصيم' },

  // ── منطقة عسير ────────────────────────────────────────────────────────────
  { id: 'bisha', name: 'بيشة', nameEn: 'Bisha', region: 'منطقة عسير' },
  { id: 'mahayil', name: 'محايل عسير', nameEn: 'Mahayil Asir', region: 'منطقة عسير' },
  { id: 'namas', name: 'النماص', nameEn: 'Al Namas', region: 'منطقة عسير' },
  { id: 'tanomah', name: 'تنومة', nameEn: 'Tanomah', region: 'منطقة عسير' },
  { id: 'ahad_rafidah', name: 'أحد رفيدة', nameEn: 'Ahad Rafidah', region: 'منطقة عسير' },
  { id: 'sarat_abidah', name: 'سراة عبيدة', nameEn: 'Sarat Abidah', region: 'منطقة عسير' },
  { id: 'dhahran_janub', name: 'ظهران الجنوب', nameEn: 'Dhahran Al Janub', region: 'منطقة عسير' },
  { id: 'majardah', name: 'المجاردة', nameEn: 'Al Majardah', region: 'منطقة عسير' },
  { id: 'bariq', name: 'بارق', nameEn: 'Bariq', region: 'منطقة عسير' },
  { id: 'rijal_almaa', name: 'رجال ألمع', nameEn: 'Rijal Almaa', region: 'منطقة عسير' },
  { id: 'tathlith', name: 'تثليث', nameEn: 'Tathlith', region: 'منطقة عسير' },
  { id: 'balqarn', name: 'بلقرن (سبت العلاية)', nameEn: 'Balqarn', region: 'منطقة عسير' },

  // ── منطقة جازان ───────────────────────────────────────────────────────────
  { id: 'jazan', name: 'جازان', nameEn: 'Jazan', region: 'منطقة جازان' },
  { id: 'sabya', name: 'صبيا', nameEn: 'Sabya', region: 'منطقة جازان' },
  { id: 'abu_arish', name: 'أبو عريش', nameEn: 'Abu Arish', region: 'منطقة جازان' },
  { id: 'samtah', name: 'صامطة', nameEn: 'Samtah', region: 'منطقة جازان' },
  { id: 'baish', name: 'بيش', nameEn: 'Baish', region: 'منطقة جازان' },
  { id: 'darb', name: 'الدرب', nameEn: 'Al Darb', region: 'منطقة جازان' },
  { id: 'farasan', name: 'فرسان', nameEn: 'Farasan', region: 'منطقة جازان' },
  { id: 'eidabi', name: 'العيدابي', nameEn: 'Al Eidabi', region: 'منطقة جازان' },
  { id: 'damad', name: 'ضمد', nameEn: 'Damad', region: 'منطقة جازان' },
  { id: 'dayer', name: 'الدائر بني مالك', nameEn: 'Al Dayer', region: 'منطقة جازان' },
  { id: 'ahad_masarihah', name: 'أحد المسارحة', nameEn: 'Ahad Al Masarihah', region: 'منطقة جازان' },
  { id: 'harth', name: 'الحرث', nameEn: 'Al Harth', region: 'منطقة جازان' },
  { id: 'raysh', name: 'الريث', nameEn: 'Al Rayth', region: 'منطقة جازان' },

  // ── منطقة نجران ───────────────────────────────────────────────────────────
  { id: 'najran', name: 'نجران', nameEn: 'Najran', region: 'منطقة نجران' },
  { id: 'sharurah', name: 'شرورة', nameEn: 'Sharurah', region: 'منطقة نجران' },
  { id: 'habuna', name: 'حبونا', nameEn: 'Habuna', region: 'منطقة نجران' },
  { id: 'yadamah', name: 'يدمه', nameEn: 'Yadamah', region: 'منطقة نجران' },
  { id: 'badr_janub', name: 'بدر الجنوب', nameEn: 'Badr Al Janub', region: 'منطقة نجران' },
  { id: 'thar', name: 'ثار', nameEn: 'Thar', region: 'منطقة نجران' },
  { id: 'khubash', name: 'خباش', nameEn: 'Khubash', region: 'منطقة نجران' },

  // ── منطقة تبوك ────────────────────────────────────────────────────────────
  { id: 'duba', name: 'ضباء', nameEn: 'Duba', region: 'منطقة تبوك' },
  { id: 'wajh', name: 'الوجه', nameEn: 'Al Wajh', region: 'منطقة تبوك' },
  { id: 'umluj', name: 'أملج', nameEn: 'Umluj', region: 'منطقة تبوك' },
  { id: 'haql', name: 'حقل', nameEn: 'Haql', region: 'منطقة تبوك' },
  { id: 'tayma', name: 'تيماء', nameEn: 'Tayma', region: 'منطقة تبوك' },
  { id: 'bada', name: 'البدع', nameEn: 'Al Bada', region: 'منطقة تبوك' },

  // ── منطقة حائل ────────────────────────────────────────────────────────────
  { id: 'hail', name: 'حائل', nameEn: 'Hail', region: 'منطقة حائل' },
  { id: 'baqaa', name: 'بقعاء', nameEn: 'Baqaa', region: 'منطقة حائل' },
  { id: 'ghazalah', name: 'الغزالة', nameEn: 'Al Ghazalah', region: 'منطقة حائل' },
  { id: 'shinan', name: 'الشنان', nameEn: 'Ash Shinan', region: 'منطقة حائل' },
  { id: 'hait', name: 'الحائط', nameEn: 'Al Hait', region: 'منطقة حائل' },
  { id: 'sulaymi', name: 'السليمي', nameEn: 'As Sulaymi', region: 'منطقة حائل' },
  { id: 'mawqaq', name: 'موقق', nameEn: 'Mawqaq', region: 'منطقة حائل' },
  { id: 'shamli', name: 'الشملي', nameEn: 'Ash Shamli', region: 'منطقة حائل' },
  { id: 'sumayra', name: 'سميراء', nameEn: 'Sumayra', region: 'منطقة حائل' },

  // ── منطقة الحدود الشمالية ──────────────────────────────────────────────────
  { id: 'arar', name: 'عرعر', nameEn: 'Arar', region: 'منطقة الحدود الشمالية' },
  { id: 'rafha', name: 'رفحاء', nameEn: 'Rafha', region: 'منطقة الحدود الشمالية' },
  { id: 'turaif', name: 'طريف', nameEn: 'Turaif', region: 'منطقة الحدود الشمالية' },
  { id: 'uwayqilah', name: 'العويقيلة', nameEn: 'Al Uwayqilah', region: 'منطقة الحدود الشمالية' },

  // ── منطقة الجوف ───────────────────────────────────────────────────────────
  { id: 'sakaka', name: 'سكاكا', nameEn: 'Sakaka', region: 'منطقة الجوف' },
  { id: 'qurayyat', name: 'القريات', nameEn: 'Al Qurayyat', region: 'منطقة الجوف' },
  { id: 'dumat_jandal', name: 'دومة الجندل', nameEn: 'Dumat Al Jandal', region: 'منطقة الجوف' },
  { id: 'tabarjal', name: 'طبرجل', nameEn: 'Tabarjal', region: 'منطقة الجوف' },

  // ── منطقة الباحة ──────────────────────────────────────────────────────────
  { id: 'baha', name: 'الباحة', nameEn: 'Al Baha', region: 'منطقة الباحة' },
  { id: 'baljurashi', name: 'بلجرشي', nameEn: 'Baljurashi', region: 'منطقة الباحة' },
  { id: 'mandaq', name: 'المندق', nameEn: 'Al Mandaq', region: 'منطقة الباحة' },
  { id: 'mukhwah', name: 'المخواة', nameEn: 'Al Mukhwah', region: 'منطقة الباحة' },
  { id: 'qilwah', name: 'قلوة', nameEn: 'Qilwah', region: 'منطقة الباحة' },
  { id: 'aqiq', name: 'العقيق', nameEn: 'Al Aqiq', region: 'منطقة الباحة' },
  { id: 'ghamid_zinad', name: 'غامد الزناد', nameEn: 'Ghamid Al Zinad', region: 'منطقة الباحة' },
  { id: 'hijrah', name: 'الحجرة', nameEn: 'Al Hijrah', region: 'منطقة الباحة' },
  { id: 'bani_hasan', name: 'بني حسن', nameEn: 'Bani Hasan', region: 'منطقة الباحة' },
];

/**
 * Normalizes Arabic text for tolerant and smart searching.
 * Removes diacritics, unifies alef, taa marbuta, and yaa forms.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
    .replace(/[أإآآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[-_()]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Filter Saudi cities by query with intelligent Arabic matching
 */
export function filterSaudiCities(query: string): SaudiCity[] {
  const q = normalizeArabic(query);
  if (!q) return SAUDI_CITIES;

  return SAUDI_CITIES.filter(city => {
    const normName = normalizeArabic(city.name);
    const normRegion = normalizeArabic(city.region);
    const normEn = city.nameEn.toLowerCase();
    return (
      normName.includes(q) ||
      normRegion.includes(q) ||
      normEn.includes(q.toLowerCase())
    );
  });
}
