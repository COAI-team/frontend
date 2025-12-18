import React, {useEffect, useState} from 'react';
import {Link, useLocation, useParams} from 'react-router-dom';
import {getProblem} from '../../service/algorithm/algorithmApi';
import SharedSolutions from './SharedSolutions';
import '../../styles/ProblemDetail.css';

const ProblemDetail = () => {
  const {problemId} = useParams();
  const location = useLocation();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'description');

  // ===== 마크다운 렌더링 함수 =====
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <div className="formatted-text">
        {lines.map((line, lineIndex) => {
          // 빈 줄 처리
          if (!line.trim()) {
            return <div key={lineIndex} className="formatted-text-empty"/>;
          }

          // 리스트 아이템 (- 또는 * 로 시작)
          const listMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
          if (listMatch) {
            const [, indent, , content] = listMatch;
            const indentLevel = Math.floor(indent.length / 2);
            return (
              <div key={lineIndex} className="formatted-list-item" style={{marginLeft: `${indentLevel * 16}px`}}>
                <span className="formatted-text-bullet">•</span>
                <span>{renderInlineFormatting(content)}</span>
              </div>
            );
          }

          // 숫자 리스트 (1. 2. 3. 등)
          const numListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
          if (numListMatch) {
            const [, indent, num, content] = numListMatch;
            const indentLevel = Math.floor(indent.length / 2);
            return (
              <div key={lineIndex} className="formatted-list-item" style={{marginLeft: `${indentLevel * 16}px`}}>
                <span className="formatted-text-number">{num}.</span>
                <span>{renderInlineFormatting(content)}</span>
              </div>
            );
          }

          // 일반 줄
          return <div key={lineIndex} className="formatted-text-line">{renderInlineFormatting(line)}</div>;
        })}
      </div>
    );
  };

  // 인라인 포맷팅 처리 (**bold**, `code`)
  const renderInlineFormatting = (text) => {
    if (!text) return null;

    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, index) => {
      // **bold** 패턴
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="formatted-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // `code` 패턴
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="formatted-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      // 일반 텍스트
      return <span key={index}>{part}</span>;
    });
  };

  // 문제 설명 파싱 (섹션별 분리)
  const parseProblemDescription = (description) => {
    if (!description) return null;

    const sections = {
      description: '',
      input: '',
      output: '',
      constraints: '',
    };

    // 섹션 구분자 패턴
    const patterns = {
      input: /(?:^|\n)(?:\*\*)?(?:입력|Input)(?:\*\*)?\s*[:：]?\s*\n?/i,
      output: /(?:^|\n)(?:\*\*)?(?:출력|Output)(?:\*\*)?\s*[:：]?\s*\n?/i,
      constraints: /(?:^|\n)(?:\*\*)?(?:제한\s*사항|제한|조건|제약|Constraints?)(?:\*\*)?\s*(?::|：)?\s*\n?/i,
    };

    let remaining = description;
    let firstSectionStart = remaining.length;

    // 각 섹션의 시작 위치 찾기
    const sectionPositions = [];
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = remaining.match(pattern);
      if (match) {
        const position = remaining.indexOf(match[0]);
        sectionPositions.push({key, position, match: match[0]});
        if (position < firstSectionStart) {
          firstSectionStart = position;
        }
      }
    }

    // 문제 설명 (첫 번째 섹션 이전의 텍스트)
    sections.description = remaining.substring(0, firstSectionStart).trim();

    // 섹션 위치순 정렬
    sectionPositions.sort((a, b) => a.position - b.position);

    // 각 섹션 내용 추출
    for (let i = 0; i < sectionPositions.length; i++) {
      const current = sectionPositions[i];
      const nextPosition = i + 1 < sectionPositions.length
        ? sectionPositions[i + 1].position
        : remaining.length;

      sections[current.key] = remaining
        .substring(current.position + current.match.length, nextPosition)
        .trim();
    }

    return sections;
  };

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProblem(problemId);
        if (res.error) {
          setError(res.message || '문제를 불러오는데 실패했습니다.');
        } else {
          setProblem(res.Data || res.data || res);
        }
      } catch (err) {
        console.error('문제 상세 조회 에러:', err);
        setError('서버에 연결할 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  const getDifficultyBadgeClass = (diff) => {
    const classes = {
      'BRONZE': 'badge-bronze',
      'SILVER': 'badge-silver',
      'GOLD': 'badge-gold',
      'PLATINUM': 'badge-platinum'
    };
    return classes[diff] || 'badge-silver';
  };

  const getProblemTypeBadgeClass = (type) => {
    return type === 'SQL' ? 'badge-database' : 'badge-algorithm';
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-content">
          <p className="error-text">⚠️ {error}</p>
          <Link to="/algorithm/problems" className="error-button">
            문제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="problem-detail-container">
      <div className="problem-detail-wrapper">

        {/* 상단 네비게이션 */}
        <div>
          <Link to="/algorithm/problems" className="back-link">
            <span>←</span>
            <span>목록으로 돌아가기</span>
          </Link>
        </div>

        {/* 문제 헤더 */}
        <div className="problem-header-card">
          <div className="problem-header-top">
            <div className="problem-header-left">
              <div className="problem-badges">
                                <span className={`badge ${getDifficultyBadgeClass(problem.algoProblemDifficulty)}`}>
                                    {problem.algoProblemDifficulty}
                                </span>
                <span className={`badge ${getProblemTypeBadgeClass(problem.problemType)}`}>
                                    {problem.problemType === 'SQL' ? 'DATABASE' : 'ALGORITHM'}
                                </span>
                <span className="problem-id">#{problem.algoProblemId}</span>
              </div>
              <h1 className="problem-detail-title">{problem.algoProblemTitle}</h1>
            </div>
            <div className="problem-header-right">
              <Link
                to={`/algorithm/problems/${problemId}/solve`}
                className="solve-button"
              >
                <span>🚀 문제 풀기</span>
              </Link>
            </div>
          </div>

          <div className="problem-meta">
            <div className="problem-meta-item">
              <span className="problem-meta-label">시간 제한:</span>
              <span>{problem.timelimit || 1000}ms</span>
            </div>
            <div className="problem-meta-item">
              <span className="problem-meta-label">메모리 제한:</span>
              <span>{problem.memorylimit || 256}MB</span>
            </div>
            <div className="problem-meta-item">
              <span className="problem-meta-label">출처:</span>
              <span>{problem.algoProblemSource || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab('description')}
              className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
            >
              문제 설명
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`tab-button ${activeTab === 'solutions' ? 'active' : ''}`}
            >
              다른 사람의 풀이
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'description' ? (
          <>
            {/* 문제 설명 (마크다운 파싱 적용) */}
            {(() => {
              const parsedSections = parseProblemDescription(problem.algoProblemDescription);
              return (
                <>
                  {/* 문제 설명 */}
                  <div className="section-card">
                    <h2 className="section-title">문제 설명</h2>
                    <div className="section-content">
                      {parsedSections?.description
                        ? renderFormattedText(parsedSections.description)
                        : renderFormattedText(problem.algoProblemDescription)}
                    </div>
                  </div>

                  {/* 입력 형식 */}
                  {parsedSections?.input && (
                    <div className="section-card">
                      <h2 className="section-title">입력</h2>
                      <div className="section-content">
                        {renderFormattedText(parsedSections.input)}
                      </div>
                    </div>
                  )}

                  {/* 출력 형식 */}
                  {parsedSections?.output && (
                    <div className="section-card">
                      <h2 className="section-title">출력</h2>
                      <div className="section-content">
                        {renderFormattedText(parsedSections.output)}
                      </div>
                    </div>
                  )}

                  {/* 제한 사항 */}
                  {parsedSections?.constraints && (
                    <div className="constraints-card">
                      <h2 className="section-title">제한 사항</h2>
                      <div className="section-content">
                        {renderFormattedText(parsedSections.constraints)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* 예제 입출력 */}
            {problem.testcases && problem.testcases.length > 0 && (
              <div className="examples-section">
                <h2 className="section-title">예제</h2>
                <div className="examples-container">
                  {problem.testcases.filter(tc => tc.isSample).map((tc, idx) => (
                    <div key={idx} className="example-grid">
                      <div className="example-item">
                        <h3 className="example-label">예제 입력 {idx + 1}</h3>
                        <pre className="example-code">
                                                    {tc.inputData || tc.input}
                                                </pre>
                      </div>
                      <div className="example-item">
                        <h3 className="example-label">예제 출력 {idx + 1}</h3>
                        <pre className="example-code">
                                                    {tc.expectedOutput || tc.output}
                                                </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <SharedSolutions problemId={problemId}/>
        )}

      </div>
    </div>
  );
};

export default ProblemDetail;
