import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { fetchPointInfo } from "../../service/mypage/MyPageApi";
import { fetchUpgradeQuote, readyPayment } from "../../service/payment/PaymentApi";
import { getAuth, removeAuth } from "../../utils/auth/token";
import AlertModal from "../../components/modal/AlertModal";
import "./css/payment.css";

const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY;
const SUCCESS_URL = `${globalThis.location.origin}/pages/payment/PaymentSuccess`;
const FAIL_URL = `${globalThis.location.origin}/pages/payment/PaymentFail`;

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

  const [orderId] = useState(() => `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const customerKey = useMemo(() => `USER_${orderId}`, [orderId]);
  const customerName = "CUSTOMER";

  const [userPoints, setUserPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [baseAmount, setBaseAmount] = useState(plan.baseAmount);
  const [amountValue, setAmountValue] = useState(plan.baseAmount);
  const [isAuthed, setIsAuthed] = useState(!!getAuth()?.accessToken);

  const [widgets, setWidgets] = useState(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const hasRenderedWidgetsRef = useRef(false);
  const isRenderingWidgetsRef = useRef(false);

  const [isReadySaving, setIsReadySaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPointConfirm, setShowPointConfirm] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(!getAuth()?.accessToken);

  const [isUpgrade, setIsUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  useEffect(() => {
    const authed = !!getAuth()?.accessToken;
    setIsAuthed(authed);
    setShowLoginAlert(!authed);
  }, []);

  // 포인트 잔액 조회
  useEffect(() => {
    if (!isAuthed) {
      setErrorMsg("로그인 후 결제를 진행해 주세요.");
      return;
    }

    async function fetchUserPoints() {
      try {
        const res = await fetchPointInfo();
        const raw = res.data?.points ?? 0;
        const numericPoints = typeof raw === "number" ? raw : Number(raw) || 0;
        setUserPoints(numericPoints);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          removeAuth();
          setIsAuthed(false);
          setShowLoginAlert(true);
          setUserPoints(0);
          return;
        }
        console.warn("포인트 조회 실패(임시 0P 사용):", e);
        setUserPoints(0);
      }
    }

    fetchUserPoints();
  }, [isAuthed]);

  // PRO 업그레이드 추가 결제 금액 조회
  useEffect(() => {
    async function fetchUpgradeQuoteData() {
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

        const res = await fetchUpgradeQuote(plan.code);
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
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          removeAuth();
          setIsAuthed(false);
          setShowLoginAlert(true);
          setIsUpgrade(false);
          setUpgradeInfo(null);
          setBaseAmount(plan.baseAmount);
          setPointsToUse(0);
          setAmountValue(plan.baseAmount);
          return;
        }
        console.warn("업그레이드 추가 금액 조회 실패(기본 결제):", e);
        setIsUpgrade(false);
        setUpgradeInfo(null);
        setBaseAmount(plan.baseAmount);
        setPointsToUse(0);
        setAmountValue(plan.baseAmount);
      }
    }

    fetchUpgradeQuoteData();
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
  }, [customerKey]);

  // 결제 모듈 1회 렌더
  useEffect(() => {
    if (!widgets) return;
    if (hasRenderedWidgetsRef.current || isRenderingWidgetsRef.current) return;

    let isCancelled = false;
    isRenderingWidgetsRef.current = true;

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
        if (!isCancelled) {
          console.error("결제 모듈 렌더 실패:", error);
          setErrorMsg("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (!isCancelled) {
          isRenderingWidgetsRef.current = false;
        }
      }
    }

    renderPaymentWidgetsOnce();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  // 금액 변경 시 업데이트
  useEffect(() => {
    if (!widgets || !hasRenderedWidgetsRef.current) return;

    const updateAmount = async () => {
      try {
        await widgets.setAmount({ currency: "KRW", value: amountValue });
      } catch (err) {
        console.warn("결제 금액 업데이트 실패:", err);
      }
    };
    updateAmount();
  }, [widgets, amountValue]);

  const maxUsablePoints = Math.min(userPoints, baseAmount);

  const handlePointsChange = (e) => {
    const raw = e.target.value.replaceAll(',', "");
    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
      setPointsToUse(0);
      setAmountValue(baseAmount);
      return;
    }
    const clamped = Math.max(0, Math.min(numeric, maxUsablePoints));
    setPointsToUse(clamped);
    setAmountValue(Math.max(baseAmount - clamped, 0));
  };

  const handleUseAllPoints = () => {
    setPointsToUse(maxUsablePoints);
    setAmountValue(Math.max(baseAmount - maxUsablePoints, 0));
  };

  const isDisabledPayButton = amountValue > 0 && (!widgets || !isWidgetReady);

  const renderUpgradeNotice = () => {
    if (!isUpgrade || !upgradeInfo) return null;
    const remainDays = upgradeInfo.remainDays ?? upgradeInfo.remainingDays;
    return (
      <div className="pay-upgrade-box">
        <div className="pay-upgrade-title">BASIC → PRO 업그레이드 결제입니다.</div>
        <div className="pay-upgrade-text">
          현재 Basic을 이용 중이며 {remainDays ?? 0}일이 남아 있습니다. 남은 기간만 PRO를 이용하시려면{" "}
          <strong>{baseAmount.toLocaleString()}원</strong>을 추가 결제합니다.
        </div>
        {upgradeInfo.prevPlanEnd && (
          <div className="pay-upgrade-sub">기존 Basic 구독 만료일: {upgradeInfo.prevPlanEnd}</div>
        )}
      </div>
    );
  };

  const performPointOnlyPayment = async () => {
    const maxPointSpend = Math.min(userPoints, baseAmount);
    const pointSpend = Math.min(pointsToUse || 0, maxPointSpend);
    if (pointSpend <= 0) {
      setErrorMsg("포인트 전액 결제를 위해 사용 포인트를 입력해 주세요.");
      return;
    }
    if (pointSpend < baseAmount) {
      setErrorMsg("포인트가 부족해 전액 결제가 불가합니다.");
      return;
    }
    setPointsToUse(pointSpend);
    setShowPointConfirm(false);
    setIsReadySaving(true);
    setErrorMsg("");
    try {
      await readyPayment({
        planCode: plan.code,
        orderId,
        amount: 0,
        usedPoint: pointSpend,
        orderName: plan.name,
        customerName,
        customerKey,
        isUpgrade,
      });
      navigate(
        `/pages/payment/PaymentSuccess?orderId=${orderId}&amount=0&pointOnly=true&plan=${plan.code}`
      );
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        removeAuth();
        setIsAuthed(false);
        setShowLoginAlert(true);
        return;
      }
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.includes("최근 2회 연속 환불")) {
        setErrorMsg("최근 2회 연속 환불로 인해 1개월 동안 결제가 제한된 계정입니다.");
      } else {
        setErrorMsg("포인트 결제 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsReadySaving(false);
    }
  };

  const handlePaymentRequest = async () => {
    if (!isAuthed) {
      setShowLoginAlert(true);
      return;
    }

    if (amountValue === 0) {
      setShowPointConfirm(true);
      return;
    }

    if (!widgets || !isWidgetReady) {
      setErrorMsg("결제 모듈 로드 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setIsReadySaving(true);
    setErrorMsg("");

    try {
      await readyPayment({
        planCode: plan.code,
        orderId,
        amount: amountValue,
        usedPoint: pointsToUse,
        orderName: plan.name,
        customerName,
        customerKey,
        isUpgrade,
      });

      await widgets.requestPayment({
        orderId,
        orderName: plan.name,
        successUrl: SUCCESS_URL,
        failUrl: FAIL_URL,
      });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        removeAuth();
        setIsAuthed(false);
        setShowLoginAlert(true);
        return;
      }
      console.error("결제 처리 중 오류:", e);
      const msg = e?.response?.data?.message || e?.message || "";
      if (msg.includes("최근 2회 연속 환불")) {
        setErrorMsg("최근 2회 연속 환불로 인해 1개월 동안 결제가 제한된 계정입니다.");
      } else {
        setErrorMsg("결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsReadySaving(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-summary-card">
        <div className="pay-summary-header">
          <div>
            <h2 className="pay-title">구매: {plan.name}</h2>
            <div className="pay-order">
              주문번호: <strong>{orderId}</strong>
            </div>
          </div>
          <div className="pay-price">
            <span className="pay-price-label">{plan.code} 정가</span>
            <span className="pay-price-value">{plan.baseAmount.toLocaleString()}원</span>
          </div>
        </div>

        {isUpgrade ? (
          <div className="pay-summary-row">
            <span className="pay-summary-label">Basic → PRO 업그레이드 결제 금액</span>
            <span className="pay-summary-value">{baseAmount.toLocaleString()}원</span>
          </div>
        ) : (
          <div className="pay-summary-row">
            <span className="pay-summary-label">{plan.name} 결제 금액</span>
            <span className="pay-summary-value">{baseAmount.toLocaleString()}원</span>
          </div>
        )}

        <div className="pay-summary-row">
          <span className="pay-summary-label">사용 포인트</span>
          <span className="pay-summary-value">
            <span className="pay-highlight">{pointsToUse.toLocaleString()}P</span>
            <span className="pay-summary-sub"> / 보유 {userPoints.toLocaleString()}P</span>
          </span>
        </div>

        <div className="pay-summary-row pay-summary-total">
          <span className="pay-summary-label">최종 결제 금액</span>
          <span className="pay-summary-value pay-total">{amountValue.toLocaleString()}원</span>
        </div>
      </div>

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
          value={pointsToUse === 0 ? "" : pointsToUse.toLocaleString()}
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
      <div className="pay-helper">최대 사용 가능 포인트: {maxUsablePoints.toLocaleString()}P</div>

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

      <button type="button" onClick={() => window.history.back()} className="pay-btn-secondary">
        이전 페이지로 돌아가기
      </button>

      {showPointConfirm && (
        <div className="pay-modal-overlay">
          <div className="pay-modal">
            <h3 className="pay-modal-title">포인트 결제 확인</h3>
            <p className="pay-modal-text">
              포인트만으로 결제하면 <strong>환불이 불가능 합니다</strong>.
            </p>
            <p className="pay-modal-subtext">정말 포인트만으로 바로 결제할까요?</p>
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

      <AlertModal
        open={showLoginAlert}
        onClose={() => setShowLoginAlert(false)}
        onConfirm={() =>
          navigate("/signin", {
            replace: true,
            state: { redirect: `/pages/payment/buy?plan=${planKey}` },
          })
        }
        type="warning"
        title="로그인이 필요합니다"
        message={"결제를 진행하려면 로그인이 필요합니다.\n로그인 화면으로 이동합니다."}
        confirmText="확인"
      />
    </div>
  );
}

export default PaymentPage;
