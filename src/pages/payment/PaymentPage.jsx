import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import axiosInstance from "../../server/AxiosConfig";
import { getAuth } from "../../utils/auth/token";
import "./payment.css";

const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY;
const SUCCESS_URL = `${window.location.origin}/pages/payment/PaymentSuccess`;
const FAIL_URL = `${window.location.origin}/pages/payment/PaymentFail`;

const PLANS = {
  basic: { code: "BASIC", name: "Basic plan", baseAmount: 39800 },
  pro: { code: "PRO", name: "Pro plan", baseAmount: 42900 },
};

function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planParam = (searchParams.get("plan") || "basic").toLowerCase();
  const planKey = PLANS[planParam] ? planParam : "basic";
  const plan = PLANS[planKey];

  const [orderId] = useState(
    () => `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );
  const customerKey = useMemo(() => `USER_${orderId}`, [orderId]);

  const [userPoints, setUserPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [baseAmount, setBaseAmount] = useState(plan.baseAmount);
  const [amountValue, setAmountValue] = useState(plan.baseAmount);
  const [isAuthed, setIsAuthed] = useState(!!getAuth()?.accessToken);

  const [widgets, setWidgets] = useState(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const hasRenderedWidgetsRef = useRef(false);

  const [isReadySaving, setIsReadySaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPointConfirm, setShowPointConfirm] = useState(false);

  const [isUpgrade, setIsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  useEffect(() => {
    setIsAuthed(!!getAuth()?.accessToken);
  }, []);

  // 보유 포인트 조회
  useEffect(() => {
    if (!isAuthed) {
      setErrorMsg("로그인 후 결제를 진행해 주세요.");
      return;
    }

    async function fetchUserPoints() {
      try {
        const res = await axiosInstance.get("/users/me/points");
        const raw = res.data?.points ?? 0;
        const numericPoints = typeof raw === "number" ? raw : Number(raw) || 0;
        setUserPoints(numericPoints);
      } catch (e) {
        console.warn("포인트 조회 실패(임시 0P 적용):", e);
        setUserPoints(0);
      }
    }

    fetchUserPoints();
  }, [isAuthed]);

  // PRO 업그레이드 차액 조회
  useEffect(() => {
    async function fetchUpgradeQuote() {
      try {
        if (!isAuthed) return;
        if (plan.code !== "PRO") {
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }

        const res = await axiosInstance.get("/payments/upgrade-quote", {
          params: { planCode: plan.code },
        });

        const info = res.data;

        if (!info || !info.upgrade) {
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }

        const extra =
          typeof info.extraAmount === "number"
            ? info.extraAmount
            : Number(info.extraAmount || 0);

        if (!extra || extra <= 0) {
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
        console.warn("업그레이드 차액 조회 실패(기본 결제로 처리):", e);
        setIsUpgrade(false);
        setUpgradeInfo(null);
        setBaseAmount(plan.baseAmount);
        setPointsToUse(0);
        setAmountValue(plan.baseAmount);
      }
    }

    fetchUpgradeQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.code, isAuthed]);

  // Toss SDK 로드
  useEffect(() => {
    async function fetchPaymentWidgets() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const newWidgets = tossPayments.widgets({ customerKey });
        setWidgets(newWidgets);
      } catch (error) {
        console.error("Toss SDK 로드 실패:", error);
        setErrorMsg("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }

    if (clientKey) {
      fetchPaymentWidgets();
    } else {
      setErrorMsg("Toss 결제 클라이언트 키가 설정되지 않았습니다.");
    }
  }, []);

  // 최초 한 번 위젯 렌더링
  // render payment widgets once (prevent duplicate render)
  useEffect(() => {
    if (!widgets) return;
    if (hasRenderedWidgetsRef.current) return;

    let isCancelled = false;

    async function renderPaymentWidgetsOnce() {
      try {
        await widgets.setAmount({
          currency: "KRW",
          value: amountValue,
        });

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
          hasRenderedWidgetsRef.current = true;
          setIsWidgetReady(true);
        }
      } catch (error) {
        const msg = error?.message || String(error);
        if (msg.toLowerCase().includes("widget")) {
          if (!isCancelled) {
            hasRenderedWidgetsRef.current = true;
            setIsWidgetReady(true);
          }
          return;
        }
        console.error("payment widget render failed:", error);
        if (!isCancelled) {
          setIsWidgetReady(false);
          setErrorMsg("?? ??? ???? ?????. ?? ? ?? ??????.");
        }
      }
    }

    renderPaymentWidgetsOnce();

    return () => {
      isCancelled = true;
    };
  }, [widgets, amountValue]);

  // 금액 변경 시 setAmount만 재호출
  useEffect(() => {
    if (!widgets) return;

    widgets
      .setAmount({
        currency: "KRW",
        value: amountValue,
      })
      .catch((error) => {
        console.error("위젯 금액 변경 실패:", error);
      });
  }, [widgets, amountValue]);

  const handlePointsChange = (event) => {
    let raw = event.target.value.replace(/[^0-9]/g, "");
    let value = raw === "" ? 0 : parseInt(raw, 10);

    if (Number.isNaN(value)) value = 0;
    if (value > userPoints) value = userPoints;
    if (value > baseAmount) value = baseAmount;

    setPointsToUse(value);
    setAmountValue(baseAmount - value);
  };

  const handleUseAllPoints = () => {
    const maxUsable = Math.min(userPoints, baseAmount);
    setPointsToUse(maxUsable);
    setAmountValue(baseAmount - maxUsable);
  };

  const maxUsablePoints = Math.min(userPoints, baseAmount);

  const buildReadyPayload = (overrideAmount) => ({
    orderId,
    orderName: plan.name,
    customerName: "구독 결제",
    planCode: plan.code,
    originalAmount: baseAmount,
    usedPoint: pointsToUse,
    amount: overrideAmount,
  });

  const handleRequestError = (error, fallbackMsg) => {
    console.error(fallbackMsg, error);
    if (error.response?.data?.message) {
      setErrorMsg(error.response.data.message);
    } else if (error.message) {
      setErrorMsg(`${fallbackMsg}: ${error.message}`);
    } else {
      setErrorMsg(fallbackMsg);
    }
  };

  const performPointOnlyPayment = async () => {
    if (!isAuthed) {
      navigate("/signin");
      return;
    }
    if (isReadySaving) return;
    setErrorMsg("");
    setIsReadySaving(true);
    try {
      const readyPayload = buildReadyPayload(0);
      const readyResponse = await axiosInstance.post("/payments/ready", readyPayload);

      if (!(readyResponse.status === 201 || readyResponse.status === 200)) {
        throw new Error("READY API 응답이 올바르지 않습니다.");
      }

      setIsReadySaving(false);
      setShowPointConfirm(false);

      window.location.href = `${SUCCESS_URL}?pointOnly=true&orderId=${orderId}`;
    } catch (error) {
      setIsReadySaving(false);
      setShowPointConfirm(false);
      handleRequestError(error, "포인트 전액 결제 실패");
    }
  };

  const handlePaymentRequest = async () => {
    if (!isAuthed) {
      navigate("/signin");
      return;
    }

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
      setErrorMsg("최종 결제 금액이 0보다 작습니다. 포인트 사용을 줄여 주세요.");
      return;
    }

    setErrorMsg("");
    setIsReadySaving(true);

    try {
      const readyPayload = buildReadyPayload(amountValue);
      const readyResponse = await axiosInstance.post("/payments/ready", readyPayload);

      if (!(readyResponse.status === 201 || readyResponse.status === 200)) {
        throw new Error("READY API 응답이 올바르지 않습니다.");
      }

      setIsReadySaving(false);

      await widgets.requestPayment({
        orderId,
        orderName: plan.name,
        successUrl: SUCCESS_URL,
        failUrl: FAIL_URL,
      });
    } catch (error) {
      setIsReadySaving(false);
      handleRequestError(error, "결제 요청 처리 실패");
    }
  };

  if (!clientKey) {
    return (
      <div style={{ padding: "40px", color: "white" }}>
        VITE_TOSS_PAYMENTS_CLIENT_KEY가 설정되지 않았습니다.
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="pay-page">
        <h2 className="pay-title">결제</h2>
        <p className="pay-error">로그인이 필요합니다.</p>
        <button
          type="button"
          className="pay-btn-primary"
          onClick={() => navigate("/signin")}
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

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
          현재 Basic을 <strong>{upgradeInfo.usedDays}일</strong> 사용했고{" "}
          <strong>{upgradeInfo.remainingDays}일</strong>이 남아 있습니다.
        </div>
        <div>
          남은 기간만큼 PRO로 이용하시려면{" "}
          <strong>{Number(upgradeInfo.extraAmount).toLocaleString()}원</strong>
          을 추가 결제합니다.
        </div>
        {upgradeInfo.basicEndDate && (
          <div style={{ marginTop: "2px", fontSize: "12px", color: "#9ca3af" }}>
            기존 Basic 구독 만료일: {upgradeInfo.basicEndDate}
          </div>
        )}
      </div>
    );
  };

  const isDisabledPayButton =
    isReadySaving || amountValue < 0 || (amountValue > 0 && !isWidgetReady);

  return (
    <div className="pay-page">
      <h2 className="pay-title">구매: {plan.name}</h2>
      <p className="pay-order">
        주문번호: <strong>{orderId}</strong>
      </p>

      {!isUpgrade ? (
        <p className="pay-text">
          기본 금액: <strong>{plan.baseAmount.toLocaleString()}원</strong>
        </p>
      ) : (
        <>
          <p className="pay-text">
            PRO 정가: <strong>{PLANS.pro.baseAmount.toLocaleString()}원</strong>
          </p>
          <p className="pay-text">
            Basic → PRO 업그레이드 결제 금액:{" "}
            <strong>{baseAmount.toLocaleString()}원</strong>
          </p>
        </>
      )}

      <p className="pay-summary">
        사용 포인트{" "}
        <strong style={{ color: "#facc15" }}>{pointsToUse.toLocaleString()}P</strong>{" "}
        / 보유 <strong>{userPoints.toLocaleString()}P</strong>
      </p>
      <p className="pay-summary">
        최종 결제 금액: <strong>{amountValue.toLocaleString()}원</strong>
      </p>

      <div className="pay-banner">Toss 결제 위젯으로 안전하게 결제됩니다.</div>

      {renderUpgradeNotice()}

      <div id="payment-methods" className="pay-widget" />
      <div id="agreement" className="pay-agreement" />

      <div className="pay-points-row">
        <label htmlFor="points-input" style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
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
        최대 사용 가능 포인트 {maxUsablePoints.toLocaleString()}P
      </div>

      {errorMsg && <div className="pay-error">{errorMsg}</div>}

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
          ? "결제 모듈 로드 중..."
          : `${amountValue.toLocaleString()}원 결제하기`}
      </button>

      <button
        type="button"
        onClick={() => window.history.back()}
        className="pay-btn-secondary"
      >
        이전 페이지로 돌아가기
      </button>

      {showPointConfirm && (
        <div className="pay-modal-overlay">
          <div className="pay-modal">
            <h3 className="pay-modal-title">포인트 전액 결제 확인</h3>
            <p className="pay-modal-text">
              포인트로만 결제하면 최종 금액이 0원이 되며, <strong>환불이 불가</strong>합니다.
            </p>
            <p className="pay-modal-subtext">정말 포인트로 바로 결제할까요?</p>
            <div className="pay-modal-actions">
              <button
                type="button"
                onClick={() => setShowPointConfirm(false)}
                disabled={isReadySaving}
                className={`pay-modal-btn secondary ${isReadySaving ? "disabled" : ""}`}
              >
                아니요
              </button>
              <button
                type="button"
                onClick={performPointOnlyPayment}
                disabled={isReadySaving}
                className={`pay-modal-btn primary ${isReadySaving ? "disabled" : ""}`}
              >
                네, 결제할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;
