import CommentItem from './CommentItem';

export default function CommentList({ comments, onCommentUpdated, isDark }) {
  return (
    <div>
      {comments.map((comment, index) => (
        <div key={comment.commentId}>
          <CommentItem
            comment={comment}
            onCommentUpdated={onCommentUpdated}
            isDark={isDark}
          />
          {index < comments.length - 1 && (
            <div className={`border-t ${isDark ? "border-gray-800" : "border-gray-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}