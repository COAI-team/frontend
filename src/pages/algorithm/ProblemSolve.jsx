import React, { useState, useEffect } from 'react';
import NavBar from '../../components/layout/NavBar';

const ProblemSolve = () => {
  const [code, setCode] = useState('// Type some code ->');
  const [language, setLanguage] = useState('javascript');
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30분
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTracking, setIsTracking] = useState(true);

  const problemData = {
    number: "#1234",
    title: "문제",
    description: `Company | Product Designer
Aug 2022 - Present
collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

Company | Product Designer
Month 2021 - Present
collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

Company | Product Designer
Month 2020 - Present
collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.

Company | Product Designer
Month 2022 - Present
collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.`
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = async () => {
    if (!isSubmitting) {
      await handleSubmit(true);
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('결과 페이지로 이동합니다.');
    }, 2000);
  };

  // 인라인 스타일 정의
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#161513',
    fontFamily: "'Inter', sans-serif"
  };

  const mainContainerStyle = {
    width: '1314px',
    height: '904px',
    background: 'rgba(24, 24, 27, 0.2)',
    border: '1px solid #27272A',
    borderRadius: '8px'
  };

  const headerStyle = {
    padding: '20px 20px 40px',
    gap: '10px',
    height: '107px',
    borderBottom: '1px solid #27272A'
  };

  const titleStyle = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: '18px',
    lineHeight: '22px',
    color: '#FAFAFA'
  };

  const statusIndicatorStyle = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: '12px',
    lineHeight: '15px',
    color: '#BFBFBF'
  };

  const eyeTrackingDotStyle = {
    width: '16px',
    height: '16px',
    background: '#FFFFFF',
    border: '5px solid #FF0000',
    borderRadius: '50%'
  };

  const timeLimitDotStyle = {
    width: '16px',
    height: '16px',
    background: '#FFFFFF',
    border: '5px solid #E8BC06',
    borderRadius: '50%'
  };

  const tagStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '15px',
    color: '#71717A'
  };

  const problemSectionStyle = {
    fontSize: '16.343px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '-0.02em',
    color: '#FFFFFF'
  };

  const companyHeaderStyle = {
    fontSize: '12.7112px',
    fontWeight: 500,
    lineHeight: '142.02%',
    letterSpacing: '-0.02em',
    textTransform: 'capitalize',
    color: '#FFFFFF'
  };

  const companyDateStyle = {
    fontSize: '10.8953px',
    fontWeight: 400,
    lineHeight: '13px',
    textTransform: 'capitalize',
    color: '#AEAEAE'
  };

  const companyDescStyle = {
    fontSize: '9.98738px',
    fontWeight: 400,
    lineHeight: '142.02%',
    letterSpacing: '-0.02em',
    textTransform: 'lowercase',
    color: '#AEAEAE'
  };

  const codeEditorStyle = {
    background: '#1C1C1C',
    backdropFilter: 'blur(20px)',
    fontFamily: "'Source Code Pro', 'Courier New', monospace",
    fontSize: '14px',
    lineHeight: '20px',
    fontFeatureSettings: "'ss01' on, 'cv01' on, 'cv11' on"
  };

  const buttonGradientStyle = {
    background: 'linear-gradient(99.15deg, #FFF1B7 0.37%, #FF92CC 61.12%, #CE69F7 99.24%)',
    color: '#042F2E',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    fontWeight: 500
  };

  return (
    <div style={containerStyle}>
      <NavBar />

      <div className="flex justify-center pt-4">
        <div style={mainContainerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div className="flex items-center justify-between">
              <h1 style={titleStyle}>
                {problemData.number} {problemData.title}
              </h1>

              <div className="flex items-center gap-8">
                {/* Eye Tracking 상태 */}
                <div className="flex items-center gap-2">
                  <div style={eyeTrackingDotStyle}></div>
                  <span style={statusIndicatorStyle}>
                    Eye Tracking {formatTime(timeLeft)}
                  </span>
                </div>

                {/* 제한시간 */}
                <div className="flex items-center gap-2">
                  <div style={timeLimitDotStyle}></div>
                  <span style={statusIndicatorStyle}>
                    제한시간 00:32:09
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div style={{
                width: '16px',
                height: '16px',
                border: '1.6px solid #FF90CD'
              }}></div>
              <span style={tagStyle}>
                난이도 / 언어 / 유형 / 제한시간
              </span>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className="flex flex-1">
            {/* 문제 설명 패널 */}
            <div className="w-1/2 flex flex-col" style={{ borderRight: '1px solid #27272A' }}>
              <div className="px-6 py-3" style={{ borderBottom: '1px solid #27272A' }}>
                <h3 style={problemSectionStyle}>문제 설명</h3>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Company sections */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={companyHeaderStyle}>Company</span>
                      <div style={{
                        width: '0px',
                        height: '15.44px',
                        border: '0.907943px solid #E8E8E8'
                      }}></div>
                      <span style={companyHeaderStyle}>Product Designer</span>
                    </div>
                    <div style={companyDateStyle}>Aug 2022 - Present</div>
                    <div style={companyDescStyle} className="mt-2">
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={companyHeaderStyle}>Company</span>
                      <div style={{
                        width: '0px',
                        height: '15.44px',
                        border: '0.907943px solid #E8E8E8'
                      }}></div>
                      <span style={companyHeaderStyle}>Product Designer</span>
                    </div>
                    <div style={companyDateStyle}>month 2021 - Present</div>
                    <div style={companyDescStyle} className="mt-2">
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={companyHeaderStyle}>Company</span>
                      <div style={{
                        width: '0px',
                        height: '15.44px',
                        border: '0.907943px solid #E8E8E8'
                      }}></div>
                      <span style={companyHeaderStyle}>Product Designer</span>
                    </div>
                    <div style={companyDateStyle}>Month 2020 - Present</div>
                    <div style={companyDescStyle} className="mt-2">
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={companyHeaderStyle}>Company</span>
                      <div style={{
                        width: '0px',
                        height: '15.44px',
                        border: '0.907943px solid #E8E8E8'
                      }}></div>
                      <span style={companyHeaderStyle}>Product Designer</span>
                    </div>
                    <div style={companyDateStyle}>Month 2022 - Present</div>
                    <div style={companyDescStyle} className="mt-2">
                      collaborated with cross-functional teams including product managers and developers to create user-friendly interfaces for web applications, and developers to create user-friendly interfaces for web applications.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 코드 에디터 패널 */}
            <div className="w-1/2 flex flex-col">
              {/* 언어 선택 및 도구바 */}
              <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #27272A' }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-700 rounded transition-colors text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-700 rounded transition-colors text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m0 0l-3 3m3-3v4m6-4h4a1 1 0 011 1v4m0 0l-3-3m3 3h-4m-6 4v4a1 1 0 01-1 1H4m0 0l3-3m-3 3h4m6 0a1 1 0 001-1v-4m0 0l3 3m-3-3h4"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* 코드 에디터 */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 p-4" style={codeEditorStyle}>
                  <div className="flex h-full">
                    {/* 라인 넘버 */}
                    <div className="pr-4 select-none" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>
                      {Array.from({ length: 25 }, (_, i) => (
                        <div
                          key={i + 1}
                          style={{
                            fontFamily: "'Source Code Pro', monospace",
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontFeatureSettings: "'ss01' on, 'cv01' on, 'cv11' on"
                          }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* 코드 입력 영역 */}
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none resize-none"
                      style={{
                        fontFamily: "'Source Code Pro', monospace",
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontFeatureSettings: "'ss01' on, 'cv01' on, 'cv11' on"
                      }}
                      placeholder="여기에 코드를 작성하세요..."
                    />
                  </div>
                </div>

                {/* 코드 복사 및 전체화면 버튼 */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="p-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button className="p-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m0 0l-3 3m3-3v4"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* 실행 결과 */}
              <div className="border-t p-4" style={{
                height: '80px',
                background: '#09090B',
                borderTop: '1px solid #27272A'
              }}>
                <h4 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '15px',
                  color: '#71717A'
                }} className="mb-2">
                  실행결과
                </h4>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '15px',
                  color: '#71717A'
                }}>
                  실행결과가 여기에 표시됩니다요.
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="border-t p-4" style={{
                background: '#09090B',
                borderTop: '1px solid #27272A'
              }}>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCode('// 코드를 작성하세요')}
                    className="px-6 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#71717A'
                    }}
                  >
                    초기화
                  </button>

                  <button
                    className="px-6 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#71717A'
                    }}
                  >
                    코드 실행
                  </button>

                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || timeLeft === 0}
                    className="px-8 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={buttonGradientStyle}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        제출중
                      </div>
                    ) : (
                      '✓ 제출 후 채점하기'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 부정행위 경고 (임시) */}
      {Math.random() > 0.7 && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg animate-pulse">
          <div className="font-semibold">⚠️ 부정행위 감지</div>
          <div className="text-sm">
            시선 이탈이 감지되었습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSolve;