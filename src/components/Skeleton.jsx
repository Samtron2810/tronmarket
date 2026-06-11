import React from "react";

export default function Skeleton({
  variant = "card",
  className = "",
  lines = 3,
}) {
  if (variant === "card") {
    return (
      <div className={`rounded-2xl overflow-hidden ${className}`}>
        <div className="animate-pulse bg-gray-200" style={{ height: 96 }} />
        <div className="p-3">
          <div className="animate-pulse bg-gray-200 h-3 w-24 rounded mb-2" />
          <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-2" />
          <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className={className}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 h-3 rounded mb-2"
          style={{ opacity: 0.9 }}
        />
      ))}
    </div>
  );
}
