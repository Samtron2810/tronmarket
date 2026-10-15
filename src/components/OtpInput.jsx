import { useRef } from "react";

/**
 * Six-box one-time-code input with paste support and auto-advance.
 * Controlled as a single string (0–6 digits) via value/onChange.
 */
export default function OtpInput({ value, onChange, autoSubmit }) {
  const refs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const setAt = (index, digit) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) autoSubmit?.(pasted);
  };

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          aria-label={`Digit ${i + 1} of 6`}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, cleaned);
            const candidate = digits.slice();
            candidate[i] = cleaned;
            if (candidate.join("").length === 6) autoSubmit?.(candidate.join(""));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className={`h-14 w-11 rounded-xl border-2 bg-[#ECFDF5] text-center text-xl font-bold text-[#101828] outline-none transition-colors focus:border-emerald-700 ${d ? "border-emerald-700" : "border-gray-200"}`}
        />
      ))}
    </div>
  );
}
