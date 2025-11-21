import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Loader2 } from "lucide-react";

const ImageLoadingSpinner = () => {
  return (
    <NodeViewWrapper>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 0",
          margin: "1rem 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1.5rem 2rem",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderRadius: "0.75rem",
            border: "2px dashed rgba(139, 92, 246, 0.3)",
          }}
        >
          <Loader2
            size={32}
            style={{
              animation: "spin 1s linear infinite",
              color: "rgb(139, 92, 246)",
            }}
          />
          <span
            style={{
              fontSize: "0.875rem",
              color: "rgb(139, 92, 246)",
              fontWeight: "500",
            }}
          >
            이미지 업로드 중...
          </span>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </NodeViewWrapper>
  );
};

export default ImageLoadingSpinner;