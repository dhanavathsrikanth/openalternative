/** Compact number format for stat pills (e.g. 12.3k). */
export function formatStatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}
