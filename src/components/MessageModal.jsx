import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function MessageModal({
  open,
  title,
  message,
  onClose,
  okLabel = "OK",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm mx-4">
        <div
          className="rounded-2xl border shadow-xl overflow-hidden"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          {/* Top accent strip */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: "#2B80FF" }}
          />

          <div className="p-6">
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ backgroundColor: "#EBF2FF" }}
              >
                <FaExclamationTriangle
                  className="w-4 h-4"
                  style={{ color: "#2B80FF" }}
                />
              </div>
              <div>
                {title && (
                  <h3
                    className="text-base font-extrabold leading-tight"
                    style={{ color: "#1A1A1A" }}
                  >
                    {title}
                  </h3>
                )}
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: "#555555" }}
                >
                  {message}
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end mt-5">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ backgroundColor: "#2B80FF", color: "#fff" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1a6de0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2B80FF")
                }
              >
                {okLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
