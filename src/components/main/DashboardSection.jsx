import {Link} from "react-router-dom";
import PopularPostsList from './PopularPostsList';
import {DashboardSectionPropTypes} from "../../utils/propTypes";

export default function DashboardSection({
                                           user = {},
                                           popularPosts = [],
                                           loading = false,
                                           onPostClick = () => {
                                           }
                                         }) {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-10 space-y-12">
      <div
        className="flex flex-col md:flex-row items-center justify-between bg-linear-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* bg-linear-to-r → bg-gradient-to-r 수정 */}
        <div className="flex items-center space-x-6">
          <div className="text-6xl filter drop-shadow-md">🗿</div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              환영합니다, <span className="text-blue-600 dark:text-blue-400">{user.nickname || "개발자"}님.</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              오늘도 <span className="line-through opacity-50">스파게티</span> 코드를 요리하고 계신가요?
            </p>
          </div>
        </div>
        <div className="flex space-x-4 mt-6 md:mt-0">
          <Link to="/codeAnalysis/new"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30">
            분석 요청
          </Link>
          <Link to="/freeboard/write"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors">
            글쓰기
          </Link>
        </div>
      </div>
      <PopularPostsList popularPosts={popularPosts} loading={loading} onPostClick={onPostClick}/>
    </section>
  );
}

DashboardSection.propTypes = DashboardSectionPropTypes;
