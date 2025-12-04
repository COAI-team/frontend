import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../server/AxiosConfig";
import { useLogin } from "../../context/useLogin";

const statusLabel = {
  DONE: "결제 완료",
  READY: "진행중",
  CANCELED: "환불 완료",
};

const pointTypeLabel = {
  EARN: "적립",
  USE: "사용",
  REFUND: "환불복구",
  BALANCE: "보유",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ko-KR");
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

export default function BillingPage() {
  const navigate = useNavigate();
  const { auth, logout, hydrated } = useLogin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("payment"); // payment | refund | point
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const isAuthed = !!auth?.accessToken;

  // 로그인 상태 확인 (hydration 완료 이후에만)
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
          let list = [];
          try {
            const res = await axiosInstance.get("/payments/points/history", {
              params: {
                from: startDate || undefined,
                to: endDate || undefined,
              },
              headers: { "X-Skip-Auth-Redirect": "true" },
            });
            list = Array.isArray(res.data) ? res.data : [];
          } catch (innerErr) {
            const statusInner = innerErr?.response?.status;
            // 포인트 히스토리 API가 없거나 막혀도 잔액만 보여주는 fallback
            if (statusInner === 401 || statusInner === 403 || statusInner === 404) {
              try {
                const res = await axiosInstance.get("/users/me/points", {
                  headers: { "X-Skip-Auth-Redirect": "true" },
                });
                const balance = res.data?.balance ?? res.data?.points ?? 0;
                list = [
                  {
                    id: "balance",
                    type: "BALANCE",
                    changeAmount: balance,
                    createdAt: new Date().toISOString(),
                    paymentOrderId: "-",
                    description: "현재 보유 포인트",
                  },
                ];
              } catch (fallbackErr) {
                const fbStatus = fallbackErr?.response?.status;
                if (fbStatus === 401) {
                  setError("로그인을 불러오지 못했습니다. 잠시 후 로그인해주세요.");
                  setPointHistory([]);
                  return;
                }
                setError("포인트 이력을 불러오지 못했습니다.");
                setPointHistory([]);
                return;
              }
            } else {
              throw innerErr;
            }
          }
          setPointHistory(list);
        } else {
          const res = await axiosInstance.get("/payments/history", {
            params: {
              from: startDate || undefined,
              to: endDate || undefined,
            },
          });
          setHistory(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        const status = err?.response?.status;
        // 포인트 외에는 401 시 강제 로그아웃
        if (status === 401 && tab !== "point") {
          logout();
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

  const payments = useMemo(
    () => history.filter((h) => (h.status || "").toUpperCase() === "DONE"),
    [history]
  );
  const refunds = useMemo(
    () => history.filter((h) => (h.status || "").toUpperCase() === "CANCELED"),
    [history]
  );

  const totalPayment = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalRefund = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPointChange = pointHistory.reduce(
    (sum, p) => sum + (Number(p.changeAmount) || 0),
    0
  );

  const handleRefund = async (row) => {
    // 포인트-only 결제 또는 paymentKey 없는 건 환불 불가
    if (!row?.paymentKey || Number(row.amount || 0) === 0) {
      alert("포인트-only 결제 건은 환불할 수 없습니다.");
      return;
    }

    const reason = prompt("환불 사유를 입력해주세요", "사용 취소")?.trim() || "";
    if (!reason) return;

    try {
      await axiosInstance.post("/payments/cancel", null, {
        params: {
          paymentKey: row.paymentKey,
          cancelReason: reason,
        },
      });
      alert("환불 요청이 처리되었습니다.");
      // 최신 이력 다시 조회
      const res = await axiosInstance.get("/payments/history", {
        params: {
          from: startDate || undefined,
          to: endDate || undefined,
        },
      });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || "환불 요청 처리 중 문제가 발생했습니다.";
      alert(message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">결제 / 구독 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            현재 구독 상태와 결제·환불 내역을 확인하세요.
          </p>
        </div>
        <Link
          to="/pages/payment/pricing"
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
        >
          요금제 보러가기
        </Link>
      </div>

      <div className="border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-4 border-b pb-3 mb-4">
          <button
            className={`pb-2 px-1 font-semibold ${
              tab === "payment" ? "border-b-2 border-indigo-500" : "text-gray-400"
            }`}
            onClick={() => setTab("payment")}
          >
            결제 내역
          </button>
          <button
            className={`pb-2 px-1 font-semibold ${
              tab === "refund" ? "border-b-2 border-indigo-500" : "text-gray-400"
            }`}
            onClick={() => setTab("refund")}
          >
            환불 내역
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

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-2 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-3 py-2 bg-transparent"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {tab === "payment"
              ? `총 결제 금액: ${formatMoney(totalPayment)}`
              : tab === "refund"
              ? `총 환불 금액: ${formatMoney(totalRefund)}`
              : `포인트 변동 합계: ${formatPoint(totalPointChange)}`}
          </div>
        </div>

        {tab === "payment" ? (
          <HistoryTable rows={payments} type="payment" onRefund={handleRefund} />
        ) : tab === "refund" ? (
          <HistoryTable rows={refunds} type="refund" />
        ) : (
          <PointTable rows={pointHistory} />
        )}

        {loading && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">이력을 불러오는 중...</p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function HistoryTable({ rows, type, onRefund }) {
  const isPayment = type === "payment";
  const emptyText = isPayment ? "결제 내역이 없습니다." : "환불 내역이 없습니다.";

  const dateLabel1 = isPayment ? "구독/결제일" : "환불 요청일";
  const dateLabel2 = isPayment ? "승인/해지일" : "환불 완료일";

  return (
    <div className="border rounded-2xl shadow-sm overflow-hidden">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-center">구독권 종류</th>
            <th className="px-4 py-3 text-center">금액</th>
            <th className="px-4 py-3 text-center">{dateLabel1}</th>
            <th className="px-4 py-3 text-center">{dateLabel2}</th>
            <th className="px-4 py-3 text-center">상태</th>
            {isPayment && <th className="px-4 py-3 text-center">환불</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                colSpan={isPayment ? 7 : 6}
              >
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row, idx) => {
            const status = (row.status || "").toUpperCase();
            const isPointOnly = Number(row.amount || 0) === 0;
            const hasPaymentKey = !!row.paymentKey;
            const canRefund =
              isPayment && status === "DONE" && !isPointOnly && hasPaymentKey;

            let disableReason = "";
            if (isPayment) {
              if (isPointOnly) {
                disableReason = "포인트-only 결제 건은 환불할 수 없습니다.";
              } else if (!hasPaymentKey) {
                disableReason = "결제 키가 없는 건은 환불할 수 없습니다.";
              } else if (status !== "DONE") {
                disableReason = "결제 완료 건만 환불 가능합니다.";
              }
            }

            return (
              <tr key={row.orderId ?? idx} className="border-t dark:border-gray-800">
                <td className="px-4 py-3 text-center">{idx + 1}</td>
                <td className="px-4 py-3 font-semibold text-center">
                  {(row.planCode || row.orderName || "-").toUpperCase()}
                </td>
                <td className="px-4 py-3 text-center">{formatMoney(row.amount)}</td>
                <td className="px-4 py-3 text-center">{formatDate(row.requestedAt)}</td>
                <td className="px-4 py-3 text-center">
                  {formatDate(row.approvedAt || row.canceledAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  {statusLabel[status] || row.status || "-"}
                </td>
                {isPayment && (
                  <td className="px-4 py-3 text-center">
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        canRefund
                          ? "bg-rose-500 text-white hover:bg-rose-600"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={!canRefund}
                      title={canRefund ? "환불 요청" : disableReason}
                      onClick={() => canRefund && onRefund?.(row)}
                    >
                      환불
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PointTable({ rows }) {
  const emptyText = "포인트 내역이 없습니다.";

  return (
    <div className="border rounded-2xl shadow-sm overflow-hidden">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3 text-center">유형</th>
            <th className="px-4 py-3 text-center">변경 포인트</th>
            <th className="px-4 py-3 text-center">발생일</th>
            <th className="px-4 py-3 text-center">연결 결제</th>
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
          {rows.map((row, idx) => (
            <tr key={row.id ?? idx} className="border-t dark:border-gray-800">
              <td className="px-4 py-3 text-center">{idx + 1}</td>
              <td className="px-4 py-3 text-center">
                {pointTypeLabel[(row.type || "").toUpperCase()] || row.type || "-"}
              </td>
              <td className="px-4 py-3 text-center">{formatPoint(row.changeAmount)}</td>
              <td className="px-4 py-3 text-center">{formatDate(row.createdAt)}</td>
              <td className="px-4 py-3 text-center">{row.paymentOrderId || "-"}</td>
              <td className="px-4 py-3 text-center">{row.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
