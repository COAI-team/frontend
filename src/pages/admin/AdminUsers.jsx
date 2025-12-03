import axios from "axios";
import { useState, useEffect } from "react";

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
  const [searchEmail, setSearchEmail] = useState(""); // ✅ 검색 상태 추가

  const findUser = async (page = 1, email = "") => {
    try {
      setLoading(true);
      const query = email ? `&userEmail=${encodeURIComponent(email)}` : "";
      const res = await axios.get(
        `${API_BASE_URL}/users?page=${page}&size=10${query}`
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

  useEffect(() => {
    findUser();
  }, []);

  const handlePrev = () => {
    if (pageInfo.hasPrevious) findUser(pageInfo.page - 1, searchEmail);
  };

  const handleNext = () => {
    if (pageInfo.hasNext) findUser(pageInfo.page + 1, searchEmail);
  };

  const handleSearch = () => {
    findUser(1, searchEmail.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 관리자 유저 목록</h2>

      {/* ✅ 검색창 */}
      <div style={styles.searchBox}>
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
                  onClick={() => findUser(num, searchEmail)}
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
    color: "#fff",
  },
  searchBox: {
    display: "flex",
    justifyContent: "center",
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
  th: {
    borderBottom: "2px solid #2b2f3a",
    padding: "12px 10px",
    fontWeight: "600",
    color: "#ddd",
  },
  td: {
    borderBottom: "1px solid #2b2f3a",
    padding: "10px",
    color: "#eee",
    transition: "background-color 0.2s ease",
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
    transition: "background 0.2s ease",
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
    margin: "0 2px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
