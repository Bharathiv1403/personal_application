/**
 * Format a number into standard Indian Currency (INR) string.
 * Example: 200000 -> "₹2,00,000"
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

/**
 * Format large amounts into human-readable Lakhs / Crores string.
 * Example: 200000 -> "₹2.0 L", 15000000 -> "₹1.5 Cr"
 */
export function formatLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return formatINR(amount);
}
