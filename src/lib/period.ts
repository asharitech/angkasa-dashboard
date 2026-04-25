const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]

/** Formats a "YYYY-MM" period code to "Apr 2026". Returns the year alone if no month part. */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-")
  if (!month || isNaN(parseInt(month))) return year
  const monthName = MONTHS[parseInt(month) - 1]
  if (!monthName) return period
  return `${monthName} ${year}`
}
