// src/pages/payment/PaymentFail.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import "./css/payment-screens.css";

function PaymentFail() {
  const [searchParams] = useSearchParams();

  // 토스페이먼츠에서 내려주는 실패 정보
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  const displayMessage =
    message || "결제 진행 중 알 수 없는 오류가 발생했습니다.";

  const getCodeDescription = (codeValue) => {
    switch (codeValue) {
      case "USER_CANCEL":
        return "사용자가 결제창에서 직접 결제를 취소했습니다.";
      case "TEST_MERCHANT_NOT_ALLOWED":
        return "테스트 결제 수단을 가맹점에서 사용할 수 없습니다. 다른 결제 수단을 선택하거나 실제 계약 정보로 진행해 주세요.";
      default:
        return null;
    }
  };

  const codeDescription = code ? getCodeDescription(code) : null;

  return (
    <div className="payment-screen">
      <div className="fail-wrapper">
        <h1 className="fail-title">결제가 실패했거나 취소되었습니다.</h1>

        <p className="fail-message">{displayMessage}</p>

        <div className="fail-box">
          <p>
            <strong>주문 번호:</strong> {orderId || "정보 없음"}
          </p>
          {code && (
            <>
              <p className="fail-detail">
                <strong>에러 코드:</strong> {code}
              </p>
              {codeDescription && (
                <p className="fail-detail-sub">
                  {codeDescription}
                </p>
              )}
            </>
          )}
        </div>

        <p className="fail-note">
          고객센터에 문의하시거나, 결제 수단을 확인 후 다시 시도해 주세요.
        </p>

        <button
          onClick={() => (window.location.href = "/")}
          className="fail-button"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PaymentFail;
