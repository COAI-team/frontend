// src/pages/payment/PricingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../server/AxiosConfig";
import "./pricing.css";



const PLANS = {
  free: { code: "FREE", name: "Free", price: 0 },
  basic: { code: "BASIC", name: "Basic", price: 39800 },
  pro: { code: "PRO", name: "Pro", price: 42900 },
};

const freeFeatures = [
  { ok: true, text: "질문: 하루 3회까지 이용 가능" },
  { ok: false, text: "시선 추적 기능 미지원" },
  { ok: true, text: "기본 기능 대부분 이용 가능" },
  { ok: true, text: "결제 없이 바로 사용 시작" },
];

const basicFeatures = [
  { ok: true, text: "질문: 무제한 이용 가능" },
  { ok: false, text: "시선 추적 기능 미지원" },
  { ok: true, text: "모든 기본 기능 포함" },
  { ok: true, text: "첫 결제일 기준 7일 이내 전액 환불" },
  { ok: true, text: "언제든지 해지 가능 (해지 시 다음 달부터 결제 중단)" },
];

const proFeatures = [
  { ok: true, text: "질문: 무제한 이용 가능" },
  { ok: true, text: "시선 추적 기능 지원" },
  { ok: true, text: "모든 기능 이용 가능" },
  { ok: true, text: "첫 결제일 기준 7일 이내 전액 환불" },
  { ok: true, text: "언제든지 해지 가능 (해지 시 다음 달부터 결제 중단)" },
];

const IconCheck = ({ color = "#16a34a" }) => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <polyline
      points="5 12.5 10 17.5 19 7"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconX = ({ color = "#ef4444" }) => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const renderFeatures = (items) => (
  <div className="feature-list">
    {items.map((item, idx) => (
      <p key={idx} className="feature-line">
        <span className={`feature-icon ${item.ok ? "ok" : "no"}`}>
          {item.ok ? <IconCheck /> : <IconX />}
        </span>
        <span className="feature-text">{item.text}</span>
      </p>
    ))}
  </div>
);

function PricingPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/payments/subscriptions/me");
        const list = Array.isArray(res.data) ? res.data : [];

        if (list.length === 0) {
          setCurrentPlan("FREE");
        } else {
          const active = list.find((s) => s.status === "ACTIVE") || list[0];
          const type = (active.subscriptionType || "FREE").toUpperCase();
          setCurrentPlan(type);
        }
      } catch (e) {
        console.error("구독 상태 조회 실패:", e);
        setCurrentPlan("FREE");
        setErrorMsg("구독 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosInstance.get("/users/me");
        const data = res.data || {};
        setUserName(data.userNickname || data.userName || "");
      } catch (e) {
        console.warn("내 정보 조회 실패(이름 표시 생략):", e);
      }
    };
    fetchMe();
  }, []);

  const currentPlanLabel =
    currentPlan === "BASIC" ? "Basic" : currentPlan === "PRO" ? "Pro" : "Free";

  const isBasicCurrent = currentPlan === "BASIC";
  const isProCurrent = currentPlan === "PRO";

  const handleSelectPlan = (planKey) => {
    if (isProCurrent) return; // Pro 구독자는 선택 불가
    if (isBasicCurrent && planKey === "basic") return; // Basic 사용 중이면 Basic 선택 불가
    setSelectedPlan((prev) => (prev === planKey ? null : planKey));
  };

  const handleProceed = () => {
    if (!selectedPlan) return;
    navigate(`/pages/payment/buy?plan=${selectedPlan}`);
  };

  const cardClass = (key, options = {}) => {
    const { variant, disabled, dimmed, current } = options;
    const classes = ["card", variant === "purple" ? "card-purple" : "card-white"];
    if (disabled && !current) classes.push("card-disabled");
    if (dimmed && !disabled && !current) classes.push("card-dimmed");
    if (selectedPlan === key) classes.push("card-selected");
    return classes.join(" ");
  };

  return (
    <div className="pricing-page">
      <div className="pricing-inner">
        {/* 구독 상태 배너 */}
        <div style={{ marginBottom: 28 }}>
          <div className="status-banner">
            <div className="status-icon">i</div>
            <div>
              <div className="status-title">
                {(userName || "사용자")}님의 구독 상태
              </div>
              <div className="status-text">
                {currentPlan === "FREE"
                  ? "현재 무료 구독입니다. Free 플랜을 이용 중입니다."
                  : `${currentPlanLabel} 구독 중입니다.`}
              </div>
            </div>
          </div>
          {errorMsg && (
            <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errorMsg}</p>
          )}
        </div>

        {/* 요금제 카드 */}
        <div className="cards-grid">
          {/* Free 카드 */}
          <div className={cardClass("free", { variant: "white", disabled: true })}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Free</h3>
                <span className="badge" style={{ backgroundColor: "#e5e7eb", color: "#4b5563" }}>
                  결제 없이 이용 가능
                </span>
              </div>

              <div className="price-text">
                <span style={{ fontSize: 24, fontWeight: 800 }}>Free</span>
              </div>

              {renderFeatures(freeFeatures)}
            </div>

            <button className="card-button secondary disabled" disabled>
              선택 불가
            </button>
          </div>

          {/* Basic 카드 */}
          <div
            className={cardClass("basic", {
              variant: "purple",
              disabled: isBasicCurrent || isProCurrent,
              dimmed: selectedPlan === "pro",
              current: isBasicCurrent,
            })}
            onClick={() => handleSelectPlan("basic")}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Basic</h3>

                {isBasicCurrent && (
                  <span className="badge" style={{ backgroundColor: "#22c55e", color: "#064e3b" }}>
                    구독 중
                  </span>
                )}

                {isProCurrent && (
                  <span className="badge" style={{ backgroundColor: "#6b7280", color: "#e5e7eb" }}>
                    Pro 구독 중
                  </span>
                )}

                {!isBasicCurrent && !isProCurrent && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: selectedPlan === "basic" ? "#22c55e" : "#312e81",
                      color: selectedPlan === "basic" ? "#064e3b" : "#fff",
                    }}
                  >
                    {selectedPlan === "basic" ? "선택됨" : "선택 가능"}
                  </span>
                )}
              </div>

              <div className="price-text">
                <span style={{ marginRight: 6 }}>₩</span>
                <span>{PLANS.basic.price.toLocaleString()}</span>
              </div>

              {renderFeatures(basicFeatures)}
            </div>

            <button
              className={`card-button ${
                isBasicCurrent || isProCurrent ? "secondary disabled" : "primary"
              }`}
              disabled={isBasicCurrent || isProCurrent}
            >
              {isBasicCurrent
                ? "구독 중"
                : isProCurrent
                ? "선택 불가"
                : selectedPlan === "basic"
                ? "선택 취소"
                : "선택"}
            </button>
          </div>

          {/* Pro 카드 */}
          <div
            className={cardClass("pro", {
              variant: "purple",
              disabled: isProCurrent,
              dimmed: selectedPlan === "basic",
              current: isProCurrent,
            })}
            onClick={() => handleSelectPlan("pro")}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Pro</h3>

                {isProCurrent && (
                  <span className="badge" style={{ backgroundColor: "#22c55e", color: "#064e3b" }}>
                    구독 중
                  </span>
                )}

                {!isProCurrent && isBasicCurrent && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: selectedPlan === "pro" ? "#22c55e" : "#f97316",
                      color: selectedPlan === "pro" ? "#064e3b" : "#111827",
                    }}
                  >
                    {selectedPlan === "pro" ? "업그레이드 선택됨" : "업그레이드 가능"}
                  </span>
                )}

                {!isProCurrent && !isBasicCurrent && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: selectedPlan === "pro" ? "#22c55e" : "#312e81",
                      color: selectedPlan === "pro" ? "#064e3b" : "#fff",
                    }}
                  >
                    {selectedPlan === "pro" ? "선택됨" : "선택 가능"}
                  </span>
                )}
              </div>

              <div className="price-text">
                <span style={{ marginRight: 6 }}>₩</span>
                <span>{PLANS.pro.price.toLocaleString()}</span>
              </div>

              {renderFeatures(proFeatures)}
            </div>

            <button
              className={`card-button ${isProCurrent ? "secondary disabled" : "primary"}`}
              disabled={isProCurrent}
            >
              {isProCurrent
                ? "구독 중"
                : isBasicCurrent
                ? selectedPlan === "pro"
                  ? "업그레이드 선택 취소"
                  : "업그레이드"
                : selectedPlan === "pro"
                ? "선택 취소"
                : "선택"}
            </button>
          </div>
        </div>

        {/* 결제 진행 버튼 */}
        <div className="proceed-wrapper">
          <button
            className={`proceed-button ${!selectedPlan || loading ? "disabled" : ""}`}
            disabled={!selectedPlan || loading}
            onClick={handleProceed}
          >
            결제 진행하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
