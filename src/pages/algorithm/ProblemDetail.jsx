import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProblem } from '../../service/algorithm/algorithmApi';
import SharedSolutions from './SharedSolutions';
import { extractPureDescription, renderFormattedText } from '../../components/algorithm/problem/markdownUtils';
import '../../styles/ProblemDetail.css';

const ProblemDetail = () => {
    const { problemId } = useParams();
    const location = useLocation();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'description');

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
                                {/* 문제 태그 - 알고리즘 유형 오른쪽에 표시 */}
                                {problem.algoProblemTags && (() => {
                                    try {
                                        const tags = JSON.parse(problem.algoProblemTags);
                                        return tags.map((tag, idx) => (
                                            <span key={idx} className="badge badge-tag">
                                                {tag}
                                            </span>
                                        ));
                                    } catch {
                                        return <span className="badge badge-tag">{problem.algoProblemTags}</span>;
                                    }
                                })()}
                                <span className="problem-id">#{problem.algoProblemId}</span>
                            </div>
                            <h1 className="problem-detail-title">{problem.algoProblemTitle}</h1>
                        </div>
                        <div className="problem-header-right">
                            <Link
                                to={`/algorithm/problems/${problemId}/solve`}
                                className="solve-button"
                            >
                                🚀 문제 풀기
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
                    <div className="problem-content-area">
                        {/* 구조화된 필드가 있는지 확인 */}
                        {(problem.inputFormat || problem.outputFormat || problem.constraints ||
                          (problem.testcases && problem.testcases.filter(tc => tc.isSample).length > 0)) ? (
                            <>
                                {/* 문제 설명 - DB의 ALGO_PROBLEM_DESCRIPTION 컬럼 (순수 스토리만) */}
                                {/* 별도 inputFormat 필드가 있으면 description에서 "**입력**" 앞부분만 추출 */}
                                <div className="section-card section-description">
                                    <div className="section-header">
                                        <span className="section-icon">📋</span>
                                        <h2 className="section-title">문제 설명</h2>
                                    </div>
                                    <div className="section-content">
                                        {renderFormattedText(
                                            problem.inputFormat
                                                ? extractPureDescription(problem.algoProblemDescription)
                                                : problem.algoProblemDescription
                                        )}
                                    </div>
                                </div>

                                {/* 입력/출력 그리드 - DB의 INPUT_FORMAT, OUTPUT_FORMAT 컬럼 */}
                                {(problem.inputFormat || problem.outputFormat) && (
                                    <div className="io-grid">
                                        {problem.inputFormat && (
                                            <div className="section-card section-input">
                                                <div className="section-header">
                                                    <span className="section-icon">📥</span>
                                                    <h2 className="section-title">입력</h2>
                                                </div>
                                                <div className="section-content">
                                                    {renderFormattedText(problem.inputFormat)}
                                                </div>
                                            </div>
                                        )}
                                        {problem.outputFormat && (
                                            <div className="section-card section-output">
                                                <div className="section-header">
                                                    <span className="section-icon">📤</span>
                                                    <h2 className="section-title">출력</h2>
                                                </div>
                                                <div className="section-content">
                                                    {renderFormattedText(problem.outputFormat)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 제한 사항 - DB의 CONSTRAINTS 컬럼 */}
                                {problem.constraints && (
                                    <div className="section-card section-constraints">
                                        <div className="section-header">
                                            <span className="section-icon">⚠️</span>
                                            <h2 className="section-title">제한 사항</h2>
                                        </div>
                                        <div className="section-content">
                                            {renderFormattedText(problem.constraints)}
                                        </div>
                                    </div>
                                )}

                                {/* 예제 입출력 - DB의 ALGO_TESTCASES 테이블 (isSample=true인 것들) */}
                                {problem.testcases && problem.testcases.filter(tc => tc.isSample).length > 0 && (
                                    <div className="examples-section">
                                        <h2 className="section-title">예제 입출력</h2>
                                        <div className="examples-container">
                                            {problem.testcases.filter(tc => tc.isSample).map((tc, idx) => (
                                                <div key={idx} className="example-grid">
                                                    <div className="example-item">
                                                        <h3 className="example-label">📝 예제 입력 {idx + 1}</h3>
                                                        <pre className="example-code">
                                                            {tc.inputData || tc.input}
                                                        </pre>
                                                    </div>
                                                    <div className="example-item">
                                                        <h3 className="example-label">✅ 예제 출력 {idx + 1}</h3>
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
                            /* 구조화된 필드가 없으면 description 전체를 표시 */
                            <div className="section-card section-description">
                                <div className="section-header">
                                    <span className="section-icon">📋</span>
                                    <h2 className="section-title">문제 설명</h2>
                                </div>
                                <div className="section-content">
                                    {renderFormattedText(problem.algoProblemDescription)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <SharedSolutions problemId={problemId} />
                )}

            </div>
        </div>
    );
};

export default ProblemDetail;