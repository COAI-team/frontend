// src/pages/payment/PricingPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const plans = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 39800,
    priceLabel: "₩39,800",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 42900,
    priceLabel: "₩42,900",
  },
};

function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null); // 처음엔 아무 것도 선택 X

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleProceed = () => {
    if (!selectedPlan) {
      alert("먼저 플랜을 선택해주세요.");
      return;
    }

    if (selectedPlan === "free") {
      alert("Free 플랜은 결제가 필요하지 않습니다. (추후 무료 플랜 로직 연결 가능)");
      return;
    }

    navigate(`/pages/payment/buy?plan=${selectedPlan}`);
  };

  const isSelected = (planId) => selectedPlan === planId;

  const cardBaseStyle = {
    flex: "0 1 260px",
    borderRadius: "12px",
    padding: "24px 20px",
    boxSizing: "border-box",
    transition:
      "transform .2s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease",
  };

  const renderPlanCard = (planId) => {
    const plan = plans[planId];
    const selected = isSelected(planId);

    const bgColor = selected ? "#4b2acf" : "#ffffff";
    const textColor = selected ? "#ffffff" : "#000000";
    const shadow = selected
      ? "0 0 25px rgba(75, 42, 207, 0.6)"
      : "0 10px 20px rgba(0,0,0,0.25)";
    const scale = selected ? "scale(1.04)" : "scale(1)";

    const buttonBg = selected ? "#ffffff" : "#4b2acf";
    const buttonColor = selected ? "#4b2acf" : "#ffffff";

    return (
      <div
        key={planId}
        style={{
          ...cardBaseStyle,
          backgroundColor: bgColor,
          color: textColor,
          boxShadow: shadow,
          transform: scale,
        }}
      >
        <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>{plan.name}</h2>
        <p
          style={{
            fontSize: planId === "free" ? "28px" : "30px",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          {plan.priceLabel}
        </p>

        <button
          type="button"
          onClick={() => handleSelectPlan(planId)}
          style={{
            width: "100%",
            padding: "11px 0",
            backgroundColor: buttonBg,
            color: buttonColor,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
            marginBottom: "18px",
          }}
        >
          Select This Plan
        </button>

        <div>
          <p style={{ fontWeight: 600, marginBottom: "8px" }}>Features :</p>
          <ul style={{ marginTop: "4px", paddingLeft: "18px", fontSize: "14px" }}>
            {planId === "free" && (
              <>
                <li>✓ 3 Question Answering</li>
                <li>✗ Eye Tracking Support</li>
                <li>✓ All other features</li>
              </>
            )}
            {planId === "basic" && (
              <>
                <li>✓ Unlimited Question Answering</li>
                <li>✗ Eye Tracking Support</li>
                <li>✓ All other features</li>
              </>
            )}
            {planId === "pro" && (
              <>
                <li>✓ Unlimited Question Answering</li>
                <li>✓ Eye Tracking Support</li>
                <li>✓ All other features</li>
              </>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: "40px 20px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>Pricing</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        {renderPlanCard("free")}
        {renderPlanCard("basic")}
        {renderPlanCard("pro")}
      </div>

      {/* 하단 버튼 영역 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginTop: "40px",
        }}
      >
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            minWidth: "160px",
            padding: "12px 0",
            backgroundColor: "#666",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleProceed}
          style={{
            minWidth: "220px",
            padding: "12px 0",
            backgroundColor: "#4b2acf",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default PricingPage;
