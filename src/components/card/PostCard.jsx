import { formatDate } from '../main/utils';
import {PostCardPropTypes} from "../../utils/propTypes";

export default function PostCard({ post, onPostClick }) {
  return (
    <button
      type="button"
      onClick={() => onPostClick(post.freeboardId)}
      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {post.category || "자유"}
        </span>
        <span className="text-xs text-gray-500">{formatDate(post.freeboardCreatedAt)}</span>
      </div>
      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1 group-hover:text-blue-500 transition-colors">
        {post.freeboardTitle}
      </h4>
      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 h-10">
        {post.freeboardSummary || "내용이 없습니다. 제목이 곧 내용인 상남자 스타일."}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2 text-xs">
            {post.userNickname?.charAt(0) || "U"}
          </div>
          {post.userNickname}
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-400">
          <span className="flex items-center"><span className="mr-1">👀</span> {post.freeboardClick}</span>
          <span className="flex items-center text-red-400"><span className="mr-1">♥</span> {post.likeCount}</span>
        </div>
      </div>
    </button>
  );
}

PostCard.propTypes = PostCardPropTypes;
