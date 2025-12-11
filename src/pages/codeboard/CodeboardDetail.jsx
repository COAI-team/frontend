import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../server/AxiosConfig";
import { getAuth } from "../../utils/auth/token";
import hljs from 'highlight.js';
import { Heart, MessageCircle, Share2, AlertCircle } from "lucide-react";
import "../../styles/CodeboardDetail.css";
import CommentSection from '../../components/comment/CommentSection';
import { getAnalysisResult } from '../../service/codeAnalysis/analysisApi';
import { getSmellKeyword } from '../../utils/codeAnalysisUtils';

const CodeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark')
  );
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // 처리된 content 저장
  const [processedContent, setProcessedContent] = useState('');
  const contentProcessed = useRef(false);

  // 로그인 유저 정보
  const [currentUser, setCurrentUser] = useState(null);

  // 로그인 유저 정보 가져오기
  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      setCurrentUser(auth.user);
    }
  }, []);

  // highlight.js 테마 관리
  useEffect(() => {
    const loadHljsTheme = (darkMode) => {
      document.querySelectorAll('link[data-hljs-theme]').forEach(el => el.remove());
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.setAttribute('data-hljs-theme', 'true');
      link.href = darkMode 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      document.head.appendChild(link);
    };

    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
      loadHljsTheme(darkMode);
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
      document.querySelectorAll('link[data-hljs-theme]').forEach(el => el.remove());
    };
  }, []);

  // 게시글 데이터 로드
  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/codeboard/${id}`)
      .then((res) => {
        const data = res.data.data || res.data;
        setBoard(data);
        setIsLiked(data.isLiked || false); 
        setLikeCount(data.likeCount || 0);
        setCommentCount(data.commentCount || 0);

        if (data.analysisId) {
          loadAnalysisData(data.analysisId);
        }
      })
      .catch((err) => console.error("게시글 불러오기 실패:", err));
  }, [id]);

  // content에서 실제 HTML 추출
  const getRenderedContent = (content) => {
    if (!content) return "";
    
    try {
      if (content.startsWith('[')) {
        const blocks = JSON.parse(content);
        if (blocks.length > 0 && blocks[0].content) {
          return blocks[0].content;
        }
      }
      return content;
    } catch {
      return content;
    }
  };

  // content 처리 - 한 번만 수행
  useEffect(() => {
    if (!board || contentProcessed.current) return;

    const rawContent = getRenderedContent(board.codeboardContent);
    if (!rawContent) return;

    // DOM 파서로 처리
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${rawContent}</div>`, 'text/html');
    const container = doc.body.firstChild;

    // 스티커 처리
    container.querySelectorAll('img[data-sticker], img[src*="openmoji"]').forEach(img => {
      img.style.width = '1.5em';
      img.style.height = '1.5em';
      img.style.verticalAlign = '-0.3em';
      img.style.display = 'inline-block';
      img.style.margin = '0 0.1em';
    });

    // 코드블록 처리
    container.querySelectorAll('pre[data-type="monaco-code-block"]').forEach(block => {
      const code = block.getAttribute('data-code');
      const language = block.getAttribute('data-language') || 'plaintext';

      if (code) {
        const decodeHTML = (html) => {
          const txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
        };

        const decodedCode = decodeHTML(code);

        block.innerHTML = '';
        block.className = 'code-block-wrapper';
        block.removeAttribute('data-type');

        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `<span class="code-language">${language}</span>`;

        const codeElement = document.createElement('code');
        codeElement.className = `language-${language}`;
        codeElement.textContent = decodedCode;

        block.appendChild(header);
        block.appendChild(codeElement);
      }
    });

    setProcessedContent(container.innerHTML);
    contentProcessed.current = true;
  }, [board]);

  const loadAnalysisData = async (analysisId) => {
    try {
      setIsAnalysisLoading(true);
      const result = await getAnalysisResult(analysisId);
      const data = result.data;
      setAnalysisResult(data);
      
      if (data.repositoryUrl && data.filePath) {
        try {
          const parts = data.repositoryUrl.split('/');
          const owner = parts[parts.length - 2];
          const repo = parts[parts.length - 1];
          
          const contentRes = await axiosInstance.get(`/api/github/repos/${owner}/${repo}/content`, {
            params: { path: data.filePath }
          });
          setFileContent(contentRes.data.content);
        } catch (contentErr) {
          console.error("Failed to load file content:", contentErr);
          setFileContent("// 파일 내용을 불러올 수 없습니다.");
        }
      }
    } catch (err) {
      console.error("분석 결과 로드 실패:", err);
      setAnalysisResult(null);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      const goLogin = window.confirm(
        "로그인 후 좋아요를 누를 수 있습니다. 로그인 하시겠습니까?"
      );
      if (goLogin) {
        const redirect = encodeURIComponent(`/codeboard/${id}`);
        navigate(`/signin?redirect=${redirect}`);
      }
      return;
    }

    try {
      const response = await axiosInstance.post(`/like/codeboard/${id}`);
      const { isLiked: newIsLiked } = response.data;
      
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/codeboard?keyword=${encodeURIComponent(tag)}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다.');
  };

  const handleReport = () => {
    console.log("신고 클릭");
  };

  const renderLinkPreview = (preview, isDark) => {
    const title = preview.getAttribute('data-title');
    const description = preview.getAttribute('data-description');
    const image = preview.getAttribute('data-image');
    const site = preview.getAttribute('data-site');
    const url = preview.getAttribute('data-url');
    
    if (!url) return;
    
    preview.innerHTML = '';
    preview.className = `link-preview-card ${isDark ? 'dark' : 'light'}`;
    Object.assign(preview.style, {
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      display: 'flex',
      gap: '1rem',
      background: isDark ? '#1f2937' : '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s'
    });
    
    preview.onmouseenter = () => preview.style.borderColor = isDark ? '#60a5fa' : '#3b82f6';
    preview.onmouseleave = () => preview.style.borderColor = isDark ? '#374151' : '#e5e7eb';
    preview.onclick = () => window.open(url, '_blank');
    
    if (image) {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = 'flex-shrink: 0; width: 120px; height: 120px; overflow: hidden; border-radius: 0.375rem;';
      const img = document.createElement('img');
      img.src = image;
      img.alt = title || 'Link preview';
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      imgContainer.appendChild(img);
      preview.appendChild(imgContainer);
    }
    
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1; min-width: 0;';
    
    if (site) {
      const siteSpan = document.createElement('div');
      siteSpan.textContent = site;
      siteSpan.style.cssText = `font-size: 0.875rem; color: ${isDark ? '#9ca3af' : '#6b7280'}; margin-bottom: 0.25rem;`;
      textContainer.appendChild(siteSpan);
    }
    
    if (title) {
      const titleDiv = document.createElement('div');
      titleDiv.textContent = title;
      titleDiv.style.cssText = `font-weight: 600; font-size: 1rem; color: ${isDark ? '#f3f4f6' : '#111827'}; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
      textContainer.appendChild(titleDiv);
    }
    
    if (description) {
      const descDiv = document.createElement('div');
      descDiv.textContent = description;
      descDiv.style.cssText = `font-size: 0.875rem; color: ${isDark ? '#d1d5db' : '#4b5563'}; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;`;
      textContainer.appendChild(descDiv);
    }
    
    preview.appendChild(textContainer);
  };

  if (!board) {
    return (
      <div className={`loading-container ${isDark ? 'dark' : ''}`}>
        로딩 중...
      </div>
    );
  }

  const currentUserId = currentUser?.userId ?? currentUser?.id ?? null;
  const currentUserNickname = currentUser?.userNickname ?? currentUser?.nickname ?? "";
  const isAuthor =
    currentUserId != null && board.userId != null
      ? Number(currentUserId) === Number(board.userId)
      : false;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#101828' : '#f9fafb',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate("/codeboard")}
            className="back-button"
            style={{
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: isDark ? '#9ca3af' : '#4b5563',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ← 목록으로
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: board.analysisId ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', 
          gap: '1.5rem',
          overflow: 'hidden'
        }}>
          
          {/* 좌측 패널 - analysisId가 있으면 항상 영역 확보 */}
          {board.analysisId && (
            analysisResult ? (
              <AnalysisPanel 
                analysisResult={analysisResult}
                fileContent={fileContent}
                isDark={isDark}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {/* 코드 뷰어 스켈레톤 */}
                <div style={{
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    color: isDark ? '#9ca3af' : '#6b7280',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderTopColor: isDark ? '#60a5fa' : '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>코드 불러오는 중...</span>
                  </div>
                </div>

                {/* 분석 결과 스켈레톤 */}
                <div style={{
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    color: isDark ? '#9ca3af' : '#6b7280',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderTopColor: isDark ? '#60a5fa' : '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span>분석 결과 불러오는 중...</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 우측 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, overflow: 'hidden'}}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: '700',
                flex: 1,
                color: isDark ? '#e5e7eb' : '#111827',
                margin: 0
              }}>
                {board.codeboardTitle || "제목 없음"}
              </h1>
              
              {isAuthor && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => navigate(`/codeboard/edit/${id}`)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      backgroundColor: isDark ? '#374151' : '#e5e7eb',
                      color: isDark ? '#e5e7eb' : '#1f2937',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("정말 삭제하시겠습니까?")) {
                        axiosInstance
                          .delete(`/codeboard/${id}`)
                          .then(() => {
                            alert("삭제되었습니다.");
                            navigate("/codeboard");
                          })
                          .catch((err) => {
                            console.error("삭제 실패:", err);
                            alert("삭제에 실패했습니다.");
                          });
                      }
                    }}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      backgroundColor: isDark ? 'rgba(127, 29, 29, 0.3)' : 'rgba(220, 38, 38, 0.1)',
                      color: isDark ? '#fca5a5' : '#dc2626',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1.5rem',
              borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              color: isDark ? '#9ca3af' : '#4b5563'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  backgroundColor: isDark ? '#374151' : '#d1d5db',
                  color: isDark ? '#e5e7eb' : '#1f2937'
                }}>
                  {board.userNickname ? String(board.userNickname).charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{board.userNickname || '익명'}</span>
              </div>
              <span>·</span>
              <span>{new Date(board.codeboardCreatedAt).toLocaleString()}</span>
              <span>·</span>
              <span>조회수 {board.codeboardClick}</span>
            </div>

            <ContentRenderer 
              content={processedContent || getRenderedContent(board.codeboardContent)}
              isDark={isDark}
            />

            {board.tags && board.tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                paddingTop: '2rem',
                borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
              }}>
                {board.tags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => handleTagClick(tag)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)')}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button
                  onClick={handleLike}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isLiked ? '#ef4444' : (isDark ? '#9ca3af' : '#4b5563')
                  }}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  <span style={{ fontSize: '0.875rem' }}>좋아요</span>
                  <span style={{ fontWeight: '500' }}>{likeCount}</span>
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isDark ? '#9ca3af' : '#4b5563'
                }}>
                  <MessageCircle size={20} />
                  <span style={{ fontSize: '0.875rem' }}>댓글</span>
                  <span style={{ fontWeight: '500' }}>{commentCount}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button 
                  onClick={handleShare}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#9ca3af' : '#4b5563'
                  }}
                >
                  <Share2 size={18} />
                  <span>공유</span>
                </button>

                <button 
                  onClick={handleReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#9ca3af' : '#4b5563'
                  }}
                >
                  <AlertCircle size={18} />
                  <span>신고</span>
                </button>
              </div>
            </div>

            <CommentSection
              boardId={Number(id)}
              boardType="CODEBOARD"
              currentUserId={currentUserId}
              currentUserNickname={currentUserNickname}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisPanel = ({ analysisResult, fileContent, isDark }) => {
  const parseJSON = (data) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return data || [];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, overflow: 'hidden' }}>
      <div style={{
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        backgroundColor: isDark ? '#1f2937' : '#ffffff'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDark ? '#1f2937' : '#F9FAFB'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isDark ? '#d1d5db' : '#1f2937' }}>
            {analysisResult.filePath?.split('/').pop()}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(fileContent);
              alert('코드가 복사되었습니다.');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '0.25rem',
              color: isDark ? '#d1d5db' : '#1f2937',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            복사
          </button>
        </div>
        
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          {fileContent.split('\n').map((line, index) => (
            <div key={index} style={{ display: 'flex', minWidth: 'max-content' }}>
              <div style={{
                width: '3rem',
                flexShrink: 0,
                padding: '0 0.5rem',
                textAlign: 'right',
                fontSize: '0.75rem',
                userSelect: 'none',
                borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                backgroundColor: isDark ? '#111827' : '#f9fafb',
                color: '#6b7280'
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1, padding: '0 1rem', minWidth: 0 }}>
                <pre style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'monospace',
                  color: isDark ? '#f3f4f6' : '#1f2937',
                  whiteSpace: 'pre',
                  overflowX: 'auto'
                }}>{line || ' '}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        borderRadius: '0.5rem',
        overflow: 'hidden',
        backgroundColor: isDark ? '#1f2937' : '#ffffff'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDark ? '#111827' : '#f9fafb'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: isDark ? '#d1d5db' : '#1f2937' }}>
            분석 결과
          </span>
          <ScoreBadge score={analysisResult.aiScore} isDark={isDark} />
        </div>

        <div style={{ padding: '1rem', maxHeight: '600px', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {parseJSON(analysisResult.codeSmells).length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isDark ? '#fca5a5' : '#dc2626'
                }}>
                  발견된 문제점
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {parseJSON(analysisResult.codeSmells).map((smell, idx) => (
                    <div key={idx} style={{
                      padding: '0.75rem',
                      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                      borderRadius: '0.375rem',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 1)'
                    }}>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem', color: isDark ? '#fca5a5' : '#dc2626' }}>
                        {smell.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: isDark ? '#fca5a5' : '#dc2626' }}>
                        {smell.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parseJSON(analysisResult.suggestions).length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isDark ? '#86efac' : '#16a34a'
                }}>
                  개선 제안
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {parseJSON(analysisResult.suggestions).map((suggestion, idx) => (
                    <div key={idx} style={{
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.375rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                        backgroundColor: isDark ? '#111827' : '#f9fafb'
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: isDark ? '#d1d5db' : '#1f2937' }}>
                          제안 #{idx + 1}
                        </span>
                      </div>
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(suggestion.problematicSnippet || suggestion.problematicCode) && (
                          <div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: isDark ? '#9ca3af' : '#4b5563' }}>
                              변경 전:
                            </div>
                            <pre style={{
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              overflowX: 'auto',
                              fontFamily: 'monospace',
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 1)',
                              color: isDark ? '#fca5a5' : '#dc2626',
                              margin: 0
                            }}>
                              {suggestion.problematicSnippet || suggestion.problematicCode}
                            </pre>
                          </div>
                        )}
                        {suggestion.proposedReplacement && (
                          <div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: isDark ? '#9ca3af' : '#4b5563' }}>
                              변경 후:
                            </div>
                            <pre style={{
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              overflowX: 'auto',
                              fontFamily: 'monospace',
                              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 252, 231, 1)',
                              color: isDark ? '#86efac' : '#16a34a',
                              margin: 0
                            }}>
                              {suggestion.proposedReplacement}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreBadge = ({ score, isDark }) => {
  let bgColor, textColor;
  
  if (score >= 80) {
    bgColor = isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 252, 231, 1)';
    textColor = isDark ? '#86efac' : '#16a34a';
  } else if (score >= 60) {
    bgColor = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)';
    textColor = isDark ? '#93c5fd' : '#2563eb';
  } else if (score >= 40) {
    bgColor = isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(254, 249, 195, 1)';
    textColor = isDark ? '#fde047' : '#ca8a04';
  } else {
    bgColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 1)';
    textColor = isDark ? '#fca5a5' : '#dc2626';
  }
  
  return (
    <span style={{
      padding: '0.125rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      backgroundColor: bgColor,
      color: textColor
    }}>
      {getSmellKeyword(score).text}
    </span>
  );
};

// ContentRenderer 컴포넌트 - analysisResult 변경에 영향받지 않음
const ContentRenderer = React.memo(({ content, isDark }) => {
  const innerRef = useRef(null);

  useEffect(() => {
    if (!innerRef.current || !content) return;

    const timer = setTimeout(() => {
      // 코드블록 하이라이트
      innerRef.current.querySelectorAll('pre.code-block-wrapper code').forEach(block => {
        block.classList.remove('hljs');
        block.removeAttribute('data-highlighted');
        hljs.highlightElement(block);
      });

      // 링크 프리뷰는 이미 처리됨
    }, 100);

    return () => clearTimeout(timer);
  }, [content, isDark]);

  return (
    <div
      ref={innerRef}
      className={`codeboard-content ${isDark ? 'dark' : 'light'}`}
      style={{ marginBottom: '2rem', minHeight: '300px', overflowX: 'auto' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
});

export default CodeboardDetail;