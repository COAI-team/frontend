// src/pages/payment/PaymentPage.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import axios from "axios";

const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY; // gck 키
const customerKey = "HQ3xYXZZG-PocUEuPo4Ih"; // 테스트용 고정 고객 키
const API_BASE_URL = "http://localhost:8090/payments";

// 각 플랜 정보
const PLANS = {
  basic: {
    code: "BASIC",
    name: "Basic 구독권",
    baseAmount: 39800,
  },
  pro: {
    code: "PRO",
    name: "Pro 구독권",
    baseAmount: 42900,
  },
};

function PaymentPage() {
  const [searchParams] = useSearchParams();

  // URL 쿼리에서 plan 읽기 (basic / pro)
  const planParam = (searchParams.get("plan") || "basic").toLowerCase();
  const initialPlanKey = PLANS[planParam] ? planParam : "basic";
  const plan = PLANS[initialPlanKey];

  // 주문번호 & 금액
  const [orderId] = useState(
    `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [amountValue, setAmountValue] = useState(plan.baseAmount);

  // Toss 위젯 상태
  const [widgets, setWidgets] = useState(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // ready API 저장 상태
  const [isReadySaving, setIsReadySaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Toss 위젯 SDK 로드
  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const newWidgets = tossPayments.widgets({ customerKey });
        setWidgets(newWidgets);
      } catch (error) {
        console.error("토스 SDK 로드 실패:", error);
        setErrorMsg("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    }

    if (clientKey) {
      fetchPaymentWidgets();
    } else {
      setErrorMsg("Toss 결제 클라이언트 키가 설정되지 않았습니다.");
    }
  }, []);

  // 2. 위젯 렌더링 & 금액 설정
  useEffect(() => {
    async function renderPaymentWidgets() {
      if (!widgets) return;

      try {
        await widgets.setAmount({ currency: "KRW", value: amountValue });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-methods",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        setIsWidgetReady(true);
        console.log("✅ 결제 위젯 렌더링 완료");
      } catch (error) {
        console.error("❌ 위젯 렌더링 실패:", error);
        setErrorMsg("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        setIsWidgetReady(false);
      }
    }

    renderPaymentWidgets();
  }, [widgets]);

  // 금액이 바뀔 때 위젯에 재적용 (쿠폰 등)
  useEffect(() => {
    if (!widgets) return;
    widgets.setAmount({ currency: "KRW", value: amountValue });
  }, [widgets, amountValue]);

  // 쿠폰 핸들러
  const handleCouponChange = (event) => {
    const checked = event.target.checked;
    const newAmount = checked ? plan.baseAmount - 5000 : plan.baseAmount;

    setAmountValue(newAmount);

    if (widgets) {
      widgets.setAmount({ currency: "KRW", value: newAmount });
    }
  };

  // 3. 결제 시작 (ready → Toss 결제창)
  const handlePaymentRequest = async () => {
    if (!widgets) return;
    if (!clientKey) {
      setErrorMsg("Toss 결제 클라이언트 키가 설정되지 않았습니다.");
      return;
    }

    setErrorMsg("");
    setIsReadySaving(true);

    try {
      // (1) 결제 준비 정보 DB 저장
      const readyPayload = {
        orderId: orderId,
        orderName: plan.name,
        customerName: "TEST_USER_001", // TODO: 실제 로그인 유저 이름/ID로 교체
        amount: amountValue,

        // 선택 사항 (지금은 DB에서 안 써도, 나중에 확장 가능)
        userId: "TEST_USER_001",
        planCode: plan.code,
      };

      const readyResponse = await axios.post(`${API_BASE_URL}/ready`, readyPayload);

      if (!(readyResponse.status === 201 || readyResponse.status === 200)) {
        throw new Error("결제 준비(READY) 단계에서 비정상 응답");
      }

      console.log("✅ READY 저장 성공:", readyResponse.data);

      setIsReadySaving(false);

      // (2) Toss 결제창 열기
      await widgets.requestPayment({
        orderId: orderId,
        orderName: plan.name,
        successUrl: `${window.location.origin}/pages/payment/PaymentSuccess`,
        failUrl: `${window.location.origin}/pages/payment/PaymentFail`,
        customerEmail: "customer@example.com",
        customerName: "TEST_USER_001",
      });
    } catch (error) {
      setIsReadySaving(false);
      console.error("결제 요청 중 오류:", error);
      console.log("❗ ready API error response:", error.response?.data);

      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else if (error.message) {
        setErrorMsg(`결제를 시작하지 못했습니다: ${error.message}`);
      } else {
        setErrorMsg("결제 요청 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  if (!clientKey) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        VITE_TOSS_PAYMENTS_CLIENT_KEY가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        padding: "24px",
        backgroundColor: "#222",
        color: "#fff",
        borderRadius: "8px",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ fontSize: "22px", marginBottom: "4px" }}>🧾 {plan.name}</h2>
      <p style={{ fontSize: "14px", marginBottom: "4px" }}>
        주문번호: <strong>{orderId}</strong>
      </p>
      <p style={{ fontSize: "16px", marginBottom: "16px" }}>
        결제 금액: <strong>{amountValue.toLocaleString()}원</strong>
      </p>

      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#443",
          borderRadius: "4px",
          fontSize: "13px",
          marginBottom: "12px",
        }}
      >
        ⚠ 테스트 환경 - 실제로 결제되지 않습니다.
      </div>

      {/* 결제 방법 위젯 */}
      <div
        id="payment-methods"
        style={{
          minHeight: "260px",
          padding: "10px",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          marginBottom: "16px",
        }}
      />

      {/* 이용약관 위젯 */}
      <div
        id="agreement"
        style={{
          minHeight: "40px",
          padding: "6px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          color: "#000",
          marginBottom: "16px",
        }}
      />

      {/* 쿠폰 */}
      <div style={{ marginBottom: "8px" }}>
        <label htmlFor="coupon-box">
          <input
            id="coupon-box"
            type="checkbox"
            disabled={!isWidgetReady}
            onChange={handleCouponChange}
          />
          <span style={{ color: "lightgray", marginLeft: "8px", fontSize: "14px" }}>
            5,000원 쿠폰 적용 (기본 {plan.baseAmount.toLocaleString()}원)
          </span>
        </label>
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div style={{ marginTop: "8px", color: "#ff8080", fontSize: "14px" }}>
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={handlePaymentRequest}
        disabled={!isWidgetReady || isReadySaving}
        style={{
          width: "100%",
          padding: "14px 0",
          marginTop: "18px",
          backgroundColor:
            !isWidgetReady || isReadySaving ? "#6a508f" : "#6f3bd2",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor:
            !isWidgetReady || isReadySaving ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        {isReadySaving
          ? "결제 준비 중..."
          : isWidgetReady
          ? `${amountValue.toLocaleString()}원 결제하기`
          : "결제 위젯 로드 중..."}
      </button>
    </div>
  );
}

export default PaymentPage;
