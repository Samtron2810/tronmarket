import { useEffect, useState } from "react";
import {
  CATEGORY_VARIANT_PRESETS,
  generateVariantRows,
  variantLabel,
} from "../utils/variants";

const MAX_OPTIONS = 3;
const MAX_VARIANTS = 100;

const smallInput =
  "w-full px-2.5 py-1.5 rounded-lg border border-emerald-100 bg-emerald-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500";

// Seller/admin editor for product variants. Controlled component:
//   value = { hasVariants, options: [{name, values[]}], variants: [...] }
//   onChange(nextValue)
// Options are edited as rows of (name, comma-separated values), then
// "Generate variants" builds one purchasable row per combination —
// regenerating preserves prices/stock already typed (see utils/variants).
export default function VariantEditor({ category, basePrice, value, onChange }) {
  const { hasVariants = false, options = [], variants = [] } = value || {};
  const [optRows, setOptRows] = useState(() =>
    options.length > 0
      ? options.map((o) => ({ name: o.name, valuesText: o.values.join(", ") }))
      : [{ name: "", valuesText: "" }],
  );
  const [warn, setWarn] = useState("");

  // Edit forms load the product asynchronously — adopt its options when
  // they arrive if the seller hasn't started typing any yet.
  useEffect(() => {
    if (options.length > 0 && optRows.every((r) => !r.name.trim())) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptRows(
        options.map((o) => ({ name: o.name, valuesText: o.values.join(", ") })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const parseRows = (rows) =>
    rows
      .map((r) => ({
        name: r.name.trim(),
        values: r.valuesText
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((o) => o.name && o.values.length > 0);

  const pushRows = (rows) => {
    setOptRows(rows);
    onChange({ ...value, hasVariants: true, options: parseRows(rows) });
  };

  const handleToggle = (enabled) => {
    if (!enabled) {
      onChange({ ...value, hasVariants: false });
      return;
    }
    // Prefill the category preset the first time variants are switched on.
    if (options.length === 0 && CATEGORY_VARIANT_PRESETS[category]) {
      const preset = CATEGORY_VARIANT_PRESETS[category];
      setOptRows(
        preset.map((o) => ({ name: o.name, valuesText: o.values.join(", ") })),
      );
      onChange({ ...value, hasVariants: true, options: preset, variants: [] });
      return;
    }
    onChange({ ...value, hasVariants: true });
  };

  const handleGenerate = () => {
    const parsed = parseRows(optRows);
    if (parsed.length === 0) {
      setWarn("Add at least one option with values first.");
      return;
    }
    const count = parsed.reduce((a, o) => a * o.values.length, 1);
    if (count > MAX_VARIANTS) {
      setWarn(
        `That makes ${count} combinations — the limit is ${MAX_VARIANTS}. Remove some values.`,
      );
      return;
    }
    setWarn("");
    onChange({
      ...value,
      hasVariants: true,
      options: parsed,
      variants: generateVariantRows(parsed, variants, basePrice),
    });
  };

  const updateVariant = (idx, patch) => {
    const next = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    onChange({ ...value, hasVariants: true, variants: next });
  };

  const applyFirstRowToAll = () => {
    if (variants.length < 2) return;
    const { price, stock } = variants[0];
    onChange({
      ...value,
      hasVariants: true,
      variants: variants.map((v) => ({ ...v, price, stock })),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-4 bg-white">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span>
          <span className="text-sm font-bold text-gray-900 block">
            This product has variants
          </span>
          <span className="text-xs text-gray-500">
            Sizes, colours, storage, etc. — each combination gets its own
            price and stock.
          </span>
        </span>
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-5 h-5 accent-emerald-700 shrink-0"
        />
      </label>

      {hasVariants && (
        <>
          {/* Option definitions */}
          <div className="space-y-2">
            {optRows.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  placeholder="Option (e.g. Size)"
                  value={row.name}
                  onChange={(e) => {
                    const next = optRows.map((r, i) =>
                      i === idx ? { ...r, name: e.target.value } : r,
                    );
                    pushRows(next);
                  }}
                  className={`${smallInput} basis-1/3`}
                />
                <input
                  placeholder="Values, comma separated (S, M, L)"
                  value={row.valuesText}
                  onChange={(e) => {
                    const next = optRows.map((r, i) =>
                      i === idx ? { ...r, valuesText: e.target.value } : r,
                    );
                    pushRows(next);
                  }}
                  className={`${smallInput} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => pushRows(optRows.filter((_, i) => i !== idx))}
                  className="px-2 text-gray-400 hover:text-red-600 text-sm font-bold"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 flex-wrap">
              {optRows.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() =>
                    pushRows([...optRows, { name: "", valuesText: "" }])
                  }
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Add option
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 active:scale-95 transition"
              >
                Generate variants
              </button>
              <span className="text-[11px] text-gray-400">
                Max {MAX_OPTIONS} options · {MAX_VARIANTS} combinations
              </span>
            </div>
            {warn && <p className="text-xs font-semibold text-red-600">{warn}</p>}
          </div>

          {/* Variant rows */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {variants.length} variant{variants.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={applyFirstRowToAll}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Apply first row's price/stock to all
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                      v.isActive === false
                        ? "border-gray-100 bg-gray-50 opacity-60"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-800 min-w-24 shrink-0">
                      {variantLabel(v) || "—"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Price ₦"
                      value={v.price ?? ""}
                      onChange={(e) =>
                        updateVariant(idx, { price: Number(e.target.value) })
                      }
                      className={`${smallInput} w-24`}
                      aria-label="Variant price"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={v.stock ?? 0}
                      onChange={(e) =>
                        updateVariant(idx, { stock: Number(e.target.value) })
                      }
                      className={`${smallInput} w-20`}
                      aria-label="Variant stock"
                    />
                    <input
                      placeholder="SKU (optional)"
                      value={v.sku || ""}
                      onChange={(e) =>
                        updateVariant(idx, { sku: e.target.value })
                      }
                      className={`${smallInput} flex-1 min-w-20`}
                      aria-label="Variant SKU"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={v.isActive !== false}
                        onChange={(e) =>
                          updateVariant(idx, { isActive: e.target.checked })
                        }
                        className="accent-emerald-700"
                      />
                      Active
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">
                Untick “Active” to stop selling a combination without deleting
                its sales history. Stock and price here replace the product's
                base stock/price for buyers.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
