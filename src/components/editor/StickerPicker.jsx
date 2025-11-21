import React, { useState } from "react";
import { STICKER_GROUPS, openmojiUrl } from "./extensions/OpenmojiStickers";

// 이모티콘 카테고리 탭 + 미리보기
const StickerPicker = ({ editor, onClose, isDark }) => {
  const [activeGroupId, setActiveGroupId] = useState(STICKER_GROUPS[0].id);

  const activeGroup =
    STICKER_GROUPS.find((g) => g.id === activeGroupId) || STICKER_GROUPS[0];

  const handleSelect = (sticker) => {
    if (!editor || !sticker.hex) return;

    // 인라인 스티커로 삽입
    editor.chain().focus().insertInlineSticker({
      src: openmojiUrl(sticker.hex),
      alt: sticker.label,
    }).run();
    
    onClose?.();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "3.5rem",
        left: "1.5rem",
        zIndex: 40,
        width: "420px",
        maxHeight: "400px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: isDark ? "#111827" : "#ffffff",
        borderRadius: "0.75rem",
        border: `1px solid ${
          isDark ? "rgba(55, 65, 81, 0.9)" : "rgba(209, 213, 219, 0.9)"
        }`,
        boxShadow: isDark
          ? "0 20px 25px -5px rgba(0,0,0,0.8)"
          : "0 20px 25px -5px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      {/* 상단 탭 */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${
            isDark ? "rgba(55, 65, 81, 0.9)" : "rgba(229, 231, 235, 1)"
          }`,
        }}
      >
        {STICKER_GROUPS.map((group) => {
          const active = group.id === activeGroupId;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroupId(group.id)}
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: active ? 600 : 400,
                border: "none",
                cursor: "pointer",
                backgroundColor: active
                  ? isDark
                    ? "rgba(55, 65, 81, 1)"
                    : "rgba(243, 244, 246, 1)"
                  : "transparent",
                color: isDark ? "#E5E7EB" : "#111827",
              }}
            >
              {group.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "0 0.75rem",
            border: "none",
            borderLeft: `1px solid ${
              isDark ? "rgba(55, 65, 81, 0.9)" : "rgba(229, 231, 235, 1)"
            }`,
            cursor: "pointer",
            background: "transparent",
            fontSize: "0.85rem",
            color: isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          닫기
        </button>
      </div>

      {/* 스티커 그리드 */}
      <div
        style={{
          padding: "0.8rem",
          overflowY: "auto",
          maxHeight: "320px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: "0.5rem",
          }}
        >
          {activeGroup.items.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => handleSelect(sticker)}
              disabled={!sticker.hex}
              title={sticker.label}
              style={{
                border: "none",
                cursor: sticker.hex ? "pointer" : "not-allowed",
                background: "transparent",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                transition: "background 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
              }}
              onMouseEnter={(e) => {
                if (sticker.hex) {
                  e.currentTarget.style.backgroundColor = isDark
                    ? "rgba(55, 65, 81, 0.8)"
                    : "rgba(243, 244, 246, 1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* OpenMoji SVG 미리보기 */}
              {sticker.hex ? (
                <>
                  <img
                    src={openmojiUrl(sticker.hex)}
                    alt={sticker.label}
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      // 이미지 로드 실패 시 이모티콘으로 대체
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div
                    style={{
                      fontSize: "1.8rem",
                      display: "none",
                    }}
                  >
                    {sticker.emoji || "📦"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      textAlign: "center",
                      lineHeight: 1,
                      marginTop: "0.15rem",
                    }}
                  >
                    {sticker.label}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: "0.7rem",
                    textAlign: "center",
                    lineHeight: 1.2,
                    color: isDark ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  준비중
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickerPicker;