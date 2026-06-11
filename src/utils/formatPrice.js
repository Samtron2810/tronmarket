export function formatPrice(cents) {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

export default formatPrice;
