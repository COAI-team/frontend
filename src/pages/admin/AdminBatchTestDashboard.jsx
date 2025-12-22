import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

import { mockBatchTestDashboardData } from "./mockBatchTestDashboardData";

const donutColors = [
  "#6366F1",
  "#34D399",
  "#F59E0B",
  "#EC4899",
  "#0EA5E9",
  "#94A3B8",
];

const BATCH_DASHBOARD_API = "http://localhost:9443/admin/batch";
const BATCH_DAILY_RANGE_API = "http://localhost:9443/admin/dailystats";
const BATCH_USER_MONTHLY_STATS_API =
  "http://localhost:9443/admin/userstats";
const BATCH_SALES_MONTHLY_STATS_API =
  "http://localhost:9443/admin/salesstats";
const RECENT_MONTHLY_RANGE_OPTIONS = [
  { label: "최근 6개월", value: 6 },
  { label: "최근 12개월", value: 12 },
];

export default function AdminBatchTestDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatsView, setUserStatsView] = useState("monthly");
  const [selectedUserYear, setSelectedUserYear] = useState(null);
  const [activeMonthlyRange, setActiveMonthlyRange] = useState(null);
  const [paymentStatsView, setPaymentStatsView] = useState("monthly");
  const [selectedPaymentYear, setSelectedPaymentYear] = useState(null);
  const [activeSalesRange, setActiveSalesRange] = useState(null);
  const initialEndDate = getISODate(new Date());
  const initialStartDate = getISODate(addDays(new Date(), -6));
  const [rangeStartDate, setRangeStartDate] = useState(initialStartDate);
  const [rangeEndDate, setRangeEndDate] = useState(initialEndDate);
  const [rangeStats, setRangeStats] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState(null);
  const [rangeMetric, setRangeMetric] = useState("totalUsers");
  const [recentMonthlyStats, setRecentMonthlyStats] = useState([]);
  const [recentSalesStats, setRecentSalesStats] = useState([]);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [userStatsError, setUserStatsError] = useState(null);
  const [salesStatsLoading, setSalesStatsLoading] = useState(false);
  const [salesStatsError, setSalesStatsError] = useState(null);
  const recentMonthlyRangeOptions = RECENT_MONTHLY_RANGE_OPTIONS;

  const fetchRangeStats = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) {
      return;
    }
    setRangeLoading(true);
    setRangeError(null);
    try {
      const response = await axios.get(BATCH_DAILY_RANGE_API, {
        params: { startDate, endDate },
      });
      const payload = response.data?.data ?? response.data ?? [];
      const normalized = Array.isArray(payload)
        ? payload.map(normalizeSummaryEntry)
        : [];
      setRangeStats(normalized);
    } catch (error) {
      console.warn("⚠️ 범위형 일별 통계 데이터 조회 실패:", error);
      setRangeError("선택한 기간의 데이터를 불러오지 못했습니다.");
      setRangeStats([]);
    } finally {
      setRangeLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(BATCH_DASHBOARD_API);
        if (response.data?.data) {
          setDashboardData(response.data.data);
        } else if (response.data) {
          setDashboardData(response.data);
        } else {
          setDashboardData(mockBatchTestDashboardData);
        }
      } catch (error) {
        console.warn(
          "⚠️ 배치 테스트 대시보드 데이터를 mock으로 대체합니다:",
          error
        );
        setDashboardData(mockBatchTestDashboardData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    fetchRangeStats(initialStartDate, initialEndDate);
  }, [fetchRangeStats, initialEndDate, initialStartDate]);
  const fetchUserMonthlyStats = useCallback(async (limit) => {
    if (!limit) return;
    setUserStatsLoading(true);
    setUserStatsError(null);
    try {
      const response = await axios.get(BATCH_USER_MONTHLY_STATS_API, {
        params: { limit },
      });
      const payload = response.data?.data ?? response.data ?? [];
      if (Array.isArray(payload) && payload.length > 0) {
        const normalized = payload.map((item) => ({
          statYear: Number(item.statYear ?? item.stat_year ?? 0),
          statMonth: Number(item.statMonth ?? item.stat_month ?? 0),
          newUserCount: Number(item.newUserCount ?? item.new_user_count ?? 0),
          totalUserCount: Number(
            item.totalUserCount ?? item.total_user_count ?? 0
          ),
        }));
        setRecentMonthlyStats(normalized);
      } else {
        setRecentMonthlyStats([]);
      }
    } catch (error) {
      console.warn("⚠️ 월별 유저 통계 조회 실패:", error);
      setUserStatsError("월별 유저 통계를 불러오지 못했습니다.");
    } finally {
      setUserStatsLoading(false);
    }
  }, []);
  const fetchSalesMonthlyStats = useCallback(async (limit) => {
    if (!limit) return;
    setSalesStatsLoading(true);
    setSalesStatsError(null);
    try {
      const response = await axios.get(BATCH_SALES_MONTHLY_STATS_API, {
        params: { limit },
      });
      const payload = response.data?.data ?? response.data ?? [];
      if (Array.isArray(payload) && payload.length > 0) {
        const normalized = payload.map((item) => ({
          statYear: Number(item.statYear ?? item.stat_year ?? 0),
          statMonth: Number(item.statMonth ?? item.stat_month ?? 0),
          paymentCount: Number(item.paymentCount ?? item.payment_count ?? 0),
          revenue: Number(item.revenue ?? 0),
        }));
        setRecentSalesStats(normalized);
      } else {
        setRecentSalesStats([]);
      }
    } catch (error) {
      console.warn("⚠️ 월별 매출 통계 조회 실패:", error);
      setSalesStatsError("월별 매출 통계를 불러오지 못했습니다.");
    } finally {
      setSalesStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const maxMonthlyRange = recentMonthlyRangeOptions.reduce(
      (max, option) => Math.max(max, option.value),
      0
    );
    const initialLimit = maxMonthlyRange || 6;
    fetchUserMonthlyStats(initialLimit);
  }, [fetchUserMonthlyStats, recentMonthlyRangeOptions]);

  const summary = dashboardData?.summary ?? {
    statDate: null,
    totalUsers: 0,
    newUsers: 0,
    paymentCount: 0,
    revenue: 0,
  };

  const userMonthlyStatsFromDashboard = Array.isArray(
    dashboardData?.userMonthlyStats
  )
    ? dashboardData.userMonthlyStats
    : [];
  const userStatsByYear = useMemo(() => {
    return userMonthlyStatsFromDashboard.reduce((acc, item) => {
      const yearKey = String(item.statYear ?? "기타");
      acc[yearKey] = acc[yearKey] ?? [];
      acc[yearKey].push(item);
      return acc;
    }, {});
  }, [userMonthlyStatsFromDashboard]);
  const sortedMonthlyStats = useMemo(() => {
    return [...userMonthlyStatsFromDashboard].sort((a, b) => {
      const aKey = Number(a.statYear ?? 0) * 100 + Number(a.statMonth ?? 0);
      const bKey = Number(b.statYear ?? 0) * 100 + Number(b.statMonth ?? 0);
      return aKey - bKey;
    });
  }, [userMonthlyStatsFromDashboard]);
  const availableUserYears = Object.keys(userStatsByYear).sort(
    (a, b) => Number(a) - Number(b)
  );

  useEffect(() => {
    if (!availableUserYears.length) {
      if (selectedUserYear !== null) {
        setSelectedUserYear(null);
      }
      return;
    }
    const latestYear = availableUserYears[availableUserYears.length - 1];
    if (!selectedUserYear || !availableUserYears.includes(selectedUserYear)) {
      setSelectedUserYear(latestYear);
    }
  }, [availableUserYears, selectedUserYear]);
  useEffect(() => {
    if (userStatsView !== "monthly" && activeMonthlyRange !== null) {
      setActiveMonthlyRange(null);
    }
  }, [userStatsView, activeMonthlyRange]);
  useEffect(() => {
    if (paymentStatsView !== "monthly" && activeSalesRange !== null) {
      setActiveSalesRange(null);
    }
  }, [paymentStatsView, activeSalesRange]);

  const monthlyDataForYear =
    selectedUserYear && userStatsByYear[selectedUserYear]
      ? [...userStatsByYear[selectedUserYear]]
          .sort((a, b) => Number(a.statMonth) - Number(b.statMonth))
          .map((item) => ({
            label: formatMonthlyLabel(item.statYear, item.statMonth),
            value: Number(item.totalUserCount ?? item.newUserCount ?? 0),
          }))
      : [];
  const recentMonthlyChartData = useMemo(() => {
    if (!activeMonthlyRange || recentMonthlyStats.length === 0) return [];
    const sorted = [...recentMonthlyStats].sort((a, b) => {
      const aKey = Number(a.statYear ?? 0) * 100 + Number(a.statMonth ?? 0);
      const bKey = Number(b.statYear ?? 0) * 100 + Number(b.statMonth ?? 0);
      return aKey - bKey;
    });
    const sliceStart = Math.max(sorted.length - activeMonthlyRange, 0);
    return sorted.slice(sliceStart).map((item) => ({
      label: formatMonthlyLabel(item.statYear, item.statMonth),
      value: Number(item.totalUserCount ?? item.newUserCount ?? 0),
    }));
  }, [activeMonthlyRange, recentMonthlyStats]);
  const userMonthlyChartData =
    activeMonthlyRange &&
    userStatsView === "monthly" &&
    recentMonthlyChartData.length > 0
      ? recentMonthlyChartData
      : monthlyDataForYear;
  const userYearlyChartData = availableUserYears.map((year) => {
    const monthlyEntries = [...(userStatsByYear[year] ?? [])].sort(
      (a, b) => Number(a.statMonth) - Number(b.statMonth)
    );
    const lastEntry = monthlyEntries[monthlyEntries.length - 1];
    return {
      label: year,
      value: Number(lastEntry?.totalUserCount ?? lastEntry?.newUserCount ?? 0),
    };
  });
  const userGrowthChartData =
    userStatsView === "monthly" ? userMonthlyChartData : userYearlyChartData;

  const userChartDiffInfo = calculateDiffInfo(userGrowthChartData);

  const salesMonthlyStats = Array.isArray(dashboardData?.salesMonthlyStats)
    ? dashboardData.salesMonthlyStats
    : [];
  const paymentStatsByYear = useMemo(() => {
    return salesMonthlyStats.reduce((acc, item) => {
      const yearKey = String(item.statYear ?? "기타");
      acc[yearKey] = acc[yearKey] ?? [];
      acc[yearKey].push(item);
      return acc;
    }, {});
  }, [salesMonthlyStats]);
  const availablePaymentYears = Object.keys(paymentStatsByYear).sort(
    (a, b) => Number(a) - Number(b)
  );

  useEffect(() => {
    if (!availablePaymentYears.length) {
      if (selectedPaymentYear !== null) {
        setSelectedPaymentYear(null);
      }
      return;
    }
    const latestYear = availablePaymentYears[availablePaymentYears.length - 1];
    if (
      !selectedPaymentYear ||
      !availablePaymentYears.includes(selectedPaymentYear)
    ) {
      setSelectedPaymentYear(latestYear);
    }
  }, [availablePaymentYears, selectedPaymentYear]);

  const paymentMonthlyDataForYear =
    selectedPaymentYear && paymentStatsByYear[selectedPaymentYear]
      ? [...paymentStatsByYear[selectedPaymentYear]]
          .sort((a, b) => Number(a.statMonth) - Number(b.statMonth))
          .map((item) => ({
            label: formatMonthlyLabel(item.statYear, item.statMonth),
            value: Number(item.revenue ?? 0),
          }))
      : [];
  const recentSalesChartData = useMemo(() => {
    if (!activeSalesRange || recentSalesStats.length === 0) return [];
    const sorted = [...recentSalesStats].sort((a, b) => {
      const aKey = Number(a.statYear ?? 0) * 100 + Number(a.statMonth ?? 0);
      const bKey = Number(b.statYear ?? 0) * 100 + Number(b.statMonth ?? 0);
      return aKey - bKey;
    });
    const sliceStart = Math.max(sorted.length - activeSalesRange, 0);
    return sorted.slice(sliceStart).map((item) => ({
      label: formatMonthlyLabel(item.statYear, item.statMonth),
      value: Number(item.revenue ?? 0),
    }));
  }, [activeSalesRange, recentSalesStats]);
  const paymentMonthlyChartData =
    activeSalesRange &&
    paymentStatsView === "monthly" &&
    recentSalesChartData.length > 0
      ? recentSalesChartData
      : paymentMonthlyDataForYear;
  const paymentYearlyChartData = availablePaymentYears.map((year) => {
    const monthlyEntries = paymentStatsByYear[year] ?? [];
    const totalRevenue = monthlyEntries.reduce(
      (sum, item) => sum + Number(item.revenue ?? 0),
      0
    );
    return { label: year, value: totalRevenue };
  });
  const paymentChartData =
    paymentStatsView === "monthly"
      ? paymentMonthlyChartData
      : paymentYearlyChartData;
  const paymentChartDiffInfo = calculateDiffInfo(paymentChartData);

  const mauMonthlyStats = Array.isArray(dashboardData?.mauMonthlyStats)
    ? dashboardData.mauMonthlyStats
    : [];
  const mauChartData = mauMonthlyStats
    .map((item) => ({
      label: `${item.statYear}.${String(item.statMonth).padStart(2, "0")}`,
      value: Number(item.mauCount ?? 0),
    }))
    .sort((a, b) => {
      const [yearA, monthA] = a.label.split(".").map(Number);
      const [yearB, monthB] = b.label.split(".").map(Number);
      if (yearA === yearB) return monthA - monthB;
      return yearA - yearB;
    });
  const mauDiffInfo = calculateDiffInfo(mauChartData);

  const languageRankingTop5Raw = Array.isArray(
    dashboardData?.languageRankingTop5
  )
    ? dashboardData.languageRankingTop5
    : [];
  const languageRankingTop5 = useMemo(() => {
    if (!languageRankingTop5Raw.length) return [];
    const sorted = [...languageRankingTop5Raw].sort(
      (a, b) => Number(b.usageCount ?? 0) - Number(a.usageCount ?? 0)
    );
    return sorted.slice(0, 5);
  }, [languageRankingTop5Raw]);
  const topLanguage = languageRankingTop5[0] ?? null;
  const topLanguageMonthLabel =
    topLanguage && topLanguage.statYear
      ? formatMonthlyLabel(topLanguage.statYear, topLanguage.statMonth)
      : null;
  const donutChartData = languageRankingTop5.map((item, index) => ({
    label: item.languageName,
    value: Number(item.usageCount ?? 0),
    color: donutColors[index % donutColors.length],
  }));
  const totalLanguageUsage = donutChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const languageColorMap = donutChartData.reduce((acc, item) => {
    acc[item.label] = item.color;
    return acc;
  }, {});

  const algoSolveRankingTop5 = Array.isArray(
    dashboardData?.algoSolveRankingTop5
  )
    ? dashboardData.algoSolveRankingTop5
    : [];
  const codeAnalysisRankingTop5 = Array.isArray(
    dashboardData?.codeAnalysisRankingTop5
  )
    ? dashboardData.codeAnalysisRankingTop5
    : [];
  const sortedRangeStats = useMemo(() => {
    if (!rangeStats.length) return [];
    return [...rangeStats].sort(
      (a, b) => new Date(a.statDate).getTime() - new Date(b.statDate).getTime()
    );
  }, [rangeStats]);
  const rangeMetricOptions = [
    {
      id: "totalUsers",
      label: "총 유저 수",
      color: "#4F46E5",
      suffix: "명",
      isCurrency: false,
    },
    {
      id: "newUsers",
      label: "신규 유저 수",
      color: "#10B981",
      suffix: "명",
      isCurrency: false,
    },
    {
      id: "paymentCount",
      label: "결제 수",
      color: "#F59E0B",
      suffix: "건",
      isCurrency: false,
    },
    {
      id: "revenue",
      label: "매출",
      color: "#0EA5E9",
      suffix: "",
      isCurrency: true,
    },
  ];
  const rangeMetricMap = rangeMetricOptions.reduce((acc, option) => {
    acc[option.id] = option;
    return acc;
  }, {});
  const currentRangeMetric =
    rangeMetricMap[rangeMetric] ?? rangeMetricOptions[0];
  const rangeChartData = sortedRangeStats.map((item) => ({
    label: formatRangeLabel(item.statDate),
    value: Number(item[rangeMetric] ?? 0),
  }));
  const rangeDiffInfo = calculateDiffInfo(rangeChartData);
  const isInvalidRange =
    rangeStartDate && rangeEndDate && rangeStartDate > rangeEndDate;

  if (loading || !dashboardData) {
    return <div className="p-6">로딩중...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">배치 테스트 대시보드</h1>
        {summary.statDate && (
          <p className="text-sm text-gray-500">
            {formatDate(summary.statDate)} 기준 집계
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          icon={UserGroupIcon}
          iconClass="text-indigo-600"
          bgClass="bg-indigo-100 dark:bg-indigo-600/20"
          label="총 유저 수"
          value={`${Number(summary.totalUsers ?? 0).toLocaleString()}명`}
        />
        <SummaryCard
          icon={ArrowTrendingUpIcon}
          iconClass="text-emerald-600"
          bgClass="bg-emerald-100 dark:bg-emerald-600/20"
          label="신규 유저"
          value={`${Number(summary.newUsers ?? 0).toLocaleString()}명`}
        />
        <SummaryCard
          icon={ShoppingCartIcon}
          iconClass="text-amber-600"
          bgClass="bg-amber-100 dark:bg-amber-600/20"
          label="결제 수"
          value={`${Number(summary.paymentCount ?? 0).toLocaleString()}건`}
        />
        <SummaryCard
          icon={ChartBarIcon}
          iconClass="text-blue-600"
          bgClass="bg-blue-100 dark:bg-blue-600/20"
          label="매출"
          value={formatCurrency(summary.revenue ?? 0)}
        />
      </div>

      <div className="rounded-xl shadow-md border dark:bg-gray-800">
        <div className="p-5 border-b dark:border-gray-700 space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">일별 범위 통계</h2>
            <p className="text-sm text-gray-500">
              원하는 기간을 선택해 일별 누적/신규/결제/매출 변화를 비교해보세요.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="text-sm flex flex-col gap-1">
                <span className="text-gray-500">시작일</span>
                <input
                  type="date"
                  value={rangeStartDate}
                  onChange={(event) => setRangeStartDate(event.target.value)}
                  className="border rounded-md px-3 py-2 bg-transparent text-sm dark:border-gray-700"
                />
              </label>
              <label className="text-sm flex flex-col gap-1">
                <span className="text-gray-500">종료일</span>
                <input
                  type="date"
                  value={rangeEndDate}
                  onChange={(event) => setRangeEndDate(event.target.value)}
                  className="border rounded-md px-3 py-2 bg-transparent text-sm dark:border-gray-700"
                />
              </label>
              <button
                type="button"
                onClick={() => fetchRangeStats(rangeStartDate, rangeEndDate)}
                disabled={
                  !rangeStartDate || !rangeEndDate || Boolean(isInvalidRange)
                }
                className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
                  isInvalidRange
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                조회
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              {[
                { label: "최근 7일", days: 6 },
                { label: "최근 30일", days: 29 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const end = new Date();
                    const start = addDays(end, -preset.days);
                    const nextStart = getISODate(start);
                    const nextEnd = getISODate(end);
                    setRangeEndDate(nextEnd);
                    setRangeStartDate(nextStart);
                    fetchRangeStats(nextStart, nextEnd);
                  }}
                  className="px-3 py-1 rounded-md border text-gray-600 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          {isInvalidRange && (
            <p className="text-sm text-rose-500">
              시작일이 종료일보다 클 수 없습니다.
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            {rangeMetricOptions.map((option) => {
              const isActive = option.id === rangeMetric;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRangeMetric(option.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-5 space-y-6">
          {rangeError && <p className="text-rose-500 text-sm">{rangeError}</p>}
          {rangeLoading ? (
            <p className="text-center text-gray-500">데이터를 불러오는 중...</p>
          ) : rangeChartData.length === 0 ? (
            <p className="text-center text-gray-500">
              선택한 기간에 대한 데이터가 없습니다.
            </p>
          ) : (
            <>
              <TrendAreaChart
                data={rangeChartData}
                color={currentRangeMetric.color}
                ariaLabel="일별 범위 통계"
                valueSuffix={
                  currentRangeMetric.isCurrency ? "" : currentRangeMetric.suffix
                }
                valueFormatter={
                  currentRangeMetric.isCurrency
                    ? (value) => formatCurrency(value)
                    : undefined
                }
                tickFormatter={
                  currentRangeMetric.isCurrency
                    ? (value) => formatCurrency(Math.round(value))
                    : undefined
                }
              />
              <DiffCards
                latestLabel={`${currentRangeMetric.label} (최근 일자)`}
                diffLabel="직전 일 대비 변화"
                rateLabel="직전 일 대비 증감률"
                diffInfo={rangeDiffInfo}
                unit={currentRangeMetric.suffix}
                isCurrency={currentRangeMetric.isCurrency}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 uppercase text-xs">
                      <th className="pb-2">날짜</th>
                      <th className="pb-2 text-right">총 유저 수</th>
                      <th className="pb-2 text-right">신규 유저 수</th>
                      <th className="pb-2 text-right">결제 수</th>
                      <th className="pb-2 text-right">매출</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sortedRangeStats.map((item) => (
                      <tr key={item.statDate}>
                        <td className="py-2">{formatDate(item.statDate)}</td>
                        <td className="py-2 text-right font-semibold">
                          {Number(item.totalUsers ?? 0).toLocaleString()}명
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {Number(item.newUsers ?? 0).toLocaleString()}명
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {Number(item.paymentCount ?? 0).toLocaleString()}건
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {formatCurrency(item.revenue ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl shadow-md border dark:bg-gray-800">
        <div className="p-5 border-b dark:border-gray-700 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">유저 증감 추이</h2>
            <p className="text-sm text-gray-500 mt-1">
              배치 테스트 결과로 수집된 유저 누적 수 변화를 시각화했습니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {[
              { id: "monthly", label: "월별" },
              { id: "yearly", label: "연도별" },
            ].map((option) => {
              const isActive = userStatsView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setUserStatsView(option.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        {userStatsView === "monthly" && (
          <div className="px-5 py-4 border-b dark:border-gray-700 space-y-3">
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              {recentMonthlyRangeOptions.map((option) => {
                const isActive = activeMonthlyRange === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      fetchUserMonthlyStats(option.value);
                      setActiveMonthlyRange(option.value);
                    }}
                    className={`px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
              {activeMonthlyRange && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveMonthlyRange(null);
                    if (availableUserYears.length) {
                      const latestYear =
                        availableUserYears[availableUserYears.length - 1];
                      setSelectedUserYear(latestYear);
                    }
                  }}
                  className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  연도별 보기
                </button>
              )}
            </div>
            {activeMonthlyRange && (
              <p className="text-xs text-gray-500">
                최근 {activeMonthlyRange}개월 데이터를 표시 중입니다.
              </p>
            )}
            {availableUserYears.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                {availableUserYears.map((year) => {
                  const isActive = !activeMonthlyRange && year === selectedUserYear;
                  return (
                    <button
                      key={`user-year-${year}`}
                      type="button"
                      onClick={() => {
                        setActiveMonthlyRange(null);
                        setSelectedUserYear(year);
                      }}
                      className={`px-2.5 py-1 rounded-md border transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-500"
                          : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {year}년
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="p-5">
          {userGrowthChartData.length === 0 ? (
            <p className="text-center text-gray-500">
              아직 수집된 데이터가 없습니다.
            </p>
          ) : (
            <>
              <TrendAreaChart
                data={userGrowthChartData}
                ariaLabel="유저 증감 추이"
                valueSuffix="명"
              />
              <DiffCards
                latestLabel={
                  userStatsView === "monthly"
                    ? "최근 월 유저 수"
                    : "최근 연도 유저 수"
                }
                diffLabel={
                  userStatsView === "monthly"
                    ? "전월 대비 변화"
                    : "전년 대비 변화"
                }
                rateLabel={
                  userStatsView === "monthly"
                    ? "전월 대비 증감률"
                    : "전년 대비 증감률"
                }
                diffInfo={userChartDiffInfo}
                unit="명"
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl shadow-md border dark:bg-gray-800">
        <div className="p-5 border-b dark:border-gray-700 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">매출 추이</h2>
            <p className="text-sm text-gray-500 mt-1">
              배치 테스트에서 계산된 결제 정보를 시각화했습니다.
            </p>
            {salesStatsLoading && (
              <p className="text-xs text-gray-500 mt-1">
                월별 매출 통계를 불러오는 중입니다...
              </p>
            )}
            {salesStatsError && (
              <p className="text-xs text-rose-500 mt-1">{salesStatsError}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {[
              { id: "monthly", label: "월별" },
              { id: "yearly", label: "연도별" },
            ].map((option) => {
              const isActive = paymentStatsView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentStatsView(option.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-sky-600 text-white border-sky-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        {paymentStatsView === "monthly" && (
          <div className="px-5 py-4 border-b dark:border-gray-700 space-y-3">
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              {recentMonthlyRangeOptions.map((option) => {
                const isActive = activeSalesRange === option.value;
                return (
                  <button
                    key={`sales-recent-${option.value}`}
                    type="button"
                    onClick={() => {
                      fetchSalesMonthlyStats(option.value);
                      setActiveSalesRange(option.value);
                    }}
                    className={`px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? "bg-sky-600 text-white border-sky-600"
                        : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
              {activeSalesRange && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSalesRange(null);
                    if (availablePaymentYears.length) {
                      const latestYear =
                        availablePaymentYears[availablePaymentYears.length - 1];
                      setSelectedPaymentYear(latestYear);
                    }
                  }}
                  className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  연도별 보기
                </button>
              )}
            </div>
            {activeSalesRange && (
              <p className="text-xs text-gray-500">
                최근 {activeSalesRange}개월 매출 데이터를 표시 중입니다.
              </p>
            )}
            {availablePaymentYears.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                {availablePaymentYears.map((year) => {
                  const isActive = !activeSalesRange && year === selectedPaymentYear;
                  return (
                    <button
                      key={`payment-year-${year}`}
                      type="button"
                      onClick={() => {
                        setActiveSalesRange(null);
                        setSelectedPaymentYear(year);
                      }}
                      className={`px-2.5 py-1 rounded-md border transition-colors ${
                        isActive
                          ? "bg-sky-50 text-sky-600 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-500"
                          : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {year}년
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="p-5">
          {paymentChartData.length === 0 ? (
            <p className="text-center text-gray-500">
              아직 수집된 데이터가 없습니다.
            </p>
          ) : (
            <>
              <TrendAreaChart
                data={paymentChartData}
                color="#0EA5E9"
                ariaLabel="매출 추이"
                valueFormatter={(value) => formatCurrency(value)}
                tickFormatter={(value) => formatCurrency(Math.round(value))}
              />
              <DiffCards
                latestLabel={
                  paymentStatsView === "monthly"
                    ? "최근 월 매출"
                    : "최근 연도 매출"
                }
                diffLabel={
                  paymentStatsView === "monthly"
                    ? "전월 대비 매출 변화"
                    : "전년 대비 매출 변화"
                }
                rateLabel={
                  paymentStatsView === "monthly"
                    ? "전월 대비 증감률"
                    : "전년 대비 증감률"
                }
                diffInfo={paymentChartDiffInfo}
                unit="₩"
                isCurrency
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl shadow-md border dark:bg-gray-800">
        <div className="p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">MAU 추이</h2>
          <p className="text-sm text-gray-500 mt-1">
            배치 테스트에서 계산된 월간 활성 사용자(MAU)를 확인하세요.
          </p>
        </div>
        <div className="p-5">
          {mauChartData.length === 0 ? (
            <p className="text-center text-gray-500">
              아직 수집된 데이터가 없습니다.
            </p>
          ) : (
            <>
              <TrendAreaChart
                data={mauChartData}
                color="#059669"
                ariaLabel="MAU 추이"
                valueSuffix="명"
              />
              <DiffCards
                latestLabel="최근 월 MAU"
                diffLabel="전월 대비 변화"
                rateLabel="전월 대비 증감률"
                diffInfo={mauDiffInfo}
                unit="명"
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl shadow-md p-5 border dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">언어 랭킹 Top 5</h2>
          <p className="text-xs text-gray-500 mb-2">
            최근 집계된 상위 5개 언어 제출 횟수
          </p>
          {topLanguage && (
            <div className="mb-4 flex items-center justify-between rounded-lg border px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="font-semibold text-indigo-700 dark:text-indigo-200">
                  {topLanguage.languageName}
                </span>
                <span className="text-gray-500 dark:text-gray-300">
                  {topLanguageMonthLabel ?? "최근 집계"}
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-200">
                {Number(topLanguage.usageCount ?? 0).toLocaleString()}회
              </span>
            </div>
          )}
          {languageRankingTop5.length === 0 ? (
            <p className="text-center text-gray-500">데이터가 없습니다.</p>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <DonutChart data={donutChartData} total={totalLanguageUsage} />
              <ul className="space-y-2 text-sm flex-1">
                {languageRankingTop5.map((item) => (
                  <li
                    key={`${item.languageName}-${item.ranking}`}
                    className="flex justify-between border-b pb-2"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            languageColorMap[item.languageName] ?? "#CBD5F5",
                        }}
                      />
                      <span>{item.languageName}</span>
                    </span>
                    <span className="font-bold">
                      {Number(item.usageCount ?? 0).toLocaleString()}회
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <RankingCard
            title="알고리즘 풀이 랭킹"
            emptyMessage="데이터가 없습니다."
            headers={["순위", "닉네임", "이메일", "풀이 수"]}
            rows={algoSolveRankingTop5.map((item) => {
              const nickname =
                item.userNickname ||
                item.userNickName ||
                item.user_nickname ||
                "-";
              const email =
                item.userEmail || item.user_email || item.email || "-";
              return {
                id: `${email}-${item.ranking}`,
                rank: item.ranking,
                label: nickname,
                extra: email,
                value: `${Number(item.solveCount ?? 0).toLocaleString()}문제`,
              };
            })}
          />
          <RankingCard
            title="코드 분석 랭킹"
            emptyMessage="데이터가 없습니다."
            headers={["순위", "닉네임", "이메일", "분석 수"]}
            rows={codeAnalysisRankingTop5.map((item) => {
              const nickname =
                item.userNickname ||
                item.userNickName ||
                item.user_nickname ||
                "-";
              const email =
                item.userEmail || item.user_email || item.email || "-";
              return {
                id: `${email}-${item.ranking}`,
                rank: item.ranking,
                label: nickname,
                extra: email,
                value: `${Number(item.analysisCount ?? 0).toLocaleString()}회`,
              };
            })}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, iconClass, bgClass, label, value }) {
  return (
    <div className="p-5 rounded-xl shadow-md flex items-center gap-4 border dark:bg-gray-800">
      <div className={`p-3 rounded-xl ${bgClass}`}>
        <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h2 className="text-xl font-bold">{value}</h2>
      </div>
    </div>
  );
}

function DiffCards({
  latestLabel,
  diffLabel,
  rateLabel,
  diffInfo,
  unit = "",
  isCurrency = false,
}) {
  const { latestValue, diffValue, diffPercent } = diffInfo;
  const formattedLatest = isCurrency
    ? formatCurrency(latestValue)
    : `${latestValue.toLocaleString()}${unit}`;
  const absoluteDiffValue = Math.abs(diffValue);
  const formattedDiffValue = isCurrency
    ? formatCurrency(absoluteDiffValue)
    : `${absoluteDiffValue.toLocaleString()}${unit}`;
  const diffSign = diffValue >= 0 ? "+" : "-";
  const percentSign = diffPercent >= 0 ? "+" : "-";

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
        <p className="text-gray-500">{latestLabel}</p>
        <p className="text-2xl font-semibold">{formattedLatest}</p>
      </div>
      <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
        <p className="text-gray-500">{diffLabel}</p>
        <p
          className={`text-2xl font-semibold ${
            diffValue >= 0 ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {diffSign}
          {formattedDiffValue}
        </p>
      </div>
      <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
        <p className="text-gray-500">{rateLabel}</p>
        <p
          className={`text-2xl font-semibold ${
            diffPercent >= 0 ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {percentSign}
          {Math.abs(diffPercent).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

function RankingCard({ title, emptyMessage, headers, rows }) {
  return (
    <div className="rounded-xl shadow-md p-5 border dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {!rows.length ? (
        <p className="text-center text-gray-500">{emptyMessage}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 uppercase text-xs">
              {headers.map((header) => (
                <th key={header} className="pb-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-2 font-semibold text-indigo-600 dark:text-indigo-300">
                  #{row.rank}
                </td>
                <td className="py-2">{row.label}</td>
                <td className="py-2 text-gray-500">{row.extra ?? "-"}</td>
                <td className="py-2 text-right font-bold">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TrendAreaChart({
  data,
  color = "#4F46E5",
  valueSuffix = "",
  valueFormatter,
  tickFormatter,
  ariaLabel = "데이터 추이",
}) {
  const gradientId = useMemo(
    () => `batchTestGradient-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        시각화할 데이터가 없습니다.
      </div>
    );
  }

  const width = 640;
  const height = 280;
  const padding = 36;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;
  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? padding + chartWidth / 2
        : padding + (index / (data.length - 1)) * chartWidth;
    const y =
      height - padding - ((item.value - minValue) / valueRange) * chartHeight;
    return { x, y, label: item.label, value: item.value };
  });
  const areaPath = `M ${points[0].x} ${height - padding} L ${points
    .map((p) => `${p.x} ${p.y}`)
    .join(" L ")} L ${points[points.length - 1].x} ${height - padding} Z`;
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const yTicks = 4;
  const tickElements = Array.from({ length: yTicks + 1 }, (_, idx) => {
    const value = minValue + (valueRange * idx) / yTicks;
    const y =
      height - padding - ((value - minValue) / valueRange) * chartHeight;
    return { y, value };
  });
  const resolveTickValue = (value) => {
    if (typeof tickFormatter === "function") {
      return tickFormatter(value);
    }
    return `${Math.round(value).toLocaleString()}${valueSuffix}`;
  };
  const resolvePointValue = (value) => {
    if (typeof valueFormatter === "function") {
      return valueFormatter(value);
    }
    return `${value.toLocaleString()}${valueSuffix}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {tickElements.map((tick, idx) => (
          <g key={`grid-${idx}`}>
            <line
              x1={padding}
              y1={tick.y}
              x2={width - padding}
              y2={tick.y}
              strokeDasharray="4 4"
              stroke="currentColor"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <text
              x={padding - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              className="text-gray-400 dark:text-gray-500"
            >
              {resolveTickValue(tick.value)}
            </text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={5}
              fill="#FFF"
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              fontSize="11"
              fill={color}
              className="font-semibold"
            >
              {resolvePointValue(point.value)}
            </text>
            <text
              x={point.x}
              y={height - padding + 16}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ data, total, valueSuffix = "회" }) {
  const [hovered, setHovered] = useState(null);

  if (!data.length || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 text-sm xl:w-1/2">
        시각화할 데이터가 없습니다.
      </div>
    );
  }

  const size = 220;
  const outerRadius = size / 2;
  const innerRadius = outerRadius - 30;
  let currentAngle = -90;

  const polarToCartesian = (radius, angleInDegrees) => {
    const angleInRadians = (Math.PI / 180) * angleInDegrees;
    return {
      x: size / 2 + radius * Math.cos(angleInRadians),
      y: size / 2 + radius * Math.sin(angleInRadians),
    };
  };

  const createSegmentPath = (startAngle, endAngle) => {
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const outerStart = polarToCartesian(outerRadius, endAngle);
    const outerEnd = polarToCartesian(outerRadius, startAngle);
    const innerStart = polarToCartesian(innerRadius, startAngle);
    const innerEnd = polarToCartesian(innerRadius, endAngle);

    return `M ${outerStart.x} ${outerStart.y}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}
            L ${innerStart.x} ${innerStart.y}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}
            Z`;
  };

  const segments = data.map((item, index) => {
    const segmentAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    currentAngle = endAngle;

    if (segmentAngle <= 0) return null;

    return (
      <path
        key={`${item.label}-${index}`}
        d={createSegmentPath(startAngle, endAngle)}
        fill={item.color}
        className="transition-opacity duration-200"
        style={{ opacity: hovered && hovered.label !== item.label ? 0.3 : 1 }}
        onMouseEnter={() => setHovered(item)}
        onMouseLeave={() => setHovered(null)}
      />
    );
  });

  const displayLabel = hovered?.label ?? "총 사용량";
  const displayValue = hovered?.value ?? total;

  return (
    <div className="flex flex-col items-center gap-4 xl:w-1/2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label="언어 사용 비중"
        >
          {segments}
        </svg>
        <div
          className="absolute rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center px-3"
          style={{
            top: size / 2 - innerRadius,
            right: size / 2 - innerRadius,
            bottom: size / 2 - innerRadius,
            left: size / 2 - innerRadius,
          }}
        >
          <span className="text-xs text-gray-500">
            {hovered ? "선택한 언어" : "총 사용량"}
          </span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {displayLabel}
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {displayValue.toLocaleString()}
            {valueSuffix}
          </span>
        </div>
      </div>
    </div>
  );
}

function calculateDiffInfo(data) {
  if (!data.length) {
    return { latestValue: 0, diffValue: 0, diffPercent: 0 };
  }
  const latestValue = data[data.length - 1]?.value ?? 0;
  const prevValue = data.length > 1 ? data[data.length - 2]?.value ?? 0 : 0;
  const diffValue = latestValue - prevValue;
  const diffPercent =
    prevValue === 0
      ? latestValue === 0
        ? 0
        : 100
      : (diffValue / prevValue) * 100;
  return { latestValue, diffValue, diffPercent };
}

function formatCurrency(value) {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return `₩${safeValue.toLocaleString()}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("ko-KR");
}

function formatRangeLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}`;
}

function formatMonthlyLabel(year, month) {
  if (!year) return "-";
  const safeMonth = String(month ?? 0).padStart(2, "0");
  return `${year}.${safeMonth}`;
}

function getISODate(date) {
  return date.toISOString().split("T")[0];
}

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function normalizeSummaryEntry(entry) {
  if (!entry) {
    return {
      statDate: null,
      totalUsers: 0,
      newUsers: 0,
      paymentCount: 0,
      revenue: 0,
    };
  }

  const totalUsers =
    entry.totalUsers ?? entry.totalUserCount ?? entry.total_user_count ?? 0;
  const newUsers =
    entry.newUsers ?? entry.newUserCount ?? entry.new_user_count ?? 0;
  const paymentCount =
    entry.paymentCount ?? entry.payment_count ?? entry.payments ?? 0;
  const revenue = entry.revenue ?? entry.totalSales ?? entry.total_sales ?? 0;

  return {
    statDate: entry.statDate ?? entry.stat_date ?? null,
    totalUsers: Number(totalUsers ?? 0),
    newUsers: Number(newUsers ?? 0),
    paymentCount: Number(paymentCount ?? 0),
    revenue: Number(revenue ?? 0),
  };
}
