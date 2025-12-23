import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useTheme} from "../../context/theme/useTheme";
import axiosInstance from '../../server/AxiosConfig';
import WriteEditor from '../../components/editor/WriteEditor';
import {getAnalysisResult} from '../../service/codeAnalysis/analysisApi';
import {getSmellKeyword} from '../../utils/codeAnalysisUtils';
import hljs from 'highlight.js';

const CodeboardWrite = () => {
  const {analysisId} = useParams();
  const navigate = useNavigate();
  const {theme} = useTheme();
  const codeViewerRef = useRef(null);

  // 분석 결과 상태
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // highlight.js 테마 관리
  useEffect(() => {
    const loadHljsTheme = (darkMode) => {
      document.querySelectorAll('link[data-hljs-theme]').forEach(el => el.remove());
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.hljsTheme = 'true';
      link.href = darkMode 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      document.head.appendChild(link);
    };

    loadHljsTheme(theme === 'dark');

    return () => {
      document.querySelectorAll('link[data-hljs-theme]').forEach(el => el.remove());
    };
  }, [theme]);

  // 파일 확장자로 언어 감지
  const detectLanguage = (filePath) => {
    if (!filePath) return 'plaintext';
    const ext = filePath.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return langMap[ext] || 'plaintext';
  };

  // 코드 하이라이팅 적용
  useEffect(() => {
    if (!codeViewerRef.current || !fileContent) return;

    const timer = setTimeout(() => {
      codeViewerRef.current.querySelectorAll('pre code').forEach((block) => {
        block.classList.remove('hljs');
        delete block.dataset.highlighted;
        hljs.highlightElement(block);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [fileContent, theme]);

  // 분석 결과 로드
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setIsLoading(true);
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
              params: {path: data.filePath}
            });
            setFileContent(contentRes.data.content);
          } catch (contentErr) {
            console.error("Failed to load file content:", contentErr);
            setFileContent("// 파일 내용을 불러올 수 없습니다.");
          }
        }
      } catch (err) {
        setError("분석 결과를 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalysis();
  }, [analysisId]);

  const handleSubmit = ({title, content, tags}) => {
    const blocks = [{
      id: `block-${Date.now()}`,
      type: "tiptap",
      content: content,
      order: 0
    }];

    console.log("📤 전송할 데이터:", {
      codeboardTitle: title,
      blocks: blocks,
      tags: tags || [],
      analysisId: analysisId
    });

    axiosInstance
      .post("/codeboard", {
        codeboardTitle: title,
        blocks: blocks,
        tags: tags || [],
        analysisId: analysisId
      })
      .then((response) => {
        console.log("✅ 응답:", response.data);
        const codeboardId = response.data.data?.codeboardId || response.data.codeboardId;
        navigate(`/codeboard/${codeboardId}`);
      })
      .catch((err) => {
        console.error("등록 실패:", err);
        console.error("에러 상세:", err.response?.data);
        alert("게시글 등록에 실패했습니다.");
      });
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#131313]' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>분석 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !analysisResult) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#131313]' : 'bg-white'}`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {error || "분석 결과를 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => navigate('/codeAnalysis')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            코드분석 홈으로
          </button>
        </div>
      </div>
    );
  }

  const language = detectLanguage(analysisResult.filePath);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#131313]' : 'bg-white'}`}>
      {/* 상단 헤더 */}
      <div
        className={`shadow-sm border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className={`transition-colors ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                ← 뒤로가기
              </button>
              <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>|</span>
              <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                게시글 작성
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 왼쪽 패널: 코드 뷰어 + 분석 결과 */}
          <div className="space-y-6">
            {/* 코드 뷰어 */}
            <div
              className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
              ref={codeViewerRef}
            >
              {/* 헤더 */}
              <div
                className={`px-4 py-2 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {analysisResult.filePath?.split('/').pop()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                    {language}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fileContent);
                    alert("코드가 클립보드에 복사되었습니다.");
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  복사
                </button>
              </div>

              {/* 코드 영역 - hljs 사용 */}
              <div className="overflow-auto" style={{maxHeight: '500px'}}>
                <pre style={{ margin: 0, backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f6f8fa' }}>
                  <code className={`language-${language}`} style={{
                    display: 'block',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    fontFamily: 'monospace'
                  }}>
                    {fileContent}
                  </code>
                </pre>
              </div>
            </div>

            {/* 분석 결과 */}
            <div
              className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>

              {/* 헤더 */}
              <div
                className={`px-4 py-2 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  분석 결과
                </span>
                {analysisResult && (() => {
                  const score = analysisResult.aiScore;
                  let colorClass = '';

                  if (score >= 80) {
                    colorClass = theme === 'dark'
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-green-50 text-green-700 border border-green-200';
                  } else if (score >= 60) {
                    colorClass = theme === 'dark'
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                      : 'bg-blue-50 text-blue-700 border border-blue-200';
                  } else if (score >= 40) {
                    colorClass = theme === 'dark'
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200';
                  } else {
                    colorClass = theme === 'dark'
                      ? 'bg-red-900/30 text-red-300 border border-red-700'
                      : 'bg-red-50 text-red-700 border border-red-200';
                  }

                  return (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
                      {getSmellKeyword(score).text}
                    </span>
                  );
                })()}
              </div>

              {/* 내용 */}
              <div className="p-4 space-y-4 overflow-auto" style={{maxHeight: '600px'}}>
                {analysisResult && (
                  <>
                    {/* Code Smells */}
                    {analysisResult.codeSmells && (typeof analysisResult.codeSmells === 'string' ? JSON.parse(analysisResult.codeSmells) : analysisResult.codeSmells).length > 0 && (
                      <div>
                        <h3
                          className={`text-sm font-semibold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"/>
                          </svg>
                          발견된 문제점
                        </h3>
                        <div className="space-y-2">
                          {(typeof analysisResult.codeSmells === 'string' ? JSON.parse(analysisResult.codeSmells) : analysisResult.codeSmells).map((smell, idx) => (
                            <div key={idx}
                                 className={`p-3 border rounded ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                              <div
                                className={`font-medium text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>{smell.name}</div>
                              <div
                                className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{smell.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {analysisResult.suggestions && (typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).length > 0 && (
                      <div>
                        <h3
                          className={`text-sm font-semibold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                  clipRule="evenodd"/>
                          </svg>
                          개선 제안
                        </h3>
                        <div className="space-y-3">
                          {(typeof analysisResult.suggestions === 'string' ? JSON.parse(analysisResult.suggestions) : analysisResult.suggestions).map((suggestion, idx) => (
                            <div key={idx}
                                 className={`border rounded overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                              <div
                                className={`px-3 py-2 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <span
                                  className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>제안 #{idx + 1}</span>
                              </div>
                              <div className="p-3 space-y-2">
                                {suggestion.problematicSnippet && (
                                  <div>
                                    <div
                                      className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>변경
                                      전:
                                    </div>
                                    <pre
                                      className={`p-2 rounded text-xs overflow-x-auto font-mono ${theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
                                      {suggestion.problematicSnippet || suggestion.problematicCode}
                                    </pre>
                                  </div>
                                )}
                                {suggestion.proposedReplacement && (
                                  <div>
                                    <div
                                      className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>변경
                                      후:
                                    </div>
                                    <pre
                                      className={`p-2 rounded text-xs overflow-x-auto font-mono ${theme === 'dark' ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 패널: 글쓰기 영역 */}
          <div className="space-y-6">
            <WriteEditor
              onSubmit={handleSubmit}
              toolbarType="codeboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeboardWrite;