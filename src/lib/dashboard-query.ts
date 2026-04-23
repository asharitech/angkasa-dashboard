/**
 * Build dashboard URLs with stable query-string ordering for filter tabs.
 */

export function buildDashboardHref(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null || raw === "") continue;
    qs.set(key, String(raw));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}
