import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchPointInfo } from "../../service/mypage/MyPageApi";
import { cancelPayment, fetchPaymentHistory } from "../../service/payment/PaymentApi";
import Pagination from "../../components/common/Pagination";
import { useLogin } from "../../context/login/useLogin";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";
import "./css/billing.css";

const statusLabel = {
  DONE: "결제 완료",
  READY: "진행중",
  CANCELED: "환불 완료",
  ERROR: "결제 오류",
};

function normalizePointRow(item, idx = 0) {
  const type = (item?.type || item?.pointType || "").toUpperCase();
  const amount = Number(item?.changeAmount ?? item?.amount ?? item?.point ?? 0);
  const createdAt = item?.createdAt || item?.usedAt || item?.earnedAt || item?.updatedAt;
  const description = item?.description || item?.memo || item?.reason || "-";

  return {
    id: item?.id ?? item?.paymentOrderId ?? idx,
    type,
    changeAmount: Number.isNaN(amount) ? 0 : amount,
    createdAt,
    paymentOrderId: item?.paymentOrderId || "-",
    description,
  };
}

function getPointDirection(row) {
  const type = (row?.type || "").toUpperCase();
  if (type === "USE") return "사용";
  if (type === "EARN" || type === "REFUND") return "적립";
  if (Number(row?.changeAmount || 0) < 0) return "사용";
  return "적립";
}

function formatPointChange(val) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  const abs = Math.abs(num).toLocaleString("ko-KR");
  return `${sign}${abs} P`;
}

const getHistoryKey = (row, idx) => row.orderId ?? row.id ?? row.paymentKey ?? `history-${idx}`;
const getPointKey = (row, idx) => row.id ?? row.paymentOrderId ?? `point-${idx}`;

function extractPointHistory(resData) {
  const candidates = [
    resData?.pointHistory,
    resData?.point_history,
    resData?.history,
    resData?.records,
    resData?.data,
    resData?.list,
    resData?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (Array.isArray(resData)) return resData;

  return [];
}

function sortByLatest(rows, getDate) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(getDate(a) || a?.createdAt || 0).getTime();
    const bTime = new Date(getDate(b) || b?.createdAt || 0).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const normalized = typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMoney(val) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  return `${num.toLocaleString("ko-KR")} 원`;
}

function formatPoint(val) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return val;
  return `${num.toLocaleString("ko-KR")} P`;
}

