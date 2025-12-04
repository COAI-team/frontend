import axios from "axios";
import React, { useState, useEffect } from "react";

const AdminUserDetailModal = ({ userId, onClose }) => {
  const API_BASE_URL = "http://localhost:9443/admin";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 모달이 열릴 때 userId로 상세 조회
  useEffect(() => {
    const fetchUserDetail = async () => {
      console.log("userId ===> ", userId);
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/userdetail/${userId}`);

        if (res.data.message === "success") {
          setUser(res.data.data); // 서버에서 data에 user 객체가 들어있다고 가정
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

  // ✅ 로딩 상태, 에러 처리
  // if (loading) return <div style={styles.loading}>⏳ 로딩 중...</div>;
  // if (error) return <div style={styles.error}>{error}</div>;
  // if (!user) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>👤 유저 상세정보</h3>
        <p>{/* <strong>ID:</strong> {user.userId} */}</p>
        <p>{/* <strong>이메일:</strong> {user.userEmail} */}</p>
        <p>{/* <strong>닉네임:</strong> {user.userNickName} */}</p>
        <p>{/* <strong>등급:</strong> {user.userGrade} */}</p>
        <p>{/* <strong>권한:</strong> {user.userRole} */}</p>

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
    backgroundColor: "#1c1f26",
    color: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "350px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    marginTop: "15px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
  },
  loading: {
    color: "#fff",
    textAlign: "center",
  },
  error: {
    color: "#ff5252",
    textAlign: "center",
  },
};
