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

  // ✅ 정렬 + 필터 상태
  const [sortField, setSortField] = useState("USER_ID");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filter, setFilter] = useState("all"); // 전체, admin, user, active, deleted

  // ✅ 유저 조회
  const findUser = async (
    page = 1,
    email = "",
    sortField = "USER_ID",
    sortOrder = "desc",
    filter = "all"
  ) => {
    try {
      setLoading(true);
      const queryEmail = email ? `&userEmail=${encodeURIComponent(email)}` : "";
      const querySort = `&sortField=${sortField}&sortOrder=${sortOrder}`;
      const queryStatus =
        filter !== "all" ? `&filter=${filter}` : "&filter=all";
      const res = await axios.get(
        `${API_BASE_URL}/users?page=${page}&size=10${queryEmail}${querySort}${queryStatus}`
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
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 필터/정렬 변경 시 자동 재조회
  useEffect(() => {
    findUser(1, searchEmail, sortField, sortOrder, filter);
  }, [sortField, sortOrder, filter]);

  const handleUserClick = (userId) => setSelectedUser(userId);
  const closeModal = () => setSelectedUser(null);

  const handlePrev = () => {
    if (pageInfo.hasPrevious)
      findUser(pageInfo.page - 1, searchEmail, sortField, sortOrder, filter);
  };

  const handleNext = () => {
    if (pageInfo.hasNext)
      findUser(pageInfo.page + 1, searchEmail, sortField, sortOrder, filter);
  };

  const handleSearch = () => {
    findUser(1, searchEmail.trim(), sortField, sortOrder, filter);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // ✅ 정렬 변경
  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split(",");
    setSortField(field);
    setSortOrder(order);
  };

  // ✅ 상태 필터 버튼 클릭
  const handleStatusChange = (status) => {
    setFilter(status);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 관리자 유저 목록</h2>

      {/* ✅ 필터 버튼들 */}
      <div style={styles.filterButtons}>
        {[
          { label: "전체보기", value: "all" },
          { label: "관리자", value: "admin" },
          { label: "유저", value: "user" },
          { label: "가입 중", value: "active" },
          { label: "탈퇴", value: "deleted" },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleStatusChange(btn.value)}
            style={{
              ...styles.filterButton,
              ...(filter === btn.value ? styles.activeFilter : {}),
            }}
          >
            {btn.label}
          </button>
        ))}
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

        {/* ✅ 정렬 드롭다운 */}
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
          {/* ✅ 유저 테이블 */}
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

          {/* ✅ 페이지네이션 */}
          <div style={styles.pagination}>
            <button
              onClick={handlePrev}
              disabled={!pageInfo.hasPrevious}
              style={{
                ...styles.pageButton,
                ...(pageInfo.hasPrevious ? {} : styles.pageButtonDisabled),
              }}
            >
              ◀ 이전
            </button>

            {Array.from({ length: pageInfo.totalPages }, (_, i) => i + 1).map(
              (num) => (
                <button
                  key={num}
                  onClick={() =>
                    findUser(num, searchEmail, sortField, sortOrder, filter)
                  }
                  style={{
                    ...styles.pageNumber,
                    ...(num === pageInfo.page ? styles.activePage : {}),
                  }}
                >
                  {num}
                </button>
              )
            )}

            <button
              onClick={handleNext}
              disabled={!pageInfo.hasNext}
              style={{
                ...styles.pageButton,
                ...(pageInfo.hasNext ? {} : styles.pageButtonDisabled),
              }}
            >
              다음 ▶
            </button>
          </div>
        </>
      )}

      {/* ✅ 유저 상세 모달 */}
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
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  filterButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  activeFilter: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
    color: "#fff",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    gap: "8px",
  },
  searchInput: {
    width: "300px",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#111",
    color: "#fff",
    outline: "none",
  },
  searchButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
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
    marginBottom: "20px",
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
    color: "#aaa",
  },
  pageNumber: {
    border: "1px solid #444",
    backgroundColor: "#111",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  activePage: {
    backgroundColor: "#1976d2",
    color: "#fff",
    borderColor: "#1976d2",
    fontWeight: "bold",
  },
  role: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
};
