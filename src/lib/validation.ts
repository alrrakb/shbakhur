// ── Validation and Anti-Spam Heuristics for Checkout ────────────────────────

const ARABIC_AND_ENGLISH_REGEX = /^[؀-ۿa-zA-Z\s]+$/;
const TEXT_WITH_NUMBERS_REGEX = /^[؀-ۿa-zA-Z0-9\s\-_.,#/()]+$/;
const SAUDI_PHONE_REGEX = /^05\d{8}$/;

// Common gibberish / spam words to reject
const BANNED_KEYWORDS = [
  'asdf',
  'qwer',
  'zxcv',
  'hjkl',
  'test',
  'fake',
  'dummy',
  'null',
  'undefined',
  'تجربة',
  'تجربه',
  'تست',
  'وهمي',
  'مجهول',
  'لا يوجد',
  'غير معروف',
  'فلان',
  'العميل',
];

// Obvious dummy phone patterns
const DUMMY_PHONES = new Set([
  '0500000000',
  '0511111111',
  '0522222222',
  '0533333333',
  '0544444444',
  '0555555555',
  '0566666666',
  '0577777777',
  '0588888888',
  '0599999999',
  '0512345678',
  '0501234567',
  '0523456789',
  '0534567890',
  '0545678901',
  '0598765432',
  '0587654321',
  '0576543210',
  '0505050505',
  '0512121212',
  '0500000001',
  '0512312312',
  '0599999990',
]);

/**
 * Checks if a string contains 3 or more consecutively repeated characters (e.g. "aaaa", "محمددددد")
 */
function hasExcessiveRepetition(text: string, maxRepeat = 3): boolean {
  const regex = new RegExp(`([^\\s\\d])\\1{${maxRepeat},}`);
  return regex.test(text);
}

/**
 * Checks if a string contains any of the known spam/test keywords
 */
function containsSpamKeyword(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return BANNED_KEYWORDS.some(kw => lower === kw || lower.includes(kw));
}

/**
 * Validates Full Customer Name (requires first and last name, real characters, no spam)
 */
export function validateName(name: string): string {
  const val = name.trim();
  if (!val) return 'الاسم الكامل مطلوب';
  if (val.length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
  if (val.length > 60) return 'الاسم يجب ألا يتجاوز 60 حرفاً';

  if (!ARABIC_AND_ENGLISH_REGEX.test(val)) {
    return 'الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط (بدون أرقام أو رموز)';
  }

  if (hasExcessiveRepetition(val, 2)) {
    return 'يرجى إدخال اسم حقيقي بدون تكرار عشوائي للأحرف';
  }

  if (containsSpamKeyword(val)) {
    return 'يرجى إدخال اسم حقيقي وصحيح';
  }

  const parts = val.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'يرجى إدخال الاسم ثنائياً على الأقل (الاسم الأول واسم العائلة)';
  }

  for (const part of parts) {
    if (part.length < 2) {
      return 'كل مقطع في الاسم يجب ألا يقل عن حرفين';
    }
  }

  return '';
}

/**
 * Validates Saudi Mobile Number (05XXXXXXXX) with anti-fake heuristics
 */
export function validateSaudiPhone(
  phone: string,
  isRequired = true,
  primaryPhone?: string
): string {
  const val = phone.trim().replace(/[^\d]/g, '');

  if (!val) {
    return isRequired ? 'رقم الجوال مطلوب' : '';
  }

  if (!val.startsWith('05')) {
    return 'رقم الجوال يجب أن يبدأ بـ 05 (مثال: 05XXXXXXXX)';
  }

  if (val.length !== 10) {
    return 'رقم الجوال يجب أن يتكون من 10 أرقام بالضبط';
  }

  if (!SAUDI_PHONE_REGEX.test(val)) {
    return 'صيغة رقم الجوال غير صحيحة';
  }

  if (DUMMY_PHONES.has(val)) {
    return 'يرجى إدخال رقم جوال حقيقي وصحيح';
  }

  // Check for 5 or more repeated identical digits (e.g. 0511111234)
  if (/(\d)\1{4,}/.test(val)) {
    return 'رقم الجوال يحتوي على تكرار غير صالح للأرقام';
  }

  if (primaryPhone && val === primaryPhone.trim().replace(/[^\d]/g, '')) {
    return 'رقم الجوال الإضافي يجب أن يكون مختلفاً عن رقم الجوال الأساسي';
  }

  return '';
}

/**
 * Validates Selected City
 */
export function validateCity(city: string): string {
  const val = city.trim();
  if (!val) return 'يرجى اختيار المدينة';
  if (val.length < 2) return 'اسم المدينة غير صحيح';
  if (val.length > 50) return 'اسم المدينة طويل جداً';
  return '';
}

/**
 * Validates District / Neighborhood
 */
export function validateDistrict(district: string): string {
  const val = district.trim();
  if (!val) return 'اسم الحي مطلوب';
  if (val.length < 2) return 'اسم الحي يجب أن يكون حرفين على الأقل';
  if (val.length > 60) return 'اسم الحي يجب ألا يتجاوز 60 حرفاً';

  if (!TEXT_WITH_NUMBERS_REGEX.test(val)) {
    return 'اسم الحي يجب ألا يحتوي على رموز خاصة غير صالحة';
  }

  if (hasExcessiveRepetition(val, 2)) {
    return 'يرجى إدخال اسم حي صحيح بدون تكرار عشوائي للأحرف';
  }

  if (containsSpamKeyword(val)) {
    return 'يرجى إدخال اسم حي حقيقي وصحيح';
  }

  return '';
}

/**
 * Validates Street Address (Optional)
 */
export function validateStreet(street: string): string {
  const val = street.trim();
  if (!val) return '';
  if (val.length > 100) return 'اسم الشارع يجب ألا يتجاوز 100 حرف';
  if (hasExcessiveRepetition(val, 3)) {
    return 'يرجى إدخال اسم شارع صحيح';
  }
  return '';
}

/**
 * Validates Detailed Address / House Number
 */
export function validateAddressDetails(address: string): string {
  const val = address.trim();
  if (!val) return 'تفاصيل العنوان ورقم المنزل / الشقة مطلوبة';
  if (val.length < 3) return 'يرجى إدخال تفاصيل العنوان بشكل أوضح (3 أحرف على الأقل)';
  if (val.length > 200) return 'تفاصيل العنوان يجب ألا تتجاوز 200 حرف';

  if (hasExcessiveRepetition(val, 3)) {
    return 'يرجى إدخال عنوان حقيقي ومفهوم';
  }

  if (containsSpamKeyword(val)) {
    return 'يرجى إدخال تفاصيل عنوان صحيحة';
  }

  // Reject strings that are only symbols or dots
  if (/^[\W_]+$/.test(val)) {
    return 'يرجى كتابة عنوان مفهوم بدلاً من الرموز';
  }

  return '';
}

/**
 * Validates Order Notes (Optional)
 */
export function validateNotes(notes: string): string {
  const val = notes.trim();
  if (!val) return '';
  if (val.length > 500) return 'الملاحظات يجب ألا تتجاوز 500 حرف';
  return '';
}
