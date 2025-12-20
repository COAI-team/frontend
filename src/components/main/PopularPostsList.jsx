import { Link } from "react-router-dom";
import PostCard from "../card/PostCard.jsx";
import {PopularPostsListPropTypes} from "../../utils/propTypes.js";

export default function PopularPostsList({
                                           popularPosts = [],
                                           loading = false,
                                           onPostClick = () => {},
                                         }) {
  let content;

  if (loading) {
    content = (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  } else if (popularPosts.length === 0) {
    content = (
      <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
        <div className="text-4xl mb-4">🍃</div>
        <p>아직 핫한 글이 없네요. 첫 번째 장작을 넣어주세요.</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularPosts.map((post) => (
          <PostCard
            key={post.freeboardId}
            post={post}
            onPostClick={onPostClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b pb-4 border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-2xl font-bold dark:text-white">
            🔥 지금 핫한 망한 코드들
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            다른 사람들의 고통을 즐겨보세요. (인기 게시글)
          </p>
        </div>
        <Link
          to="/freeboard"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center"
        >
          전체보기
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {content}
    </div>
  );
}

/* ✅ props validation */
PopularPostsList.propTypes = PopularPostsListPropTypes;
