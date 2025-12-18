import axiosInstance from "../../server/AxiosConfig";

/**
 * 알고리즘 소셜 기능 API
 */

/**
 * 문제별 공유된 제출 목록 조회
 */
export const getSharedSubmissions = async (problemId, page = 1, size = 20, sortBy = 'latest', language = '') => {
  try {
    const params = {
      page,
      size,
      sort: sortBy,
    };
    
    if (language) {
      params.language = language;
    }
    
    const response = await axiosInstance.get(`/algo/problems/${problemId}/solutions`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ [getSharedSubmissions] 공유 제출 조회 실패:', error);
    return { error: true, message: error.response?.data?.message || '공유된 풀이를 불러오는데 실패했습니다.' };
  }
};

/**
 * 좋아요 토글
 */
export const toggleLike = async (submissionId) => {
  try {
    const response = await axiosInstance.post(`/algo/submissions/${submissionId}/like`);
    return response.data;
  } catch (error) {
    console.error('❌ [toggleLike] 좋아요 처리 실패:', error);
    return { error: true, message: error.response?.data?.message || '좋아요 처리에 실패했습니다.' };
  }
};

/**
 * 댓글 조회 (커서 기반)
 */
export const getComments = async (submissionId, cursor = null, size = 20) => {
  try {
    const params = { size };
    if (cursor) params.cursor = cursor;
    
    const response = await axiosInstance.get(`/algo/submissions/${submissionId}/comments`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ [getComments] 댓글 조회 실패:', error);
    return { error: true, message: error.response?.data?.message || '댓글을 불러오는데 실패했습니다.' };
  }
};

/**
 * 댓글 작성
 */
export const createComment = async (submissionId, content, parentCommentId = null) => {
  try {
    const response = await axiosInstance.post(`/algo/submissions/${submissionId}/comments`, {
      content,
      parentCommentId
    });
    return response.data;
  } catch (error) {
    console.error('❌ [createComment] 댓글 작성 실패:', error);
    return { error: true, message: error.response?.data?.message || '댓글 작성에 실패했습니다.' };
  }
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await axiosInstance.delete(`/algo/submissions/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('❌ [deleteComment] 댓글 삭제 실패:', error);
    return { error: true, message: error.response?.data?.message || '댓글 삭제에 실패했습니다.' };
  }
};