function parseDateStrict(value) {
  if (!value) return null;
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinDays(dateInput, days) {
  const base = parseDateStrict(dateInput);
  if (!base) return false;
  const now = Date.now();
  const diffMs = now - base.getTime();
  if (diffMs < 0) return false; // 미래 시간은 환불 불가
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

function getTransactionDate(row) {
  return row?.requestedAt || row?.approvedAt || row?.canceledAt || row?.subscriptionEndAt;
}

function getEndDate(row) {
  if (row?.canceledAt) return row.canceledAt;
  if (row?.subscriptionEndAt) return row.subscriptionEndAt;
  if (row?.approvedAt) return row.approvedAt;
  return row?.requestedAt;
}

export default function BillingPage() {
  const navigate = useNavigate();
  const { auth, logout, hydrated } = useLogin();
  const {alert, showAlert, closeAlert} = useAlert();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("history"); // history | point
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [showPayments, setShowPayments] = useState(true);
  const [showRefunds, setShowRefunds] = useState(true);
  const [historySortOrder, setHistorySortOrder] = useState("desc"); // desc 최신순
  const [pointSortOrder, setPointSortOrder] = useState("desc");
  const [historyPage, setHistoryPage] = useState(1);
  const [pointPage, setPointPage] = useState(1);
  const [pointStartDate, setPointStartDate] = useState("");
  const [pointEndDate, setPointEndDate] = useState("");
  const [showPointUse, setShowPointUse] = useState(true);
  const [showPointEarn, setShowPointEarn] = useState(true);
  const [pointOrderFilter, setPointOrderFilter] = useState("");
  const isAuthed = !!auth?.accessToken;

  // 로그인 상태 확인 (hydration 이후에만)
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) {
      navigate("/signin", { replace: true, state: { redirect: "/mypage/billing" } });
    }
  }, [hydrated, isAuthed, navigate]);

  // 결제/환불/포인트 이력 조회
  useEffect(() => {
    if (!hydrated || !isAuthed) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "point") {
          try {
            const res = await fetchPointInfo();

            const balanceRaw = res.data?.balance ?? res.data?.points ?? 0;
            const numericBalance =
              typeof balanceRaw === "number" ? balanceRaw : Number(balanceRaw) || 0;
            setPointBalance(numericBalance);

            const responseHistory = extractPointHistory(res.data);
            const normalizedHistory = (responseHistory || []).map((item, idx) =>
              normalizePointRow(item, idx)
            );

            setPointHistory(normalizedHistory);
          } catch (err) {
            const statusInner = err?.response?.status;
            if (statusInner === 401 || statusInner === 403) {
              setError("로그인이 필요합니다. 다시 로그인해 주세요.");
              setPointHistory([]);
              setPointBalance(0);
              setLoading(false);
              navigate("/signin", { replace: true, state: { redirect: "/mypage/billing" } });
              return;
            }
            setError("포인트 내역을 불러오지 못했습니다.");
            setPointHistory([]);
            setPointBalance(0);
            setLoading(false);
          }
        } else {
          const res = await fetchPaymentHistory({ from: startDate, to: endDate });
          setHistory(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setError("로그인이 필요합니다. 다시 로그인해주세요.");
          navigate("/signin", { replace: true, state: { redirect: "/mypage/billing" } });
          return;
        }
        setError("이력을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [hydrated, isAuthed, startDate, endDate, logout, navigate, tab]);

  const sortedHistory = useMemo(() => sortByLatest(history, getTransactionDate), [history]);

  const payments = useMemo(
    () => sortedHistory.filter((h) => (h.status || "").toUpperCase() === "DONE"),
    [sortedHistory]
  );
  const refunds = useMemo(
    () => sortedHistory.filter((h) => (h.status || "").toUpperCase() === "CANCELED"),
    [sortedHistory]
  );

  const isPointUse = (row) => {
    const type = (row?.type || "").toUpperCase();
    if (type === "USE") return true;
    if (type === "EARN" || type === "REFUND") return false;
    return Number(row?.changeAmount || 0) < 0;
  };

  const filteredHistoryAsc = useMemo(() => {
    const eligible = history.filter((row) => {
      const status = (row.status || "").toUpperCase();
      if (status !== "DONE" && status !== "CANCELED") return false;
      if (status === "CANCELED") return showRefunds;
      return showPayments;
    });

    return eligible.sort((a, b) => {
      const aTime = new Date(getTransactionDate(a) || a?.createdAt || 0).getTime();
      const bTime = new Date(getTransactionDate(b) || b?.createdAt || 0).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return aTime - bTime; // 오래된 순
    });
  }, [history, showPayments, showRefunds]);

  const historyNumberMap = useMemo(() => {
    const map = new Map();
    filteredHistoryAsc.forEach((row, idx) => {
      map.set(getHistoryKey(row, idx), idx + 1);
    });
    return map;
  }, [filteredHistoryAsc]);

  const filteredHistory = useMemo(() => {
    if (historySortOrder === "asc") return filteredHistoryAsc;
    return [...filteredHistoryAsc].reverse();
  }, [filteredHistoryAsc, historySortOrder]);

  const filteredPaymentSum = filteredHistory
    .filter((row) => (row.status || "").toUpperCase() === "DONE")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const filteredRefundSum = filteredHistory
    .filter((row) => (row.status || "").toUpperCase() === "CANCELED")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const filteredPointHistoryAsc = useMemo(() => {
    const sorted = [...pointHistory].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return aTime - bTime;
    });

    return sorted.filter((row) => {
      const dateStr = row?.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : "";
      if (pointStartDate && dateStr < pointStartDate) return false;
      if (pointEndDate && dateStr > pointEndDate) return false;

      const direction = getPointDirection(row);
      if (direction === "사용" && !showPointUse) return false;
      if (direction === "적립" && !showPointEarn) return false;
      return true;
    });
  }, [pointHistory, pointStartDate, pointEndDate, showPointUse, showPointEarn]);

  const pointNumberMap = useMemo(() => {
    const map = new Map();
    filteredPointHistoryAsc.forEach((row, idx) => {
      map.set(getPointKey(row, idx), idx + 1);
    });
    return map;
  }, [filteredPointHistoryAsc]);

  const filteredPointHistory = useMemo(() => {
    const filtered = filteredPointHistoryAsc.filter((row) => {
      return !(pointOrderFilter && (row.paymentOrderId || "") !== pointOrderFilter);
    });
    if (pointSortOrder === "asc") return filtered;
    return [...filtered].reverse();
  }, [filteredPointHistoryAsc, pointSortOrder, pointOrderFilter]);

  const filteredTotalPointUse = filteredPointHistory.reduce((sum, p) => {
    const amount = Number(p?.changeAmount) || 0;
    return sum + (isPointUse(p) ? Math.abs(amount) : 0);
  }, 0);
  const filteredTotalPointEarn = filteredPointHistory.reduce((sum, p) => {
    const amount = Number(p?.changeAmount) || 0;
    const direction = getPointDirection(p);
    return sum + (direction === "적립" ? Math.abs(amount) : 0);
  }, 0);

  // 페이지네이션
  const PAGE_SIZE = 10;

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const pointTotalPages = Math.max(1, Math.ceil(filteredPointHistory.length / PAGE_SIZE));

  useEffect(() => {
    setHistoryPage(1);
  }, [showPayments, showRefunds, historySortOrder, startDate, endDate]);

  useEffect(() => {
    setPointPage(1);
  }, [showPointUse, showPointEarn, pointSortOrder, pointStartDate, pointEndDate, pointOrderFilter]);

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
  }, [historyPage, historyTotalPages]);

  useEffect(() => {
    if (pointPage > pointTotalPages) setPointPage(pointTotalPages);
  }, [pointPage, pointTotalPages]);

  const historyPageRows = useMemo(() => {
    const start = (historyPage - 1) * PAGE_SIZE;
    return filteredHistory.slice(start, start + PAGE_SIZE);
  }, [filteredHistory, historyPage]);

  const filteredPointPageRows = useMemo(() => {
    const start = (pointPage - 1) * PAGE_SIZE;
    return filteredPointHistory.slice(start, start + PAGE_SIZE);
  }, [filteredPointHistory, pointPage]);

  const currentPlan = useMemo(() => {
    const active = (history || []).filter((row) => {
      const end = parseDateStrict(row.subscriptionEndAt);
      return row?.status?.toUpperCase() === "DONE" && end && end >= new Date();
    });
    if (!active.length) return "FREE";
    const sorted = active.sort((a, b) => {
      const aEnd = parseDateStrict(a.subscriptionEndAt)?.getTime() || 0;
      const bEnd = parseDateStrict(b.subscriptionEndAt)?.getTime() || 0;
      return bEnd - aEnd;
    });
    return (sorted[0]?.planCode || sorted[0]?.orderName || "FREE").toUpperCase();
  }, [history]);

  const handleRefund = async (row) => {
    if (!row?.paymentKey || Number(row.amount || 0) === 0) {
      showAlert({
        type: "warning",
        title: "환불 불가",
        message: "포인트 전액 결제 건은 환불할 수 없습니다.",
      });
      return;
    }

    const reason = prompt("환불 사유를 입력해주세요", "사용 취소")?.trim() || "";
    if (!reason) return;

    try {
      await cancelPayment({ paymentKey: row.paymentKey, cancelReason: reason });

      showAlert({
        type: "success",
        title: "환불 완료",
        message: "환불 요청이 처리되었습니다.",
      });

      const res = await fetchPaymentHistory({ from: startDate, to: endDate });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        "환불 요청 처리 중 문제가 발생했습니다.";

      showAlert({
        type: "error",
        title: "환불 실패",
        message,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 text-main billing-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-main">결제 / 구독 관리</h1>
          <p className="text-sm text-sub">현재 구독 상태와 결제·환불 내역을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-md text-sm font-semibold billing-current-plan text-main">
            현재 요금제: <span className="font-bold text-main">{currentPlan}</span>
          </div>
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            요금제 보러가기
          </Link>
        </div>
      </div>

      <div className="border rounded-2xl shadow-sm p-6 billing-panel">
        <div className="flex items-center gap-4 border-b pb-3 mb-4">
          <button
            className={`pb-2 px-1 font-semibold ${
              tab === "history" ? "border-b-2 border-indigo-500" : "text-gray-400"
            }`}
            onClick={() => setTab("history")}
          >
            결제/환불 내역
          </button>
          <button
            className={`pb-2 px-1 font-semibold ${
              tab === "point" ? "border-b-2 border-indigo-500" : "text-gray-400"
            }`}
            onClick={() => setTab("point")}
          >
            포인트 내역
          </button>
        </div>

        {tab === "history" ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-main">
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal text-sub">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-date"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal text-sub">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-date"
                />
              </div>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={showPayments}
                  onChange={(e) => setShowPayments(e.target.checked)}
                />
                결제 보기
              </label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={showRefunds}
                  onChange={(e) => setShowRefunds(e.target.checked)}
                />
                환불 보기
              </label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={historySortOrder === "desc"}
                  onChange={() => setHistorySortOrder("desc")}
                />
                최신순
              </label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={historySortOrder === "asc"}
                  onChange={() => setHistorySortOrder("asc")}
                />
                오래된순
              </label>
            </div>

            <HistoryTable
              rows={historyPageRows}
              onRefund={handleRefund}
              onOrderLink={(orderId, isPointOnly, row) => {
                if (!orderId) return;
                const usedPoint = Number(row?.usedPoint || 0);
                const shouldJump = isPointOnly || usedPoint > 0;
                if (shouldJump) {
                  setTab("point");
                  setPointOrderFilter(orderId);
                  setPointPage(1);
                }
              }}
              numberMap={historyNumberMap}
              rowKeyFn={getHistoryKey}
            />
            <div className="flex items-center justify-between text-sm text-main mt-3">
              <span className="text-sub">총 {filteredHistory.length}건</span>
              <div className="text-right">
                <span className="mr-4 text-sub">총 결제 금액: {formatMoney(filteredPaymentSum)}</span>
                <span className="text-sub">총 환불 금액: {formatMoney(filteredRefundSum)}</span>
              </div>
            </div>
            <Pagination
              currentPage={historyPage}
              totalPages={historyTotalPages}
              onPageChange={setHistoryPage}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-main">
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal text-sub">시작일</label>
                <input
                  type="date"
                  value={pointStartDate}
                  onChange={(e) => setPointStartDate(e.target.value)}
                  className="input-date"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal text-sub">종료일</label>
                <input
                  type="date"
                  value={pointEndDate}
                  onChange={(e) => setPointEndDate(e.target.value)}
                  className="input-date"
                />
              </div>
              {pointOrderFilter && (
                <div className="flex items-center gap-2 text-sm text-sub">
                  <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/40">
                    주문번호 필터: {pointOrderFilter}
                  </span>
                  <button
                    className="text-xs underline"
                    onClick={() => {
                      setPointOrderFilter("");
                      setPointPage(1);
                    }}
                  >
                    필터 해제
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-main">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={showPointUse}
                    onChange={(e) => setShowPointUse(e.target.checked)}
                  />
                  사용 보기
                </label>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={showPointEarn}
                    onChange={(e) => setShowPointEarn(e.target.checked)}
                  />
                  적립 보기
                </label>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={pointSortOrder === "desc"}
                    onChange={() => setPointSortOrder("desc")}
                  />
                  최신순
                </label>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={pointSortOrder === "asc"}
                    onChange={() => setPointSortOrder("asc")}
                  />
                  오래된순
                </label>
              </div>
            </div>
            <PointTable rows={filteredPointPageRows} numberMap={pointNumberMap} rowKeyFn={getPointKey} />
            <div className="flex items-center justify-between text-sm text-main mt-3">
              <span className="text-sub">총 {filteredPointHistory.length}건</span>
              <div className="text-right space-x-4">
                <span className="text-sub">현재 보유 포인트: {formatPoint(pointBalance)}</span>
                <span className="text-sub">총 사용 포인트: {formatPoint(filteredTotalPointUse)}</span>
                <span className="text-sub">총 적립 포인트: {formatPoint(filteredTotalPointEarn)}</span>
              </div>
            </div>
            <Pagination
              currentPage={pointPage}
              totalPages={pointTotalPages}
              onPageChange={setPointPage}
            />
          </>
        )}

        {loading && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">이력을 불러오는 중...</p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
}

function HistoryTable({ rows, onRefund, onOrderLink, numberMap, rowKeyFn }) {
  const emptyText = "내역이 없습니다.";
  const dateLabel1 = "구독/결제일";
  const dateLabel2 = "만료/해지일";

  return (
    <div className="border rounded-2xl shadow-sm overflow-hidden billing-panel">
      <table className="min-w-full text-sm text-center billing-table">
        <thead className="billing-table-head">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-center">주문번호</th>
            <th className="px-4 py-3 text-center">구독권 종류</th>
            <th className="px-4 py-3 text-center">금액</th>
            <th className="px-4 py-3 text-center">{dateLabel1}</th>
            <th className="px-4 py-3 text-center">{dateLabel2}</th>
            <th className="px-4 py-3 text-center">상태</th>
            <th className="px-4 py-3 text-center">환불</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, idx) => {
            const key = rowKeyFn?.(row, idx) ?? row.orderId ?? row.id ?? idx;
            const number = numberMap?.get(key) ?? idx + 1;
            const status = (row.status || "").toUpperCase();
            const isPointOnly = Number(row.amount || 0) === 0;
            const hasPaymentKey = !!row.paymentKey;
            const isCanceled = status === "CANCELED";
            const refundBaseTime =
              row.subscriptionStartAt || row.approvedAt || row.requestedAt || row.canceledAt;
            const isWithinRefund = refundBaseTime ? isWithinDays(refundBaseTime, 7) : false;
            const endTime = row.subscriptionEndAt ? new Date(row.subscriptionEndAt) : null;
            const isSubscriptionActive = !endTime || endTime >= new Date();
            const canRefund =
              status === "DONE" &&
              !isPointOnly &&
              hasPaymentKey &&
              isWithinRefund &&
              isSubscriptionActive;

            let refundLabel = "환불 불가";
            let refundReason = "환불을 진행할 수 없는 건입니다.";
            if (isCanceled) {
              refundLabel = "환불됨";
              refundReason = "이미 환불 완료된 건입니다.";
            } else if (status === "ERROR") {
              refundLabel = "결제 오류";
              refundReason = "결제 오류로 환불이 불가능합니다.";
            } else if (canRefund) {
              refundLabel = "환불 가능";
              refundReason = "결제 완료 건으로 환불 요청이 가능합니다.";
            } else if ((status === "DONE" && !isSubscriptionActive) || ["ENDED", "EXPIRED"].includes(status)) {
              refundLabel = "구독 종료";
              refundReason = "만료된 구독은 환불할 수 없습니다.";
            } else if (status === "DONE" && !isWithinRefund) {
              refundLabel = "기간 만료";
              refundReason = "환불 가능 기간(7일)이 지났습니다.";
            } else if (isPointOnly) {
              refundReason = "포인트만 사용된 결제는 환불을 지원하지 않습니다.";
            } else if (!hasPaymentKey) {
              refundReason = "결제 키가 없어 환불할 수 없습니다.";
              refundLabel = "결제 오류";
            } else if (status !== "DONE") {
              refundReason = "진행 중/실패/만료 등 결제 완료가 아닌 상태입니다.";
            }

            const badgeClass =
              refundLabel === "환불 가능"
                ? "bg-emerald-100 text-emerald-700"
                : refundLabel === "환불됨"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600";

            return (
              <tr key={key} className="border-t">
                <td className="px-4 py-3 text-center">{number}</td>
                <td className="px-4 py-3 text-center">
                  {row.orderId ? (
                    <button
                      className="text-xs font-medium text-current hover:underline"
                      title={row.orderId}
                      onClick={() => onOrderLink?.(row.orderId, isPointOnly, row)}
                    >
                      {row.orderId}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-center">
                  {(row.planCode || row.orderName || "-").toUpperCase()}
                </td>
                <td className="px-4 py-3 text-center">{formatMoney(row.amount)}</td>
                <td className="px-4 py-3 text-center">
                  {formatDate(row.subscriptionStartAt || row.requestedAt)}
                </td>
                <td className="px-4 py-3 text-center">{formatDate(getEndDate(row))}</td>
                <td className="px-4 py-3 text-center">
                  {statusLabel[status] || row.status || "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      title={refundReason || refundLabel}
                      className={`px-2 py-1 rounded-md text-xs font-medium ${badgeClass}`}
                    >
                      {refundLabel}
                    </span>
                    {canRefund && (
                      <button
                        title="환불 요청"
                        className="px-3 py-1 rounded-md text-sm bg-rose-500 text-white hover:bg-rose-600"
                        onClick={() => onRefund?.(row)}
                      >
                        환불
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PointTable({ rows, numberMap, rowKeyFn }) {
  const emptyText = "포인트 내역이 없습니다.";

  const formatDescription = (row) => {
    const direction = getPointDirection(row);
    if (direction === "사용" && row.paymentOrderId) return "구독 결제";
    return row.description || "-";
  };

  return (
    <div className="border rounded-2xl shadow-sm overflow-hidden billing-panel">
      <table className="min-w-full text-sm text-center billing-table">
        <thead className="billing-table-head">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-center">주문번호</th>
            <th className="px-4 py-3 text-center">유형</th>
            <th className="px-4 py-3 text-center">변경 포인트</th>
            <th className="px-4 py-3 text-center">사용 날짜</th>
            <th className="px-4 py-3 text-center">설명</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, idx) => {
            const key = rowKeyFn?.(row, idx) ?? row.id ?? row.paymentOrderId ?? idx;
            const number = numberMap?.get(key) ?? idx + 1;
            return (
              <tr key={key} className="border-t">
                <td className="px-4 py-3 text-center">{number}</td>
                <td className="px-4 py-3 text-center" title={row.paymentOrderId || "-"}>
                  <span className="text-xs font-medium text-current">
                    {row.paymentOrderId || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{getPointDirection(row)}</td>
                <td className="px-4 py-3 text-center">{formatPointChange(row.changeAmount)}</td>
                <td className="px-4 py-3 text-center">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3 text-center">{formatDescription(row)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
