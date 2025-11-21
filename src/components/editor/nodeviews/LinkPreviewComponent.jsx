import React from "react";
import { NodeViewWrapper } from "@tiptap/react";

const LinkPreviewComponent = ({ node }) => {
  const { title, description, image, site, url } = node.attrs;

  const handleClick = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      className="link-preview-card"
      onClick={handleClick}
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "0.9rem 1rem",
        borderRadius: "0.75rem",
        border: "1px solid rgba(148, 163, 184, 0.6)",
        cursor: url ? "pointer" : "default",
        backgroundColor: "rgba(15, 23, 42, 0.02)",
        maxWidth: "100%",
        margin: "0.75rem 0",
      }}
    >
      {image && (
        <div
          style={{
            flexShrink: 0,
            width: "90px",
            height: "90px",
            borderRadius: "0.5rem",
            overflow: "hidden",
            backgroundColor: "#e5e7eb",
          }}
        >
          <img
            src={image}
            alt={title || url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
          minWidth: 0,
        }}
      >
        {site && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#16a34a",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {site}
          </div>
        )}

        {title && (
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        )}

        {description && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#4b5563",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </div>
        )}

        {url && (
          <div
            style={{
              marginTop: "0.2rem",
              fontSize: "0.75rem",
              color: "#0066cc",
              textDecoration: "underline",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {url}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default LinkPreviewComponent;
