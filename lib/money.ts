export function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
