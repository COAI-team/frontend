import React, { useState } from 'react';
import NavBar from '../../components/common/NavBar';

const ProblemResult = () => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [githubCommit, setGithubCommit] = useState(true);
  const [resultPublic, setResultPublic] = useState(true);
  const [shareToBoard, setShareToBoard] = useState(true);

  // 예시 결과 데이터
  const result = {
    problemId: "1234",
    problemTitle: "#1234 문제",
    solvedCount: 233,
    totalSubmissions: 501,
    judgeResult: "ACCEPTED",
    difficulty: "HARD",
    language: "Python",
    category: "DP",
    timeLimit: "2초",
    scores: {
      total: { current: 2, max: 6, unit: "TB" },
      memory: { current: 23, max: 50, unit: "TB" },
      focus: { current: 2, max: 6, unit: "TB" },
      timeElapsed: { current: 23, max: 50, unit: "TB" }
    }
  };

  const handleShare = async (isPublic) => {
    setIsSharing(true);
    setTimeout(() => {
      setShowShareModal(false);
      setIsSharing(false);
      alert(isPublic ? '결과가 공개되었습니다!' : '결과가 비공개로 저장되었습니다!');
    }, 1000);
  };

  const handleToggle = (setter, value) => {
    setter(!value);
  };

  // Toggle 컴포넌트
  const Toggle = ({ enabled, onToggle }) => (
    <div
      className="relative cursor-pointer"
      style={{ width: '39.65px', height: '19.82px' }}
      onClick={onToggle}
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-200"
        style={{
          background: enabled
            ? 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)'
            : '#6B7280',
          borderRadius: '12px'
        }}
      />
      {/* Toggle Handle */}
      <div
        className="absolute transition-transform duration-200"
        style={{
          width: '22px',
          height: '19.32px',
          top: '0.25px',
          left: enabled ? '17.65px' : '0px',
          background: enabled
            ? 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)'
            : '#9CA3AF',
          borderRadius: '12px'
        }}
      />
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: enabled
            ? 'radial-gradient(50% 50% at 29.5% 249.32%, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 81.25%, rgba(255, 255, 255, 0.2) 100%)'
            : 'none',
          borderRadius: '12px'
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#161513]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Container - 이미지와 동일한 중앙 정렬 레이아웃 */}
      <div className="flex justify-center pt-4 px-4">
        <div
          className="relative"
          style={{
            width: '956px',
            height: '904px',
            background: 'rgba(24, 24, 27, 0.2)',
            border: '1px solid #27272A',
            borderRadius: '8px'
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col items-start gap-2.5 relative"
            style={{
              padding: '20px 20px 40px',
              height: '107px'
            }}
          >
            <div className="flex items-center justify-between w-full">
              <h1
                className="font-semibold text-zinc-50"
                style={{
                  fontSize: '18px',
                  lineHeight: '22px'
                }}
              >
                {result.problemTitle}
              </h1>

              {/* More Options Button */}
              <button
                className="flex items-center justify-center bg-zinc-900/20 border border-zinc-800"
                style={{
                  width: '30px',
                  height: '28px',
                  borderRadius: '6px',
                  padding: '6px 7px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-zinc-300">
                  <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="1.33"/>
                  <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="1.33"/>
                  <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="1.33"/>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 text-zinc-500" style={{ fontSize: '12px', lineHeight: '15px' }}>
              <span>맞힌사람 {result.solvedCount}</span>
              <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
              <span>제출한 사람 {result.totalSubmissions}</span>
            </div>
          </div>

          {/* Problem Info Bar */}
          <div
            className="flex items-center px-5 py-4 gap-2 bg-zinc-950 border-t border-zinc-800"
            style={{ height: '48px', padding: '10px' }}
          >
            <div className="w-4 h-4" style={{ border: '1.6px solid #FF90CD' }}></div>
            <span className="text-xs text-zinc-500" style={{ fontSize: '12px', lineHeight: '15px' }}>
              난이도 / 언어 / 유형 / 제한시간
            </span>
          </div>

          {/* Main Content Area */}
          <div className="absolute left-7 top-[187px] flex gap-6">
            {/* Left Content - 채점 결과 */}
            <div
              className="relative"
              style={{
                width: '602px',
                height: '687px',
                background: 'rgba(24, 24, 27, 0.2)',
                border: '1px solid #27272A',
                borderRadius: '8px'
              }}
            >
              {/* Results Header */}
              <div className="p-5" style={{ height: '214px' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
                     style={{ padding: '10px' }}
                >
                  <div className="flex items-center gap-2">
                    <h2
                      className="font-semibold text-white"
                      style={{ fontSize: '18px', lineHeight: '22px' }}
                    >
                      채점 결과
                    </h2>
                    <div
                      className="px-2 py-1 bg-[#533146]"
                      style={{ borderRadius: '12px' }}
                    >
                      <span
                        className="font-semibold text-[#FF90CD]"
                        style={{ fontSize: '10px', lineHeight: '12px'}}
                      >
                        냄새 요약(킁킁)
                      </span>
                    </div>
                  </div>

                  <button
                    className="flex items-center px-2 py-1 bg-zinc-800 border border-zinc-700"
                    style={{
                      borderRadius: '12px',
                      width: '118px',
                      height: '23px'
                    }}
                  >
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="1"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1"/>
                    </svg>
                    <span
                      className="font-medium text-zinc-50"
                      style={{ fontSize: '12px', lineHeight: '15px' }}
                    >
                      내 히스토리 보기
                    </span>
                  </button>
                </div>

                {/* Score Metrics - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Score */}
                  <div style={{ width: '260px', height: '32px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '13px', lineHeight: '16px' }}
                      >
                        점수
                      </span>
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '12px', lineHeight: '15px' }}
                      >
                        {result.scores.total.current}{result.scores.total.unit} / {result.scores.total.max}{result.scores.total.unit}
                      </span>
                    </div>
                    <div className="relative w-full h-2">
                      <div
                        className="absolute inset-0 bg-zinc-900"
                        style={{ borderRadius: '42px' }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2"
                        style={{
                          width: '160px',
                          background: 'linear-gradient(90deg, #FFF1B7 0%, #FF92CC 61%, #CE69F7 100%)',
                          borderRadius: '42px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Focus */}
                  <div style={{ width: '260px', height: '32px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '13px', lineHeight: '16px' }}
                      >
                        집중도
                      </span>
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '12px', lineHeight: '15px' }}
                      >
                        {result.scores.focus.current}{result.scores.focus.unit} / {result.scores.focus.max}{result.scores.focus.unit}
                      </span>
                    </div>
                    <div className="relative w-full h-2">
                      <div
                        className="absolute inset-0 bg-zinc-900"
                        style={{ borderRadius: '42px' }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2"
                        style={{
                          width: '160px',
                          background: 'linear-gradient(90deg, #FFF1B7 0%, #FF92CC 61%, #CE69F7 100%)',
                          borderRadius: '42px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Memory */}
                  <div style={{ width: '260px', height: '32px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '13px', lineHeight: '16px' }}
                      >
                        메모리
                      </span>
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '12px', lineHeight: '15px' }}
                      >
                        {result.scores.memory.current}{result.scores.memory.unit} / {result.scores.memory.max}{result.scores.memory.unit}
                      </span>
                    </div>
                    <div className="relative w-full h-2">
                      <div
                        className="absolute inset-0 bg-zinc-900"
                        style={{ borderRadius: '42px' }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2"
                        style={{
                          width: '160px',
                          background: 'linear-gradient(90deg, #FFF1B7 0%, #FF92CC 61%, #CE69F7 100%)',
                          borderRadius: '42px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Elapsed */}
                  <div style={{ width: '260px', height: '32px' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '13px', lineHeight: '16px' }}
                      >
                        걸린 시간
                      </span>
                      <span
                        className="font-medium text-zinc-300"
                        style={{ fontSize: '12px', lineHeight: '15px' }}
                      >
                        {result.scores.timeElapsed.current}{result.scores.timeElapsed.unit} / {result.scores.timeElapsed.max}{result.scores.timeElapsed.unit}
                      </span>
                    </div>
                    <div className="relative w-full h-2">
                      <div
                        className="absolute inset-0 bg-zinc-900"
                        style={{ borderRadius: '42px' }}
                      />
                      <div
                        className="absolute top-0 left-0 h-2"
                        style={{
                          width: '160px',
                          background: 'linear-gradient(90deg, #FFF1B7 0%, #FF92CC 61%, #CE69F7 100%)',
                          borderRadius: '42px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Code Evaluation Divider */}
              <div
                className="px-5 py-2 bg-zinc-950 border-t border-zinc-800"
                style={{ height: '32px' }}
              >
                <span
                  className="text-zinc-500"
                  style={{ fontSize: '12px', lineHeight: '16px' }}
                >
                  ai 코드 평가 .. 킁킁
                </span>
              </div>

              {/* AI Evaluation Results */}
              <div
                className="p-8"
                style={{ height: '454px' }}
              >
                <h3
                  className="font-medium text-white mb-6 tracking-tight"
                  style={{ fontSize: '16.343px', lineHeight: '20px', letterSpacing: '-0.02em' }}
                >
                  ai 코드 평가 결과
                </h3>

                <div className="space-y-5">
                  {/* First Evaluation Item */}
                  <div style={{ width: '270.57px', height: '93.36px' }}>
                    <div className="flex items-center mb-0.5" style={{ gap: '5.45px' }}>
                      <span
                        className="font-medium text-white capitalize"
                        style={{ fontSize: '12.7112px', lineHeight: '142.02%', letterSpacing: '-0.02em' }}
                      >
                        Company
                      </span>
                      <div
                        className="bg-gray-300"
                        style={{ width: '0px', height: '15.44px', border: '0.907943px solid #E8E8E8' }}
                      />
                      <span
                        className="font-medium text-white capitalize"
                        style={{ fontSize: '12.7112px', lineHeight: '142.02%', letterSpacing: '-0.02em' }}
                      >
                        Product Designer
                      </span>
                    </div>
                    <div
                      className="text-gray-400 capitalize mb-2"
                      style={{ fontSize: '10.8953px', lineHeight: '13px' }}
                    >
                      Aug 2022 - Present
                    </div>
                    <div
                      className="text-gray-400 tracking-tight lowercase"
                      style={{
                        fontSize: '9.98738px',
                        lineHeight: '142.02%',
                        letterSpacing: '-0.02em',
                        width: '270.57px',
                        height: '56px'
                      }}
                    >
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>

                  {/* Second Evaluation Item */}
                  <div style={{ width: '270.57px', height: '93.36px' }}>
                    <div className="flex items-center mb-0.5" style={{ gap: '5.45px' }}>
                      <span
                        className="font-medium text-white capitalize"
                        style={{ fontSize: '12.7112px', lineHeight: '142.02%', letterSpacing: '-0.02em' }}
                      >
                        Company
                      </span>
                      <div
                        className="bg-gray-300"
                        style={{ width: '0px', height: '15.44px', border: '0.907943px solid #E8E8E8' }}
                      />
                      <span
                        className="font-medium text-white capitalize"
                        style={{ fontSize: '12.7112px', lineHeight: '142.02%', letterSpacing: '-0.02em' }}
                      >
                        Product Designer
                      </span>
                    </div>
                    <div
                      className="text-gray-400 capitalize mb-2"
                      style={{ fontSize: '10.8953px', lineHeight: '13px' }}
                    >
                      Month 2021 - Present
                    </div>
                    <div
                      className="text-gray-400 tracking-tight lowercase"
                      style={{
                        fontSize: '9.98738px',
                        lineHeight: '142.02%',
                        letterSpacing: '-0.02em',
                        width: '270.57px',
                        height: '56px'
                      }}
                    >
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - 제출 옵션 */}
            <div className="flex flex-col gap-4" style={{ width: '253px' }}>
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  className="flex items-center justify-center font-medium text-teal-950"
                  style={{
                    width: '96px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)',
                    fontSize: '12px',
                    lineHeight: '15px'
                  }}
                  onClick={() => setShowShareModal(true)}
                >
                  <svg className="w-3 h-2 mr-2" viewBox="0 0 12 8" fill="currentColor">
                    <path d="M1.33 4L10.67 4M7.33 1L10.67 4L7.33 7" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  결과 제출
                </button>
              </div>

              {/* Options Panel */}
              <div
                className="relative w-full bg-zinc-900/20 border border-zinc-800"
                style={{
                  height: '145px',
                  borderRadius: '8px'
                }}
              >
                <div className="p-5">
                  <div className="mb-4">
                    <span
                      className="text-zinc-500"
                      style={{ fontSize: '12px', lineHeight: '15px' }}
                    >
                      제출 옵션을 선택하세요.
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* GitHub Auto Commit */}
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold text-zinc-50"
                        style={{ fontSize: '15px', lineHeight: '18px' }}
                      >
                        깃헙에 자동 커밋
                      </span>
                      <Toggle
                        enabled={githubCommit}
                        onToggle={() => handleToggle(setGithubCommit, githubCommit)}
                      />
                    </div>

                    {/* Result Public */}
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold text-zinc-50"
                        style={{ fontSize: '15px', lineHeight: '18px' }}
                      >
                        결과 공개
                      </span>
                      <Toggle
                        enabled={resultPublic}
                        onToggle={() => handleToggle(setResultPublic, resultPublic)}
                      />
                    </div>

                    {/* Share to Board */}
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold text-zinc-50"
                        style={{ fontSize: '15px', lineHeight: '18px' }}
                      >
                        게시판에 공유
                      </span>
                      <Toggle
                        enabled={shareToBoard}
                        onToggle={() => handleToggle(setShareToBoard, shareToBoard)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-white">결과 제출</h3>
            <p className="text-zinc-300 mb-6">
              선택한 옵션으로 결과를 제출하시겠습니까?
            </p>

            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">깃헙 자동 커밋:</span>
                <span className={githubCommit ? "text-green-400" : "text-zinc-500"}>
                  {githubCommit ? "활성화" : "비활성화"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">결과 공개:</span>
                <span className={resultPublic ? "text-green-400" : "text-zinc-500"}>
                  {resultPublic ? "공개" : "비공개"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">게시판 공유:</span>
                <span className={shareToBoard ? "text-green-400" : "text-zinc-500"}>
                  {shareToBoard ? "공유함" : "공유안함"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2 border border-zinc-600 rounded hover:bg-zinc-700 transition-colors text-white"
              >
                취소
              </button>
              <button
                onClick={() => handleShare(resultPublic)}
                disabled={isSharing}
                className="flex-1 py-2 rounded font-semibold transition-colors text-teal-950"
                style={{
                  background: 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)'
                }}
              >
                {isSharing ? '제출 중...' : '결과 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemResult;