import { useEffect, useState } from "react";

import {
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

import { mockDashboardData } from "./mockDashboardData";
import axiosInstance from "../../server/AxiosConfig";

const donutColors = [
  "#6366F1",
  "#34D399",
  "#F59E0B",
  "#EC4899",
  "#0EA5E9",
  "#94A3B8",
];

export default function AdminStatsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatsView, setUserStatsView] = useState("monthly");
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState(null);
  const [paymentStatsView, setPaymentStatsView] = useState("monthly");
  const [selectedPaymentYear, setSelectedPaymentYear] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/admin/dashboard");

        if (res.data?.data) {
          setData(res.data.data); // 성공 시 API 데이터로 교체
        } else {
          setData(mockDashboardData);
        }
      } catch (err) {
        console.warn("⚠️ 대시보드 데이터를 mock으로 대체합니다:", err);
        setData(mockDashboardData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const userCountSummary = Array.isArray(data?.userCountSummary)
    ? data.userCountSummary
    : [];
  const totalUserEntry = userCountSummary.find(
    (item) => item.year === "TOTAL" && item.month === "-"
  );
  const latestUserCount =
    totalUserEntry?.userCount ??
    userCountSummary[userCountSummary.length - 1]?.userCount ??
    0;
  const filteredUserSummary = userCountSummary.filter(
    (item) => item.year !== "TOTAL"
  );
  const userSummaryByYear = filteredUserSummary.reduce((acc, item) => {
    const yearKey = item.year ?? "기타";
    if (!acc[yearKey]) acc[yearKey] = [];
    acc[yearKey].push(item);
    return acc;
  }, {});
  const userSummaryYearEntries = Object.entries(userSummaryByYear).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );
  const availableMonthlyYears = userSummaryYearEntries.map(([year]) => year);
  const currentMonthlyYear =
    selectedMonthlyYear && availableMonthlyYears.includes(selectedMonthlyYear)
      ? selectedMonthlyYear
      : availableMonthlyYears[availableMonthlyYears.length - 1] || null;
  const rawMonthlyItemsForYear = currentMonthlyYear
    ? [...(userSummaryByYear[currentMonthlyYear] ?? [])]
    : [];
  const monthlyDataForYear = rawMonthlyItemsForYear
    .filter((item) => item.month !== "-")
    .sort((a, b) => Number(a.month) - Number(b.month));
  const monthlyChartData = monthlyDataForYear.map((item) => ({
    label: `${currentMonthlyYear}.${item.month}`,
    value: item.userCount ?? 0,
  }));
  const yearlyChartData = userSummaryYearEntries.map(([year, months]) => {
    const totalEntry = months.find((item) => item.month === "-");
    const total =
      totalEntry?.userCount ??
      months.reduce((sum, item) => sum + (item.userCount ?? 0), 0);
    return { label: `${year}`, value: total };
  });
  const userGrowthChartData =
    userStatsView === "monthly" ? monthlyChartData : yearlyChartData;
  const latestChartValue =
    userGrowthChartData[userGrowthChartData.length - 1]?.value ?? 0;
  const previousChartValue =
    userGrowthChartData.length > 1
      ? userGrowthChartData[userGrowthChartData.length - 2]?.value ?? 0
      : null;
  const userGrowthDiff = previousChartValue
    ? latestChartValue - previousChartValue
    : 0;
  const userGrowthDiffPercent =
    previousChartValue && previousChartValue !== 0
      ? (userGrowthDiff / previousChartValue) * 100
      : 0;
  const isMonthlyView = userStatsView === "monthly";
  const monthlyYearLabel = currentMonthlyYear ? `${currentMonthlyYear}년 ` : "";
  const chartDescription = isMonthlyView
    ? `${monthlyYearLabel}월별 유저 수 추이를 시각화했습니다.`
    : "최근 집계된 연도별 유저 수 추이를 시각화했습니다.";
  const chartValueLabel = isMonthlyView
    ? `${monthlyYearLabel}최근 월 유저 수`
    : "최근 연도 유저 수";
  const differenceLabelUnit = isMonthlyView ? "전월" : "전년";
  const chartDiffLabel = `${differenceLabelUnit} 대비 변화`;
  const chartRateLabel = `${differenceLabelUnit} 대비 증감률`;

  const paymentSummary = Array.isArray(data?.paymentSummary)
    ? data.paymentSummary
    : [];
  const filteredPaymentSummary = paymentSummary.filter(
    (item) => item.year !== "TOTAL"
  );
  const paymentSummaryByYear = filteredPaymentSummary.reduce((acc, item) => {
    const yearKey = item.year ?? "기타";
    if (!acc[yearKey]) acc[yearKey] = [];
    acc[yearKey].push(item);
    return acc;
  }, {});
  const paymentSummaryYearEntries = Object.entries(paymentSummaryByYear).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );
  const availablePaymentYears = paymentSummaryYearEntries.map(([year]) => year);
  const currentPaymentYear =
    selectedPaymentYear && availablePaymentYears.includes(selectedPaymentYear)
      ? selectedPaymentYear
      : availablePaymentYears[availablePaymentYears.length - 1] || null;
  const paymentMonthlyData = currentPaymentYear
    ? [...(paymentSummaryByYear[currentPaymentYear] ?? [])]
        .filter((item) => item.month !== "-")
        .sort((a, b) => Number(a.month) - Number(b.month))
    : [];
  const paymentMonthlyChartData = paymentMonthlyData.map((item) => ({
    label: `${currentPaymentYear}.${item.month}`,
    value: item.totalSales ?? 0,
  }));
  const paymentYearlyChartData = paymentSummaryYearEntries.map(
    ([year, months]) => {
      const totalEntry = months.find((item) => item.month === "-");
      const totalSales =
        totalEntry?.totalSales ??
        months.reduce((sum, item) => sum + (item.totalSales ?? 0), 0);
      return { label: `${year}`, value: totalSales };
    }
  );
  const paymentChartData =
    paymentStatsView === "monthly"
      ? paymentMonthlyChartData
      : paymentYearlyChartData;
  const latestPaymentValue =
    paymentChartData[paymentChartData.length - 1]?.value ?? 0;
  const previousPaymentValue =
    paymentChartData.length > 1
      ? paymentChartData[paymentChartData.length - 2]?.value ?? 0
      : null;
  const paymentDiff = previousPaymentValue
    ? latestPaymentValue - previousPaymentValue
    : 0;
  const paymentDiffPercent =
    previousPaymentValue && previousPaymentValue !== 0
      ? (paymentDiff / previousPaymentValue) * 100
      : 0;
  const isPaymentMonthlyView = paymentStatsView === "monthly";
  const paymentYearLabel =
    isPaymentMonthlyView && currentPaymentYear
      ? `${currentPaymentYear}년 `
      : "";
  const paymentChartDescription = isPaymentMonthlyView
    ? `${paymentYearLabel}월별 매출 추이를 시각화했습니다.`
    : "최근 집계된 연도별 매출 추이를 시각화했습니다.";
  const paymentValueLabel = isPaymentMonthlyView
    ? `${paymentYearLabel}최근 월 매출`
    : "최근 연도 매출";
  const paymentDifferenceUnit = isPaymentMonthlyView ? "전월" : "전년";
  const paymentDiffLabel = `${paymentDifferenceUnit} 대비 매출 변화`;
  const paymentRateLabel = `${paymentDifferenceUnit} 대비 매출 증감률`;

  useEffect(() => {
    if (!availableMonthlyYears.length) {
      if (selectedMonthlyYear !== null) {
        setSelectedMonthlyYear(null);
      }
      return;
    }
    const latestYear = availableMonthlyYears[availableMonthlyYears.length - 1];
    if (
      !selectedMonthlyYear ||
      !availableMonthlyYears.includes(selectedMonthlyYear)
    ) {
      setSelectedMonthlyYear(latestYear);
    }
  }, [availableMonthlyYears, selectedMonthlyYear]);
  useEffect(() => {
    if (!availablePaymentYears.length) {
      if (selectedPaymentYear !== null) {
        setSelectedPaymentYear(null);
      }
      return;
    }
    const latestPaymentYear =
      availablePaymentYears[availablePaymentYears.length - 1];
    if (
      !selectedPaymentYear ||
      !availablePaymentYears.includes(selectedPaymentYear)
    ) {
      setSelectedPaymentYear(latestPaymentYear);
    }
  }, [availablePaymentYears, selectedPaymentYear]);
  const todaySignUpCount = data?.todaySignUpCount ?? 0;
  const todayPaymentSummary = data?.todayPaymentSummary ?? {
    todayPaymentCount: 0,
    todayPaymentTotal: 0,
  };
  const languageRanking = Array.isArray(data?.languageRanking)
    ? data.languageRanking
    : [];
  const codeBoardStateTotal = Array.isArray(data?.codeBoardStateTotal)
    ? data.codeBoardStateTotal
    : [];
  const algoSolverRanking = Array.isArray(data?.algoSolverRanking)
    ? data.algoSolverRanking
    : [];
  const codeAnalysisRanking = Array.isArray(data?.codeAnalysisRanking)
    ? data.codeAnalysisRanking
    : [];
  const codeBoardTotalEntry = codeBoardStateTotal.find(
    (item) => item.name === "TOTAL"
  );
  const codeBoardOverallCount = codeBoardTotalEntry?.totalCount ?? 0;
  const codeBoardCategoryStats = codeBoardStateTotal.filter(
    (item) => item.name !== "TOTAL"
  );
  const languageChartData = languageRanking
    .filter((lang) => lang.lanuage !== "TOTAL")
    .map((lang, index) => ({
      label: lang.lanuage,
      value: lang.submissionCount ?? 0,
      color: donutColors[index % donutColors.length],
    }));
  const totalLanguageSubmission = languageChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const languageColorMap = languageChartData.reduce((acc, item) => {
    acc[item.label] = item.color;
    return acc;
  }, {});

  if (loading || !data) {
    return <div className="p-6">로딩중...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* 페이지 타이틀 */}
      <h1 className="text-2xl font-bold">통계 대시보드</h1>

      {/* 4개 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 유저 수 */}
        <div className="p-5 rounded-xl shadow-md flex items-center gap-4 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-600/20 rounded-xl">
            <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">총 유저 수</p>
            <h2 className="text-xl font-bold">
              {latestUserCount.toLocaleString()}명
            </h2>
          </div>
        </div>

        {/* 오늘 가입자 수 */}
        <div className="p-5 rounded-xl shadow-md flex items-center gap-4 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <div className="p-3 bg-green-100 dark:bg-green-600/20 rounded-xl">
            <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">오늘 가입한 수</p>
            <h2 className="text-xl font-bold">
              {todaySignUpCount.toLocaleString()}명
            </h2>
          </div>
        </div>

        {/* 오늘 결제 수 */}
        <div className="p-5 rounded-xl shadow-md flex items-center gap-4 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-600/20 rounded-xl">
            <ShoppingCartIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">오늘 결제 수</p>
            <h2 className="text-xl font-bold">
              {todayPaymentSummary.todayPaymentCount.toLocaleString()}건
            </h2>
          </div>
        </div>

        {/* 오늘 매출 */}
        <div className="p-5 rounded-xl shadow-md flex items-center gap-4 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-xl">
            <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">오늘 매출</p>
            <h2 className="text-xl font-bold">
              ₩{todayPaymentSummary.todayPaymentTotal.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      {/* 유저 증감 그래프 */}
      <div className="rounded-xl shadow-md border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
        <div className="p-5 border-b border-[#e2e8f0] dark:border-[#3f3f46]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">유저 증감 그래프</h2>
              <p className="text-sm text-gray-500 mt-1">{chartDescription}</p>
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
          {isMonthlyView && availableMonthlyYears.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
              {availableMonthlyYears.map((year) => {
                const isActive = currentMonthlyYear === year;
                return (
                  <button
                    key={`monthly-${year}`}
                    type="button"
                    onClick={() => setSelectedMonthlyYear(year)}
                    className={`px-2.5 py-1 rounded-md border transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-500"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {year}년 월별
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{chartValueLabel}</p>
                  <p className="text-2xl font-semibold">
                    {latestChartValue.toLocaleString()}명
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{chartDiffLabel}</p>
                  <p
                    className={`text-2xl font-semibold ${
                      userGrowthDiff >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {userGrowthDiff >= 0 ? "+" : "-"}
                    {Math.abs(userGrowthDiff).toLocaleString()}명
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{chartRateLabel}</p>
                  <p
                    className={`text-2xl font-semibold ${
                      userGrowthDiffPercent >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {userGrowthDiffPercent >= 0 ? "+" : "-"}
                    {Math.abs(userGrowthDiffPercent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 매출 추이 그래프 */}
      <div className="rounded-xl shadow-md border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
        <div className="p-5 border-b border-[#e2e8f0] dark:border-[#3f3f46]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">매출 추이</h2>
              <p className="text-sm text-gray-500 mt-1">
                {paymentChartDescription}
              </p>
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
          {isPaymentMonthlyView && availablePaymentYears.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
              {availablePaymentYears.map((year) => {
                const isActive = currentPaymentYear === year;
                return (
                  <button
                    key={`payment-${year}`}
                    type="button"
                    onClick={() => setSelectedPaymentYear(year)}
                    className={`px-2.5 py-1 rounded-md border transition-colors ${
                      isActive
                        ? "bg-sky-50 text-sky-600 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-500"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {year}년 월별
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
                valueFormatter={(value) => `₩${value.toLocaleString()}`}
                ariaLabel="매출 추이"
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{paymentValueLabel}</p>
                  <p className="text-2xl font-semibold">
                    ₩{latestPaymentValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{paymentDiffLabel}</p>
                  <p
                    className={`text-2xl font-semibold ${
                      paymentDiff >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {paymentDiff >= 0 ? "+" : "-"}₩
                    {Math.abs(paymentDiff).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/40 dark:border-gray-800">
                  <p className="text-gray-500">{paymentRateLabel}</p>
                  <p
                    className={`text-2xl font-semibold ${
                      paymentDiffPercent >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {paymentDiffPercent >= 0 ? "+" : "-"}
                    {Math.abs(paymentDiffPercent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 언어 랭킹 / 코드보드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl shadow-md p-5 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4">언어 랭킹</h2>
          {languageRanking.length === 0 ? (
            <p className="text-center text-gray-500">데이터가 없습니다.</p>
          ) : (
            <div className="flex flex-col xl:flex-row gap-6">
              <DonutChart
                data={languageChartData}
                total={totalLanguageSubmission}
              />
              <ul className="space-y-2 text-sm flex-1">
                {languageRanking.map((lang) => (
                  <li
                    key={lang.lanuage}
                    className="flex justify-between border-b pb-2"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            languageColorMap[lang.lanuage] ?? "#CBD5F5",
                        }}
                      />
                      {lang.lanuage}
                    </span>
                    <span className="font-bold">
                      {lang.submissionCount.toLocaleString()}회
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl shadow-md p-5 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4">코드보드 분석 통계</h2>
          {codeBoardStateTotal.length === 0 ? (
            <p className="text-center text-gray-500">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {codeBoardTotalEntry && (
                <div className="border rounded-lg p-4 flex items-center justify-between bg-sky-50 dark:bg-sky-900/30 dark:border-sky-700">
                  <div>
                    <p className="text-sm text-sky-800 dark:text-sky-200">
                      전체 코드보드 검토량
                    </p>
                    <p className="text-2xl font-bold text-sky-700 dark:text-sky-100">
                      {codeBoardOverallCount.toLocaleString()}건
                    </p>
                  </div>
                  <span className="text-xs text-sky-600 dark:text-sky-200">
                    TOTAL 포함 데이터
                  </span>
                </div>
              )}
              {codeBoardCategoryStats.length === 0 ? (
                <p className="text-center text-gray-500">
                  카테고리별 데이터가 없습니다.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {codeBoardCategoryStats.map((item) => (
                    <div
                      key={item.name}
                      className="border rounded-lg p-3 bg-white dark:bg-gray-900/40 dark:border-gray-800"
                    >
                      <p className="text-sm text-gray-500">{item.name}</p>
                      <p className="text-xl font-bold">
                        {item.totalCount.toLocaleString()}건
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 알고리즘 / 코드 분석 랭킹 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl shadow-md p-5 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4">알고리즘 풀이 랭킹</h2>
          {algoSolverRanking.length === 0 ? (
            <p className="text-center text-gray-500">데이터가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 uppercase text-xs">
                  <th className="pb-2">순위</th>
                  <th className="pb-2">닉네임</th>
                  <th className="pb-2 text-right">풀이 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {algoSolverRanking.map((user, index) => (
                  <tr key={user.userId}>
                    <td className="py-2 font-semibold text-indigo-600 dark:text-indigo-300">
                      #{index + 1}
                    </td>
                    <td className="py-2">{user.userNickName}</td>
                    <td className="py-2 text-right font-bold">
                      {user.AlgoSolveCount.toLocaleString()}문제
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl shadow-md p-5 border border-[#e2e8f0] dark:border-[#3f3f46] dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4">코드 분석 랭킹</h2>
          {codeAnalysisRanking.length === 0 ? (
            <p className="text-center text-gray-500">데이터가 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 uppercase text-xs">
                  <th className="pb-2">순위</th>
                  <th className="pb-2">닉네임</th>
                  <th className="pb-2 text-right">분석 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {codeAnalysisRanking.map((user, index) => {
                  const analysisCount = Number(user.codeAnalysisCount ?? 0);
                  return (
                    <tr key={user.userId}>
                      <td className="py-2 font-semibold text-emerald-600 dark:text-emerald-300">
                        #{index + 1}
                      </td>
                      <td className="py-2">{user.userNickName}</td>
                      <td className="py-2 text-right font-bold">
                        {analysisCount.toLocaleString()}회
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendAreaChart({
  data,
  color = "#4F46E5",
  valueFormatter,
  ariaLabel = "데이터 추이",
}) {
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

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-64"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="userGrowthGradient" x1="0" x2="0" y1="0" y2="1">
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
              {Math.round(tick.value).toLocaleString()}명
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#userGrowthGradient)" />
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
              {valueFormatter
                ? valueFormatter(point.value)
                : point.value.toLocaleString()}
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

function DonutChart({ data, total }) {
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
  let currentAngle = -90; // start at top

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

  const displayLabel = hovered?.label ?? "총 제출";
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
            {hovered ? "선택한 언어" : "총 제출"}
          </span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {displayLabel}
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {displayValue.toLocaleString()}회
          </span>
        </div>
      </div>
    </div>
  );
}
