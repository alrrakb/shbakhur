/**
 * Product Utilities & Customer-Facing Title Formatting
 * For SH BAKHUR (shbakhur.com)
 */

/**
 * Polishes raw product titles by converting internal warehouse codes (e.g. B101, 306, 113)
 * into customer-facing luxury titles: [اسم المنتج] [درجة الفخامة] ([الكود])
 */
export function formatProductDisplayTitle(rawTitle?: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'منتج فاخر';
  }

  const cleaned = rawTitle.trim();
  if (!cleaned) return 'منتج فاخر';

  // 1. Check for specific known warehouse code mappings or regex patterns
  // Pattern matches: trailing code like "B101", "306", "113", "M201", etc.
  const codeRegex = /\s*(?:[-–—_#\s]+)?\b([A-Za-z]\d{2,4}|\d{3,4})\b\s*$/;
  const match = cleaned.match(codeRegex);

  if (match) {
    const code = match[1].toUpperCase();
    const baseTitle = cleaned.slice(0, match.index).trim();

    // Check if the base title needs luxury commercial elevation
    const lower = baseTitle.toLowerCase();

    // Specific commercial enhancements matching brand standards
    if (lower === 'عود مروكي' || lower === 'مروكي') {
      return `عود مروكي ملوكي فاخر (${code})`;
    }

    if (lower === 'كلمنتان' || lower === 'عود كلمنتان') {
      return `عود كلمنتان طبيعي سوبر (${code})`;
    }

    if (lower === 'كمبودي' || lower === 'دهن كمبودي' || lower === 'دهن عود كمبودي') {
      return `دهن عود كمبودي معتق نقي (${code})`;
    }

    if (lower === 'تراد' || lower === 'دهن تراد') {
      return `دهن عود تراد الحطب الصافي (${code})`;
    }

    if (lower === 'براشين' || lower === 'دهن براشين') {
      return `دهن عود براشين سويت فاخر (${code})`;
    }

    // Generic fallback for any title ending with a warehouse code
    // If it doesn't already have luxury qualifiers, we append appropriate nuance
    const hasLuxuryQualifier = /فاخر|ملكي|طبيعي|سوبر|بيور|معتق|ملوكي|أصيل|بلس/i.test(baseTitle);
    
    if (hasLuxuryQualifier) {
      return `${baseTitle} (${code})`;
    }

    return `${baseTitle} الفاخر (${code})`;
  }

  // If title doesn't end with a warehouse code, return cleaned title
  return cleaned;
}
