/**
 * Utility functions for formatting database identifiers to human-readable names
 */

// Mapping of database requestor identifiers to human-readable names
const REQUESTOR_NAME_MAP: Record<string, string> = {
  // Common snake_case patterns -> proper names
  'patta_wellang': 'Patta Wellang',
  'yayasan_btn': 'Yayasan BTN',
  'yayasan_bri': 'Yayasan BRI',
  'pak_sandi': 'Pak Sandi',
  'angkasa': 'Angkasa',
  'admin': 'Administrator',

  // Add more mappings as needed
  // Pattern: snake_case identifier -> "Proper Name"
};

// Mapping for fund source identifiers
const FUND_SOURCE_MAP: Record<string, string> = {
  'CASH_YAYASAN': 'Cash Yayasan',
  'BRI_ANGKASA': 'BRI Angkasa',
  'BTN_YAYASAN': 'BTN Yayasan',
  'DANA_SEWA': 'Dana Sewa',
};

/**
 * Convert requestor database identifier to human-readable name
 */
export function formatRequestorName(requestor: string | null | undefined): string {
  if (!requestor) return '';

  // Check for exact match in mapping
  const mapped = REQUESTOR_NAME_MAP[requestor.toLowerCase()];
  if (mapped) return mapped;

  // Check for partial matches (for truncated names like "PATTA_WELL...")
  for (const [key, value] of Object.entries(REQUESTOR_NAME_MAP)) {
    if (requestor.toLowerCase().startsWith(key.toLowerCase()) ||
        key.toLowerCase().startsWith(requestor.toLowerCase())) {
      return value;
    }
  }

  // Fallback: Convert snake_case to Title Case
  return requestor
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert fund source identifier to human-readable name
 */
export function formatFundSource(source: string | null | undefined): string {
  if (!source) return '';

  const mapped = FUND_SOURCE_MAP[source.toUpperCase()];
  if (mapped) return mapped;

  // Fallback: Convert SCREAMING_SNAKE_CASE to Title Case
  return source
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Convert any snake_case or SCREAMING_SNAKE_CASE identifier to human-readable format
 */
export function formatIdentifier(identifier: string | null | undefined): string {
  if (!identifier) return '';

  return identifier
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}