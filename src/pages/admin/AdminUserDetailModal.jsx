import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../server/AxiosConfig";
import { useTheme } from "../../context/theme/useTheme";

const AdminUserDetailModal = ({ userId, onClose }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState("");
  const [subscriptionResult, setSubscriptionResult] = useState(null);
  const [banModalOpen, setBanModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(""); // ✅ 이전 에러 초기화
        setStatusMessage(""); // ✅ 이전 상태 초기화
        setUser(null); // ✅ 이전 유저 정보 초기화 (중복 방지)

        const res = await axiosInstance.get(`/admin/userdetail/${userId}`);
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

  const hasSubscriptionType =
    user.subscriptionType && user.subscriptionType.trim().length > 0;
  const isSubscribed = Boolean(hasSubscriptionType);
  const subscriptionTypeText = hasSubscriptionType
    ? user.subscriptionType
    : "구독중이지 않습니다.";

  const handleBanUser = async (userId) => {
    try {
      const res = await axiosInstance.post(`/admin/banuser/${userId}`);
      if (res.data.message === "success") {
        console.log("✅ 추방 성공:", res.data.data); // 2025-12-11T17:46:29

        // ✅ user 상태에 deletedAt 바로 반영
        setUser((prev) => ({
          ...prev,
          userDeleteAt: res.data.data, // 서버에서 받은 시간값
        }));

        setStatusMessage("🚫 유저가 성공적으로 추방되었습니다.");
      }
    } catch (err) {
      console.error("❌ 유저 추방 오류:", err);
      setStatusMessage("❌ 추방 중 오류가 발생했습니다.");
    }
  };

  // 구독 결제가 이루어졌는지 확인
  const handleCheckSubscription = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/subscribecheck/${userId}`);
      if (res.data.message === "success") {
        const isActive = Boolean(res.data.data);

        setSubscriptionResult(isActive);
        setSubscriptionModalMessage(
          isActive
            ? "구독이 확인되었습니다. 구독이 활성화 상태입니다."
            : "구독 결제내역이 없습니다."
        );

        setStatusMessage(
          isActive
            ? `✅ 구독중 (${user.userSubscribeStart} ~ ${user.userSubscribeEnd})`
            : "❌ 현재 구독중이 아닙니다."
        );

        // 구독 상태를 다시 반영하기 위해 유저 정보를 새로 가져옴
        const detailRes = await axiosInstance.get(
          `/admin/userdetail/${userId}`
        );
        if (detailRes.data.message === "success") {
          setUser(detailRes.data.data);
        }
      } else {
        setSubscriptionResult(false);
        setSubscriptionModalMessage("데이터를 불러오지 못했습니다.");
      }
    } catch (err) {
      console.error("❌ 유저 상세 조회 오류:", err);
      setSubscriptionResult(false);
      setSubscriptionModalMessage("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setSubscriptionModalOpen(true);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>👤 유저 상세정보</h3>

        <div style={styles.infoBox}>
          <div style={styles.idRow}>
            <p style={styles.idText}>
              <strong>ID:</strong> {user.userId}
            </p>
            {!user.userDeleteAt && (
              <button
                style={styles.banButton}
                onClick={() => setBanModalOpen(true)} // ✅ 추방 확인 모달 열기
              >
                🚫 추방
              </button>
            )}
          </div>
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
          {user.userRole !== "ROLE_ADMIN" && (
            <p>
              <strong>포인트:</strong> {user.userPoint.toLocaleString()}
            </p>
          )}
          <hr style={styles.divider} />
          <p>
            <strong>가입일:</strong> {user.userCreateAt}
          </p>
          <p>
            <strong>탈퇴일:</strong>{" "}
            {user.userDeleteAt ? user.userDeleteAt : "탈퇴하지 않음"}
          </p>

          <hr style={styles.divider} />

          {user.userRole !== "ROLE_ADMIN" && (
            <>
              {/* ✅ 구독 상태 섹션 */}
              <div style={styles.subscriptionRow}>
                <div style={{ flex: 1 }}>
                  {isSubscribed ? (
                    <>
                      <p>
                        <strong>구독 상태:</strong> {subscriptionTypeText}
                      </p>
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
                        <strong>구독 상태:</strong> {subscriptionTypeText}
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
                  <button
                    style={styles.checkBtn}
                    onClick={handleCheckSubscription}
                  >
                    🔍 구독 상태 체크
                  </button>
                )}
              </div>

              {statusMessage && (
                <p style={styles.statusText}>{statusMessage}</p>
              )}
            </>
          )}
        </div>

        <button style={styles.closeBtn} onClick={onClose}>
          닫기
        </button>
      </div>

      {subscriptionModalOpen && (
        <div
          style={styles.subscriptionModalOverlay}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.subscriptionModal}>
            <div style={styles.subscriptionModalHeader}>
              <h3 style={styles.subscriptionModalTitle}>구독 상태 확인</h3>
            </div>
            <div style={styles.subscriptionModalBody}>
              <p
                style={{
                  ...styles.subscriptionModalMessage,
                  color: subscriptionResult ? "#4caf50" : "#ff5252",
                }}
              >
                {subscriptionModalMessage}
              </p>
            </div>
            <div style={styles.subscriptionModalFooter}>
              <button
                type="button"
                style={styles.subscriptionModalButton}
                onClick={() => setSubscriptionModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {banModalOpen && (
        <div
          style={styles.subscriptionModalOverlay}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.banModal}>
            <div style={styles.subscriptionModalHeader}>
              <h3 style={styles.subscriptionModalTitle}>추방 확인</h3>
            </div>
            <div style={styles.subscriptionModalBody}>
              <p style={styles.subscriptionModalMessage}>
                해당 유저를 정말 추방하시겠습니까?
              </p>
            </div>
            <div style={styles.banModalFooter}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setBanModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                style={styles.banButtonConfirm}
                onClick={async () => {
                  await handleBanUser(user.userId);
                  setBanModalOpen(false);
                }}
              >
                추방하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailModal;

const getStyles = (theme) => {
  const isLight = theme === "light";
  return {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isLight ? "rgba(15, 23, 42, 0.35)" : "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
    },
    modal: {
      backgroundColor: isLight ? "#ffffff" : "#1f2430",
      color: isLight ? "#0f172a" : "#fff",
      padding: "24px",
      borderRadius: "12px",
      width: "420px",
      boxShadow: isLight
        ? "0 8px 24px rgba(15, 23, 42, 0.12)"
        : "0 6px 15px rgba(0,0,0,0.5)",
      border: isLight ? "1px solid #e2e8f0" : "1px solid transparent",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "15px",
      textAlign: "center",
      color: isLight ? "#0f172a" : "#fff",
    },
    infoBox: {
      backgroundColor: isLight ? "#f8fafc" : "#2a2f3d",
      borderRadius: "10px",
      padding: "15px",
      lineHeight: "1.6",
      fontSize: "14px",
      color: isLight ? "#0f172a" : "#e5e7eb",
      border: isLight ? "1px solid #e2e8f0" : "1px solid transparent",
    },
    idRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    idText: {
      margin: 0,
    },
    banButton: {
      backgroundColor: "#ff7043",
      border: "none",
      color: "#fff",
      padding: "6px 10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
    },
    divider: {
      border: isLight
        ? "0.5px solid rgba(15, 23, 42, 0.12)"
        : "0.5px solid rgba(255,255,255,0.1)",
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
      color: isLight ? "#2563eb" : "#90caf9",
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
      color: isLight ? "#0f172a" : "#fff",
      textAlign: "center",
      marginTop: "30px",
    },
    error: {
      color: "#ff5252",
      textAlign: "center",
      marginTop: "30px",
    },
    subscriptionModalOverlay: {
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
      zIndex: 1000,
      padding: "0 16px",
    },
    subscriptionModal: {
      width: "100%",
      maxWidth: "420px",
      backgroundColor: isLight ? "#ffffff" : "#1f2430",
      border: `1px solid ${isLight ? "#e2e8f0" : "#3c4458"}`,
      borderRadius: "12px",
      boxShadow: isLight
        ? "0 14px 32px rgba(15, 23, 42, 0.15)"
        : "0 12px 32px rgba(0,0,0,0.35)",
    },
    subscriptionModalHeader: {
      padding: "14px 18px",
      borderBottom: `1px solid ${isLight ? "#e2e8f0" : "#2f3545"}`,
    },
    subscriptionModalTitle: {
      margin: 0,
      fontSize: "17px",
      fontWeight: 700,
      color: isLight ? "#0f172a" : "#fff",
    },
    subscriptionModalBody: {
      padding: "16px 18px",
      color: isLight ? "#0f172a" : "#e5e7eb",
    },
    subscriptionModalMessage: {
      margin: 0,
      fontSize: "14px",
      lineHeight: 1.5,
    },
    subscriptionModalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "12px 18px",
      borderTop: `1px solid ${isLight ? "#e2e8f0" : "#2f3545"}`,
    },
    subscriptionModalButton: {
      backgroundColor: "#1976d2",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },
    banModal: {
      width: "100%",
      maxWidth: "420px",
      backgroundColor: isLight ? "#ffffff" : "#1f2430",
      border: `1px solid ${isLight ? "#e2e8f0" : "#3c4458"}`,
      borderRadius: "12px",
      boxShadow: isLight
        ? "0 14px 32px rgba(15, 23, 42, 0.15)"
        : "0 12px 32px rgba(0,0,0,0.35)",
    },
    banModalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      padding: "12px 18px",
      borderTop: `1px solid ${isLight ? "#e2e8f0" : "#2f3545"}`,
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
    banButtonConfirm: {
      backgroundColor: "#ff5252",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },
  };
};
