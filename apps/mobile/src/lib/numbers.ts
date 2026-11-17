// Accepts what a keyboard can actually produce in Arabic / Kurdish: Arabic-Indic
// (U+0660–0669) and Persian (U+06F0–06F9) digits, the Arabic decimal separator
// (٫) and a comma. parseFloat alone returns NaN for all of these.
export function parseLocaleNumber(input: string): number {
  const ascii = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫٬,]/g, '.')
    .trim();
  return parseFloat(ascii);
}
