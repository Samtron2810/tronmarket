import {
  activeVariants,
  colourHex,
  isColourOption,
} from "../utils/variants";

// Buyer-facing option picker. Renders colour options as swatches and every
// other option as pills. A value is disabled when no active variant matches
// it together with the rest of the current selection, or when every such
// variant is out of stock.
//
// Props: product, selection ({optionName: value}), onChange(nextSelection)
export default function VariantSelector({ product, selection, onChange }) {
  if (!product?.hasVariants) return null;
  const variants = activeVariants(product);

  const isValueAvailable = (optionName, value) => {
    const probe = { ...selection, [optionName]: value };
    return variants.some((v) => {
      if (v.stock <= 0) return false;
      const attrs = Object.fromEntries(
        v.attributes.map((a) => [a.name, a.value]),
      );
      return Object.entries(probe).every(
        ([k, val]) => !val || attrs[k] === val,
      );
    });
  };

  return (
    <div className="space-y-3">
      {(product.options || []).map((option) => (
        <div key={option.name}>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
            {option.name}
            {selection[option.name] && (
              <span className="ml-2 normal-case tracking-normal text-emerald-700">
                {selection[option.name]}
              </span>
            )}
          </span>

          {isColourOption(option.name) ? (
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const available = isValueAvailable(option.name, value);
                const selected = selection[option.name] === value;
                const hex = colourHex(value);
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!available}
                    title={available ? value : `${value} — out of stock`}
                    onClick={() => onChange({ ...selection, [option.name]: value })}
                    className={`relative w-9 h-9 rounded-full border-2 transition-all duration-150 ${
                      selected
                        ? "border-emerald-700 ring-2 ring-emerald-200 scale-105"
                        : "border-gray-300 hover:border-gray-400"
                    } ${!available ? "opacity-35 cursor-not-allowed" : "active:scale-95"}`}
                    style={{ backgroundColor: hex || "#E5E7EB" }}
                  >
                    {!hex && (
                      <span className="text-[10px] font-bold text-gray-600">
                        {value.charAt(0)}
                      </span>
                    )}
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {option.values.map((value) => {
                const available = isValueAvailable(option.name, value);
                const selected = selection[option.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!available}
                    onClick={() => onChange({ ...selection, [option.name]: value })}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-150 ${
                      selected
                        ? "bg-emerald-700 border-emerald-700 text-white"
                        : available
                          ? "bg-white border-gray-300 text-gray-700 hover:border-emerald-600 hover:text-emerald-700 active:scale-95"
                          : "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed line-through"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

