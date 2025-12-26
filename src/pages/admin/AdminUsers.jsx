import axios from "axios";
import { useState, useEffect, useRef } from "react";
import AdminUserDetailModal from "./AdminUserDetailModal";
import axiosInstance from "../../server/AxiosConfig";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    size: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [sortField, setSortField] = useState("USER_ID");
  const [sortOrder, setSortOrder] = useState("desc");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMenuOpen, setSortMenuOpen] = useState(null);
  const sortMenuRef = useRef(null);
  const isDeletedMap = {
    0: { label: "가입중", color: "#2dd4bf" },
    1: { label: "탈퇴", color: "#94a3b8" },
    2: { label: "추방", color: "#ef4444" },
  };

  const [pageGroup, setPageGroup] = useState(1); // ✅ 현재 페이지 그룹 (1~5 / 6~10 등)

  const findUser = async (
    page = 1,
    email = "",
    sortField = "USER_ID",
    sortOrder = "desc",
    role = "all",
    status = "all"
  ) => {
    try {
      setLoading(true);
      const queryEmail = email ? `&userEmail=${encodeURIComponent(email)}` : "";
      const querySort = `&sortField=${sortField}&sortOrder=${sortOrder}`;
      const queryRole = `&roleFilter=${role}`;
      const queryStatus = `&statusFilter=${status}`;

      const res = await axiosInstance.get(
        `/admin/users?page=${page}&size=10${queryEmail}${querySort}${queryRole}${queryStatus}`
      );

      if (res.data.message === "success") {
        const data = res.data.data;
        setUsers(data.content);
        setPageInfo({
          page: data.page,
          size: data.size,
          totalPages: data.totalPages,
          hasNext: data.hasNext,
          hasPrevious: data.hasPrevious,
        });

        // ✅ 현재 페이지가 속한 그룹 계산
        setPageGroup(Math.ceil(page / 5));
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findUser(1, searchEmail, sortField, sortOrder, roleFilter, statusFilter);
  }, [sortField, sortOrder, roleFilter, statusFilter]);

  const handleUserClick = (userId) => setSelectedUser(userId);
  const closeModal = () => setSelectedUser(null);

  const handlePrev = () => {
    if (pageInfo.hasPrevious)
      findUser(
        pageInfo.page - 1,
        searchEmail,
        sortField,
        sortOrder,
        roleFilter,
        statusFilter
      );
  };

  const handleNext = () => {
    if (pageInfo.hasNext)
      findUser(
        pageInfo.page + 1,
        searchEmail,
        sortField,
        sortOrder,
        roleFilter,
        statusFilter
      );
  };

  const handleSearch = () => {
    findUser(
      1,
      searchEmail.trim(),
      sortField,
      sortOrder,
      roleFilter,
      statusFilter
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSortSelect = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setPageGroup(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPageGroup(1);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ 페이지 그룹 계산 (5단위)
  const pagesPerGroup = 5;
  const startPage = (pageGroup - 1) * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, pageInfo.totalPages);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const handlePrevGroup = () => {
    if (pageGroup > 1) {
      const newStartPage = (pageGroup - 2) * pagesPerGroup + 1;
      setPageGroup(pageGroup - 1);
      findUser(
        newStartPage,
        searchEmail,
        sortField,
        sortOrder,
        roleFilter,
        statusFilter
      );
    }
  };

  const handleNextGroup = () => {
    if (endPage < pageInfo.totalPages) {
      const newStartPage = pageGroup * pagesPerGroup + 1;
      setPageGroup(pageGroup + 1);
      findUser(
        newStartPage,
        searchEmail,
        sortField,
        sortOrder,
        roleFilter,
        statusFilter
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>👥 관리자 유저 목록</h2>
          <p style={styles.subtitle}>필터/검색으로 유저를 빠르게 찾아보세요.</p>
        </div>
      </div>

      <div style={styles.card}>
        {/* ✅ 검색 + 정렬 */}
        <div style={styles.searchBox}>
          <div style={styles.searchGroup}>
            <input
              type="text"
              placeholder="이메일을 입력하세요"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.searchInput}
            />
            <button onClick={handleSearch} style={styles.primaryButton}>
              🔍 검색
            </button>
          </div>
          <span style={styles.sortHint}>헤더 ▾ 클릭으로 정렬/권한 설정</span>
        </div>

        {loading ? (
          <p style={styles.subText}>⏳ 로딩 중...</p>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <HeaderWithSort
                      label="ID"
                      sortAsc="USER_ID,asc"
                      sortDesc="USER_ID,desc"
                      active={`${sortField},${sortOrder}`}
                      onSelect={(value) => {
                        const [field, order] = value.split(",");
                        handleSortSelect(field, order);
                        setSortMenuOpen(null);
                      }}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      style={{ ...styles.th, width: "10%" }}
                    />
                    <th
                      style={{ ...styles.th, width: "30%", textAlign: "left" }}
                    >
                      이메일
                    </th>
                    <th
                      style={{ ...styles.th, width: "25%", textAlign: "left" }}
                    >
                      닉네임
                    </th>
                    <HeaderWithSort
                      label="등급"
                      sortAsc="USER_GRADE,asc"
                      sortDesc="USER_GRADE,desc"
                      active={`${sortField},${sortOrder}`}
                      onSelect={(value) => {
                        const [field, order] = value.split(",");
                        handleSortSelect(field, order);
                        setSortMenuOpen(null);
                      }}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      style={{ ...styles.th, width: "10%" }}
                    />
                    <StatusHeader
                      active={statusFilter}
                      onSelect={(val) => {
                        handleStatusFilterChange(val);
                        setSortMenuOpen(null);
                      }}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      style={{ ...styles.th, width: "12%" }}
                    />
                    <RoleHeader
                      active={roleFilter}
                      onSelect={(val) => {
                        handleRoleFilterChange(val);
                        setSortMenuOpen(null);
                      }}
                      menuRef={sortMenuRef}
                      openKey={sortMenuOpen}
                      setOpenKey={setSortMenuOpen}
                      style={{ ...styles.th, width: "13%" }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr
                        key={user.userId}
                        style={styles.trHover}
                        onClick={() => handleUserClick(user.userId)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(25, 118, 210, 0.25)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <td style={styles.tdCenter}>{user.userId}</td>
                        <td style={styles.tdLeft}>{user.userEmail}</td>
                        <td style={styles.tdLeft}>{user.userNickName}</td>
                        <td style={styles.tdCenter}>{user.userGrade}</td>
                        <td style={styles.tdCenter}>
                          <span
                            style={styles.statusBadge(
                              isDeletedMap[user.isDeleted]?.color
                            )}
                          >
                            {isDeletedMap[user.isDeleted]?.label || "-"}
                          </span>
                        </td>
                        <td style={styles.tdCenter}>
                          <span
                            style={{
                              ...styles.role,
                              backgroundColor:
                                user.userRole === "ROLE_ADMIN"
                                  ? "#ffb74d"
                                  : "#64b5f6",
                            }}
                          >
                            {user.userRole.replace("ROLE_", "")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ ...styles.emptyRow, textAlign: "center" }}
                      >
                        ❌ 검색된 유저가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ 페이지네이션 (5단위) */}
            <div style={styles.pagination}>
              <button
                onClick={handlePrevGroup}
                disabled={pageGroup === 1}
                style={{
                  ...styles.pageButton,
                  ...(pageGroup === 1 ? styles.pageButtonDisabled : {}),
                }}
              >
                ◀
              </button>

              {pageNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() =>
                    findUser(
                      num,
                      searchEmail,
                      sortField,
                      sortOrder,
                      roleFilter,
                      statusFilter
                    )
                  }
                  style={{
                    ...styles.pageNumber,
                    ...(num === pageInfo.page ? styles.activePage : {}),
                  }}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handleNextGroup}
                disabled={endPage >= pageInfo.totalPages}
                style={{
                  ...styles.pageButton,
                  ...(endPage >= pageInfo.totalPages
                    ? styles.pageButtonDisabled
                    : {}),
                }}
              >
                ▶
              </button>
            </div>
          </>
        )}
      </div>

      {selectedUser && (
        <AdminUserDetailModal userId={selectedUser} onClose={closeModal} />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "'Pretendard', sans-serif",
    color: "#e5e7eb",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: "14px",
    border: "1px solid #1f2937",
    padding: "18px",
    boxShadow: "0 2px 14px rgba(0,0,0,0.35)",
    color: "#e5e7eb",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  sortHint: {
    color: "#94a3b8",
    fontSize: "13px",
  },
  searchGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchInput: {
    width: "320px",
    maxWidth: "60vw",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #1f2937",
    backgroundColor: "#111827",
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "1px solid #1976d2",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },
  sortSelect: {
    backgroundColor: "#111827",
    color: "#fff",
    border: "1px solid #1f2937",
    borderRadius: "8px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  tableContainer: {
    width: "100%",
    borderRadius: "10px",
    overflow: "visible",
    border: "1px solid #1f2937",
    backgroundColor: "#0d1117",
    boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "#e5e7eb",
  },
  thead: {
    backgroundColor: "#1c1f26",
  },
  th: {
    padding: "12px 10px",
    textAlign: "center",
    borderBottom: "1px solid #1f2937",
    fontSize: "13px",
  },
  tdLeft: {
    padding: "10px 10px",
    textAlign: "left",
    borderBottom: "1px solid #1f2937",
    fontSize: "13px",
  },
  tdCenter: {
    padding: "10px 10px",
    textAlign: "center",
    borderBottom: "1px solid #1f2937",
    fontSize: "13px",
  },
  trHover: {
    transition: "background-color 0.25s ease",
  },
  emptyRow: {
    padding: "20px",
    color: "#94a3b8",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  pageButton: {
    padding: "8px 12px",
    backgroundColor: "#0b1220",
    color: "#e5e7eb",
    border: "1px solid #1f2937",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "700",
  },
  pageButtonDisabled: {
    backgroundColor: "#111827",
    cursor: "not-allowed",
    color: "#475569",
    borderColor: "#1f2937",
  },
  pageNumber: {
    border: "1px solid #1f2937",
    backgroundColor: "#111827",
    color: "#e5e7eb",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "700",
  },
  activePage: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
    fontWeight: "800",
  },
  sortMenu: {
    position: "absolute",
    top: "105%",
    left: 0,
    backgroundColor: "#0d1117",
    border: "1px solid #1f2937",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    overflow: "hidden",
    minWidth: "190px",
    maxWidth: "calc(100vw - 24px)",
    zIndex: 1000,
  },
  sortMenuItem: {
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "10px 12px",
    color: "#dbe4ff",
    cursor: "pointer",
    fontSize: "13px",
  },
  sortMenuItemActive: {
    backgroundColor: "rgba(124,141,245,0.18)",
    color: "#e5ecff",
  },
  headerButton: {
    background: "transparent",
    border: "none",
    color: "#b4c2e0",
    fontWeight: 800,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    width: "100%",
    justifyContent: "center",
  },
  caret: {
    fontSize: "10px",
    color: "#94a3b8",
  },
  role: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  statusBadge: (bg) => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#0f172a",
    backgroundColor: bg || "#94a3b8",
  }),
  subText: {
    color: "#94a3b8",
    fontSize: "13px",
  },
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
  style,
}) {
  const isOpen = openKey === label;
  return (
    <th
      style={{ ...style, position: "relative" }}
      ref={isOpen ? menuRef : null}
    >
      <button
        style={styles.headerButton}
        onClick={() => setOpenKey(isOpen ? null : label)}
      >
        <span>{label}</span>
        <span style={styles.caret}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div style={styles.sortMenu}>
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

function RoleHeader({ active, onSelect, menuRef, openKey, setOpenKey, style }) {
  const isOpen = openKey === "role";
  const options = [
    { value: "all", label: "전체보기" },
    { value: "admin", label: "관리자" },
    { value: "user", label: "유저" },
  ];
  return (
    <th
      style={{ ...style, position: "relative" }}
      ref={isOpen ? menuRef : null}
    >
      <button
        style={styles.headerButton}
        onClick={() => setOpenKey(isOpen ? null : "role")}
      >
        <span>권한</span>
        <span style={styles.caret}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div style={styles.sortMenu}>
          {options.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.sortMenuItem,
                ...(active === opt.value ? styles.sortMenuItemActive : {}),
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

function StatusHeader({
  active,
  onSelect,
  menuRef,
  openKey,
  setOpenKey,
  style,
}) {
  const isOpen = openKey === "status";
  const options = [
    { value: "all", label: "전체" },
    { value: "active", label: "가입중" },
    { value: "deleted", label: "탈퇴" },
    { value: "banned", label: "추방" },
  ];
  return (
    <th
      style={{ ...style, position: "relative" }}
      ref={isOpen ? menuRef : null}
    >
      <button
        style={styles.headerButton}
        onClick={() => setOpenKey(isOpen ? null : "status")}
      >
        <span>가입 상태</span>
        <span style={styles.caret}>{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div style={styles.sortMenu}>
          {options.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.sortMenuItem,
                ...(active === opt.value ? styles.sortMenuItemActive : {}),
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
