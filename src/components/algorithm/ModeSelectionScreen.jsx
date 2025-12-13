import React from 'react';
import TrackerSelector from './eye-tracking/TrackerSelector';

/**
 * 풀이 모드 선택 화면 컴포넌트
 *
 * 기능:
 * - 기본 모드 / 집중 모드 선택
 * - 모드별 기능 안내
 * - 집중 모드 선택 시 타이머 설정 UI 표시
 * - 집중 모드 선택 시 추적기 선택 UI 표시 (TrackerSelector)
 */
const ModeSelectionScreen = ({
  problem,
  problemId,
  selectedMode,
  setSelectedMode,
  onStartSolving,
  onNavigateBack,
  // 타이머 설정 props (집중 모드용)
  customTimeMinutes,
  setCustomTimeMinutes,
  // 추적기 선택 props (집중 모드용)
  selectedTrackerType,
  setSelectedTrackerType
}) => {
  // 타이머 프리셋 옵션
  const timePresets = [15, 30, 45, 60];
  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100">
      {/* Header */}
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

      {/* Body */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Mode cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModeCard
              icon="🎓"
              title="학습 모드"
              description="튜터와 함께 연습해보세요."
              features={[
                { text: '힌트 제공 (Pro: 자동, Basic: 질문)', enabled: true },
                { text: '연습용 페이지 (채점 기록과 별도)', enabled: true },
                { text: '타이머/시선 추적 없음', enabled: true }
              ]}
              isSelected={selectedMode === 'LEARN'}
              onClick={() => setSelectedMode('LEARN')}
              selectedBorderClass="border-green-500 bg-green-900/20"
              note="Basic / Pro 구독에서만 이용 가능합니다."
            />

            <ModeCard
              icon="✅"
              title="기본 모드"
              description="자유롭게 문제를 풀어보세요"
              features={[
                { text: '타이머 기능 (수동 시작)', enabled: true },
                { text: '시간 설정 가능', enabled: true },
                { text: '시선 추적 없음', enabled: false }
              ]}
              isSelected={selectedMode === 'BASIC'}
              onClick={() => setSelectedMode('BASIC')}
              selectedBorderClass="border-blue-500 bg-blue-900/20"
            />

            <ModeCard
              icon="👁️"
              title="집중 모드"
              description="시선 추적으로 집중력을 관리하세요"
              features={[
                { text: '타이머 자동 시작 (추적 준비 후)', enabled: true },
                { text: '시선 추적 (캘리브 필요)', enabled: true },
                { text: '집중도 모니터링', enabled: true }
              ]}
              isSelected={selectedMode === 'FOCUS'}
              onClick={() => setSelectedMode('FOCUS')}
              selectedBorderClass="border-purple-500 bg-purple-900/20"
              note="* 침대/소파는 권장 안함 (정서 집중 목적)"
            />
          </div>

          {/* 집중 모드 주의사항 */}
          {selectedMode === 'FOCUS' && <FocusModeWarning />}

          {/* 집중 모드 타이머 설정 */}
          {selectedMode === 'FOCUS' && (
            <div className="mt-6 p-6 bg-zinc-800 border border-zinc-700 rounded-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">⏱️</span>
                <h3 className="text-lg font-bold text-white">풀이 시간 설정</h3>
                <p className="text-sm text-gray-400 mt-1">집중 모드에서 사용할 타이머 시간을 설정하세요</p>
              </div>

              {/* 프리셋 버튼 */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {timePresets.map(time => (
                  <button
                    key={time}
                    onClick={() => setCustomTimeMinutes(time)}
                    className={`px-5 py-2 rounded-lg font-semibold transition-all ${
                      customTimeMinutes === time
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                    }`}
                  >
                    {time}분
                  </button>
                ))}
              </div>

              {/* 커스텀 시간 입력 */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-gray-400">직접 입력:</span>
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
                  className="w-20 px-3 py-2 bg-zinc-700 rounded-lg text-center text-lg font-mono text-white"
                />
                <span className="text-gray-400">분</span>
              </div>
            </div>
          )}

          {/* 집중 모드 추적기 선택 */}
          {selectedMode === 'FOCUS' && (
            <div className="mt-6 p-6 bg-zinc-800 border border-zinc-700 rounded-xl">
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">👁️</span>
                <h3 className="text-lg font-bold text-white">시선 추적 방식 선택</h3>
                <p className="text-sm text-gray-400 mt-1">집중 모드에서 사용할 시선 추적 라이브러리를 선택하세요</p>
              </div>
              <TrackerSelector
                selectedTracker={selectedTrackerType}
                onSelect={setSelectedTrackerType}
              />
            </div>
          )}

          {/* 시작 버튼 */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                if (!selectedMode) return;
                onStartSolving(selectedMode);
              }}
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
                  : selectedMode === 'LEARN'
                    ? '학습 모드로 이동'
                    : '모드를 선택해주세요'}
            </button>

            <p className="text-gray-500 text-sm mt-3">
              {selectedMode === 'FOCUS'
                ? `전체화면 모드로 전환되며 시선 추적이 활성화됩니다 (${customTimeMinutes}분)`
                : selectedMode === 'BASIC'
                  ? '풀이 화면에서 타이머 또는 스톱워치를 설정할 수 있습니다'
                  : selectedMode === 'LEARN'
                    ? '튜터와 함께 문제를 연습할 수 있습니다'
                    : '모드를 선택하면 시작할 수 있습니다'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 집중 모드 주의사항 안내 컴포넌트
 */
const FocusModeWarning = () => (
  <div className="mt-6 p-5 bg-amber-900/30 border border-amber-600/50 rounded-xl">
    <h3 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
      <span>&#9888;&#65039;</span> 집중 모드 주의사항
    </h3>

    <div className="mb-4">
      <h4 className="text-gray-300 font-semibold mb-2">위반으로 기록되는 행위:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-red-400">&#8226;</span>
          <span>전체화면 이탈</span>
          <span className="text-amber-400 text-xs">(1점)</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-red-400">&#8226;</span>
          <span>다른 탭/창으로 전환</span>
          <span className="text-amber-400 text-xs">(1점)</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-red-400">&#8226;</span>
          <span>마우스 화면 밖 이동</span>
          <span className="text-amber-400 text-xs">(0.5점)</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-red-400">&#8226;</span>
          <span>얼굴 미검출 (15초+)</span>
          <span className="text-amber-400 text-xs">(2점)</span>
        </div>
      </div>
    </div>

    <div className="bg-zinc-800/50 rounded-lg p-3">
      <h4 className="text-gray-300 font-semibold mb-3">패널티 시스템:</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-20 px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-center text-xs font-semibold">
            1~3점
          </span>
          <span className="text-gray-400">경고 알림 표시</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 px-2 py-1 bg-orange-600/30 text-orange-400 rounded text-center text-xs font-semibold">
            4~6점
          </span>
          <span className="text-gray-400">제한 시간 5분 감소 (최대 3회)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 px-2 py-1 bg-red-600/30 text-red-400 rounded text-center text-xs font-semibold">
            7점+
          </span>
          <span className="text-gray-400">자동 제출</span>
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-500 mt-3">
      * 집중 모드는 학습 집중도 향상을 위한 기능이며, 실제 점수에는 영향을 주지 않습니다.
    </p>
  </div>
);

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
