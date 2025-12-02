// src/pages/payment/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./payment-screens.css";

const API_BASE_URL = "https://localhost:9443/payments";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const pointOnly = searchParams.get("pointOnly") === "true";

  const [statusMessage, setStatusMessage] = useState(
    "결제 확인 처리 중입니다..."
  );
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 포인트 전액 결제 플로우
    if (pointOnly) {
      if (!orderId) {
        setStatusMessage("주문 정보가 올바르지 않습니다.");
        setIsSuccess(false);
        return;
      }

      setStatusMessage(
        `포인트 전액 사용으로 구독이 활성화되었습니다. (주문 ID: ${orderId})`
      );
      setIsSuccess(true);
      return;
    }

    // 일반 Toss 결제 플로우
    if (!paymentKey || !orderId || !amount) {
      setStatusMessage(
        "승인 결제 정보(paymentKey, orderId, amount)가 누락되었습니다."
      );
      setIsSuccess(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/confirm`, {
          paymentKey,
          orderId,
          amount,
        });

        if (response.status === 200 && response.data?.status === "DONE") {
          setStatusMessage(
            `결제가 성공적으로 완료되었습니다. (주문 ID: ${response.data.orderId})`
          );
          setIsSuccess(true);
        } else {
          setStatusMessage(
            "결제는 처리되었으나 응답 형식이 이상합니다. 관리자에게 문의해 주세요."
          );
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("최종 결제 확인 실패:", error.response || error);

        let msg = "일시적인 오류로 최종 결제 확인에 실패했습니다.";

        if (error.response && error.response.data?.message) {
          msg = error.response.data.message;
        } else if (error.message) {
          msg = `통신 오류: ${error.message}`;
        }

        setStatusMessage(msg);
        setIsSuccess(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, pointOnly]);

  return (
    <div className="payment-screen">
      <div className="payment-card">
        <h1
          className={
            isSuccess ? "payment-title-success" : "payment-title-warning"
          }
        >
          {isSuccess ? "결제 및 구독 활성화 완료" : "결제 처리 중 / 오류"}
        </h1>

        <p className="payment-status">{statusMessage}</p>

        {isSuccess && (
          <p className="payment-subtext">
            마이페이지 또는 서비스 화면에서 바로 이용하실 수 있습니다.
          </p>
        )}

        <div className="payment-buttons">
          <button className="payment-btn-primary" onClick={() => navigate("/")}>
            서비스로 돌아가기
          </button>

          <button
            className="payment-btn-secondary"
            onClick={() => navigate("/pages/payment/pricing")}
          >
            요금제 다시 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
