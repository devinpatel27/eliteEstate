import { getLast12Months } from './reports.filters';

export function buildMonthlyTrend(dates: unknown[], template = getLast12Months()) {
  const counts = new Map<string, number>();
  for (const value of dates) {
    if (!(typeof value === 'string' || value instanceof Date)) continue;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) continue;
    // Match the UTC year/month semantics of the original date aggregation.
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return template.map(item => ({ ...item, count: counts.get(`${item.year}-${item.month}`) || 0 }));
}
