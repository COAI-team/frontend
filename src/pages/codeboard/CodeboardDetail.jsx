import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../server/AxiosConfig";
import hljs from 'highlight.js';
import { Heart, MessageCircle, Share2, AlertCircle, Code2 } from "lucide-react";
import "../../styles/CodeboardDetail.css";
import CommentSection from '../../components/comment/CommentSection';
import { getAnalysisResult } from '../../service/codeAnalysis/analysisApi';
import { getSmellKeyword } from '../../utils/codeAnalysisUtils';

const CodeboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const contentRef = useRef(null);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // 분석 결과 상태 추가
  const [analysisResult, setAnalysisResult] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  const currentUserId = 1;

  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDark(darkMode);
      
      const existingStyle = document.getElementById('hljs-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const link = document.createElement('link');
      link.id = 'hljs-theme';
      link.rel = 'stylesheet';
      link.href = darkMode 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      document.head.appendChild(link);
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
      const existingStyle = document.getElementById('hljs-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/codeboard/${id}`)
      .then((res) => {
        console.log("API 응답:", res.data);
        const data = res.data.data || res.data;
        console.log("tags:", data.tags);
        setBoard(data);
        setIsLiked(data.isLiked || false); 
        setLikeCount(data.likeCount || 0);
        setCommentCount(data.commentCount || 0);

        // analysisId가 있으면 분석 결과 로드
        if (data.analysisId) {
          loadAnalysisData(data.analysisId);
        } else {
          console.log("분석 ID가 없습니다.");
        }
      })
      .catch((err) => console.error("게시글 불러오기 실패:", err));
  }, [id]);

  // 분석 결과 로드 함수
  const loadAnalysisData = async (analysisId) => {
    try {
      setIsAnalysisLoading(true);
      const result = await getAnalysisResult(analysisId);
      const data = result.data;
      setAnalysisResult(data);
      
      // 파일 내용 로드
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
      // 에러가 나도 analysisResult를 null로 설정해서 레이아웃이 단일 컬럼으로 표시되도록
      setAnalysisResult(null);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axiosInstance.post(`/like/codeboard/${id}`);
      const { isLiked } = response.data;
      
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleShare = () => {
    console.log("공유 클릭");
  };

  const handleReport = () => {
    console.log("신고 클릭");
  };

  const handleAnalysisView = () => {
    if (board?.analysisId) {
      navigate(`/analysis/${board.analysisId}`);
    }
  };

  useEffect(() => {
    if (!contentRef.current) return;

    const timer = setTimeout(() => {
      const stickerImages = contentRef.current.querySelectorAll('img[data-sticker], img[src*="openmoji"]');
      stickerImages.forEach(img => {
        img.style.width = '1.5em';
        img.style.height = '1.5em';
        img.style.verticalAlign = '-0.3em';
        img.style.display = 'inline-block';
        img.style.margin = '0 0.1em';
      });

      const monacoBlocks = contentRef.current.querySelectorAll('pre[data-type="monaco-code-block"]');
      
      monacoBlocks.forEach(block => {
        const code = block.getAttribute('data-code');
        const language = block.getAttribute('data-language');
        
        if (code) {
          const decodeHTML = (html) => {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
          };
          
          const decodedCode = decodeHTML(code);
          
          block.innerHTML = '';
          block.className = 'code-block-wrapper';
          block.removeAttribute('data-type');
          
          const header = document.createElement('div');
          header.className = 'code-header';
          header.innerHTML = `<span class="code-language">${language || 'code'}</span>`;
          
          const codeElement = document.createElement('code');
          codeElement.className = `language-${language || 'plaintext'}`;
          codeElement.textContent = decodedCode;
          
          block.appendChild(header);
          block.appendChild(codeElement);
          
          hljs.highlightElement(codeElement);
        }
      });

      const linkPreviews = contentRef.current.querySelectorAll('div[data-type="link-preview"]');
      
      linkPreviews.forEach(preview => {
        const title = preview.getAttribute('data-title');
        const description = preview.getAttribute('data-description');
        const image = preview.getAttribute('data-image');
        const site = preview.getAttribute('data-site');
        const url = preview.getAttribute('data-url');
        
        if (url) {
          preview.innerHTML = '';
          preview.className = `link-preview-card ${isDark ? 'dark' : 'light'}`;
          preview.style.cssText = `
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
            display: flex;
            gap: 1rem;
            background: ${isDark ? '#1f2937' : '#ffffff'};
            cursor: pointer;
            transition: all 0.2s;
          `;
          
          preview.addEventListener('mouseenter', () => {
            preview.style.borderColor = isDark ? '#60a5fa' : '#3b82f6';
          });
          
          preview.addEventListener('mouseleave', () => {
            preview.style.borderColor = isDark ? '#374151' : '#e5e7eb';
          });
          
          preview.addEventListener('click', () => {
            window.open(url, '_blank');
          });
          
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
            siteSpan.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? '#9ca3af' : '#6b7280'};
              margin-bottom: 0.25rem;
            `;
            textContainer.appendChild(siteSpan);
          }
          
          if (title) {
            const titleDiv = document.createElement('div');
            titleDiv.textContent = title;
            titleDiv.style.cssText = `
              font-weight: 600;
              font-size: 1rem;
              color: ${isDark ? '#f3f4f6' : '#111827'};
              margin-bottom: 0.25rem;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `;
            textContainer.appendChild(titleDiv);
          }
          
          if (description) {
            const descDiv = document.createElement('div');
            descDiv.textContent = description;
            descDiv.style.cssText = `
              font-size: 0.875rem;
              color: ${isDark ? '#d1d5db' : '#4b5563'};
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            `;
            textContainer.appendChild(descDiv);
          }
          
          preview.appendChild(textContainer);
        }
      });

      const allCodeBlocks = contentRef.current.querySelectorAll('pre code:not([class*="language-"])');
      allCodeBlocks.forEach(block => {
        block.classList.remove('hljs');
        block.removeAttribute('data-highlighted');
        hljs.highlightElement(block);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [board, isDark]);

  const getRenderedContent = (content) => {
    if (!content) {
      return "";
    }
    
    try {
      if (content.startsWith('[')) {
        const blocks = JSON.parse(content);
        if (blocks.length > 0 && blocks[0].content) {
          return blocks[0].content;
        }
      }
      return content;
    } catch (e) {
      console.error("컨텐츠 파싱 실패:", e);
      return content;
    }
  };

  if (!board) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#101828',
        color: 'white',
        padding: '2.5rem'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#101828',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* 상단 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate("/codeboard")}
            style={{
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            ← 목록으로
          </button>

          {board.analysisId && (
            <button
              onClick={handleAnalysisView}
              style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
              }}
            >
              <Code2 size={16} />
              <span>코드 분석 결과 보기</span>
            </button>
          )}
        </div>

        {/* 그리드 레이아웃 */}
        <div style={{ display: 'grid', gridTemplateColumns: analysisResult ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          
          {/* 왼쪽: 코드 & 분석 결과 (analysisId가 있을 때만 표시) */}
          {analysisResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 코드 뷰어 */}
              <div style={{
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                backgroundColor: '#1f2937'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  borderBottom: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#111827'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>
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
                      color: '#d1d5db',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#374151'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    복사
                  </button>
                </div>
                
                <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                  {fileContent.split('\n').map((line, index) => {
                    const lineNumber = index + 1;
                    return (
                      <div
                        key={lineNumber}
                        style={{ display: 'flex' }}
                      >
                        <div style={{
                          width: '3rem',
                          flexShrink: 0,
                          padding: '0 0.5rem',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          userSelect: 'none',
                          borderRight: '1px solid #374151',
                          backgroundColor: '#111827',
                          color: '#6b7280'
                        }}>
                          {lineNumber}
                        </div>
                        <div style={{ flex: 1, padding: '0 1rem' }}>
                          <pre style={{
                            fontSize: '0.875rem',
                            margin: 0,
                            fontFamily: 'monospace',
                            color: '#f3f4f6'
                          }}>{line || ' '}</pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 분석 결과 */}
              <div style={{
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                backgroundColor: '#1f2937'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  borderBottom: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#111827'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>
                    분석 결과
                  </span>
                  {analysisResult && (() => {
                    const score = analysisResult.aiScore;
                    let colorClass = '';
                    
                    if (score >= 80) {
                      colorClass = 'rgba(34, 197, 94, 0.2)';
                    } else if (score >= 60) {
                      colorClass = 'rgba(59, 130, 246, 0.2)';
                    } else if (score >= 40) {
                      colorClass = 'rgba(234, 179, 8, 0.2)';
                    } else {
                      colorClass = 'rgba(239, 68, 68, 0.2)';
                    }
                    
                    return (
                      <span style={{
                        padding: '0.125rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: colorClass,
                        color: score >= 80 ? '#86efac' : score >= 60 ? '#93c5fd' : score >= 40 ? '#fde047' : '#fca5a5'
                      }}>
                        {getSmellKeyword(score).text}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ padding: '1rem', maxHeight: '600px', overflow: 'auto' }}>
                  {analysisResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Code Smells */}
                      {analysisResult.codeSmells && (typeof analysisResult.codeSmells === 'string' ? JSON.parse(analysisResult.codeSmells) : analysisResult.codeSmells).length > 0 && (
                        <div>
                          <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#fca5a5'
                          }}>
                            <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            발견된 문제점
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(typeof analysisResult.codeSmells === 'string' ? JSON.parse(analysisResult.codeSmells) : analysisResult.codeSmells).map((smell, idx) => (
                              <div key={idx} style={{
                                padding: '0.75rem',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.375rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)'
                              }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#fca5a5' }}>{smell.name}</div>
                                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#fca5a5' }}>{smell.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {analysisResult.suggestions && (typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).length > 0 && (
                        <div>
                          <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#86efac'
                          }}>
                            <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            개선 제안
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {(typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).map((suggestion, idx) => (
                              <div key={idx} style={{
                                border: '1px solid #374151',
                                borderRadius: '0.375rem',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  padding: '0.5rem 0.75rem',
                                  borderBottom: '1px solid #374151',
                                  backgroundColor: '#111827'
                                }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#d1d5db' }}>제안 #{idx + 1}</span>
                                </div>
                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {suggestion.problematicSnippet && (
                                    <div>
                                      <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: '#9ca3af' }}>변경 전:</div>
                                      <pre style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        overflowX: 'auto',
                                        fontFamily: 'monospace',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#fca5a5',
                                        margin: 0
                                      }}>
                                        {suggestion.problematicSnippet || suggestion.problematicCode}
                                      </pre>
                                    </div>
                                  )}
                                  {suggestion.proposedReplacement && (
                                    <div>
                                      <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: '#9ca3af' }}>변경 후:</div>
                                      <pre style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        overflowX: 'auto',
                                        fontFamily: 'monospace',
                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                        color: '#86efac',
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
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 오른쪽: 게시글 내용 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 제목 및 버튼 */}
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
                color: '#e5e7eb',
                margin: 0
              }}>
                {board.codeboardTitle || "제목 없음"}
              </h1>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => navigate(`/codeboard/edit/${id}`)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    backgroundColor: '#374151',
                    color: '#e5e7eb',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
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
                    backgroundColor: 'rgba(127, 29, 29, 0.3)',
                    color: '#fca5a5',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(127, 29, 29, 0.5)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(127, 29, 29, 0.3)'}
                >
                  삭제
                </button>
              </div>
            </div>

            {/* 메타 정보 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #374151',
              color: '#9ca3af'
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
                  backgroundColor: '#374151',
                  color: '#e5e7eb'
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

            {/* 본문 */}
            <div
              ref={contentRef}
              className="codeboard-content"
              style={{ marginBottom: '2rem', minHeight: '300px' }}
              dangerouslySetInnerHTML={{ __html: getRenderedContent(board.codeboardContent) }}
            ></div>

            {/* 태그 */}
            {board.tags && board.tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                paddingTop: '2rem',
                borderTop: '1px solid #374151'
              }}>
                {board.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #374151'
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
                    color: isLiked ? '#ef4444' : '#9ca3af',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => !isLiked && (e.currentTarget.style.color = '#fca5a5')}
                  onMouseLeave={(e) => !isLiked && (e.currentTarget.style.color = '#9ca3af')}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  <span style={{ fontSize: '0.875rem' }}>좋아요</span>
                  <span style={{ fontWeight: '500' }}>{likeCount}</span>
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#9ca3af'
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
                    color: '#9ca3af',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
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
                    color: '#9ca3af',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  <AlertCircle size={18} />
                  <span>신고</span>
                </button>
              </div>
            </div>

            {/* 댓글 섹션 */}
            <CommentSection
              boardId={Number(id)}
              boardType="CODEBOARD"
              currentUserId={currentUserId}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeboardDetail;