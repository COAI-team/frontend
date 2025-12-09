export const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
};

export const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    if (score >= 20) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
};

export const getSmellKeyword = (score) => {
    // 1. 90점 이상: 최상 (아주 향기로움)
    if (score >= 90) return { text: "🌸 천상의 라벤더 향", desc: "완벽 그 자체! 숨결마저 향기롭습니다." };

    // 2. 70점 이상: 긍정 마지노선 (상쾌함)
    if (score >= 70) return { text: "🍃 산뜻한 피톤치드 향", desc: "군더더기 없이 깔끔하고 쾌적한 코드네요." };

    // --- 긍정과 부정의 경계선 (70점) ---

    // 3. 50점 이상: 부정 시작 (불쾌함 감지)
    if (score >= 50) return { text: "🤧 눅눅한 지하방 곰팡이", desc: "어디선가 쾌쾌한 냄새가 나기 시작합니다..." };

    // 4. 30점 이상: 심각 (악취)
    if (score >= 30) return { text: "🤢 3일 묵힌 음식물 쓰레기", desc: "코를 막아야 할 수준입니다. 리팩토링이 시급해요!" };

    // 5. 30점 미만: 최악 (재앙)
    return { text: "🤮 지옥의 하수구 가스", desc: "이 구역은 폐쇄해야 합니다. 당장 코드를 갈아엎으세요!" };
    };

export const getToneEmoji = (level) => {
    const emojis = { 1: '😊', 2: '🙂', 3: '😐', 4: '😠', 5: '😾' };
    return emojis[level] || '😐';
};
