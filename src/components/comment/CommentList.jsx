import CommentItem from './CommentItem';

export default function CommentList({ comments, currentUserId, onCommentUpdated, isDark }) {

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