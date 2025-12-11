import axios from "axios";
import { useState, useEffect } from "react";
import AdminUserDetailModal from "./AdminUserDetailModal";

export default function AdminUsers() {
  const API_BASE_URL = "http://localhost:9443/admin";
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
      const res = await axios.get(
        `${API_BASE_URL}/users?page=${page}&size=10${queryEmail}${querySort}${queryRole}${queryStatus}`
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

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split(",");
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
      <h2 style={styles.title}>👥 관리자 유저 목록</h2>

      {/* ✅ 필터 버튼 */}
      <div style={styles.filterRow}>
        <div style={styles.filterButtons}>
          {[
            { label: "전체보기", value: "all" },
            { label: "관리자", value: "admin" },
            { label: "유저", value: "user" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleRoleFilterChange(btn.value)}
              style={{
                ...styles.filterButton,
                ...(roleFilter === btn.value ? styles.activeFilter : {}),
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={styles.statusButtons}>
          {[
            { label: "가입 상태 전체", value: "all" },
            { label: "가입 중", value: "active" },
            { label: "탈퇴", value: "deleted" },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => handleStatusFilterChange(btn.value)}
              style={{
                ...styles.statusButton,
                ...(statusFilter === btn.value
                  ? styles.activeStatusFilter
                  : {}),
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ 검색 + 정렬 */}
      <div style={{ ...styles.searchBox, justifyContent: "space-between" }}>
        <div>
          <input
            type="text"
            placeholder="이메일을 입력하세요"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            style={styles.searchInput}
          />
          <button onClick={handleSearch} style={styles.searchButton}>
            🔍 검색
          </button>
        </div>

        <select
          value={`${sortField},${sortOrder}`}
          onChange={handleSortChange}
          style={styles.sortSelect}
        >
          <option value="USER_ID,desc">ID 내림차순</option>
          <option value="USER_ID,asc">ID 오름차순</option>
          <option value="USER_GRADE,desc">등급 높은 순</option>
          <option value="USER_GRADE,asc">등급 낮은 순</option>
          <option value="USER_ROLE,asc">권한 오름차순</option>
          <option value="USER_ROLE,desc">권한 내림차순</option>
        </select>
      </div>

      {loading ? (
        <p>⏳ 로딩 중...</p>
      ) : (
        <>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={{ textAlign: "center", width: "8%" }}>ID</th>
                <th style={{ textAlign: "left", width: "35%" }}>이메일</th>
                <th style={{ textAlign: "left", width: "25%" }}>닉네임</th>
                <th style={{ textAlign: "center", width: "10%" }}>등급</th>
                <th style={{ textAlign: "center", width: "15%" }}>권한</th>
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
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ textAlign: "center" }}>{user.userId}</td>
                    <td style={{ textAlign: "left" }}>{user.userEmail}</td>
                    <td style={{ textAlign: "left" }}>{user.userNickName}</td>
                    <td style={{ textAlign: "center" }}>{user.userGrade}</td>
                    <td style={{ textAlign: "center" }}>
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
                    colSpan="5"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    ❌ 검색된 유저가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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

      {selectedUser && (
        <AdminUserDetailModal userId={selectedUser} onClose={closeModal} />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "'Pretendard', sans-serif",
    color: "#fff",
  },
  title: {
    fontSize: "22px",
    marginBottom: "20px",
    fontWeight: "700",
    textAlign: "center",
  },
  filterButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  filterRow: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
  },
  filterButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#444",
    backgroundColor: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  activeFilter: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
  statusButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  statusButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#444",
    backgroundColor: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  activeStatusFilter: {
    backgroundColor: "#2dd4bf",
    borderColor: "#2dd4bf",
    color: "#0d1117",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },
  searchInput: {
    width: "300px",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#111",
    color: "#fff",
  },
  searchButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    marginLeft: "8px",
  },
  sortSelect: {
    backgroundColor: "#111",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#0d1117",
    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  thead: {
    backgroundColor: "#1c1f26",
  },
  trHover: {
    transition: "background-color 0.25s ease",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    marginTop: "15px",
  },
  pageButton: {
    padding: "6px 12px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  pageButtonDisabled: {
    backgroundColor: "#444",
    cursor: "not-allowed",
  },
  pageNumber: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#444",
    backgroundColor: "#111",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  activePage: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
    fontWeight: "bold",
  },
  role: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
