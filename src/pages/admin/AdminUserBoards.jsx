import { useEffect, useMemo, useRef, useState } from "react";
import AdminBoardDetailModal from "./AdminBoardDetailModal";
import AlertModal from "../../components/modal/AlertModal";
import { useAlert } from "../../hooks/common/useAlert";
import axiosInstance from "../../server/AxiosConfig";
import { useTheme } from "../../context/theme/useTheme";

const API_BASE_URL = "https://api.co-ai.run/admin";
const DEFAULT_PAGE_SIZE = 10;
const PAGES_PER_GROUP = 5;
const BOARD_TYPES = {
  algo: { label: "알고리즘", color: "#00a884" },
  code: { label: "코드 리뷰", color: "#f39c12" },
  free: { label: "자유", color: "#e74c3c" },
};

const LEGACY_TYPE_MAP = {
  1: "algo",
  2: "code",
  3: "free",
};

const SORT_QUERY_MAP = {
  recent: { field: "createdAt", order: "desc" },
  oldest: { field: "createdAt", order: "asc" },
  titleAsc: { field: "title", order: "asc" },
  titleDesc: { field: "title", order: "desc" },
  userAsc: { field: "userNickName", order: "asc" },
  userDesc: { field: "userNickName", order: "desc" },
};

const pickField = (item, fields, defaultValue = undefined) => {
  for (const field of fields) {
    if (item[field] !== undefined && item[field] !== null) {
      return item[field];
    }
  }
  return defaultValue;
};

