import React, { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Star, Trash2 } from "lucide-react";

// 이미지 컴포넌트 (NodeView)
const ImageBlockView = ({ node, updateAttributes, deleteNode, editor }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { src, alt, isRepresentative } = node.attrs;

  // 대표 이미지 설정
  const handleSetRepresentative = () => {
    // 모든 이미지의 대표 해제
    const updates = [];
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "blockImage" && n.attrs.isRepresentative) {
        updates.push({ pos, node: n });
      }
    });

    // 트랜잭션으로 한 번에 처리
    let tr = editor.state.tr;
    updates.forEach(({ pos, node }) => {
      tr = tr.setNodeMarkup(pos, null, {
        ...node.attrs,
        isRepresentative: false,
      });
    });

    if (updates.length > 0) {
      editor.view.dispatch(tr);
    }

    // 현재 이미지를 대표로 설정
    updateAttributes({ isRepresentative: true });
  };

  return (
    <NodeViewWrapper as="div" data-drag-handle>
      <div
        style={{
          position: "relative",
          display: "inline-block",
          margin: "1rem 0",
          maxWidth: "100%",
          cursor: isHovered ? "move" : "default",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-drag-handle
      >
        {/* 대표 이미지 뱃지 */}
        {isRepresentative && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              left: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.35rem 0.6rem",
              backgroundColor: "rgba(234, 179, 8, 0.95)",
              color: "#1a1a1a",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              zIndex: 10,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <Star size={14} fill="currentColor" />
            대표 이미지
          </div>
        )}

        {/* 호버 시 버튼들 */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              display: "flex",
              gap: "0.4rem",
              zIndex: 10,
            }}
          >
            {!isRepresentative && (
              <button
                onClick={handleSetRepresentative}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.4rem 0.7rem",
                  backgroundColor: "rgba(234, 179, 8, 0.95)",
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <Star size={14} />
                대표로 설정
              </button>
            )}
            <button
              onClick={deleteNode}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.4rem",
                backgroundColor: "rgba(239, 68, 68, 0.95)",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* 이미지 */}
        <img
          src={src}
          alt={alt || ""}
          draggable={false}
          style={{
            maxWidth: "100%",
            borderRadius: "0.5rem",
            display: "block",
            border: isRepresentative
              ? "3px solid rgb(234, 179, 8)"
              : "1px solid transparent",
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default ImageBlockView;