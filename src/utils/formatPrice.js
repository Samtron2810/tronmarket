// FIX #11: was using $ and cents — corrected to ₦ Naira and kobo
export function formatPrice(kobo) {
  if (kobo == null) return "";
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default formatPrice;
