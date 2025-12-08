import axios from "axios";
import React, { useState, useEffect } from "react";

const AdminUserDetailModal = ({ userId, onClose }) => {
  const API_BASE_URL = "http://localhost:9443/admin";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(""); // ✅ 이전 에러 초기화
        setStatusMessage(""); // ✅ 이전 상태 초기화
        setUser(null); // ✅ 이전 유저 정보 초기화 (중복 방지)

        const res = await axios.get(`${API_BASE_URL}/userdetail/${userId}`);
        if (res.data.message === "success") {
          setUser(res.data.data);
        } else {
          setError("데이터를 불러오지 못했습니다.");
        }
      } catch (err) {
        console.error("❌ 유저 상세 조회 오류:", err);
        setError("서버 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserDetail();
  }, [userId]);

  if (loading) return <div style={styles.loading}>⏳ 로딩 중...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (!user) return null;

  const isSubscribed = user.subscriptionStatus === "ACTIVE" ? true : false;

  // 구독 결제가 이루어졌는지 확인
  const handleCheckSubscription = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/subscribecheck/${userId}`);
      if (res.data.message === "success") {
        setUser(res.data.data);
      } else {
        setError("데이터를 불러오지 못했습니다.");
      }
    } catch (err) {
      console.error("❌ 유저 상세 조회 오류:", err);
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }

    if (isSubscribed) {
      setStatusMessage(
        `✅ 구독중 (${user.userSubscribeStart} ~ ${user.userSubscribeEnd})`
      );
    } else {
      setStatusMessage("❌ 현재 구독중이 아닙니다.");
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>👤 유저 상세정보</h3>

        <div style={styles.infoBox}>
          <p>
            <strong>ID:</strong> {user.userId}
          </p>
          <p>
            <strong>이메일:</strong> {user.userEmail}
          </p>
          <p>
            <strong>이름:</strong> {user.userName}
          </p>
          <p>
            <strong>닉네임:</strong> {user.userNickName}
          </p>
          <p>
            <strong>권한:</strong> {user.userRole}
          </p>
          <p>
            <strong>등급:</strong> {user.userGrade}
          </p>
          <p>
            <strong>포인트:</strong> {user.userPoint.toLocaleString()}P
          </p>

          <hr style={styles.divider} />
          <p>
            <strong>가입일:</strong> {user.userCreateAt}
          </p>
          <p>
            <strong>탈퇴일:</strong>{" "}
            {user.userDeleteAt ? user.userDeleteAt : "탈퇴하지 않음"}
          </p>

          <hr style={styles.divider} />

          {/* ✅ 구독 상태 섹션 */}
          <div style={styles.subscriptionRow}>
            <div style={{ flex: 1 }}>
              {isSubscribed ? (
                <>
                  <p>
                    <strong>구독 시작일:</strong> {user.userSubscribeStart}
                  </p>
                  <p>
                    <strong>구독 종료일:</strong> {user.userSubscribeEnd}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>구독 상태:</strong> 구독중이지 않습니다.
                  </p>
                </>
              )}
            </div>

            {isSubscribed ? (
              <button
                style={{
                  ...styles.checkBtn,
                  backgroundColor: "#555",
                  cursor: "not-allowed",
                  opacity: 0.6,
                }}
                disabled
              >
                구독 중
              </button>
            ) : (
              <button style={styles.checkBtn} onClick={handleCheckSubscription}>
                🔍 구독 상태 체크
              </button>
            )}
          </div>

          {statusMessage && <p style={styles.statusText}>{statusMessage}</p>}
        </div>

        <button style={styles.closeBtn} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default AdminUserDetailModal;

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    backgroundColor: "#1f2430",
    color: "#fff",
    padding: "24px",
    borderRadius: "12px",
    width: "420px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.5)",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "15px",
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#2a2f3d",
    borderRadius: "10px",
    padding: "15px",
    lineHeight: "1.6",
    fontSize: "14px",
  },
  divider: {
    border: "0.5px solid rgba(255,255,255,0.1)",
    margin: "10px 0",
  },
  subscriptionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  checkBtn: {
    backgroundColor: "#43a047",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    height: "fit-content",
    alignSelf: "center",
    whiteSpace: "nowrap",
    fontWeight: "600",
  },
  statusText: {
    marginTop: "10px",
    textAlign: "center",
    color: "#90caf9",
    fontWeight: "500",
  },
  closeBtn: {
    marginTop: "18px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "10px 0",
    borderRadius: "8px",
    cursor: "pointer",
    width: "100%",
    fontSize: "15px",
    fontWeight: "bold",
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: "30px",
  },
  error: {
    color: "#ff5252",
    textAlign: "center",
    marginTop: "30px",
  },
};
