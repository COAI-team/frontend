import React, { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "../../styles/tiptap.css";
import { useTheme } from "../../context/theme/useTheme";

const AdminBoardDetailModal = ({
  open,
  loading,
  error,
  detail,
  boardType,
  onClose,
  onDelete,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const RichViewer = ({ content }) => {
    const normalizeContent = (raw) => {
      if (!raw) return "";
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (
          (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
          (trimmed.startsWith("{") && trimmed.endsWith("}"))
        ) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              const tiptapBlock = parsed.find((item) => item?.content);
              return tiptapBlock?.content || "";
            }
            if (parsed?.content) return parsed.content;
          } catch (e) {
            // ignore and fallback
          }
        }
        return raw;
      }
      if (Array.isArray(raw)) {
        const tiptapBlock = raw.find((item) => item?.content);
        return tiptapBlock?.content || "";
      }
      if (raw?.content) return raw.content;
      return "";
    };

    const normalized = normalizeContent(content);
    const editor = useEditor({
      extensions: [StarterKit],
      content: normalized,
      editable: false,
    });
    if (!normalized) return <div style={styles.detailBlock}>-</div>;
    if (!editor) return <div style={styles.detailBlock}>로딩 중...</div>;
    return (
      <div style={styles.viewer}>
        <EditorContent editor={editor} />
      </div>
    );
  };

  if (!open) return null;

  const codeDetail = detail?.codeBoardDetail || detail?.CodeBoardDetail || {};
  const isCodeDeleted =
    boardType === "code" &&
    (codeDetail.codeboardDeletedYn || "N").toUpperCase() === "Y";
  const isFreeDeleted =
    boardType === "free" &&
    (detail?.freeBoardDeletedYn || "N").toUpperCase() === "Y";
  const isDeleted = isCodeDeleted || isFreeDeleted;

  const DetailRow = ({ label, children }) => (
    <div style={styles.detailRow}>
      <div style={styles.detailRowLabel}>{label}</div>
      <div style={styles.detailRowValue}>{children}</div>
    </div>
  );

  const renderContent = () => {
    if (!detail || !boardType) {
      return <p style={styles.detailText}>행을 클릭하면 상세 내용을 확인할 수 있습니다.</p>;
    }

    if (boardType === "code") {
      return (
        <>
          <div style={styles.detailChipRow}>
            <p style={styles.detailTypeLabel}>코드 리뷰 게시판</p>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: isCodeDeleted ? "#991b1b" : "#14532d",
              }}
            >
              {isCodeDeleted ? "삭제됨" : "정상"}
            </span>
          </div>
          <div style={styles.detailTable}>
            <DetailRow label="제목">{codeDetail.codeboardTitle || "-"}</DetailRow>
            <DetailRow label="분석 타입">
              {codeDetail.analysisType || "-"}
            </DetailRow>
            <DetailRow label="AI 점수">{codeDetail.aiScore ?? "-"}</DetailRow>
            <DetailRow label="Git 저장소">
              {codeDetail.repositoryUrl || "-"}
            </DetailRow>
            <DetailRow label="분석 결과">
              <RichViewer content={codeDetail.analysisResults} />
            </DetailRow>
          </div>
          {detail.gitCode && (
            <>
              <h4 style={styles.detailSubheading}>Git 코드</h4>
              <pre style={styles.detailPre}>{detail.gitCode}</pre>
            </>
          )}
          {isCodeDeleted && (
            <p style={styles.deletedNotice}>
              이 게시글은 이미 삭제된 상태입니다.
            </p>
          )}
        </>
      );
    }

    if (boardType === "free") {
      return (
        <>
          <div style={styles.detailChipRow}>
            <p style={styles.detailTypeLabel}>자유 게시판</p>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: isFreeDeleted ? "#991b1b" : "#14532d",
              }}
            >
              {isFreeDeleted ? "삭제됨" : "정상"}
            </span>
          </div>
          <div style={styles.detailTable}>
            <DetailRow label="제목">{detail.freeboardTitle || "-"}</DetailRow>
            <DetailRow label="작성자 닉네임">
              {detail.userNickNae || detail.userNickName || "-"}
            </DetailRow>
            <DetailRow label="내용">
              <RichViewer content={detail.freeboardContent} />
            </DetailRow>
          </div>
          {isFreeDeleted && (
            <p style={styles.deletedNotice}>
              이 게시글은 이미 삭제된 상태입니다.
            </p>
          )}
        </>
      );
    }

    if (boardType === "algo") {
      return (
        <>
          <p style={styles.detailTypeLabel}>알고리즘 게시판</p>
          <div style={styles.detailTable}>
            <DetailRow label="작성자 닉네임">
              {detail.userNickName || "-"}
            </DetailRow>
            <DetailRow label="문제 제목">
              {detail.algoProblemTitle || "-"}
            </DetailRow>
            <DetailRow label="난이도">
              {detail.algoProblemDifficulty || "-"}
            </DetailRow>
            <DetailRow label="언어">{detail.language || "-"}</DetailRow>
            <DetailRow label="소스 코드">
              <div style={styles.detailBlock}>{detail.sourceCode || "-"}</div>
            </DetailRow>
            <DetailRow label="AI 피드백">
              <div style={styles.detailBlock}>{detail.aiFeedback || "-"}</div>
            </DetailRow>
          </div>
        </>
      );
    }

    return (
      <p style={styles.detailText}>지원하지 않는 게시판 유형입니다.</p>
    );
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>게시글 상세 정보</h3>
          <div style={styles.headerButtons}>
            {onDelete && !loading && !error && detail && !isDeleted && (
              <button
                type="button"
                style={styles.deleteButton}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                삭제하기
              </button>
            )}
            <button type="button" style={styles.modalClose} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        {loading && (
          <p style={styles.detailText}>상세 정보를 불러오는 중...</p>
        )}
        {error && <p style={styles.detailError}>{error}</p>}
        {!loading && !error && renderContent()}
      </div>

      {deleteConfirmOpen && (
        <div
          style={styles.confirmOverlay}
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmOpen(false);
          }}
        >
          <div
            style={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.confirmHeader}>
              <h3 style={styles.confirmTitle}>삭제 확인</h3>
              <button
                type="button"
                style={styles.confirmClose}
                onClick={() => setDeleteConfirmOpen(false)}
                aria-label="Close delete confirm"
              >
                ✕
              </button>
            </div>
            <div style={styles.confirmBody}>
              <p style={styles.confirmMessage}>
                정말로 해당 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div style={styles.confirmFooter}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setDeleteConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                style={styles.confirmDeleteButton}
                onClick={async () => {
                  await onDelete?.();
                  setDeleteConfirmOpen(false);
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme) => {
  const isLight = theme === "light";
  return {
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: isLight
        ? "rgba(15, 23, 42, 0.35)"
        : "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
      padding: "20px",
    },
    modalContent: {
      backgroundColor: isLight ? "#ffffff" : "#0f1117",
      borderRadius: "12px",
      width: "min(90vw, 640px)",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "20px 24px",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    headerButtons: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    modalTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: 700,
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    modalClose: {
      width: "34px",
      height: "34px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: isLight ? "#f1f5f9" : "#1f232a",
      border: `1px solid ${isLight ? "#e2e8f0" : "#2e3440"}`,
      color: isLight ? "#475569" : "#cbd5e1",
      borderRadius: "8px",
      fontSize: "16px",
      cursor: "pointer",
    },
    detailChipRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
      gap: "12px",
    },
    detailTypeLabel: {
      margin: 0,
      fontSize: "14px",
      color: isLight ? "#475569" : "#9ca3af",
    },
    statusBadge: {
      padding: "4px 10px",
      borderRadius: "999px",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 600,
    },
    detailText: {
      color: isLight ? "#475569" : "#cbd5f5",
      margin: 0,
      fontSize: "14px",
    },
    detailError: {
      color: "#f87171",
      fontSize: "14px",
      margin: 0,
    },
    detailTable: {
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      borderRadius: "10px",
      overflow: "hidden",
      backgroundColor: isLight ? "#f8fafc" : "#0b0f16",
    },
    detailRow: {
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      alignItems: "stretch",
      borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
    },
    detailRowLabel: {
      padding: "10px 12px",
      backgroundColor: isLight ? "#f1f5f9" : "#0f1117",
      borderRight: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      fontSize: "13px",
      color: isLight ? "#64748b" : "#94a3b8",
      fontWeight: 600,
    },
    detailRowValue: {
      padding: "10px 12px",
      fontSize: "14px",
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    detailBlock: {
      padding: "12px",
      backgroundColor: isLight ? "#ffffff" : "#0b0f16",
      borderRadius: "8px",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
    },
    viewer: {
      padding: "12px",
      backgroundColor: isLight ? "#ffffff" : "#0b0f16",
      borderRadius: "8px",
      lineHeight: 1.6,
      color: isLight ? "#0f172a" : "#e5e7eb",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
    },
    detailSubheading: {
      margin: "16px 0 8px",
      fontSize: "14px",
      fontWeight: 600,
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    detailPre: {
      margin: 0,
      padding: "12px",
      backgroundColor: isLight ? "#0f172a" : "#05070c",
      borderRadius: "8px",
      color: isLight ? "#f8fafc" : "#e5e7eb",
      fontSize: "13px",
      overflowX: "auto",
      whiteSpace: "pre-wrap",
    },
    deleteButton: {
      padding: "8px 12px",
      backgroundColor: "#ef4444",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      minHeight: "34px",
      fontSize: "13px",
      fontWeight: 700,
    },
    deletedNotice: {
      marginTop: "12px",
      padding: "8px 12px",
      borderRadius: "8px",
      backgroundColor: isLight ? "#fee2e2" : "rgba(239,68,68,0.15)",
      color: isLight ? "#b91c1c" : "#f87171",
      fontSize: "13px",
    },
    confirmOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isLight
        ? "rgba(15, 23, 42, 0.35)"
        : "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 60,
      padding: "0 16px",
    },
    confirmModal: {
      width: "100%",
      maxWidth: "420px",
      backgroundColor: isLight ? "#ffffff" : "#0f1117",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      borderRadius: "12px",
      boxShadow: isLight
        ? "0 12px 32px rgba(15, 23, 42, 0.12)"
        : "0 12px 32px rgba(0,0,0,0.35)",
    },
    confirmHeader: {
      padding: "14px 18px",
      borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
    },
    confirmTitle: {
      margin: 0,
      fontSize: "16px",
      fontWeight: 700,
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    confirmClose: {
      width: "30px",
      height: "30px",
      background: "transparent",
      border: `1px solid ${isLight ? "#e2e8f0" : "#2f3545"}`,
      borderRadius: "8px",
      color: isLight ? "#64748b" : "#cbd5e1",
      cursor: "pointer",
      fontSize: "14px",
    },
    confirmBody: {
      padding: "16px 18px",
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    confirmMessage: {
      margin: 0,
      fontSize: "14px",
      color: isLight ? "#334155" : "#e5e7eb",
      lineHeight: 1.5,
    },
    confirmFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      padding: "12px 18px",
      borderTop: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
    },
    cancelButton: {
      backgroundColor: isLight ? "#e2e8f0" : "#2f3545",
      color: isLight ? "#0f172a" : "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },
    confirmDeleteButton: {
      backgroundColor: "#ef4444",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 700,
    },
  };
};

export default AdminBoardDetailModal;
