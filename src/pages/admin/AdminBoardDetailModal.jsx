import React from "react";

const AdminBoardDetailModal = ({
  open,
  loading,
  error,
  detail,
  boardType,
  onClose,
  onDelete,
}) => {
  if (!open) return null;

  const codeDetail = detail?.codeBoardDetail || detail?.CodeBoardDetail || {};
  const isCodeDeleted =
    boardType === "code" &&
    (codeDetail.codeboardDeletedYn || "N").toUpperCase() === "Y";
  const isFreeDeleted =
    boardType === "free" &&
    (detail?.freeBoardDeletedYn || "N").toUpperCase() === "Y";
  const isDeleted = isCodeDeleted || isFreeDeleted;

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
          <dl style={styles.detailList}>
            <dt>제목</dt>
            <dd>{codeDetail.codeboardTitle || "-"}</dd>
            <dt>분석 타입</dt>
            <dd>{codeDetail.analysisType || "-"}</dd>
            <dt>AI 점수</dt>
            <dd>{codeDetail.aiScore ?? "-"}</dd>
            <dt>Git 저장소</dt>
            <dd>{codeDetail.repositoryUrl || "-"}</dd>
            <dt>분석 결과</dt>
            <dd style={styles.detailBlock}>
              {codeDetail.analysisResults || "-"}
            </dd>
          </dl>
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
          <dl style={styles.detailList}>
            <dt>제목</dt>
            <dd>{detail.freeboardTitle || "-"}</dd>
            <dt>작성자 닉네임</dt>
            <dd>{detail.userNickNae || detail.userNickName || "-"}</dd>
            <dt>내용</dt>
            <dd style={styles.detailBlock}>
              {detail.freeboardContent || "-"}
            </dd>
          </dl>
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
          <dl style={styles.detailList}>
            <dt>작성자 닉네임</dt>
            <dd>{detail.userNickName || "-"}</dd>
            <dt>문제 제목</dt>
            <dd>{detail.algoProblemTitle || "-"}</dd>
            <dt>난이도</dt>
            <dd>{detail.algoProblemDifficulty || "-"}</dd>
            <dt>언어</dt>
            <dd>{detail.language || "-"}</dd>
            <dt>소스 코드</dt>
            <dd style={styles.detailBlock}>{detail.sourceCode || "-"}</dd>
            <dt>AI 피드백</dt>
            <dd style={styles.detailBlock}>
              {detail.aiFeedback || "-"}
            </dd>
          </dl>
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
          <button type="button" style={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {onDelete && !loading && !error && detail && !isDeleted && (
          <button
            type="button"
            style={styles.deleteButton}
            onClick={onDelete}
          >
            삭제하기
          </button>
        )}
        {loading && (
          <p style={styles.detailText}>상세 정보를 불러오는 중...</p>
        )}
        {error && <p style={styles.detailError}>{error}</p>}
        {!loading && !error && renderContent()}
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#0f1117",
    borderRadius: "12px",
    width: "min(90vw, 640px)",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "20px 24px",
    border: "1px solid #1f232a",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
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
    color: "#9ca3af",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
  },
  detailText: {
    color: "#cbd5f5",
    margin: 0,
    fontSize: "14px",
  },
  detailError: {
    color: "#f87171",
    fontSize: "14px",
    margin: 0,
  },
  detailList: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    rowGap: "8px",
    columnGap: "12px",
    fontSize: "14px",
    color: "#e5e7eb",
  },
  detailBlock: {
    padding: "12px",
    backgroundColor: "#0b0f16",
    borderRadius: "8px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  detailSubheading: {
    margin: "16px 0 8px",
    fontSize: "14px",
    fontWeight: 600,
  },
  detailPre: {
    margin: 0,
    padding: "12px",
    backgroundColor: "#05070c",
    borderRadius: "8px",
    color: "#e5e7eb",
    fontSize: "13px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
  deleteButton: {
    padding: "8px 12px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "16px",
    alignSelf: "flex-end",
  },
  deletedNotice: {
    marginTop: "12px",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "rgba(239,68,68,0.15)",
    color: "#f87171",
    fontSize: "13px",
  },
};

export default AdminBoardDetailModal;
