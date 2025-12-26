import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPayment } from "../../service/payment/PaymentApi";
import { getUserInfo } from "../../service/user/User";
import { useLogin } from "../../context/login/useLogin";
import "./css/payment-screens.css";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useLogin() || {};

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const pointOnly = searchParams.get("pointOnly") === "true";

  const [statusMessage, setStatusMessage] = useState("결제 확인 처리 중입니다...");
  const [orderLine, setOrderLine] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 결제 완료 후 돌아갈 경로 (sessionStorage에서 읽기)
  const [redirectPath, setRedirectPath] = useState(null);
  useEffect(() => {
    const savedPath = sessionStorage.getItem("paymentRedirectPath");
    if (savedPath) {
      setRedirectPath(savedPath);
      // 한 번 사용 후 삭제
      sessionStorage.removeItem("paymentRedirectPath");
    }
  }, []);

  const confirmCalledRef = useRef(false);

  useEffect(() => {
    if (confirmCalledRef.current) return;
    confirmCalledRef.current = true;

    const refreshUser = async () => {
      try {
        const res = await getUserInfo();
        if (res && setUser) {
          setUser(res);
        }
      } catch (e) {
        console.warn("결제 후 사용자 정보 갱신 실패:", e?.message || e);
      }
    };

    // 포인트 전액 결제 플로우
    if (pointOnly) {
      if (!orderId) {
        setStatusMessage("주문 정보가 올바르지 않습니다.");
        setIsSuccess(false);
        return;
      }

      setStatusMessage("포인트 전액 사용으로 구독이 활성화되었습니다.");
      setOrderLine(`주문 ID: ${orderId}`);
      setIsSuccess(true);
      refreshUser();
      return;
    }

    // 일반 Toss 결제 플로우
    if (!paymentKey || !orderId || !amount) {
      setStatusMessage("유효한 결제 정보(paymentKey, orderId, amount)가 누락되었습니다.");
      setIsSuccess(false);
      return;
    }

    const doConfirmPayment = async () => {
      try {
        const response = await confirmPayment({
          paymentKey,
          orderId,
          amount,
        });

        if (response.status === 200 && response.data?.status === "DONE") {
          setStatusMessage("결제가 성공적으로 완료되었습니다.");
          setOrderLine(`주문 ID: ${response.data.orderId}`);
          setIsSuccess(true);
          refreshUser();
        } else {
          setStatusMessage("결제가 처리되었으나 응답이 비정상적입니다. 관리자에게 문의해 주세요.");
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

    doConfirmPayment();
  }, [paymentKey, orderId, amount, pointOnly, setUser]);

  return (
    <div className="payment-screen">
      <div className="payment-card">
        <h1 className={isSuccess ? "payment-title-success" : "payment-title-warning"}>
          {isSuccess ? "결제 및 구독 활성화 완료" : "결제 처리 중/오류"}
        </h1>

        <p className="payment-status">{statusMessage}</p>
        {orderLine && <p className="payment-status">{orderLine}</p>}

        <div className="payment-buttons">
          {/* 결제 전 페이지로 돌아가기 (redirect 경로가 있는 경우) */}
          {isSuccess && redirectPath && (
            <button
              className="payment-btn-primary"
              onClick={() => navigate(redirectPath)}
            >
              원래 페이지로 돌아가기
            </button>
          )}

          <button
            className={redirectPath && isSuccess ? "payment-btn-secondary" : "payment-btn-primary"}
            onClick={() => navigate("/")}
          >
            홈으로
          </button>

          <button className="payment-btn-secondary" onClick={() => navigate("/mypage/profile")}>
            마이페이지
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
