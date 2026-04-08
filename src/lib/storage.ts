/**
 * Storage utility helpers for SH Bakhoor
 * Handles filename sanitization for Supabase Storage compatibility
 */

/**
 * Sanitizes a filename for Supabase Storage compatibility.
 * 
 * Supabase Storage (and S3-compatible storage) requires ASCII-only keys.
 * This function:
 * 1. Removes Arabic and all non-ASCII characters
 * 2. Replaces spaces with hyphens
 * 3. Keeps only alphanumeric, dots, and hyphens
 * 4. Adds unique timestamp prefix to prevent overwrites
 * 5. Preserves original file extension
 * 
 * @param fileName - Original filename (may contain Arabic/special chars)
 * @param prefix - Optional folder prefix (e.g., 'featured', 'gallery')
 * @returns Storage-safe filename with path
 * 
 * @example
 *   sanitizeFilename('إعلان-رغد-بالعربية.png', 'featured')
 *   // → 'featured/1744143721000-1892834563.png'
 */
export function sanitizeFilename(fileName: string, prefix?: string): string {
  // Clean the filename first - remove any path components (security)
  const cleanFileName = fileName.replace(/.*[\\/]/, '');
  
  // Extract extension (preserve the last dot and extension)
  const lastDotIndex = cleanFileName.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? cleanFileName.slice(lastDotIndex).toLowerCase() : '';
  const baseName = lastDotIndex > 0 ? cleanFileName.slice(0, lastDotIndex) : cleanFileName;

  // Generate unique suffix (timestamp + random component)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // Sanitize base name:
  // 1. Remove all non-ASCII characters (Arabic, emoji, special chars)
  // 2. Keep only a-z, A-Z, 0-9, spaces, and hyphens temporarily
  let sanitized = baseName
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII (Arabic, etc.)
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // If sanitized name is empty (file was all Arabic), use generic name
  if (!sanitized) {
    sanitized = 'image';
  }

  // Build final path - always include sanitized name for clarity
  const finalName = prefix 
    ? `${prefix}/${uniqueSuffix}-${sanitized}${extension}`
    : `${uniqueSuffix}-${sanitized}${extension}`;

  return finalName;
}

/**
 * Alternative: Generate a completely random filename (no original name preserved)
 * Use this when you don't need to preserve any part of original filename
 */
export function generateRandomFilename(extension: string, prefix?: string): string {
  const cleanExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return prefix 
    ? `${prefix}/${uniqueId}${cleanExt}`
    : `${uniqueId}${cleanExt}`;
}

/**
 * Validates if a filename is storage-safe
 */
export function isStorageSafe(fileName: string): boolean {
  // Check if contains only ASCII characters and allowed symbols
  return /^[\x00-\x7F]*$/.test(fileName) && 
         /^[a-zA-Z0-9._-]+$/.test(fileName.split('/').pop() || '');
}
