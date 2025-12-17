import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../server/AxiosConfig";
import Pagination from '../../components/common/Pagination';
import { getSmellKeyword, getSmellVisual } from '../../utils/codeAnalysisUtils';
import "../../styles/CodeboardList.css";

// debounce 유틸리티 함수
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const CodeboardList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewType, setViewType] = useState('list');

  // URL에서 파라미터 읽기 (단일 진실 공급원)
  const keyword = searchParams.get('keyword') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('size')) || 10;
  const sortBy = searchParams.get('sort') || 'CREATED_AT';
  const sortDirection = searchParams.get('direction') || 'DESC';
  const scoreRange = searchParams.get('scoreRange') || '';

  // 검색 입력용 로컬 state
  const [searchInput, setSearchInput] = useState(keyword);

  // URL 파라미터 업데이트 헬퍼 함수
  const updateParams = useCallback((updates, resetPage = false) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    // 조건이 바뀌면 페이지 초기화
    if (resetPage) {
      newParams.delete('page');
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // URL keyword 변경 시 검색 입력창 동기화
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  // 게시글 목록 조회 (scoreRange 필터링 포함)
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/codeboard', {
        params: {
          page: currentPage,
          size: pageSize,
          sort: sortBy,
          direction: sortDirection,
          keyword: keyword
        }
      });
      
      const data = response.data.data || response.data;
      let filteredContent = data.content || [];
      
      // scoreRange가 있으면 클라이언트에서 필터링
      if (scoreRange) {
        const [min, max] = scoreRange.split('-').map(Number);
        filteredContent = filteredContent.filter(post => 
          post.aiScore != null && post.aiScore >= min && post.aiScore < max
        );
      }
      
      setPosts(filteredContent);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, keyword, scoreRange]);

  // URL 파라미터가 변경될 때마다 게시글 조회
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 검색 입력 변경 시 debounce 적용하여 자동 검색
  const debouncedSearch = useCallback(
    debounce((value) => {
      updateParams({ keyword: value }, true);
    }, 300),
    [updateParams]
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // 정렬 변경
  const handleSortChange = (newSort) => {
    updateParams({ sort: newSort, direction: 'DESC' }, true);
  };

  // 페이지 크기 변경
  const handlePageSizeChange = (newSize) => {
    updateParams({ size: newSize }, true);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    updateParams({ page: page });
  };

  // 태그 클릭
  const handleTagClick = (tag) => {
    setSearchParams({ keyword: tag.trim() });
  };

  // AI 점수 태그 클릭 핸들러
  const handleSmellTagClick = (score) => {
    let range;
    if (score >= 90) range = '90-100';
    else if (score >= 70) range = '70-90';
    else if (score >= 50) range = '50-70';
    else if (score >= 30) range = '30-50';
    else range = '0-30';
    
    setSearchParams({ scoreRange: range });
  };

  const handlePostClick = (postId) => {
    navigate(`/codeboard/${postId}`);
  };

  const handleWriteClick = () => {
    navigate('/codeAnalysis');
  };

  const getPreviewText = (content) => {
    if (!content) return '내용 없음';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  const handleAnalysisListClick = () => {
    navigate("/analysis");
  };

  return (
    <div className="freeboard-list-container">
      <div className="freeboard-header">
        <div className="freeboard-header-row">
          <div className="freeboard-header-text">
            <h1 className="freeboard-title">코드게시판</h1>
            <p className="freeboard-subtitle">
              코드 리뷰와 분석을 통해 더 나은 코드를 작성해보세요
            </p>
          </div>

          <div className="freeboard-header-actions">
            <button
              className="analysis-list-btn"
              onClick={handleAnalysisListClick}
              title="코드 분석 내역 보기"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              코드분석 내역
            </button>
          </div>
        </div>
      </div>

      <div className="freeboard-controls">
        <div className="control-left">
          <div className="search-form">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchInput}
              onChange={handleSearchInputChange}
              className="search-input"
            />
            <button type="button" className="search-button" disabled>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="control-right">
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="CREATED_AT">최신순</option>
            <option value="COMMENT_COUNT">댓글 많은 순</option>
            <option value="LIKE_COUNT">좋아요 순</option>
            <option value="VIEW_COUNT">조회수 순</option>
          </select>

          <select 
            value={pageSize} 
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="pagesize-select"
          >
            <option value="10">10개씩 보기</option>
            <option value="20">20개씩 보기</option>
            <option value="30">30개씩 보기</option>
            <option value="50">50개씩 보기</option>
          </select>

          <div className="view-type-buttons">
            <button 
              className={`view-type-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => setViewType('list')}
              title="리스트형"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="2" fill="currentColor"/>
                <rect x="2" y="9" width="16" height="2" fill="currentColor"/>
                <rect x="2" y="14" width="16" height="2" fill="currentColor"/>
              </svg>
            </button>
            <button 
              className={`view-type-btn ${viewType === 'card' ? 'active' : ''}`}
              onClick={() => setViewType('card')}
              title="카드형"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" fill="currentColor"/>
                <rect x="11" y="2" width="7" height="7" fill="currentColor"/>
                <rect x="2" y="11" width="7" height="7" fill="currentColor"/>
                <rect x="11" y="11" width="7" height="7" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>게시글을 불러오는 중입니다...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-container">
          <p>게시글이 없습니다.</p>
          <button onClick={handleWriteClick} className="write-first-btn">
            첫 코드 분석하기
          </button>
        </div>
      ) : (
        <>
          {viewType === 'list' ? (
            <div className="posts-list">
              {posts.map((post) => (
                <div 
                  key={post.codeboardId} 
                  className="post-item"
                  onClick={() => handlePostClick(post.codeboardId)}
                >
                  <div className="post-content">
                    <h2 className="post-title">{post.codeboardTitle}</h2>

                    <p className="post-preview">{getPreviewText(post.codeboardSummary || post.codeboardContent)}</p>

                    {(post.codeboardTag || post.aiScore != null) && (
                      <div className="post-tags">
                        {post.codeboardTag && (Array.isArray(post.codeboardTag) ? post.codeboardTag : post.codeboardTag.split(',')).map((tag, index) => (
                          <span 
                            key={index} 
                            className="post-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagClick(tag);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                        
                        {post.aiScore != null && (
                          <span 
                            className="post-tag"
                            style={{
                              backgroundColor: post.aiScore >= 50 
                                ? 'rgba(76, 175, 80, 0.15)' 
                                : 'rgba(255, 82, 82, 0.15)',
                              color: post.aiScore >= 50 
                                ? '#4caf50' 
                                : '#ff5252',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleSmellTagClick(post.aiScore);
                            }}
                          >
                            {getSmellKeyword(post.aiScore).text.replace(/🌸|🍃|🤧|🤢|🤮/g, '').trim()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="post-footer">
                      <div className="post-user-info">
                        <div className="user-avatar">
                          <span className="user-initial">
                            {post.userNickname?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span className="user-nickname">{post.userNickname || 'User'}</span>
                      </div>
                      <span className="post-date">{formatDate(post.codeboardCreatedAt)}</span>
                      <span className="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" 
                                stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.codeboardClick || 0}
                      </span>
                      <span className="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" 
                                stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.commentCount || 0}
                      </span>
                      <span className="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                                stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.likeCount || 0}
                      </span>
                    </div>
                  </div>

                  {post.aiScore != null && (() => {
                    const visual = getSmellVisual(post.aiScore);
                    return (
                      <div 
                        className="smell-visual-card"
                        style={{
                          background: visual.gradient,
                        }}
                      >
                        <div 
                          style={{
                            background: visual.pattern,
                            position: 'absolute',
                            inset: 0,
                            opacity: 0.5
                          }}
                        />
                        <span style={{ position: 'relative', zIndex: 1 }}>
                          {visual.icon}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <div 
                  key={post.codeboardId} 
                  className="post-card"
                  onClick={() => handlePostClick(post.codeboardId)}
                >
                  <div className="card-content">
                    <div className="card-header">
                      <div className="card-user-info">
                        <div className="user-avatar">
                          <span className="user-initial">
                            {post.userNickname?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <span className="user-nickname">{post.userNickname || 'User'}</span>
                      </div>
                      <div className="card-header-right">
                        <span className="post-date">{formatDate(post.codeboardCreatedAt)}</span>
                      </div>
                    </div>

                    <h3 className="card-title">{post.codeboardTitle}</h3>
                    <p className="card-preview">{getPreviewText(post.codeboardSummary || post.codeboardContent)}</p>

                    {(post.codeboardTag || post.aiScore != null) && (
                      <div className="card-tags">
                        {post.codeboardTag && (Array.isArray(post.codeboardTag) ? post.codeboardTag : post.codeboardTag.split(',')).slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className="post-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagClick(tag);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                        
                        {post.aiScore != null && (
                          <span 
                            className="post-tag"
                            style={{
                              backgroundColor: post.aiScore >= 50 
                                ? 'rgba(76, 175, 80, 0.15)' 
                                : 'rgba(255, 82, 82, 0.15)',
                              color: post.aiScore >= 50 
                                ? '#4caf50' 
                                : '#ff5252',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleSmellTagClick(post.aiScore);
                            }}
                          >
                            {getSmellKeyword(post.aiScore).text.replace(/🌸|🍃|🤧|🤢|🤮/g, '').trim()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="card-stats">
                      <span className="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" 
                                stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.codeboardClick || 0}
                      </span>
                      <span className="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" 
                                stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.commentCount || 0}
                      </span>
                      <span className="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                                stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {post.likeCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

    </div>
  );
};

export default CodeboardList;