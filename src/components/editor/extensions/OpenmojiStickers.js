// 스티커 데이터 + URL 헬퍼
const OPENMOJI_BASE =
  "https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/png";

export const openmojiUrl = (hex) =>
  `${OPENMOJI_BASE}/${hex.toUpperCase()}.png`;

// 스티커 그룹 정의
export const STICKER_GROUPS = [
  {
    id: "ui-status",
    label: "상태/알림",
    items: [
      { id: "check", label: "성공", emoji: "✅", hex: "2705" },
      { id: "cross", label: "실패", emoji: "❌", hex: "274C" },
      { id: "exclamation", label: "감탄", emoji: "❗", hex: "2757" },
      { id: "warning", label: "경고", emoji: "⚠️", hex: "26A0" },
      { id: "info", label: "정보", emoji: "ℹ️", hex: "2139" },
    ],
  },
  {
    id: "ui-icons",
    label: "UI 아이콘",
    items: [
      { id: "play", label: "재생", emoji: "▶️", hex: "25B6" },
      { id: "pause", label: "일시정지", emoji: "⏸️", hex: "23F8" },
      { id: "stop", label: "정지", emoji: "⏹️", hex: "23F9" },
      { id: "reload", label: "새로고침", emoji: "🔁", hex: "1F501" },
      { id: "search", label: "검색", emoji: "🔍", hex: "1F50D" },
      { id: "link", label: "링크", emoji: "🔗", hex: "1F517" },
      { id: "bookmark", label: "북마크", emoji: "🔖", hex: "1F516" },
      { id: "star", label: "스타", emoji: "⭐", hex: "2B50" },
      { id: "upload", label: "업로드", emoji: "📤", hex: "1F4E4" },
      { id: "download", label: "다운로드", emoji: "📥", hex: "1F4E5" },
      { id: "loading", label: "로딩", emoji: "🔃", hex: "1F503" },
    ],
  },
  {
    id: "smileys",
    label: "표정",
    items: [
      { id: "grinning", label: "기본 웃음", emoji: "😀", hex: "1F600" },
      { id: "smile", label: "미소", emoji: "😄", hex: "1F604" },
      { id: "smiling-eyes", label: "눈웃음", emoji: "😊", hex: "1F60A" },
      { id: "star-struck", label: "반함", emoji: "🤩", hex: "1F929" },
      { id: "heart-eyes", label: "사랑", emoji: "😍", hex: "1F60D" },
      { id: "relieved", label: "후련", emoji: "😌", hex: "1F60C" },

      { id: "disappointed", label: "실망", emoji: "😞", hex: "1F61E" },
      { id: "angry", label: "화남", emoji: "😡", hex: "1F621" },
      { id: "crying", label: "눈물", emoji: "😭", hex: "1F62D" },
      { id: "scream", label: "충격", emoji: "😱", hex: "1F631" },
      { id: "dizzy", label: "어질", emoji: "😵", hex: "1F635" },
      { id: "tears-of-joy", label: "울며웃기", emoji: "🥲", hex: "1F972" },

      { id: "thinking", label: "생각중", emoji: "🤔", hex: "1F914" },
      { id: "raised-brow", label: "의심", emoji: "🤨", hex: "1F928" },
      { id: "spiral-eyes", label: "멘붕", emoji: "😵‍💫", hex: "1F635-200D-1F4AB" },
      { id: "sleeping", label: "자는중", emoji: "😴", hex: "1F634" },
    ],
  },
  {
    id: "activities",
    label: "활동",
    items: [
      { id: "laptop", label: "노트북", emoji: "💻", hex: "1F4BB" },
      { id: "coder", label: "코딩", emoji: "🧑‍💻", hex: "1F9D1-200D-1F4BB" },
      { id: "notes", label: "필기", emoji: "🗒️", hex: "1F5D2" },
      { id: "books", label: "공부", emoji: "📚", hex: "1F4DA" },
      { id: "coffee", label: "커피", emoji: "☕", hex: "2615" },
      { id: "workout", label: "운동", emoji: "💪", hex: "1F4AA" },

      { id: "message", label: "메시지", emoji: "📨", hex: "1F4E8" },
      { id: "call", label: "전화", emoji: "📞", hex: "1F4DE" },
      { id: "speaking", label: "대화", emoji: "🗣️", hex: "1F5E3" },
      { id: "hello", label: "인사", emoji: "👋", hex: "1F44B" },

      { id: "memo", label: "메모", emoji: "📝", hex: "1F4DD" },
      { id: "tools", label: "툴", emoji: "🔧", hex: "1F527" },
      { id: "calendar", label: "캘린더", emoji: "📅", hex: "1F4C5" },
      { id: "chart", label: "차트", emoji: "📈", hex: "1F4C8" },
    ],
  },
  {
    id: "brands",
    label: "브랜드",
    items: [
      // extras-openmoji 브랜드들은 유니코드가 아니라 Private Use Area 코드라 emoji 자리는 이름만 둠
      { id: "github", label: "GitHub", hex: "E045" }, // OpenMoji github 코드 :contentReference[oaicite:0]{index=0}
      // 아래들은 hex는 나중에 OpenMoji 사이트에서 하나씩 복사해서 채우면 됨
      { id: "youtube", label: "YouTube", hex: "" },
      { id: "notion", label: "Notion", hex: "" },
      { id: "google", label: "Google", hex: "" },
      { id: "twitter", label: "Twitter / X", hex: "" },
      { id: "instagram", label: "Instagram", hex: "" },
      { id: "facebook", label: "Facebook", hex: "" },

      { id: "java", label: "Java", hex: "" },
      { id: "node", label: "Node.js", hex: "" },
      { id: "react", label: "React", hex: "" },
      { id: "vue", label: "Vue", hex: "" },
      { id: "docker", label: "Docker", hex: "" },
      { id: "aws", label: "AWS", hex: "" },
      { id: "git", label: "Git", hex: "" },
      { id: "vscode", label: "VSCode", hex: "" },
      { id: "openai", label: "OpenAI", hex: "" },
      { id: "huggingface", label: "HuggingFace", hex: "" },
    ],
  },
];

// Tiptap 이미지 노드로 변환
export const stickerToImageNode = (sticker) => ({
  type: "image",
  attrs: {
    src: openmojiUrl(sticker.hex),
    alt: sticker.label,
  },
});
