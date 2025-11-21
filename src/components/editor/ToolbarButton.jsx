import React from "react";

const ToolbarButton = ({ onClick, active, children, title, label, isDark }) => {
  const hasLabel = !!label;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        flexDirection: hasLabel ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: hasLabel ? "0.25rem" : "0.35rem",
        padding: hasLabel ? "0.55rem 0.7rem" : "0.45rem",
        borderRadius: "0.5rem",
        fontSize: hasLabel ? "0.7rem" : "0.8rem",
        transition: "all 0.15s",
        backgroundColor: active
          ? isDark
            ? "rgba(139, 92, 246, 0.2)"
            : "rgba(139, 92, 246, 0.15)"
          : "transparent",
        color: active
          ? isDark
            ? "rgb(196, 181, 253)"
            : "rgb(109, 40, 217)"
          : isDark
          ? "rgb(156, 163, 175)"
          : "rgb(107, 114, 128)",
        border: active
          ? `1px solid ${
              isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.3)"
            }`
          : "1px solid transparent",
        cursor: "pointer",
        minWidth: hasLabel ? "3.5rem" : "auto",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = isDark
            ? "rgba(55, 65, 81, 0.6)"
            : "rgba(243, 244, 246, 0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {children}
      {hasLabel && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
};

export default ToolbarButton;
