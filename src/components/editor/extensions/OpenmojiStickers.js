// 스티커 데이터 + URL 헬퍼 (GitHub CDN 사용)
const OPENMOJI_BASE = "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg";

export const openmojiUrl = (hex) => {
  if (!hex) return "";
  return `${OPENMOJI_BASE}/${hex.toUpperCase()}.svg`;
};

// 스티커 그룹 정의
export const STICKER_GROUPS = [
  {
    id: "popular",
    label: "자주 쓰는",
    items: [
      { id: "thumbs-up", label: "좋아요", emoji: "👍", hex: "1F44D" },
      { id: "thumbs-down", label: "별로", emoji: "👎", hex: "1F44E" },
      { id: "clap", label: "박수", emoji: "👏", hex: "1F44F" },
      { id: "ok-hand", label: "오케이", emoji: "👌", hex: "1F44C" },
      { id: "fire", label: "불타는", emoji: "🔥", hex: "1F525" },
      { id: "hundred", label: "백점", emoji: "💯", hex: "1F4AF" },
      { id: "party", label: "파티", emoji: "🎉", hex: "1F389" },
      { id: "rocket", label: "로켓", emoji: "🚀", hex: "1F680" },
      { id: "sparkles", label: "반짝", emoji: "✨", hex: "2728" },
      { id: "check", label: "체크", emoji: "✅", hex: "2705" },
      { id: "cross", label: "엑스", emoji: "❌", hex: "274C" },
      { id: "warning", label: "경고", emoji: "⚠️", hex: "26A0" },
    ],
  },
  {
    id: "emotions",
    label: "감정",
    items: [
      { id: "smile", label: "웃음", emoji: "😊", hex: "1F60A" },
      { id: "laughing", label: "빵터짐", emoji: "😂", hex: "1F602" },
      { id: "heart-eyes", label: "하트눈", emoji: "😍", hex: "1F60D" },
      { id: "cool", label: "멋짐", emoji: "😎", hex: "1F60E" },
      { id: "thinking", label: "생각중", emoji: "🤔", hex: "1F914" },
      { id: "surprised", label: "놀람", emoji: "😮", hex: "1F62E" },
      { id: "sad", label: "슬픔", emoji: "😢", hex: "1F622" },
      { id: "crying", label: "엉엉", emoji: "😭", hex: "1F62D" },
      { id: "angry", label: "화남", emoji: "😠", hex: "1F620" },
      { id: "rage", label: "분노", emoji: "😡", hex: "1F621" },
      { id: "sleepy", label: "졸림", emoji: "😴", hex: "1F634" },
      { id: "sick", label: "아픔", emoji: "🤒", hex: "1F912" },
    ],
  },
  {
    id: "gestures",
    label: "제스처",
    items: [
      { id: "wave", label: "인사", emoji: "👋", hex: "1F44B" },
      { id: "raised-hand", label: "손들기", emoji: "✋", hex: "270B" },
      { id: "victory", label: "브이", emoji: "✌️", hex: "270C" },
      { id: "crossed-fingers", label: "행운", emoji: "🤞", hex: "1F91E" },
      { id: "love-you", label: "사랑", emoji: "🤟", hex: "1F91F" },
      { id: "call-me", label: "전화", emoji: "🤙", hex: "1F919" },
      { id: "point-up", label: "위", emoji: "☝️", hex: "261D" },
      { id: "point-down", label: "아래", emoji: "👇", hex: "1F447" },
      { id: "point-left", label: "왼쪽", emoji: "👈", hex: "1F448" },
      { id: "point-right", label: "오른쪽", emoji: "👉", hex: "1F449" },
      { id: "fist", label: "주먹", emoji: "✊", hex: "270A" },
      { id: "punch", label: "펀치", emoji: "👊", hex: "1F44A" },
    ],
  },
  {
    id: "dev",
    label: "개발",
    items: [
      { id: "computer", label: "컴퓨터", emoji: "💻", hex: "1F4BB" },
      { id: "keyboard", label: "키보드", emoji: "⌨️", hex: "2328" },
      { id: "bug", label: "버그", emoji: "🐛", hex: "1F41B" },
      { id: "gear", label: "설정", emoji: "⚙️", hex: "2699" },
      { id: "wrench", label: "도구", emoji: "🔧", hex: "1F527" },
      { id: "hammer", label: "망치", emoji: "🔨", hex: "1F528" },
      { id: "lock", label: "잠금", emoji: "🔒", hex: "1F512" },
      { id: "unlock", label: "열림", emoji: "🔓", hex: "1F513" },
      { id: "key", label: "키", emoji: "🔑", hex: "1F511" },
      { id: "battery", label: "배터리", emoji: "🔋", hex: "1F50B" },
      { id: "bulb", label: "아이디어", emoji: "💡", hex: "1F4A1" },
      { id: "package", label: "패키지", emoji: "📦", hex: "1F4E6" },
    ],
  },
  {
    id: "brands",
    label: "브랜드",
    items: [
      { id: "github", label: "GitHub", emoji: "", hex: "E045" },
      { id: "gitlab", label: "GitLab", emoji: "", hex: "E046" },
      { id: "stackoverflow", label: "Stack Overflow", emoji: "", hex: "E261" },
      { id: "vscode", label: "VS Code", emoji: "", hex: "E273" },
      { id: "react", label: "React", emoji: "", hex: "E281" },
      { id: "vue", label: "Vue", emoji: "", hex: "E282" },
      { id: "angular", label: "Angular", emoji: "", hex: "E283" },
      { id: "nodejs", label: "Node.js", emoji: "", hex: "E267" },
      { id: "python", label: "Python", emoji: "", hex: "E269" },
      { id: "javascript", label: "JavaScript", emoji: "", hex: "E26A" },
      { id: "typescript", label: "TypeScript", emoji: "", hex: "E26B" },
      { id: "java", label: "Java", emoji: "", hex: "E268" },
      { id: "docker", label: "Docker", emoji: "", hex: "E26E" },
      { id: "kubernetes", label: "Kubernetes", emoji: "", hex: "E26F" },
      { id: "aws", label: "AWS", emoji: "", hex: "E270" },
      { id: "google-cloud", label: "Google Cloud", emoji: "", hex: "E271" },
      { id: "firebase", label: "Firebase", emoji: "", hex: "E272" },
      { id: "notion", label: "Notion", emoji: "", hex: "E274" },
      { id: "slack", label: "Slack", emoji: "", hex: "E275" },
      { id: "discord", label: "Discord", emoji: "", hex: "E276" },
      { id: "figma", label: "Figma", emoji: "", hex: "E277" },
      { id: "chrome", label: "Chrome", emoji: "", hex: "E278" },
      { id: "youtube", label: "YouTube", emoji: "", hex: "E20B" },
      { id: "linkedin", label: "LinkedIn", emoji: "", hex: "E279" },
    ],
  },
  {
    id: "symbols",
    label: "기호",
    items: [
      { id: "info", label: "정보", emoji: "ℹ️", hex: "2139" },
      { id: "question", label: "물음표", emoji: "❓", hex: "2753" },
      { id: "exclamation", label: "느낌표", emoji: "❗", hex: "2757" },
      { id: "star", label: "별", emoji: "⭐", hex: "2B50" },
      { id: "heart", label: "하트", emoji: "❤️", hex: "2764" },
      { id: "broken-heart", label: "실연", emoji: "💔", hex: "1F494" },
      { id: "eyes", label: "눈", emoji: "👀", hex: "1F440" },
      { id: "speech", label: "말풍선", emoji: "💬", hex: "1F4AC" },
      { id: "zzz", label: "졸음", emoji: "💤", hex: "1F4A4" },
      { id: "dash", label: "대시", emoji: "💨", hex: "1F4A8" },
      { id: "boom", label: "충돌", emoji: "💥", hex: "1F4A5" },
      { id: "sweat-drops", label: "땀", emoji: "💦", hex: "1F4A6" },
    ],
  },
];

// BlockImage 노드로 변환 (대표 이미지 기능 없는 스티커)
export const stickerToImageNode = (sticker) => ({
  type: "blockImage",
  attrs: {
    src: openmojiUrl(sticker.hex),
    alt: sticker.label,
    isRepresentative: false,
    isSticker: true, // 스티커임을 명시
  },
});

// 인라인 스티커 노드로 변환 (텍스트와 같은 줄에 표시)
export const stickerToInlineNode = (sticker) => ({
  type: "inlineSticker",
  attrs: {
    src: openmojiUrl(sticker.hex),
    alt: sticker.label,
  },
});