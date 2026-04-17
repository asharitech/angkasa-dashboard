import { FilterTabs, type FilterTab } from "@/components/filter-bar";
import { monthLabel, recentMonths } from "@/lib/periods";

/**
 * Server-rendered period picker. Generates "Semua" + N most recent months
 * including the current WITA month, linking to the same path with ?period=YYYY-MM.
 */
export function PeriodPicker({
  basePath,
  current,
  months = 4,
  extraParams = {},
}: {
  basePath: string;
  current?: string;
  months?: number;
  extraParams?: Record<string, string>;
}) {
  const periods = recentMonths(months);

  function hrefFor(period?: string) {
    const qs = new URLSearchParams(extraParams);
    if (period) qs.set("period", period);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  }

  const tabs: FilterTab[] = [
    { label: "Semua", href: hrefFor(undefined), active: !current },
    ...periods.map((p) => ({
      label: monthLabel(p),
      href: hrefFor(p),
      active: p === current,
    })),
  ];

  return <FilterTabs tabs={tabs} size="sm" />;
}
