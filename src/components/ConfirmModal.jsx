import React from "react";
import { FiTrash2 } from "react-icons/fi";

export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
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
            style={{ backgroundColor: "#FF2E3B" }}
          />

          <div className="p-6">
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ backgroundColor: "#fff0f0" }}
              >
                <FiTrash2 className="w-4 h-4" style={{ color: "#FF2E3B" }} />
              </div>
              <div>
                <h3
                  className="text-base font-extrabold leading-tight"
                  style={{ color: "#1A1A1A" }}
                >
                  {title || "Confirm"}
                </h3>
                <p
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: "#555555" }}
                >
                  {description || "Are you sure you want to proceed?"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ backgroundColor: "#f3f4f6", color: "#222222" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f3f4f6")
                }
              >
                {cancelLabel}
              </button>

              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                style={{ backgroundColor: "#FF2E3B", color: "#fff" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e0001a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FF2E3B")
                }
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
