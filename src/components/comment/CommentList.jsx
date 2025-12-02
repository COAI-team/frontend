import CommentItem from './CommentItem';

export default function CommentList({ comments, currentUserId, onCommentUpdated, isDark }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">첫 번째 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.commentId}
          comment={comment}
          currentUserId={currentUserId}
          onCommentUpdated={onCommentUpdated}
          isDark={isDark}
        />
      ))}
    </div>
  );
}