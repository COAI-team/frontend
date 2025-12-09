import CommentItem from './CommentItem';

export default function CommentList({ comments, onCommentUpdated, isDark }) {
  // 댓글과 답글 분리
  const groupedComments = comments.reduce((acc, comment) => {
    if (comment.parentCommentId === null) {
      // 댓글
      acc.push({
        ...comment,
        replies: []
      });
    } else {
      // 답글
      const parent = acc.find(c => c.commentId === comment.parentCommentId);
      if (parent) {
        parent.replies.push(comment);
      }
    }
    return acc;
  }, []);

  return (
    <div>
      {groupedComments.map(comment => (
        <div key={comment.commentId}>
          <CommentItem comment={comment} isDark={isDark} />
          
          {/* 답글 표시 */}
          {comment.replies.length > 0 && (
            <div style={{ marginLeft: '2rem' }}>
              {comment.replies.map(reply => (
                <CommentItem 
                  key={reply.commentId} 
                  comment={reply} 
                  isReply={true}
                  isDark={isDark} 
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}