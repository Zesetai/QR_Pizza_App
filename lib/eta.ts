export function calcETA({
  ordersAhead,
  ovens,
  avgMinutes,
  bulkCount = 1,
  pauseFactor = 1
}: {
  ordersAhead: number;
  ovens: number;
  avgMinutes: number;
  bulkCount?: number;
  pauseFactor?: number;
}) {
  const units = Math.max(1, Math.ceil(ordersAhead / Math.max(1, ovens)));
  const bulkMinutes = bulkCount > 1 ? (bulkCount - 1) * avgMinutes : 0;
  return Math.ceil((units * avgMinutes + bulkMinutes) * pauseFactor);
}
