import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import axiosInstance from "../../server/AxiosConfig";
import "./payment.css";

const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY; // Toss ??? ?
const SUCCESS_URL = `${window.location.origin}/pages/payment/PaymentSuccess`;
const FAIL_URL = `${window.location.origin}/pages/payment/PaymentFail`;

// ?? ??
const PLANS = {
  basic: {
    code: "BASIC",
    name: "Basic plan",
    baseAmount: 39800,
  },
  pro: {
    code: "PRO",
    name: "Pro plan",
    baseAmount: 42900,
  },
};


function PaymentPage() {
  const [searchParams] = useSearchParams();

  // URL 쿼리에서 plan 읽기 (basic / pro)
  const planParam = (searchParams.get("plan") || "basic").toLowerCase();
  const initialPlanKey = PLANS[planParam] ? planParam : "basic";
  const plan = PLANS[initialPlanKey];

  // 주문번호 (페이지 열릴 때 한 번만 생성)
  const [orderId] = useState(
    () => `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const customerKey = useMemo(() => `USER_${orderId}`, [orderId]);

  // ★ 실제 로그인 유저 정보가 생기면 여기로 교체하면 됨
  const MOCK_USER_ID = "TEST_USER_001";
  const MOCK_USER_NAME = "TEST_USER_001";

  // 포인트 관련 상태
  const [userPoints, setUserPoints] = useState(0); // 보유 포인트
  const [pointsToUse, setPointsToUse] = useState(0); // 사용할 포인트

  // 결제 기본 금액 (일반: 플랜 가격 / 업그레이드: 추가 결제 금액)
  const [baseAmount, setBaseAmount] = useState(plan.baseAmount);

  // 실제 결제 금액 (baseAmount - 사용 포인트)
  const [amountValue, setAmountValue] = useState(plan.baseAmount);

  // Toss 위젯 상태
  const [widgets, setWidgets] = useState(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // ready API 저장 상태 & 에러 메시지
  const [isReadySaving, setIsReadySaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPointConfirm, setShowPointConfirm] = useState(false);

  // 업그레이드 관련 상태
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  // 0. 유저 포인트 조회
  useEffect(() => {
    async function fetchUserPoints() {
      try {
        // 실제 서비스에서는 인증된 유저 기준으로 처리
        const res = await axiosInstance.get("/users/me/points");
        const raw = res.data?.points ?? 0;
        const numericPoints = typeof raw === "number" ? raw : Number(raw) || 0;
        setUserPoints(numericPoints);
      } catch (e) {
        console.warn("포인트 조회 실패 (임시로 0P 사용):", e);
        setUserPoints(0);
      }
    }

    fetchUserPoints();
  }, []);

  // 0-1. PRO 플랜 선택 시, BASIC → PRO 업그레이드 견적 조회
  useEffect(() => {
    async function fetchUpgradeQuote() {
      try {
        // BASIC인 경우는 업그레이드 개념 없음 → 그냥 정가 결제
        if (plan.code !== "PRO") {
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }

        const res = await axiosInstance.get("/payments/upgrade-quote", {
          params: {
            planCode: plan.code,
          },
        });

        const info = res.data;

        if (!info || !info.upgrade) {
          // 업그레이드 대상이 아니면 일반 PRO 결제로 처리
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }

        // extraAmount(BigDecimal)이 숫자/문자 어떤 형태로 와도 처리
        const extra = typeof info.extraAmount === "number"
          ? info.extraAmount
          : Number(info.extraAmount || 0);

        if (!extra || extra <= 0) {
          // 추가 결제 금액이 0 이하라면 그냥 일반 PRO 정가 결제로
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }

        setIsUpgrade(true);
        setUpgradeInfo(info);
        setBaseAmount(extra);
        setPointsToUse(0);
        setAmountValue(extra);
      } catch (e) {
        console.warn("업그레이드 견적 조회 실패 (일반 결제로 진행):", e);
        setIsUpgrade(false);
        setUpgradeInfo(null);
        setBaseAmount(plan.baseAmount);
        setPointsToUse(0);
        setAmountValue(plan.baseAmount);
      }
    }

    fetchUpgradeQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.code]);

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

  // 2-1. 위젯 최초 렌더링 (결제수단/이용약관) - 딱 한 번만
  useEffect(() => {
    if (!widgets) return;

    let isCancelled = false;

    async function renderPaymentWidgetsOnce() {
      try {
        // 초기 금액 세팅
        await widgets.setAmount({
          currency: "KRW",
          value: amountValue,
        });

        // 결제수단 + 이용약관 위젯 렌더 (1회)
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

        if (!isCancelled) {
          setIsWidgetReady(true);
          console.log("✅ 결제 위젯 렌더링 완료");
        }
      } catch (error) {
        const msg = error?.message || String(error);

        // StrictMode / 중복 렌더링 등으로 인해
        // "하나의 결제수단 위젯만을 사용할 수 있어요." 가 떴을 때는
        // 이미 렌더된 상태로 보고, 에러로 취급하지 않고 통과
        if (msg.includes("하나의 결제수단 위젯만을 사용할 수 있어요")) {
          if (!isCancelled) {
            console.log(
              "이미 렌더된 결제수단 위젯입니다. (중복 렌더 시도 무시)"
            );
            setIsWidgetReady(true);
          }
          return;
        }

        console.error("❌ 위젯 렌더링 실패:", error);
        if (!isCancelled) {
          setIsWidgetReady(false);
          setErrorMsg("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    }

    renderPaymentWidgetsOnce();

    return () => {
      isCancelled = true;
    };
  }, [widgets, amountValue]); // amountValue 초기값 반영까지는 허용 (이후엔 아래 setAmount에서 처리)

  // 2-2. 금액만 바뀔 때는 setAmount로만 갱신 (renderPaymentMethods 다시 호출 X)
  useEffect(() => {
    if (!widgets) return;

    widgets
      .setAmount({
        currency: "KRW",
        value: amountValue,
      })
      .catch((error) => {
        console.error("위젯 금액 갱신 실패:", error);
      });
  }, [widgets, amountValue]);

  // 포인트 입력 핸들러
  const handlePointsChange = (event) => {
    let raw = event.target.value.replace(/[^0-9]/g, ""); // 숫자만
    let value = raw === "" ? 0 : parseInt(raw, 10);

    if (Number.isNaN(value)) value = 0;

    // 보유 포인트 초과 불가
    if (value > userPoints) value = userPoints;
    // 결제 기본 금액보다 많이 사용할 수는 없음 (업그레이드면 extraAmount 기준)
    if (value > baseAmount) value = baseAmount;

    setPointsToUse(value);
    setAmountValue(baseAmount - value);
  };

  // 포인트 전액 사용 버튼
  const handleUseAllPoints = () => {
    const maxUsable = Math.min(userPoints, baseAmount);
    setPointsToUse(maxUsable);
    setAmountValue(baseAmount - maxUsable);
  };

  const maxUsablePoints = Math.min(userPoints, baseAmount);

  const buildReadyPayload = (overrideAmount) => ({
    orderId: orderId,
    orderName: plan.name,
    customerName: "??", // ?? ??? ??
    planCode: plan.code,
    originalAmount: baseAmount, // ?? ??(????? ? ?? ??)
    usedPoint: pointsToUse, // ?? ???
    amount: overrideAmount,
  });

  const handleRequestError = (error, fallbackMsg) => {
    console.error(fallbackMsg, error);
    console.log("❗ ready API error response:", error.response?.data);

    if (error.response && error.response.data && error.response.data.message) {
      setErrorMsg(error.response.data.message);
    } else if (error.message) {
      setErrorMsg(`${fallbackMsg}: ${error.message}`);
    } else {
      setErrorMsg(fallbackMsg);
    }
  };

  // 4. 결제 시작 (ready → Toss 결제창)
  const performPointOnlyPayment = async () => {
    if (isReadySaving) return;
    setErrorMsg("");
    setIsReadySaving(true);
    try {
      const readyPayload = buildReadyPayload(0);

      const readyResponse = await axiosInstance.post("/payments/ready", readyPayload);

      if (!(readyResponse.status === 201 || readyResponse.status === 200)) {
        throw new Error("결제 준비(READY) 단계에서 비정상 응답");
      }

      setIsReadySaving(false);
      setShowPointConfirm(false);

      window.location.href = `${SUCCESS_URL}?pointOnly=true&orderId=${orderId}`;
    } catch (error) {
      setIsReadySaving(false);
      setShowPointConfirm(false);
      handleRequestError(error, "포인트 전액 결제 오류");
    }
  };

  const handlePaymentRequest = async () => {
    // 포인트 전액 결제(0원) 플로우: 확인 모달 → READY → 성공 처리
    if (amountValue === 0) {
      if (!showPointConfirm) {
        setShowPointConfirm(true);
        return;
      }
      await performPointOnlyPayment();
      return;
    }

    if (!widgets) return;

    if (!clientKey) {
      setErrorMsg("Toss 결제 클라이언트 키가 설정되지 않았습니다.");
      return;
    }

    if (amountValue < 0) {
      setErrorMsg(
        "최종 결제 금액이 0 미만이라서 결제를 진행할 수 없습니다. 사용 포인트를 줄여 주세요."
      );
      return;
    }

    setErrorMsg("");
    setIsReadySaving(true);

    try {
      // (1) 결제 준비 정보 DB 저장
      const readyPayload = buildReadyPayload(amountValue);

      const readyResponse = await axiosInstance.post("/payments/ready", readyPayload);

      if (!(readyResponse.status === 201 || readyResponse.status === 200)) {
        throw new Error("결제 준비(READY) 단계에서 비정상 응답");
      }

      console.log("✅ READY 저장 성공:", readyResponse.data);

      setIsReadySaving(false);

      // (2) Toss 결제창 열기
      await widgets.requestPayment({
        orderId: orderId,
        orderName: plan.name,
        successUrl: SUCCESS_URL,
        failUrl: FAIL_URL,
        customerEmail: "customer@example.com",
        customerName: MOCK_USER_NAME,
      });
    } catch (error) {
      setIsReadySaving(false);
      handleRequestError(error, "결제 요청 중 오류");
    }
  };

  if (!clientKey) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        VITE_TOSS_PAYMENTS_CLIENT_KEY가 설정되지 않았습니다.
      </div>
    );
  }

  // 업그레이드 안내 문구 생성
  const renderUpgradeNotice = () => {
    if (!isUpgrade || !upgradeInfo) return null;

    return (
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "#1f2937",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
          color: "#e5e7eb",
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          BASIC → PRO 업그레이드 결제입니다.
        </div>
        <div>
          현재 BASIC을{" "}
          <strong>{upgradeInfo.usedDays}일</strong> 사용하셨고,{" "}
          <strong>{upgradeInfo.remainingDays}일</strong>이 남아 있습니다.
        </div>
        <div>
          남은 기간에 대해서만 PRO로 이용하시며,{" "}
          <strong>{Number(upgradeInfo.extraAmount).toLocaleString()}원</strong>만
          추가로 결제됩니다.
        </div>
        {upgradeInfo.basicEndDate && (
          <div style={{ marginTop: "2px", fontSize: "12px", color: "#9ca3af" }}>
            현재 구독 종료일: {upgradeInfo.basicEndDate}
          </div>
        )}
      </div>
    );
  };

  const isDisabledPayButton =
    isReadySaving || amountValue < 0 || (amountValue > 0 && !isWidgetReady);

  return (
    <div className="pay-page">
      <h2 className="pay-title">📄 {plan.name}</h2>
      <p className="pay-order">주문번호: <strong>{orderId}</strong></p>

      {!isUpgrade ? (
        <>
          <p className="pay-text">
            기본 금액: <strong>{plan.baseAmount.toLocaleString()}원</strong>
          </p>
        </>
      ) : (
        <>
          <p className="pay-text">
            원래 PRO 월 요금: <strong>{PLANS.pro.baseAmount.toLocaleString()}원</strong>
          </p>
          <p className="pay-text">
            BASIC → PRO 업그레이드 추가 결제 금액: <strong>{baseAmount.toLocaleString()}원</strong>
          </p>
        </>
      )}

      {/* 포인트/금액 요약 */}
      <p className="pay-summary">
        사용 포인트:{" "}
        <strong style={{ color: "#facc15" }}>
          {pointsToUse.toLocaleString()}P
        </strong>{" "}
        / 보유 <strong>{userPoints.toLocaleString()}P</strong>
      </p>
      <p className="pay-summary">최종 결제 금액: <strong>{amountValue.toLocaleString()}원</strong></p>

      <div className="pay-banner">
        ⚠ 테스트 환경 - 실제로 결제되지 않습니다.
      </div>

      {/* 업그레이드 안내 */}
      {renderUpgradeNotice()}

      {/* 결제 방법 위젯 */}
      <div id="payment-methods" className="pay-widget" />

      {/* 이용약관 위젯 */}
      <div id="agreement" className="pay-agreement" />

      {/* 포인트 입력 영역 */}
      <div className="pay-points-row">
        <label
          htmlFor="points-input"
          style={{ fontSize: "14px", whiteSpace: "nowrap" }}
        >
          사용할 포인트
        </label>
        <input
          id="points-input"
          type="text"
          value={pointsToUse === 0 ? "" : pointsToUse}
          onChange={handlePointsChange}
          placeholder="0"
          className="pay-input-dark"
        />
        <button
          type="button"
          onClick={handleUseAllPoints}
          disabled={userPoints === 0}
          className={`pay-btn-small ${userPoints === 0 ? "disabled" : ""}`}
        >
          전액 사용
        </button>
      </div>
      <div className="pay-helper">
        최대 사용 가능 포인트: {maxUsablePoints.toLocaleString()}P
      </div>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="pay-error">
          {errorMsg}
        </div>
      )}

      {/* 결제 버튼 */}
      <button
        type="button"
        onClick={handlePaymentRequest}
        disabled={isDisabledPayButton}
        className={`pay-btn-primary ${isDisabledPayButton ? "disabled" : ""}`}
      >
        {isReadySaving
          ? "결제 준비 중..."
          : amountValue === 0
          ? "포인트로 바로 결제"
          : !isWidgetReady
          ? "결제 위젯 로드 중..."
          : `${amountValue.toLocaleString()}원 결제하기`}
      </button>

      {/* 이전 페이지 버튼 */}
      <button
        type="button"
        onClick={() => window.history.back()}
        className="pay-btn-secondary"
      >
        이전 페이지로 돌아가기
      </button>

      {/* 포인트 전액 결제 확인 모달 */}
      {showPointConfirm && (
        <div className="pay-modal-overlay">
          <div className="pay-modal">
            <h3 className="pay-modal-title">포인트 전액 결제 확인</h3>
            <p className="pay-modal-text">
              포인트만으로 결제하면 결제 금액이 0원이 되며,{" "}
              <strong>환불이 불가능</strong>합니다.
            </p>
            <p className="pay-modal-subtext">
              정말 포인트로 바로 결제하시겠습니까?
            </p>
            <div className="pay-modal-actions">
              <button
                type="button"
                onClick={() => setShowPointConfirm(false)}
                disabled={isReadySaving}
                className={`pay-modal-btn secondary ${isReadySaving ? "disabled" : ""}`}
              >
                아니오
              </button>
              <button
                type="button"
                onClick={performPointOnlyPayment}
                disabled={isReadySaving}
                className={`pay-modal-btn primary ${isReadySaving ? "disabled" : ""}`}
              >
                네, 결제합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;