const AdminUserBoards = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { alert, showAlert, closeAlert } = useAlert();
  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [pageGroup, setPageGroup] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [boardFilter, setBoardFilter] = useState("all");
  const [searchType, setSearchType] = useState("title");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState({
    type: "title",
    keyword: "",
  });
  const [sortOption, setSortOption] = useState("recent");
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedBoardDetail, setSelectedBoardDetail] = useState(null);
  const [selectedBoardType, setSelectedBoardType] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(null);
  const sortMenuRef = useRef(null);
  const [sortMenuPos, setSortMenuPos] = useState({
    left: 0,
    top: 0,
    width: 240,
  });

  const fetchBoards = async (page = 1) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
      });

      if (boardFilter !== "all") {
        params.append("boardType", boardFilter);
      }

      if (activeSearch.keyword) {
        params.append("keyword", activeSearch.keyword);
        params.append("searchType", activeSearch.type);
      }
      const { field, order } =
        SORT_QUERY_MAP[sortOption] ?? SORT_QUERY_MAP.recent;
      params.append("sortField", field);
      params.append("sortOrder", order);
      const res = await axiosInstance.get(
        `/admin/userboards?${params.toString()}`
      );

      if (res.data?.message === "success" && res.data?.data) {
        const data = res.data.data;
        setBoards(data.content || []);
        setPageInfo({
          page: data.page,
          size: data.size,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        });
        setPageGroup(Math.max(1, Math.ceil(page / PAGES_PER_GROUP)));
      } else {
        setError("응답 형식이 올바르지 않습니다.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "게시글 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  };
  const fetchBoardDetail = async (boardId, boardTypeKey) => {
    const normalizedType = resolveBoardTypeKey(boardTypeKey);
    if (!normalizedType) {
      setDetailError("알 수 없는 게시판 유형입니다.");
      setSelectedBoardDetail(null);
      setSelectedBoardType(null);
      setIsDetailModalOpen(false);
      setSelectedBoardId(null);
      return;
    }
    try {
      setDetailLoading(true);
      setDetailError("");
      setIsDetailModalOpen(true);
      const res = await axiosInstance.get(
        `/admin/boarddetail/${normalizedType}/${boardId}`
      );
      if (res.data?.message === "success" && res.data?.data) {
        setSelectedBoardDetail(res.data.data);
        setSelectedBoardType(normalizedType);
        setSelectedBoardId(boardId);
      } else {
        setDetailError("상세 정보를 불러오지 못했습니다.");
        setSelectedBoardDetail(null);
        setSelectedBoardType(null);
        setSelectedBoardId(null);
      }
    } catch (err) {
      setDetailError(
        err.response?.data?.message ||
          "상세 정보를 호출하는 중 오류가 발생했습니다."
      );
      setSelectedBoardDetail(null);
      setSelectedBoardType(null);
      setSelectedBoardId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards(1);
  }, [boardFilter, pageSize, activeSearch, sortOption]);

  const startPage = (pageGroup - 1) * PAGES_PER_GROUP + 1;
  const endPage = Math.min(
    startPage + PAGES_PER_GROUP - 1,
    pageInfo.totalPages || 0
  );
  const pageNumbers =
    pageInfo.totalPages > 0
      ? Array.from(
          { length: endPage - startPage + 1 },
          (_, idx) => startPage + idx
        )
      : [];

  const handlePrevPage = () => {
    if (pageInfo.hasPrevious) {
      const targetPage = Math.max(1, pageInfo.page - 1);
      setPageGroup(Math.max(1, Math.ceil(targetPage / PAGES_PER_GROUP)));
      fetchBoards(targetPage);
    }
  };

  const handleNextPage = () => {
    if (pageInfo.hasNext) {
      const targetPage = Math.min(pageInfo.totalPages, pageInfo.page + 1);
      setPageGroup(Math.max(1, Math.ceil(targetPage / PAGES_PER_GROUP)));
      fetchBoards(targetPage);
    }
  };

  const handleBoardFilterChange = (type) => {
    setBoardFilter(type);
    setPageGroup(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPageGroup(1);
  };

  const handleSearch = () => {
    setActiveSearch({
      type: searchType,
      keyword: searchInput.trim(),
    });
    setPageGroup(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleResetFilters = () => {
    setBoardFilter("all");
    setPageSize(DEFAULT_PAGE_SIZE);
    setSearchType("title");
    setSearchInput("");
    setActiveSearch({ type: "title", keyword: "" });
    setSortOption("recent");
    setPageGroup(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}.`;
  };

  const resolveBoardTypeKey = (typeKey) => {
    if (typeKey === undefined || typeKey === null) return undefined;
    const normalized = String(typeKey).toLowerCase();
    if (BOARD_TYPES[normalized]) {
      return normalized;
    }
    if (LEGACY_TYPE_MAP[normalized]) {
      return LEGACY_TYPE_MAP[normalized];
    }
    return undefined;
  };

  const renderBoardTypeTag = (typeKey, boardId) => {
    const boardKey = resolveBoardTypeKey(typeKey);
    const meta = (boardKey && BOARD_TYPES[boardKey]) || {
      label: "미분류",
      color: "#6c757d",
    };
    const isReported =
      (boardKey === "code" && Number(boardId) === 2) ||
      (boardKey === "algo" && Number(boardId) === 1031);
    return (
      <span style={styles.boardTypeWrap}>
        <span
          style={{
            ...styles.boardTypeTag,
            backgroundColor: meta.color,
          }}
        >
          {meta.label}
        </span>
        {isReported && (
          <span style={styles.reportBadge} aria-label="신고됨">
            🚨
          </span>
        )}
      </span>
    );
  };

  const getSortedBoards = () => {
    const cloned = [...boards];
    return cloned.sort((a, b) => {
      const dateA = new Date(pickField(a, ["createTime", "createdAt"]) || 0);
      const dateB = new Date(pickField(b, ["createTime", "createdAt"]) || 0);
      const titleA = (
        pickField(a, [
          "title",
          "algoBoardTitle",
          "codeBoardTitle",
          "freeBoardTitle",
        ]) || ""
      ).toString();
      const titleB = (
        pickField(b, [
          "title",
          "algoBoardTitle",
          "codeBoardTitle",
          "freeBoardTitle",
        ]) || ""
      ).toString();
      const userA = (a.userNickName || "").toString();
      const userB = (b.userNickName || "").toString();

      switch (sortOption) {
        case "oldest":
          return dateA - dateB;
        case "titleDesc":
          return titleB.localeCompare(titleA, "ko");
        case "titleAsc":
          return titleA.localeCompare(titleB, "ko");
        case "userDesc":
          return userB.localeCompare(userA, "ko");
        case "userAsc":
          return userA.localeCompare(userB, "ko");
        case "recent":
        default:
          return dateB - dateA;
      }
    });
  };
  const displayBoards = getSortedBoards();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(null);
      }
    };
    const handleWindowChange = () => setSortMenuOpen(null);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, []);

  const handleDeleteBoard = async () => {
    if (!selectedBoardId || !selectedBoardType) return;
    const boardId = selectedBoardId;
    const normalizedType = selectedBoardType;
    try {
      await axios.delete(`${API_BASE_URL}/boarddelte`, {
        data: {
          boardId,
          boardType: normalizedType,
        },
      });
      fetchBoards(pageInfo.page);
      setIsDetailModalOpen(false);
      setSelectedBoardDetail(null);
      setSelectedBoardType(null);
      setSelectedBoardId(null);
    } catch (err) {
      showAlert({
        type: "error",
        title: "삭제 실패",
        message:
          err.response?.data?.message || "삭제 요청 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📋 사용자 게시글 현황</h2>
          <p style={styles.subtitle}>
            총 {pageInfo.totalCount.toLocaleString()}개의 글이 등록되어
            있습니다.
          </p>
        </div>
        
      </div>

      <div style={styles.sectionCard}>
        <div style={styles.controlsWrapper}>
          <div style={styles.pageSizeWrapper}>
            <label htmlFor="pageSizeSelect" style={styles.pageSizeLabel}>
              페이지 크기
            </label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={styles.pageSizeSelect}
            >
              {[10, 20, 30].map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}개
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.searchRow}>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={styles.searchSelect}
          >
            <option value="title">제목</option>
            <option value="user">작성자</option>
          </select>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={styles.searchInput}
          />
          <button style={styles.searchButton} onClick={handleSearch}>
            🔍 검색
          </button>
          <button style={styles.resetButton} onClick={handleResetFilters}>
            초기화
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {loading ? (
          <div style={styles.loadingBox}>데이터를 불러오는 중입니다...</div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.thId}>ID</th>
                    <HeaderWithSort
                      label="제목"
                      sortAsc="titleAsc"
                      sortDesc="titleDesc"
                      active={sortOption}
                      onSelect={setSortOption}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      setMenuPos={setSortMenuPos}
                      menuPos={sortMenuPos}
                      width={260}
                      styles={styles}
                      style={styles.thTitleCenter}
                    />
                    <th style={styles.thAuthorCenter}>작성자</th>
                    <TypeHeader
                      activeType={boardFilter}
                      onSelect={(type) => {
                        handleBoardFilterChange(type);
                        setSortMenuOpen(null);
                      }}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      setMenuPos={setSortMenuPos}
                      menuPos={sortMenuPos}
                      width={220}
                      styles={styles}
                      style={styles.thType}
                    />
                    <HeaderWithSort
                      label="작성일"
                      sortAsc="oldest"
                      sortDesc="recent"
                      active={sortOption}
                      onSelect={setSortOption}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      setMenuPos={setSortMenuPos}
                      menuPos={sortMenuPos}
                      width={240}
                      styles={styles}
                      style={styles.thDate}
                    />
                  </tr>
                </thead>
                <tbody>
                  {displayBoards.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={styles.emptyState}>
                        등록된 게시글이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    displayBoards.map((item, index) => {
                      const boardId =
                        pickField(item, [
                          "id",
                          "algoBoardId",
                          "codeBoardId",
                          "freeBoardId",
                        ]) ?? `unknown-${index}`;
                      const boardTitle =
                        pickField(item, [
                          "title",
                          "algoBoardTitle",
                          "codeBoardTitle",
                          "freeBoardTitle",
                        ]) ?? "제목 없음";
                      const createdAt = pickField(item, [
                        "createTime",
                        "createdAt",
                      ]);

                      const boardKey = item.boardType || item.check;
                      const rowBaseColor =
                        index % 2 === 0
                          ? styles.rowEven.backgroundColor
                          : styles.rowOdd.backgroundColor;

                      return (
                        <tr
                          key={`${boardKey || "unknown"}-${boardId}`}
                          style={{
                            ...styles.tbodyRow,
                            ...(index % 2 === 0 ? styles.rowEven : styles.rowOdd),
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              styles.rowHoverBg)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = rowBaseColor)
                          }
                          onClick={() => fetchBoardDetail(boardId, boardKey)}
                        >
                          <td style={styles.tdCenter}>{boardId}</td>
                          <td style={styles.tdLeft}>{boardTitle}</td>
                          <td style={styles.tdAuthor}>
                            {item.userNickName || "-"}
                          </td>
                          <td style={styles.tdCenter}>
                            {renderBoardTypeTag(boardKey, boardId)}
                          </td>
                          <td style={styles.tdDate}>{formatDate(createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pageInfo.totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={handlePrevPage}
                  disabled={!pageInfo.hasPrevious}
                  style={{
                    ...styles.pageButton,
                    ...(!pageInfo.hasPrevious ? styles.pageButtonDisabled : {}),
                  }}
                >
                  ◀
                </button>
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => fetchBoards(num)}
                    style={{
                      ...styles.pageNumber,
                      ...(num === pageInfo.page ? styles.activePage : {}),
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={!pageInfo.hasNext}
                  style={{
                    ...styles.pageButton,
                    ...(!pageInfo.hasNext ? styles.pageButtonDisabled : {}),
                  }}
                >
                  ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <AdminBoardDetailModal
        open={isDetailModalOpen}
        loading={detailLoading}
        error={detailError}
        detail={selectedBoardDetail}
        boardType={selectedBoardType}
        onDelete={selectedBoardDetail ? handleDeleteBoard : undefined}
        onClose={() => setIsDetailModalOpen(false)}
      />
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

function HeaderWithSort({
  label,
  sortAsc,
  sortDesc,
  active,
  onSelect,
  menuRef,
  openKey,
  setOpenKey,
  setMenuPos,
  menuPos,
  width,
  styles,
  style,
}) {
  const isOpen = openKey === label;
  const getMenuCoords = (rect) => {
    const menuWidth = width ?? 240;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - menuWidth - 8
    );
    const top = rect.bottom + 8;
    return { left, top, width: menuWidth };
  };
  return (
    <th
      style={{ ...style, position: "relative" }}
      ref={isOpen ? menuRef : null}
    >
      <button
        style={styles.headerButton}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMenuPos(getMenuCoords(rect));
          setOpenKey(isOpen ? null : label);
        }}
      >
        <span>{label}</span>
        <span style={styles.caret}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div
          style={{
            ...styles.sortMenu,
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
          }}
        >
          <button
            style={{
              ...styles.sortMenuItem,
              ...(active === sortDesc ? styles.sortMenuItemActive : {}),
            }}
            onClick={() => {
              onSelect(sortDesc);
              setOpenKey(null);
            }}
          >
            내림차순 정렬
          </button>
          <button
            style={{
              ...styles.sortMenuItem,
              ...(active === sortAsc ? styles.sortMenuItemActive : {}),
            }}
            onClick={() => {
              onSelect(sortAsc);
              setOpenKey(null);
            }}
          >
            오름차순 정렬
          </button>
        </div>
      )}
    </th>
  );
}

function TypeHeader({
  activeType,
  onSelect,
  menuRef,
  openKey,
  setOpenKey,
  setMenuPos,
  menuPos,
  width,
  styles,
  style,
}) {
  const options = [
    { value: "all", label: "전체" },
    ...Object.entries(BOARD_TYPES).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
  ];
  const isOpen = openKey === "type";
  return (
    <th
      style={{ ...style, position: "relative" }}
      ref={isOpen ? menuRef : null}
    >
      <button
        style={styles.headerButton}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const menuWidth = width ?? 220;
          const left = Math.min(
            Math.max(8, rect.left),
            window.innerWidth - menuWidth - 8
          );
          const top = rect.bottom + 8;
          setMenuPos({ left, top, width: menuWidth });
          setOpenKey(isOpen ? null : "type");
        }}
      >
        <span>유형</span>
        <span style={styles.caret}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div
          style={{
            ...styles.sortMenu,
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.sortMenuItem,
                ...(activeType === opt.value ? styles.sortMenuItemActive : {}),
              }}
              onClick={() => {
                onSelect(opt.value);
                setOpenKey(null);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </th>
  );
}

const getStyles = (theme) => {
  const isLight = theme === "light";
  return {
    container: {
      padding: "30px",
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: "'Pretendard', sans-serif",
      color: isLight ? "#0f172a" : "#fff",
      overflow: "visible",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      gap: "12px",
      flexWrap: "wrap",
    },
    title: {
      fontSize: "22px",
      fontWeight: "700",
      margin: 0,
      color: isLight ? "#0f172a" : "#fff",
    },
    subtitle: {
      margin: "4px 0 0",
      color: isLight ? "#64748b" : "#b3b3b3",
      fontSize: "14px",
    },
    refreshButton: {
      backgroundColor: "#1976d2",
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
    },
    error: {
      color: "#ff6b6b",
      marginBottom: "12px",
    },
    controlsWrapper: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    },
    sectionCard: {
      backgroundColor: isLight ? "#ffffff" : "#0f172a",
      borderRadius: "14px",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      padding: "18px",
      boxShadow: isLight
        ? "0 10px 24px rgba(15, 23, 42, 0.08)"
        : "0 10px 24px rgba(0,0,0,0.35)",
    },
    boardFilterGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    boardFilterButton: {
      backgroundColor: isLight ? "#f8fafc" : "#111",
      color: isLight ? "#0f172a" : "#fff",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: isLight ? "#cbd5e1" : "#333",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
    },
    activeFilterButton: {
      backgroundColor: "#2dd4bf",
      color: "#0d1117",
      borderColor: "#2dd4bf",
    },
    hoverFilterButton: {
      borderColor: isLight ? "#94a3b8" : "#4c4c4c",
      backgroundColor: isLight ? "#e2e8f0" : "#1a1a1a",
    },
    pageSizeWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginLeft: "auto",
    },
    pageSizeLabel: {
      fontSize: "14px",
      color: isLight ? "#64748b" : "#b3b3b3",
    },
    pageSizeSelect: {
      backgroundColor: isLight ? "#f8fafc" : "#111",
      color: isLight ? "#0f172a" : "#fff",
      border: `1px solid ${isLight ? "#cbd5e1" : "#444"}`,
      borderRadius: "6px",
      padding: "6px 10px",
    },
    sortTabs: {
      display: "flex",
      gap: "18px",
      marginBottom: "14px",
    },
    sortTab: {
      background: "transparent",
      border: "none",
      color: isLight ? "#64748b" : "#9ca3af",
      fontSize: "15px",
      cursor: "pointer",
      padding: 0,
    },
    sortTabActive: {
      color: isLight ? "#0f172a" : "#fff",
      fontWeight: 700,
    },
    sortTabHover: {
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    searchRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "16px",
    },
    searchSelect: {
      backgroundColor: isLight ? "#f8fafc" : "#111",
      color: isLight ? "#0f172a" : "#fff",
      border: `1px solid ${isLight ? "#cbd5e1" : "#444"}`,
      borderRadius: "6px",
      padding: "6px 10px",
    },
    searchInput: {
      flex: 1,
      minWidth: "180px",
      padding: "8px 12px",
      borderRadius: "6px",
      border: `1px solid ${isLight ? "#cbd5e1" : "#444"}`,
      backgroundColor: isLight ? "#f8fafc" : "#111",
      color: isLight ? "#0f172a" : "#fff",
    },
    searchButton: {
      backgroundColor: "#1976d2",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600,
    },
    resetButton: {
      backgroundColor: isLight ? "#e2e8f0" : "#555",
      color: isLight ? "#0f172a" : "#fff",
      border: "none",
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer",
    },
    loadingBox: {
      textAlign: "center",
      padding: "40px 0",
      color: isLight ? "#64748b" : "#ccc",
    },
    tableWrapper: {
      backgroundColor: isLight ? "#ffffff" : "#0d1117",
      borderRadius: "12px",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f232a"}`,
      overflow: "hidden",
      boxShadow: isLight
        ? "0 8px 24px rgba(15, 23, 42, 0.12)"
        : "0 8px 24px rgba(0,0,0,0.35)",
      position: "relative",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
      clipPath: "inset(0 0 0 2px round 12px)",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "fixed",
      boxSizing: "border-box",
    },
    thead: {
      backgroundColor: isLight ? "#f1f5f9" : "#1c1f26",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      fontSize: "12px",
      fontWeight: 600,
    },
    tbodyRow: {
      transition: "background-color 0.2s ease",
      borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#15191f"}`,
      cursor: "pointer",
    },
    rowEven: {
      backgroundColor: isLight ? "#f8fafc" : "#10141b",
    },
    rowOdd: {
      backgroundColor: isLight ? "#ffffff" : "#0c1016",
    },
    rowHoverBg: isLight ? "rgba(37, 99, 235, 0.08)" : "rgba(148, 163, 184, 0.15)",
    thId: {
      width: "10%",
      textAlign: "center",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thTitle: {
      width: "34%",
      textAlign: "left",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thTitleCenter: {
      width: "34%",
      textAlign: "center",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thAuthor: {
      width: "20%",
      textAlign: "left",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thAuthorCenter: {
      width: "20%",
      textAlign: "center",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thType: {
      width: "16%",
      textAlign: "center",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    thDate: {
      width: "20%",
      textAlign: "center",
      padding: "14px 10px",
      boxSizing: "border-box",
    },
    tdCenter: {
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 14px",
      color: isLight ? "#0f172a" : "#f8fafc",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    tdLeft: {
      textAlign: "left",
      padding: "12px 14px",
      color: isLight ? "#0f172a" : "#f8fafc",
      fontSize: "14px",
      fontWeight: 500,
      boxSizing: "border-box",
    },
    tdAuthor: {
      textAlign: "center",
      padding: "12px 14px",
      color: isLight ? "#0f172a" : "#f8fafc",
      fontSize: "14px",
      fontWeight: 500,
      boxSizing: "border-box",
    },
    tdDate: {
      textAlign: "center",
      padding: "12px 14px",
      color: isLight ? "#475569" : "#cbd5f5",
      fontSize: "13px",
      fontFamily: "'Inter', 'Pretendard', sans-serif",
      boxSizing: "border-box",
    },
    boardTypeTag: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      color: "#fff",
      fontWeight: 600,
    },
    boardTypeWrap: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "nowrap",
      position: "relative",
      width: "100%",
      paddingRight: "22px",
    },
    reportBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      width: "20px",
      height: "20px",
      lineHeight: "20px",
      position: "absolute",
      right: 0,
      top: "50%",
      transform: "translateY(-50%)",
    },
    emptyState: {
      textAlign: "center",
      padding: "25px",
      color: isLight ? "#64748b" : "#b3b3b3",
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "6px",
      marginTop: "18px",
    },
    pageButton: {
      padding: "6px 12px",
      backgroundColor: isLight ? "#f8fafc" : "#1976d2",
      color: isLight ? "#0f172a" : "#fff",
      border: `1px solid ${isLight ? "#cbd5e1" : "transparent"}`,
      borderRadius: "4px",
      cursor: "pointer",
    },
    pageButtonDisabled: {
      backgroundColor: isLight ? "#e2e8f0" : "#444",
      cursor: "not-allowed",
      color: isLight ? "#94a3b8" : "#fff",
    },
    pageNumber: {
      border: `1px solid ${isLight ? "#cbd5e1" : "#444"}`,
      backgroundColor: isLight ? "#ffffff" : "#111",
      color: isLight ? "#0f172a" : "#fff",
      padding: "6px 10px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    activePage: {
      backgroundColor: "#1976d2",
      borderColor: "#1976d2",
      fontWeight: "bold",
      color: "#fff",
    },
    headerButton: {
      background: "transparent",
      border: "none",
      color: isLight ? "#334155" : "#dce2f7",
      fontWeight: 700,
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      cursor: "pointer",
      width: "100%",
      justifyContent: "center",
    },
    caret: {
      fontSize: "10px",
      color: isLight ? "#94a3b8" : "#e5e7eb",
    },
    sortMenu: {
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: isLight ? "#ffffff" : "#0f172a",
      border: `1px solid ${isLight ? "#e2e8f0" : "#1f2937"}`,
      borderRadius: "12px",
      boxShadow: isLight
        ? "0 12px 24px rgba(15, 23, 42, 0.12)"
        : "0 12px 24px rgba(0,0,0,0.35)",
      overflowY: "auto",
      overflowX: "hidden",
      maxWidth: "calc(100vw - 16px)",
      maxHeight: "420px",
      zIndex: 9999,
      whiteSpace: "nowrap",
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      padding: "6px",
      boxSizing: "border-box",
    },
    sortMenuItem: {
      width: "100%",
      textAlign: "left",
      background: "transparent",
      border: "none",
      padding: "10px 14px",
      color: isLight ? "#1f2937" : "#e2e8f0",
      cursor: "pointer",
      fontSize: "13px",
    },
    sortMenuItemActive: {
      backgroundColor: isLight
        ? "rgba(59,130,246,0.12)"
        : "rgba(59,130,246,0.16)",
      color: isLight ? "#0f172a" : "#ffffff",
    },
  };
};

export default AdminUserBoards;
