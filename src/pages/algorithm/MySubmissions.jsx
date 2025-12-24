import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMySubmissions } from "../../service/algorithm/AlgorithmApi";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import "../../styles/MySubmissions.css";

const MySubmissions = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchSubmissions();
  }, [page]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await getMySubmissions({ page, size: PAGE_SIZE });

      if (response.error) {
        throw new Error(response.message);
      }

      const newSubmissions = response.data || [];
      if (page === 0) {
        setSubmissions(newSubmissions);
      } else {
        setSubmissions((prev) => [...prev, ...newSubmissions]);
      }

      setHasMore(newSubmissions.length === PAGE_SIZE);
    } catch (err) {
      console.error("제출 이력 로딩 실패:", err);
      setError("제출 이력을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (result) => {
    switch (result) {
      case "AC":
        return "status-badge-ac";
      case "WA":
        return "status-badge-wa";
      case "TLE":
        return "status-badge-tle";
      case "MLE":
        return "status-badge-mle";
      case "RE":
        return "status-badge-re";
      case "CE":
        return "status-badge-ce";
      default:
        return "status-badge-default";
    }
  };

  const getStatusText = (result) => {
    switch (result) {
      case "AC":
        return "맞았습니다";
      case "WA":
        return "틀렸습니다";
      case "TLE":
        return "시간 초과";
      case "MLE":
        return "메모리 초과";
      case "RE":
        return "런타임 에러";
      case "CE":
        return "컴파일 에러";
      default:
        return result || "채점 중";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-main">내 제출 이력</h1>
        <p className="mt-2 text-sm text-muted">
          지금까지 제출한 알고리즘 문제 풀이 기록입니다.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1f1f1f] shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden sm:rounded-lg submissions-table-container border border-gray-200 dark:border-[#2e2e2e]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2e2e2e]">
              <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    제출 번호
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    문제
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    풀이 모드
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    결과
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    언어
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    메모리 / 시간
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    제출 일시
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                  >
                    공유
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1f1f1f] divide-y divide-gray-200 dark:divide-[#2e2e2e]">
                {submissions.map((submission) => (
                  <tr
                    key={submission.submissionId}
                    onClick={() =>
                      navigate(
                        `/algorithm/submissions/${submission.submissionId}`
                      )
                    }
                    className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      #{submission.submissionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-main">
                        <span className="text-blue-600 dark:text-blue-400">#{submission.problemId}</span>{" "}
                        {submission.problemTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          submission.solveMode === "FOCUS"
                            ? "solve-mode-badge-focus"
                            : "solve-mode-badge-normal"
                        }
                      >
                        {submission.solveMode === "FOCUS" ? "집중 모드" : "기본 모드"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(submission.judgeResult)}>
                        {getStatusText(submission.judgeResult)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {submission.languageName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {submission.memoryUsage
                        ? `${Math.round(submission.memoryUsage / 1024)}KB`
                        : "-"}{" "}
                      /
                      {submission.executionTime
                        ? ` ${submission.executionTime}ms`
                        : " -"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {format(
                        new Date(submission.submittedAt),
                        "yyyy-MM-dd HH:mm",
                        { locale: ko }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          submission.isShared
                            ? "share-badge-shared"
                            : "share-badge-not-shared"
                        }
                      >
                        {submission.isShared ? "공유됨" : "미공유"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submissions.length === 0 && !loading && (
            <div className="text-center py-12 text-muted">
              제출 이력이 없습니다.
            </div>
          )}

          {hasMore && (
            <div className="bg-gray-50 dark:bg-[#1a1a1a] px-4 py-4 sm:px-6 text-center border-t border-gray-200 dark:border-[#2e2e2e] load-more-section">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "로딩 중..." : "더 보기"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
