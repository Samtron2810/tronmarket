// FIX #11: was using $ and cents — corrected to ₦ Naira and kobo
export function formatPrice(naira) {
  if (naira == null) return "";
  return `₦${Number(naira).toLocaleString("en-NG")}`;
}

export default formatPrice;
