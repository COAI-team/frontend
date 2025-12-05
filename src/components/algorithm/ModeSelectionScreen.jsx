import React from 'react';

/**
 * 풀이 모드 선택 화면 컴포넌트
 *
 * 기능:
 * - 기본 모드 / 집중 모드 선택
 * - 풀이 시간 설정
 * - 모드별 기능 안내
 */
const ModeSelectionScreen = ({
  problem,
  problemId,
  selectedMode,
  setSelectedMode,
  customTimeMinutes,
  setCustomTimeMinutes,
  onStartSolving,
  onNavigateBack
}) => {
  const timePresets = [15, 30, 45, 60];

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      {/* 헤더 */}
      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                #{problem?.problemId || problemId} {problem?.title || '문제'}
              </h1>
              <p className="text-sm text-gray-400 mt-1">풀이 모드를 선택해주세요</p>
            </div>
            <button
              onClick={onNavigateBack}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
            >
              목록으로
            </button>
          </div>
        </div>
      </div>

      {/* 모드 선택 컨테이너 */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 시간 설정 */}
          <div className="mb-8 text-center">
            <h2 className="text-lg font-semibold mb-4">풀이 시간 설정</h2>
            <div className="flex items-center justify-center gap-4">
              {timePresets.map(time => (
                <button
                  key={time}
                  onClick={() => setCustomTimeMinutes(time)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    customTimeMinutes === time
                      ? 'bg-purple-600'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  {time}분
                </button>
              ))}
              <div className="flex items-center gap-2 ml-4">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customTimeMinutes}
                  onChange={(e) =>
                    setCustomTimeMinutes(
                      Math.max(1, Math.min(180, parseInt(e.target.value) || 30))
                    )
                  }
                  className="w-20 px-3 py-2 bg-zinc-700 rounded-lg text-center"
                />
                <span className="text-gray-400">분</span>
              </div>
            </div>
          </div>

          {/* 모드 선택 카드 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 기본 모드 */}
            <ModeCard
              icon="📝"
              title="기본 모드"
              description="자유롭게 문제를 풀어보세요"
              features={[
                { text: '타이머 기능 (수동 시작)', enabled: true },
                { text: '자유로운 풀이 환경', enabled: true },
                { text: '시선 추적 없음', enabled: false }
              ]}
              isSelected={selectedMode === 'BASIC'}
              onClick={() => setSelectedMode('BASIC')}
              selectedBorderClass="border-blue-500 bg-blue-900/20"
            />

            {/* 집중 모드 */}
            <ModeCard
              icon="👁️"
              title="집중 모드"
              description="시선 추적으로 집중력을 관리하세요"
              features={[
                { text: '타이머 자동 시작', enabled: true },
                { text: '시선 추적 (웹캠 필요)', enabled: true },
                { text: '집중도 모니터링', enabled: true }
              ]}
              isSelected={selectedMode === 'FOCUS'}
              onClick={() => setSelectedMode('FOCUS')}
              selectedBorderClass="border-purple-500 bg-purple-900/20"
              note="* 점수에는 영향 없음 (정보 제공 목적)"
            />
          </div>

          {/* 시작 버튼 */}
          <div className="mt-8 text-center">
            <button
              onClick={() => onStartSolving(selectedMode)}
              disabled={!selectedMode}
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all ${
                selectedMode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  : 'bg-zinc-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedMode === 'FOCUS'
                ? '집중 모드로 시작'
                : selectedMode === 'BASIC'
                  ? '기본 모드로 시작'
                  : '모드를 선택해주세요'}
            </button>
            <p className="text-gray-500 text-sm mt-3">
              {customTimeMinutes}분 동안 문제를 풀게 됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 모드 카드 서브컴포넌트
 */
const ModeCard = ({
  icon,
  title,
  description,
  features,
  isSelected,
  onClick,
  selectedBorderClass,
  note
}) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-xl cursor-pointer transition-all border-2 ${
      isSelected
        ? selectedBorderClass
        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
    }`}
  >
    <div className="text-center mb-4">
      <span className="text-4xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
    <p className="text-gray-400 text-sm text-center mb-4">{description}</p>
    <ul className="text-sm space-y-2 text-gray-300">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2">
          <span className={feature.enabled ? 'text-green-400' : 'text-gray-500'}>
            {feature.enabled ? '✓' : '✗'}
          </span>
          {feature.text}
        </li>
      ))}
    </ul>
    {note && <p className="text-xs text-purple-400 mt-3 text-center">{note}</p>}
  </div>
);

export default ModeSelectionScreen;
