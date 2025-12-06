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
    if (score >= 80) return { text: "🌸 향기로운 꽃내음", desc: "완벽에 가까운 코드입니다!" };
    if (score >= 60) return { text: "🍃 상쾌한 비누향", desc: "깔끔하고 좋은 코드입니다." };
    if (score >= 40) return { text: "🤧 퀴퀴한 먼지 냄새", desc: "개선이 조금 필요해 보입니다." };
    if (score >= 20) return { text: "🤢 썩은 치즈 냄새", desc: "리팩토링이 시급합니다." };
    return { text: "🤮 지옥의 하수구 냄새", desc: "당장 코드를 갈아엎으세요!" };
};

export const getToneEmoji = (level) => {
    const emojis = { 1: '😊', 2: '🙂', 3: '😐', 4: '😠', 5: '😾' };
    return emojis[level] || '😐';
};
