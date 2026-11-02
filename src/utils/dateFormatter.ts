/**
 * Global Date Formatting Utilities for Department Portal
 * Standardizes date presentation throughout the site in strict DD/MM/YYYY format.
 */

/**
 * Converts any date representation (ISO string, YYYY-MM-DD, DD-MM-YYYY, timestamp, Date object)
 * into strict `DD/MM/YYYY` format.
 *
 * Examples:
 * - "2026-11-15" -> "15/11/2026"
 * - "2026-11-15T08:30:00Z" -> "15/11/2026"
 * - "15-11-2026" -> "15/11/2026"
 * - "15/11/2026" -> "15/11/2026"
 * - Date object -> "15/11/2026"
 */
export function formatDateToDDMMYYYY(val: string | number | Date | null | undefined): string {
  if (val === undefined || val === null || val === '') return '';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle numeric timestamp or Excel serial date
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '';
  }

  const str = String(val).trim();
  if (!str) return '';

  // 1. Check for YYYY-MM-DD or YYYY/MM/DD
  const yyyyMmDdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (yyyyMmDdMatch) {
    const yr = yyyyMmDdMatch[1];
    const month = String(parseInt(yyyyMmDdMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(yyyyMmDdMatch[3], 10)).padStart(2, '0');
    return `${day}/${month}/${yr}`;
  }

  // 2. Check for DD-MM-YYYY or DD/MM/YYYY
  const ddMmYyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddMmYyyyMatch) {
    const p1 = parseInt(ddMmYyyyMatch[1], 10);
    const p2 = parseInt(ddMmYyyyMatch[2], 10);
    const yr = ddMmYyyyMatch[3];

    let day = p1;
    let month = p2;
    // Disambiguate if p1 <= 12 and p2 > 12 (MM-DD-YYYY)
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1;
    }
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${yr}`;
  }

  // 3. Fallback: Parse with Date constructor
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Returns today's date in strict DD/MM/YYYY format
 */
export function getTodayDDMMYYYY(): string {
  return formatDateToDDMMYYYY(new Date());
}

/**
 * Formats date and time into DD/MM/YYYY, hh:mm AM/PM format
 */
export function formatDateTimeToDDMMYYYY(val: string | number | Date | null | undefined): string {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return String(val);

  const datePart = formatDateToDDMMYYYY(d);
  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
