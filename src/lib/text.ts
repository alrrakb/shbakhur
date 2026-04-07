/**
 * Text utility helpers for SH Bakhoor
 */

/**
 * Strips HTML tags from a rich-text string and returns clean plain text.
 *
 * Strategy (two-pass):
 *  1. Decode common HTML entities (&amp; &lt; &gt; &nbsp; etc.)
 *  2. Remove all remaining HTML tags via regex
 *  3. Collapse whitespace / newlines into a single space
 *
 * This is intentionally dependency-free (no DOMParser, no external lib)
 * so it works safely in both Server Components and Client Components.
 *
 * @param html - Raw HTML string, e.g. "<p><strong>Oud</strong> from Arabia</p>"
 * @param maxLength - Optional character limit AFTER stripping (0 = unlimited)
 * @returns Plain text string
 *
 * @example
 *   stripHtml('<p><strong>عود</strong> طبيعي &amp; فاخر</p>')
 *   // → 'عود طبيعي & فاخر'
 */
export function stripHtml(html: string | null | undefined, maxLength = 0): string {
  if (!html) return '';

  const decoded = html
    // Common HTML entities first
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    // Numeric entities (decimal and hex)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Replace block-level tags with a space so words don't run together
  const noTags = decoded
    .replace(/<(br|hr|p|div|li|tr|td|th|h[1-6]|blockquote|pre)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/gm, '') // strip remaining tags
    .replace(/\s+/g, ' ')     // collapse whitespace
    .trim();

  if (maxLength > 0 && noTags.length > maxLength) {
    return noTags.slice(0, maxLength).trimEnd() + '…';
  }

  return noTags;
}
