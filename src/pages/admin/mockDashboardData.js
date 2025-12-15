// src/data/mockDashboardData.js

export const mockDashboardData = {
  userCountSummary: [
    { year: "2025", month: "10", userCount: 620 },
    { year: "2025", month: "11", userCount: 850 },
    { year: "2025", month: "12", userCount: 310 },
    { year: "TOTAL", month: "-", userCount: 1780 },
  ],

  todaySignUpCount: 37,

  todayPaymentSummary: {
    todayPaymentCount: 156,
    todayPaymentTotal: 1203450, // ₩1,203,450
  },

  paymentSummary: [
    { year: "2025", month: "10", paymentCount: "112", totalSales: 4900000 },
    { year: "2025", month: "11", paymentCount: "98", totalSales: 5732000 },
    { year: "2025", month: "12", paymentCount: "56", totalSales: 3245000 },
    { year: "TOTAL", month: "-", paymentCount: "266", totalSales: 13877000 },
  ],

  languageRanking: [
    { lanuage: "Python", submissionCount: 1123 },
    { lanuage: "Java", submissionCount: 984 },
    { lanuage: "C++", submissionCount: 676 },
    { lanuage: "JavaScript", submissionCount: 544 },
    { lanuage: "C#", submissionCount: 233 },
    { lanuage: "TOTAL", submissionCount: 3560 },
  ],

  algoSolverRanking: [
    { userId: 1, userNickName: "mok119", AlgoSolveCount: 188 },
    { userId: 2, userNickName: "dev_girl", AlgoSolveCount: 175 },
    { userId: 3, userNickName: "ai_master", AlgoSolveCount: 161 },
    { userId: 4, userNickName: "datahunter", AlgoSolveCount: 144 },
    { userId: 5, userNickName: "heejung", AlgoSolveCount: 130 },
  ],

  codeBoardStateTotal: [
    { name: "CleanCodeCheck", totalCount: 124 },
    { name: "ComplexityAnalysis", totalCount: 101 },
    { name: "ErrorHandling", totalCount: 97 },
    { name: "VariableNaming", totalCount: 88 },
    { name: "TOTAL", totalCount: 410 },
  ],
};
