/**
 * Centralized number formatting utilities using European format (X.XXX,XX)
 * All functions use es-ES locale for consistent dot/comma separators.
 */

const EUR_FORMATTER = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

/**
 * Format a value as EUR currency: "1.008,00 €"
 * Uses Intl.NumberFormat with es-ES locale.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "€0,00";
  return EUR_FORMATTER.format(value);
}

/**
 * Format a number without currency symbol: "1.008,00"
 * Configurable fraction digits.
 */
export function formatNumber(
  value: number | null | undefined,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: "always",
  }).format(value);
}

/**
 * Format a volume value with m³ suffix: "1,234 m³"
 */
export function formatVolume(
  value: number | null | undefined,
  fractionDigits = 2
): string {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: "always",
  }).format(value)} m³`;
}

/**
 * Format a percentage value: "12%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "0%";
  return `${value}%`;
}

/**
 * Format an integer count with thousands separator: "1.234"
 */
export function formatCount(value: number | null | undefined): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: "always",
  }).format(value);
}
