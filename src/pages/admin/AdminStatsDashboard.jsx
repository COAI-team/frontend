import {
    ChartBarIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    ShoppingCartIcon,
} from "@heroicons/react/24/outline";

export default function AdminStatsDashboard() {
    return (
        <div className="p-6 space-y-8">

            {/* 페이지 타이틀 */}
            <h1 className="text-2xl font-bold">통계 대시보드</h1>

            {/* 4개 통계 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 총 유저 */}
                <div className="p-5 rounded-xl shadow-md flex items-center gap-4
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-600/20 rounded-xl">
                        <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">총 유저 수</p>
                        <h2 className="text-xl font-bold">12,482명</h2>
                    </div>
                </div>

                {/* 총 방문자 */}
                <div className="p-5 rounded-xl shadow-md flex items-center gap-4
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="p-3 bg-green-100 dark:bg-green-600/20 rounded-xl">
                        <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">일일 방문자</p>
                        <h2 className="text-xl font-bold">3,901명</h2>
                    </div>
                </div>

                {/* 결제 수 */}
                <div className="p-5 rounded-xl shadow-md flex items-center gap-4
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-600/20 rounded-xl">
                        <ShoppingCartIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">오늘 결제 수</p>
                        <h2 className="text-xl font-bold">156건</h2>
                    </div>
                </div>

                {/* 매출 */}
                <div className="p-5 rounded-xl shadow-md flex items-center gap-4
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-xl">
                        <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">오늘 매출</p>
                        <h2 className="text-xl font-bold">₩1,203,450</h2>
                    </div>
                </div>

            </div>

            {/* 그래프 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 트래픽 그래프 */}
                <div className="rounded-xl shadow-md p-5
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="text-lg font-semibold mb-4">방문자 추이</h2>
                    <div className="w-full h-52 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        📊 Chart.js / Recharts 그래프 영역
                    </div>
                </div>

                {/* 매출 그래프 */}
                <div className="rounded-xl shadow-md p-5
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="text-lg font-semibold mb-4">매출 추이</h2>
                    <div className="w-full h-52 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        📈 매출 그래프 영역
                    </div>
                </div>

            </div>

            {/* 최근 활동 + Top Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 최근 활동 */}
                <div className="rounded-xl shadow-md p-5
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
                    <ul className="space-y-3 text-sm">
                        <li className="border-b pb-2 dark:border-gray-700">• 신규 회원 가입: user123</li>
                        <li className="border-b pb-2 dark:border-gray-700">• 결제 완료: order #5544</li>
                        <li className="border-b pb-2 dark:border-gray-700">• 관리자 로그인: admin01</li>
                        <li>• 로그아웃: user77</li>
                    </ul>
                </div>

                {/* Top Users */}
                <div className="rounded-xl shadow-md p-5
                    border dark:border-black dark:border-gray-700 dark:bg-gray-800"
                >
                    <h2 className="text-lg font-semibold mb-4">Top Users</h2>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                            <span>user123</span>
                            <span className="font-bold">₩120,000</span>
                        </li>
                        <li className="flex justify-between">
                            <span>pro_gamer</span>
                            <span className="font-bold">₩95,000</span>
                        </li>
                        <li className="flex justify-between">
                            <span>mike88</span>
                            <span className="font-bold">₩72,300</span>
                        </li>
                    </ul>
                </div>

            </div>

        </div>
    );
}
