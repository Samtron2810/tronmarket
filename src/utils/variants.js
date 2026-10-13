// ─── Product variant helpers (shared by buyer, seller and admin UI) ─────────
// A variant is a ProductVariant document: { _id, attributes: [{name, value}],
// price, stock, image, isActive, sku }. The parent product carries the
// option definitions: options: [{ name, values: [] }].

export function activeVariants(product) {
  return (product?.variants || []).filter((v) => v.isActive !== false);
}

export function variantLabel(variant) {
  if (!variant) return "";
  if (typeof variant === "string") return variant;
  return (variant.attributes || []).map((a) => a.value).join(" / ");
}

export function attributeKey(attributes = []) {
  return attributes
    .map(
      (a) =>
        `${String(a.name).trim().toLowerCase()}=${String(a.value).trim().toLowerCase()}`,
    )
    .sort()
    .join("|");
}

// Find the active variant matching a { optionName: value } selection.
// Returns null until every option has a chosen value that matches.
export function findVariant(product, selection = {}) {
  const options = product?.options || [];
  if (!product?.hasVariants || options.length === 0) return null;
  if (options.some((o) => !selection[o.name])) return null;
  const wanted = attributeKey(
    options.map((o) => ({ name: o.name, value: selection[o.name] })),
  );
  return (
    activeVariants(product).find(
      (v) => attributeKey(v.attributes) === wanted,
    ) || null
  );
}

export function isSelectionComplete(product, selection = {}) {
  if (!product?.hasVariants) return true;
  return (product.options || []).every((o) => selection[o.name]);
}

// { min, max } across active variants, or null when no variants.
export function variantPriceRange(product) {
  const prices = activeVariants(product).map((v) => Number(v.price));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// "From ₦X" when variants span prices, plain price otherwise.
export function displayPrice(product) {
  const range = product?.hasVariants ? variantPriceRange(product) : null;
  if (range && range.max > range.min) {
    return { label: `From ₦${range.min.toLocaleString()}`, range };
  }
  const price = range ? range.min : product?.price;
  return { label: `₦${Number(price || 0).toLocaleString()}`, range };
}

// Short browse hint, e.g. "S–XXL · 4 colours" / "3 sizes".
export function variantHint(product) {
  if (!product?.hasVariants) return "";
  const parts = (product.options || []).map((o) => {
    const name = o.name.toLowerCase();
    return `${o.values.length} ${name}${o.values.length === 1 ? "" : "s"}`;
  });
  return parts.join(" · ");
}

// Colour name → swatch hex (fallback: neutral with initial letter).
const COLOUR_HEX = {
  black: "#111827",
  white: "#FFFFFF",
  red: "#DC2626",
  blue: "#2563EB",
  navy: "#1E3A5F",
  green: "#047857",
  yellow: "#F59E0B",
  gold: "#D97706",
  orange: "#EA580C",
  pink: "#EC4899",
  purple: "#7C3AED",
  brown: "#92400E",
  grey: "#6B7280",
  gray: "#6B7280",
  silver: "#C0C4CC",
  beige: "#D6C7A8",
  cream: "#F5EFE0",
  teal: "#0F766E",
};

export function colourHex(value) {
  return COLOUR_HEX[String(value || "").trim().toLowerCase()] || null;
}

export function isColourOption(optionName) {
  const n = String(optionName || "").toLowerCase();
  return n.includes("colour") || n.includes("color");
}

// Cartesian product of option definitions → variant rows. Existing rows are
// preserved (matched by attribute combination) so regenerating after an
// option tweak never wipes prices/stock the seller already typed.
export function generateVariantRows(options = [], existing = [], basePrice = 0) {
  const clean = options
    .map((o) => ({
      name: o.name.trim(),
      values: o.values.map((v) => String(v).trim()).filter(Boolean),
    }))
    .filter((o) => o.name && o.values.length > 0);
  if (clean.length === 0) return [];

  let combos = [[]];
  for (const opt of clean) {
    const next = [];
    for (const combo of combos) {
      for (const value of opt.values) {
        next.push([...combo, { name: opt.name, value }]);
      }
    }
    combos = next;
  }

  const byKey = new Map(
    existing.map((v) => [attributeKey(v.attributes), v]),
  );
  return combos.map((attributes) => {
    const prev = byKey.get(attributeKey(attributes));
    return prev
      ? { ...prev, attributes }
      : {
          attributes,
          price: Number(basePrice) || 0,
          stock: 0,
          sku: "",
          image: "",
          isActive: true,
        };
  });
}

// Category → option presets for the seller/admin variant editor.
export const CATEGORY_VARIANT_PRESETS = {
  fashion: [
    { name: "Size", values: ["S", "M", "L", "XL", "XXL"] },
    { name: "Colour", values: ["Black", "White", "Red", "Blue"] },
  ],
  phones: [
    { name: "Storage", values: ["128GB", "256GB", "512GB"] },
    { name: "Colour", values: ["Black", "White", "Blue"] },
  ],
  laptops: [
    { name: "Configuration", values: ["8GB/256GB", "16GB/512GB", "16GB/1TB"] },
    { name: "Colour", values: ["Silver", "Grey", "Black"] },
  ],
  electronics: [{ name: "Colour", values: ["Black", "White"] }],
  home: [
    { name: "Colour", values: ["White", "Grey", "Brown"] },
    { name: "Size", values: ["Small", "Medium", "Large"] },
  ],
};
