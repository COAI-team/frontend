import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../../context/login/useLogin";
import { removeAuth } from "../../utils/auth/token";
import {
  createRoom,
  fetchDurationPolicy,
  fetchMyRoom,
  fetchRooms,
  joinRoom,
} from "../../service/battle/battleApi";
import { getLanguages, getProblem, getProblems } from "../../service/algorithm/AlgorithmApi";
import { useBattleWebSocket } from "../../hooks/battle/useBattleWebSocket";
import SearchableCombobox from "../../components/battle/SearchableCombobox";
import { getDifficultyColorClasses } from "../../constants/difficultyColors";

const PAGE_SIZE = 20;

const STATUS_META = {
  WAITING: {
    label: "대기 중",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900/40",
    tint: "bg-emerald-50/40 dark:bg-emerald-900/10",
  },
  RUNNING: {
    label: "게임 중",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-900/40",
    tint: "bg-rose-50/40 dark:bg-rose-900/10",
  },
  FINISHED: {
    label: "정산 중",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900/40",
    tint: "bg-amber-50/40 dark:bg-amber-900/10",
  },
};

const DEFAULT_FILTERS = {
  search: "",
  status: "WAITING",
  joinableOnly: false,
  hideFull: true,
  includePrivate: true,
  bet: "ALL",
  languageId: "",
  problemId: "",
  grade: "ALL",
  time: "ALL",
};

const LANGUAGE_ALIAS_TABLE = {
  python: ["파이썬", "파이선", "파이썬3", "파이썬 3"],
  java: ["자바"],
  javascript: ["자바스크립트", "자스", "js"],
  typescript: ["타입스크립트", "ts"],
  csharp: ["씨샵", "시샵", "씨샾", "시샾", "c샵", "c샾", "csharp", "c#"],
  cpp: ["씨플플", "시플플", "c플플", "cpp", "c++"],
  kotlin: ["코틀린"],
  go: ["고", "golang"],
  golang: ["고", "golang"],
  rust: ["러스트"],
  sql: ["에스큐엘"],
};

const normalizeQuery = (q = "") =>
  q
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/#/g, "sharp")
    .replace(/[^a-z0-9가-힣]/g, "");

const GRADE_GEMS = {
  1: { name: "에메랄드", main: "#34d399", light: "#bbf7d0", dark: "#059669" },
  2: { name: "사파이어", main: "#60a5fa", light: "#bfdbfe", dark: "#2563eb" },
  3: { name: "루비", main: "#f87171", light: "#fecaca", dark: "#dc2626" },
  4: { name: "다이아", main: "#67e8f9", light: "#cffafe", dark: "#0891b2" },
};

const sortProblemsByIdAsc = (items) => {
  const list = Array.isArray(items) ? [...items] : [];
  return list.sort((a, b) => {
    const aId = Number(a?.algoProblemId ?? a?.problemId ?? a?.id ?? Number.MAX_SAFE_INTEGER);
    const bId = Number(b?.algoProblemId ?? b?.problemId ?? b?.id ?? Number.MAX_SAFE_INTEGER);
    if (Number.isNaN(aId) && Number.isNaN(bId)) return 0;
    if (Number.isNaN(aId)) return 1;
    if (Number.isNaN(bId)) return -1;
    return aId - bId;
  });
};

const buildProblemItems = (items, randomValue = "") => {
  const base = sortProblemsByIdAsc(items).map((p) => {
    const id = p.algoProblemId ?? p.problemId ?? p.id;
    const title = p.algoProblemTitle || p.title || `문제 #${id}`;
    const difficulty = (p.algoProblemDifficulty || p.difficulty || "").toUpperCase();
    return {
      value: id,
      label: `#${id} · ${title}`,
      subLabel: difficulty ? `난이도: ${difficulty}` : null,
      badge: difficulty || null,
      searchText: `${id} ${title} ${difficulty}`,
    };
  });
  return [
    {
      value: randomValue,
      label: "#? RANDOM",
      subLabel: "문제가 랜덤으로 선택됨",
      badge: null,
      searchText: "random 랜덤 무작위",
    },
    ...base,
  ];
};

const getAliasesByKey = (key) => {
  if (LANGUAGE_ALIAS_TABLE[key]) return LANGUAGE_ALIAS_TABLE[key];
  if (key === "go") return LANGUAGE_ALIAS_TABLE.golang || [];
  if (key === "golang") return LANGUAGE_ALIAS_TABLE.go || [];
  return [];
};

const normalizeLevelMode = (levelMode) => {
  const normalized = String(levelMode || "").toUpperCase().trim();
  if (!normalized) return "ANY";
  if (normalized.includes("SAME")) return "SAME_LINE_ONLY";
  if (["ANY", "NONE", "UNLIMITED"].includes(normalized)) return "ANY";
  return normalized;
};

const levelModeText = (levelMode) => {
  const normalized = normalizeLevelMode(levelMode);
  if (normalized === "SAME_LINE_ONLY") return "동일 레벨만";
  return "제한 없음";
};

const getDisplayStatusKey = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "WAITING") return "WAITING";
  if (normalized === "COUNTDOWN" || normalized === "RUNNING") return "RUNNING";
  if (normalized === "FINISHED" || normalized === "CANCELED") return "FINISHED";
  return "WAITING";
};

const formatBet = (amount) => {
  const num = Number(amount || 0);
  if (Number.isNaN(num) || num <= 0) return "0P";
  return `${Math.round(num).toLocaleString("ko-KR")}P`;
};

export default function BattleLobby() {
  const navigate = useNavigate();
  const { accessToken, user } = useLogin();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [languages, setLanguages] = useState({});
  const [problems, setProblems] = useState([]);
  const [problemTitles, setProblemTitles] = useState({});
  const [countdownMap, setCountdownMap] = useState({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [joinModal, setJoinModal] = useState({ open: false, roomId: null, error: "" });
  const [joinPassword, setJoinPassword] = useState("");
  const [infoModal, setInfoModal] = useState({ open: false, message: "" });
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [authMismatch, setAuthMismatch] = useState(false);

  const listRef = useRef(null);
  const sentinelRef = useRef(null);
  const problemTitleRef = useRef({});
  const filteredRoomsRef = useRef([]);

  const tokenUserId = useMemo(() => {
    if (!accessToken) return null;
    const parts = accessToken.split(".");
    if (parts.length < 2 || typeof atob !== "function") return null;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      const raw = payload?.id ?? payload?.userId ?? null;
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? numeric : null;
    } catch {
      return null;
    }
  }, [accessToken]);

  useEffect(() => {
    if (tokenUserId && user?.userId && tokenUserId !== user.userId) {
      setAuthMismatch(true);
    }
  }, [tokenUserId, user?.userId]);

  const handleAuthMismatch = () => {
    removeAuth();
    navigate("/signin", { replace: true });
  };

  const loadLanguages = useCallback(async () => {
    const res = await getLanguages();
    const list = res?.data || res?.languages || res;
    if (Array.isArray(list)) {
      const map = {};
      list.forEach((lang) => {
        const id = lang.languageId ?? lang.id;
        const name = lang.languageName ?? lang.name ?? lang.label;
        if (id) map[id] = name;
      });
      setLanguages(map);
    }
  }, []);

  const loadProblems = useCallback(async () => {
    const res = await getProblems({ page: 1, size: 200 });
    const list = res?.data?.problems || res?.problems || res?.data || [];
    if (Array.isArray(list)) {
      setProblems(list);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchRooms();
    if (res?.error) {
      setError(res.message);
      setLoading(false);
      return;
    }
    const list = res?.data?.items || res?.items || res?.data || res;
    if (Array.isArray(list)) {
      setRooms(list);
    }
    setLoading(false);
  }, []);

  const upsertRoom = useCallback((room) => {
    if (!room?.roomId) return;
    setRooms((prev) => {
      const exists = prev.find((r) => r.roomId === room.roomId);
      if (exists) {
        return prev.map((r) => (r.roomId === room.roomId ? { ...exists, ...room } : r));
      }
      return [room, ...prev];
    });
  }, []);

  const applyRoomList = useCallback((list) => {
    if (Array.isArray(list)) {
      setRooms(list);
    }
  }, []);

  useBattleWebSocket({
    accessToken,
    onRoomList: applyRoomList,
    onRoomState: upsertRoom,
    onCountdown: ({ roomId, seconds }) => {
      setCountdownMap((prev) => ({ ...prev, [roomId]: seconds }));
    },
    onStart: upsertRoom,
    onFinish: upsertRoom,
    onError: (payload) => {
      setError(payload?.message || "서버 오류가 발생했습니다.");
    },
  });

  useEffect(() => {
    (async () => {
      const myRoom = await fetchMyRoom();
      if (myRoom?.roomId) {
        navigate(`/battle/room/${myRoom.roomId}`);
        return;
      }
      try {
        const notice = sessionStorage.getItem("battleLobbyNotice");
        if (notice) {
          setInfoModal({ open: true, message: notice });
          sessionStorage.removeItem("battleLobbyNotice");
        }
      } catch {}
      loadRooms();
      loadLanguages();
      loadProblems();
    })();
  }, [loadRooms, loadLanguages, loadProblems, navigate]);

  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const id = setInterval(() => {
      setRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [refreshCooldown]);

  useEffect(() => {
    problemTitleRef.current = problemTitles;
  }, [problemTitles]);

  const problemMetaMap = useMemo(() => {
    const map = {};
    problems.forEach((p) => {
      const id = p.algoProblemId ?? p.problemId ?? p.id;
      const title = p.algoProblemTitle || p.title || `문제 #${id}`;
      const difficulty = (p.algoProblemDifficulty || p.difficulty || "").toUpperCase();
      if (id) {
        map[id] = { title, difficulty };
      }
    });
    return map;
  }, [problems]);

  useEffect(() => {
    const ids = rooms.map((r) => r.algoProblemId).filter(Boolean);
    const missing = ids.filter((id) => !problemTitleRef.current[id] && !problemMetaMap[id]);
    if (missing.length === 0) return;
    missing.forEach(async (problemId) => {
      const res = await getProblem(problemId);
      const title =
        res?.data?.algoProblemTitle ||
        res?.algoProblemTitle ||
        res?.data?.title ||
        `문제 #${problemId}`;
      setProblemTitles((prev) => ({ ...prev, [problemId]: title }));
    });
  }, [rooms, problemMetaMap]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0 });
    }
  }, [filters, rooms]);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const root = listRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredRoomsRef.current.length));
      },
      { root, rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const handleJoin = async (roomId, room) => {
    if (!roomId) return;
    if (!accessToken) {
      setError("로그인이 필요합니다. 먼저 로그인 후 다시 시도해 주세요.");
      return;
    }
    const targetRoom = room || rooms.find((r) => r.roomId === roomId) || {};
    const roomIsPrivate =
      targetRoom.isPrivate ?? targetRoom.private ?? targetRoom.privateRoom ?? targetRoom.passwordRequired ?? false;
    if (roomIsPrivate) {
      setJoinModal({ open: true, roomId, error: "" });
      setJoinPassword("");
      return;
    }
    setJoiningId(roomId);
    const res = await joinRoom(roomId, null);
    setJoiningId(null);
    if (res?.error) {
      handleJoinError(res);
      return;
    }
    const targetRoomId = res?.roomId || roomId;
    try {
      sessionStorage.setItem(`battlePendingJoin:${targetRoomId}`, "1");
      sessionStorage.setItem(`battleJoinSnapshot:${targetRoomId}`, JSON.stringify(res));
    } catch {}
    try {
      sessionStorage.removeItem(`battleRoomPassword:${targetRoomId}`);
    } catch {}
    navigate(`/battle/room/${targetRoomId}`);
  };

  const handleJoinError = (res) => {
    const code = res?.code;
    const msg = res?.message || "";
    if (code === "B002" || msg.includes("정원") || msg.includes("가득")) {
      setInfoModal({ open: true, message: "가득 찬 방입니다." });
      return;
    }
    if (code === "B018") {
      setInfoModal({ open: true, message: "잘못된 비밀번호이거나 존재하지 않는 방입니다." });
      return;
    }
    if (code === "B025" || code === "B026" || msg.includes("강퇴")) {
      setInfoModal({ open: true, message: "강퇴당한 방은 재입장이 불가능합니다." });
      return;
    }
    if (code === "B027") {
      setInfoModal({ open: true, message: msg || "아직 게임이 종료되지 않았습니다." });
      return;
    }
    if (code === "B032") {
      setInfoModal({ open: true, message: msg || "동일 레벨이 아닙니다." });
      return;
    }
    if (msg.includes("존재하지 않는 방")) {
      setInfoModal({ open: true, message: msg });
      loadRooms();
      return;
    }
    setError(msg || "입장에 실패했습니다.");
  };

  const confirmJoinWithPassword = async () => {
    if (!joinModal.roomId) return;
    if (!/^\d{4}$/.test(joinPassword)) {
      setJoinModal((prev) => ({ ...prev, error: "비밀번호는 숫자 4자리로 입력해 주세요." }));
      return;
    }
    setJoiningId(joinModal.roomId);
    const res = await joinRoom(joinModal.roomId, joinPassword);
    setJoiningId(null);
    if (res?.error) {
      const code = res.code;
      const msg = res.message || "";
      let friendly = msg || "입장에 실패했습니다.";
      if (code === "B018") {
        friendly = "잘못된 비밀번호이거나 존재하지 않는 방입니다.";
      } else if (code === "B002") {
        friendly = "가득 찬 방입니다.";
      } else if (code === "B027") {
        friendly = msg || "아직 게임이 종료되지 않았습니다.";
      } else if (code === "B032") {
        friendly = msg || "동일 레벨이 아닙니다.";
      } else if (code === "B025" || code === "B026") {
        friendly = "강퇴당한 방은 재입장이 불가능합니다.";
      }
      setJoinModal((prev) => ({ ...prev, error: friendly }));
      return;
    }
    const targetRoomId = res?.roomId || joinModal.roomId;
    try {
      sessionStorage.setItem(`battlePendingJoin:${targetRoomId}`, "1");
      sessionStorage.setItem(`battleJoinSnapshot:${targetRoomId}`, JSON.stringify(res));
    } catch {}
    try {
      sessionStorage.setItem(`battleRoomPassword:${targetRoomId}`, joinPassword);
    } catch {}
    setJoinModal({ open: false, roomId: null, error: "" });
    setJoinPassword("");
    navigate(`/battle/room/${targetRoomId}`);
  };

  const languageItems = useMemo(
    () =>
      Object.entries(languages || {}).map(([id, name]) => {
        const key = normalizeQuery(name);
        const aliases = getAliasesByKey(key);
        const searchText = `${name} ${key} ${aliases.join(" ")}`.trim();
        return {
          value: id,
          label: name,
          searchText,
        };
      }),
    [languages]
  );

  const problemItems = useMemo(() => buildProblemItems(problems, "RANDOM"), [problems]);
  const formattedRooms = useMemo(() => {
    const normalizedSearch = normalizeQuery(filters.search);
    let list = rooms.map((room) => {
      const participants = room.participants || {};
      const ids = [
        room.hostUserId,
        room.guestUserId,
        ...Object.keys(room.participants || {})
      ]
        .filter(v => v !== null && v !== undefined)
        .map(v => String(v)); // 타입 통일 (3 vs "3" 방지)

      const headCount = new Set(ids).size;
      const isOpen = room.status === "WAITING" && headCount < 2;
      const roomIsPrivate =
        room.isPrivate ?? room.private ?? room.privateRoom ?? room.passwordRequired ?? false;
      const isRandomHidden = Boolean(room.randomProblem && !room.algoProblemId);
      const meta = problemMetaMap[room.algoProblemId] || {};
      const problemTitle = isRandomHidden
        ? "? RANDOM"
        : room.problemTitle ||
          room.algoProblemTitle ||
          meta.title ||
          problemTitles[room.algoProblemId] ||
          `문제 #${room.algoProblemId || "-"}`;
      const difficultyRaw =
        room.problemDifficulty ||
        room.algoProblemDifficulty ||
        room.difficulty ||
        room.problemLevel ||
        meta.difficulty ||
        "";
      const problemDifficulty = isRandomHidden ? null : String(difficultyRaw || "").toUpperCase() || null;
      const languageName = languages[room.languageId] || `언어 #${room.languageId || "-"}`;
      const hostName = getParticipantName(room, room.hostUserId, "방장");
      const guestName = getParticipantName(room, room.guestUserId, "유저");
      const hostGrade = getParticipantGrade(room, room.hostUserId);
      const guestGrade = getParticipantGrade(room, room.guestUserId);
      const displayStatusKey = getDisplayStatusKey(room.status);
      return {
        ...room,
        headCount,
        isOpen,
        isPrivate: roomIsPrivate,
        problemTitle,
        problemDifficulty,
        languageName,
        hostName,
        guestName,
        hostGrade,
        guestGrade,
        displayStatusKey,
      };
    });

    if (normalizedSearch) {
      list = list.filter((room) => {
        const langKey = normalizeQuery(room.languageName || "");
        const aliases = getAliasesByKey(langKey);
        const searchText = [
          room.title,
          room.problemTitle,
          room.languageName,
          room.hostName,
          room.guestName,
          room.algoProblemId,
          aliases.join(" "),
        ]
          .filter(Boolean)
          .join(" ");
        const normalizedText = normalizeQuery(searchText);
        return normalizedText.includes(normalizedSearch);
      });
    }

    if (filters.status !== "ALL") {
      list = list.filter((room) => room.displayStatusKey === filters.status);
    }

    if (filters.joinableOnly) {
      list = list.filter((room) => room.displayStatusKey === "WAITING" && room.headCount < 2);
    } else if (filters.hideFull) {
      list = list.filter((room) => room.headCount < 2);
    }

    if (!filters.includePrivate) {
      list = list.filter((room) => !room.isPrivate);
    }

    if (filters.bet === "ZERO") {
      list = list.filter((room) => Number(room.betAmount || 0) <= 0);
    } else if (filters.bet === "PAID") {
      list = list.filter((room) => Number(room.betAmount || 0) > 0);
    }

    if (filters.languageId) {
      list = list.filter((room) => String(room.languageId) === String(filters.languageId));
    }

    if (filters.problemId) {
      if (filters.problemId === "RANDOM") {
        list = list.filter((room) => Boolean(room.randomProblem));
      } else {
        list = list.filter((room) => String(room.algoProblemId) === String(filters.problemId));
      }
    }

    if (filters.grade !== "ALL") {
      if (filters.grade === "ANY") {
        list = list.filter((room) => normalizeLevelMode(room.levelMode) === "ANY");
      } else {
        const targetGrade = Number(filters.grade);
        list = list.filter((room) => {
          const sameLevelOnly = normalizeLevelMode(room.levelMode) === "SAME_LINE_ONLY";
          if (!sameLevelOnly) return false;
          return Number(room.hostGrade) === targetGrade;
        });
      }
    }

    if (filters.time !== "ALL") {
      const limit = Number(filters.time);
      list = list.filter((room) => {
        const value = Number(room.maxDurationMinutes || 0);
        return value > 0 && value <= limit;
      });
    }

    list.sort((a, b) => {
      const openDiff = Number(b.isOpen) - Number(a.isOpen);
      if (openDiff !== 0) return openDiff;
      const statusOrder = { WAITING: 0, RUNNING: 1, FINISHED: 2 };
      const statusDiff =
        (statusOrder[a.displayStatusKey] ?? 99) - (statusOrder[b.displayStatusKey] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      const av = new Date(a.createdAt || 0).getTime();
      const bv = new Date(b.createdAt || 0).getTime();
      return bv - av;
    });

    return list;
  }, [filters, rooms, languages, problemTitles, problemMetaMap]);

  useEffect(() => {
    filteredRoomsRef.current = formattedRooms;
  }, [formattedRooms]);

  const visibleRooms = useMemo(
    () => formattedRooms.slice(0, Math.min(visibleCount, formattedRooms.length)),
    [formattedRooms, visibleCount]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.status !== DEFAULT_FILTERS.status) {
      chips.push({
        key: "status",
        label:
          filters.status === "WAITING"
            ? "대기 중"
            : filters.status === "RUNNING"
            ? "게임 중"
            : filters.status === "FINISHED"
            ? "정산 중"
            : "전체",
      });
    }
    if (filters.joinableOnly) chips.push({ key: "joinableOnly", label: "입장 가능만" });
    if (!filters.hideFull) chips.push({ key: "hideFull", label: "꽉 찬 방 포함" });
    if (!filters.includePrivate) chips.push({ key: "includePrivate", label: "비밀방 제외" });
    if (filters.bet === "ZERO") chips.push({ key: "bet", label: "0P만" });
    if (filters.bet === "PAID") chips.push({ key: "bet", label: "베팅방만" });
    if (filters.languageId) {
      const label = languages[filters.languageId] || `언어 #${filters.languageId}`;
      chips.push({ key: "languageId", label });
    }
    if (filters.problemId) {
      if (filters.problemId === "RANDOM") {
        chips.push({ key: "problemId", label: "#? RANDOM" });
      } else {
        const item = problemItems.find((p) => String(p.value) === String(filters.problemId));
        chips.push({ key: "problemId", label: item?.label || `문제 #${filters.problemId}` });
      }
    }
    if (filters.grade !== "ALL") {
      if (filters.grade === "ANY") {
        chips.push({ key: "grade", label: "제한 없음" });
      } else {
        const meta = GRADE_GEMS[Number(filters.grade)];
        chips.push({
          key: "grade",
          label: meta ? meta.name : `레벨 ${filters.grade}`,
        });
      }
    }
    if (filters.time !== "ALL") {
      chips.push({ key: "time", label: `${filters.time}분 이하` });
    }
    return chips;
  }, [filters, languages, problemItems]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#131313]">
      {authMismatch && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-[#3f3f46] space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">로그인 정보 불일치</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              현재 로그인 정보와 토큰 정보가 달라 배틀 입장 상태가 꼬였습니다. 다시 로그인해 주세요.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleAuthMismatch}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                다시 로그인
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
        <div className="border rounded-3xl bg-white dark:bg-[#161b22] shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-gray-200 dark:border-[#3f3f46] p-6 space-y-4">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">알고리즘 · 1vs1</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">1vs1 배틀 로비</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/algorithm"
                className="px-4 py-2 text-sm rounded border border-gray-200 dark:border-[#3f3f46] hover:border-gray-400 dark:hover:border-gray-500 dark:text-gray-100"
              >
                알고리즘 홈
              </Link>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                방 만들기
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="방 제목 / 문제 / 방장 / 언어(예: python, 파이썬, 씨샵)"
                value={filters.search}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters((prev) => ({ ...prev, search: value }));
                  setDraftFilters((prev) => ({ ...prev, search: value }));
                }}
                className="flex-1 min-w-[220px] px-3 py-2 border rounded bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (refreshCooldown > 0) return;
                  loadRooms();
                  setRefreshCooldown(5);
                }}
                disabled={refreshCooldown > 0}
                className={`px-3 py-2 text-sm rounded border border-gray-200 dark:border-[#3f3f46] flex items-center gap-1 transition ${
                  refreshCooldown > 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 cursor-not-allowed"
                    : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                }`}
              >
                <span className="text-lg leading-none">↻</span>
                {refreshCooldown > 0 ? `${refreshCooldown}s` : "새로고침"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(filters);
                  setFiltersOpen(true);
                }}
                className="px-4 py-2 rounded border border-gray-200 dark:border-[#3f3f46] hover:border-gray-400 dark:hover:border-gray-500"
              >
                필터
              </button>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                  >
                    {chip.label}
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, [chip.key]: DEFAULT_FILTERS[chip.key] }))}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label="필터 해제"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setDraftFilters(DEFAULT_FILTERS);
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 underline"
                >
                  전체 해제
                </button>
              </div>
            )}
            {error && <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>}
          </div>
        </header>

        <div
          ref={listRef}
          className="space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: "calc(100vh - 360px)" }}
        >
          {loading && formattedRooms.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">방 목록을 불러오는 중...</div>
          ) : visibleRooms.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">표시할 방이 없습니다.</div>
          ) : (
            <>
              {visibleRooms.map((room) => (
                <RoomCard
                  key={room.roomId}
                  room={room}
                  countdownSeconds={countdownMap[room.roomId]}
                  onJoin={() => handleJoin(room.roomId, room)}
                  joining={joiningId === room.roomId}
                />
              ))}
              <div ref={sentinelRef} />
              {visibleRooms.length < formattedRooms.length && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">로딩 중...</div>
              )}
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#161b22] shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-6 overflow-y-auto border-l border-gray-200 dark:border-[#3f3f46]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">필터</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                닫기
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">상태</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "WAITING", label: "대기 중" },
                    { key: "RUNNING", label: "게임 중" },
                    { key: "FINISHED", label: "정산 중" },
                    { key: "ALL", label: "전체" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, status: item.key }))}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        draftFilters.status === item.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={draftFilters.joinableOnly}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, joinableOnly: e.target.checked }))
                    }
                  />
                  입장 가능한 방만 보기
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={draftFilters.hideFull}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, hideFull: e.target.checked }))
                    }
                  />
                  꽉 찬 방 숨기기
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={draftFilters.includePrivate}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, includePrivate: e.target.checked }))
                    }
                  />
                  비밀방 포함
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">베팅</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "ALL", label: "전체" },
                    { key: "ZERO", label: "0P만" },
                    { key: "PAID", label: "베팅방만" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, bet: item.key }))}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        draftFilters.bet === item.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">문제 검색</span>
                  {draftFilters.problemId && (
                    <button
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, problemId: "" }))}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-lg"
                      aria-label="문제 선택 해제"
                    >
                      ×
                    </button>
                  )}
                </div>
                <SearchableCombobox
                  label={null}
                  items={problemItems}
                  value={draftFilters.problemId}
                  onChange={(val) => setDraftFilters((prev) => ({ ...prev, problemId: val }))}
                  placeholder="문제를 선택해 주세요"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">언어 검색</span>
                  {draftFilters.languageId && (
                    <button
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, languageId: "" }))}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-lg"
                      aria-label="언어 선택 해제"
                    >
                      ×
                    </button>
                  )}
                </div>
                <SearchableCombobox
                  label={null}
                  items={languageItems}
                  value={draftFilters.languageId}
                  onChange={(val) => setDraftFilters((prev) => ({ ...prev, languageId: val }))}
                  placeholder="언어를 선택해 주세요"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">레벨</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "ALL", label: "전체" },
                    { key: "ANY", label: "제한 없음" },
                    ...Object.entries(GRADE_GEMS).map(([grade, meta]) => ({
                      key: String(grade),
                      label: meta.name,
                    })),
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, grade: item.key }))}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        draftFilters.grade === item.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.key === "ALL" || item.key === "ANY" ? (
                        item.label
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <GradeGem grade={item.key} size={12} />
                          <span>{item.label}</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">시간</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "ALL", label: "전체" },
                    { key: "10", label: "10분 이하" },
                    { key: "30", label: "30분 이하" },
                    { key: "60", label: "60분 이하" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDraftFilters((prev) => ({ ...prev, time: item.key }))}
                      className={`px-3 py-1.5 rounded-full text-xs border ${
                        draftFilters.time === item.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-200 dark:border-[#3f3f46] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDraftFilters(DEFAULT_FILTERS)}
                className="px-4 py-2 rounded border border-gray-200 dark:border-[#3f3f46] hover:border-gray-300 dark:hover:border-gray-500"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(draftFilters);
                  setFiltersOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(room) => {
            setIsCreateOpen(false);
            upsertRoom(room);
            navigate(`/battle/room/${room.roomId}`);
          }}
          languages={languages}
          accessToken={accessToken}
        />
      )}

      {joinModal.open && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-full max-w-sm p-5 border border-gray-200 dark:border-[#3f3f46]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">비밀방 입장</h3>
              <button
                type="button"
                onClick={() => setJoinModal({ open: false, roomId: null, error: "" })}
                className="text-gray-500 dark:text-gray-400 text-sm"
              >
                닫기
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300">비밀번호 (숫자 4자리)</label>
              <div className="flex items-center border rounded px-2 py-1 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46]">
                <input
                  type="password"
                  value={joinPassword}
                  maxLength={4}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setJoinPassword(digits);
                    if (digits.length === 4) {
                      setJoinModal((prev) => ({ ...prev, error: "" }));
                    }
                  }}
                  className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="****"
                />
              </div>
              {joinModal.error && <div className="text-xs text-red-600 dark:text-red-400">{joinModal.error}</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setJoinModal({ open: false, roomId: null, error: "" })}
                className="px-3 py-2 text-sm rounded border border-gray-200 dark:border-[#3f3f46] hover:border-gray-300 dark:hover:border-gray-500"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmJoinWithPassword}
                disabled={joiningId === joinModal.roomId}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                입장
              </button>
            </div>
          </div>
        </div>
      )}

      {infoModal.open && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-full max-w-sm p-5 border border-gray-200 dark:border-[#3f3f46]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">안내</h3>
              <button
                type="button"
                onClick={() => setInfoModal({ open: false, message: "" })}
                className="text-gray-500 dark:text-gray-400 text-sm"
              >
                닫기
              </button>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{infoModal.message}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setInfoModal({ open: false, message: "" });
                  loadRooms();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
function getParticipantName(room, userId, roleLabel) {
  if (!userId) return null;
  const isHost = room.hostUserId != null && String(room.hostUserId) === String(userId);
  const isGuest = room.guestUserId != null && String(room.guestUserId) === String(userId);
  if (isHost && room.hostNickname) return room.hostNickname;
  if (isGuest && room.guestNickname) return room.guestNickname;
  const state = room.participants?.[userId] || room.participants?.[String(userId)] || {};
  return (
    state.nickname ||
    state.nickName ||
    state.userNickname ||
    state.name ||
    `사용자#${userId}`
  );
}

function getParticipantGrade(room, userId) {
  if (!userId) return null;
  const state = room.participants?.[userId] || room.participants?.[String(userId)] || {};
  return state.grade ?? state.userGrade ?? state.level ?? null;
}

function RoomCard({ room, countdownSeconds, onJoin, joining }) {
  const statusMeta = STATUS_META[room.displayStatusKey] || STATUS_META.WAITING;
  const hostLabel = room.hostName || "방장 정보 없음";
  const guestLabel = room.guestName;
  const canJoin = room.displayStatusKey === "WAITING" && room.headCount < 2;

  return (
    <div
      className={`border rounded-2xl p-4 shadow-sm ${statusMeta.border} ${statusMeta.tint} text-gray-900 dark:text-gray-100`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate" title={room.title || "제목 없음"}>
              <span className="mr-1">{room.isPrivate ? "🔒" : ""}</span>
              {room.title || "제목 없음"}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <span className="font-semibold">문제:</span>
              <span className="truncate">{room.problemTitle}</span>
              {room.problemDifficulty && <DifficultyBadge value={room.problemDifficulty} />}
            </div>
            <div>
              <span className="font-semibold">언어:</span> {room.languageName}
            </div>
            <div>
              <span className="font-semibold">규칙:</span> {levelModeText(room.levelMode)}
            </div>
            <div>
              <span className="font-semibold">시간:</span> {room.maxDurationMinutes || "-"}분
            </div>
            <div>
              <span className="font-semibold">인원:</span> {room.headCount}/2
            </div>
            <div>
              <span className="font-semibold">베팅:</span> {formatBet(room.betAmount)}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            방장{" "}
            <span className="inline-flex items-center gap-1">
              <GradeGem grade={room.hostGrade} size={12} />
              <span>{hostLabel}</span>
            </span>
            {guestLabel ? (
              <>
                {" "}vs 유저{" "}
                <span className="inline-flex items-center gap-1">
                  <GradeGem grade={room.guestGrade} size={12} />
                  <span>{guestLabel}</span>
                </span>
              </>
            ) : (
              ""
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusMeta.badge}`}>
            {statusMeta.label}
          </span>
          {countdownSeconds != null && room.displayStatusKey === "RUNNING" && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{countdownSeconds}초</span>
          )}
          <button
            type="button"
            onClick={onJoin}
            disabled={joining || !canJoin}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            입장
          </button>
        </div>
      </div>
    </div>
  );
}

function DifficultyBadge({ value }) {
  if (!value) return null;
  const c = getDifficultyColorClasses(value);
  const badgeClasses =
    typeof c === "string" ? c : `${c?.bg ?? ""} ${c?.text ?? ""} ${c?.border ?? ""}`.trim();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClasses}`}
      title={value}
    >
      {value}
    </span>
  );
}

function GradeGem({ grade, size = 12 }) {
  const meta = GRADE_GEMS[Number(grade)];
  if (!meta) return null;
  return (
    <span className="inline-flex items-center" title={`${meta.name} 레벨`}>
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        <polygon points="10 1 19 7 10 19 1 7" fill={meta.main} stroke={meta.dark} strokeWidth="1" />
        <polygon points="10 3.5 15 7 10 16.5 5 7" fill={meta.light} />
        <polygon points="10 1 14 7 10 10" fill={meta.dark} opacity="0.35" />
      </svg>
    </span>
  );
}

function CreateRoomModal({ onClose, onCreated, languages, accessToken }) {
  const [title, setTitle] = useState("");
  const [problemId, setProblemId] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [levelMode, setLevelMode] = useState("ANY");
  const [maxDuration, setMaxDuration] = useState("");
  const [password, setPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [problems, setProblems] = useState([]);
  const [durationPolicy, setDurationPolicy] = useState(null);

  useEffect(() => {
    const loadProblems = async () => {
      const res = await getProblems({ page: 1, size: 200 });
      const list = res?.data?.problems || res?.problems || res?.data || [];
      if (Array.isArray(list)) {
        setProblems(list);
      }
    };
    const loadPolicy = async () => {
      const res = await fetchDurationPolicy();
      if (!res?.error) {
        setDurationPolicy(res);
      }
    };
    loadProblems();
    loadPolicy();
  }, []);

  const problemItems = useMemo(() => buildProblemItems(problems, ""), [problems]);

  const languageItems = useMemo(
    () =>
      Object.entries(languages || {}).map(([id, name]) => {
        const key = normalizeQuery(name);
        const aliases = getAliasesByKey(key);
        const searchText = `${name} ${key} ${aliases.join(" ")}`.trim();
        return {
          value: id,
          label: name,
          searchText,
        };
      }),
    [languages]
  );

  const selectedProblem = useMemo(
    () => problems.find((p) => String(p.algoProblemId ?? p.problemId ?? p.id) === String(problemId)),
    [problems, problemId]
  );

  const selectedProblemDefault = useMemo(() => {
    const defaults = durationPolicy?.difficultyDefaults || {};
    const difficulty = (selectedProblem?.algoProblemDifficulty || selectedProblem?.difficulty || "").toUpperCase();
    if (difficulty && defaults[difficulty] != null) return defaults[difficulty];
    if (defaults.DEFAULT != null) return defaults.DEFAULT;
    return null;
  }, [durationPolicy, selectedProblem]);

  const durationHelper = useMemo(() => {
    const min = durationPolicy?.minMinutes ?? 1;
    const max = durationPolicy?.maxMinutes ?? 120;
    const base = selectedProblemDefault ?? null;
    const difficulty =
      (selectedProblem?.algoProblemDifficulty || selectedProblem?.difficulty || "") || null;
    const defaults = durationPolicy?.difficultyDefaults || {};
    return { min, max, base, difficulty, defaults };
  }, [durationPolicy, selectedProblemDefault, selectedProblem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      setError("로그인이 필요합니다. 먼저 로그인 후 다시 시도해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("방 제목을 입력해 주세요.");
      return;
    }
    if (title.trim().length > 50) {
      setError("방 제목은 50자 이내로 입력해 주세요.");
      return;
    }
    if (!languageId) {
      setError("언어를 선택해 주세요.");
      return;
    }
    if (Number(betAmount) < 0) {
      setError("베팅 금액은 0 이상만 가능합니다.");
      return;
    }
    if (Number(betAmount) > 99999) {
      setError("베팅 금액은 99,999P 이하만 가능합니다.");
      return;
    }
    if (isPrivate && !/^\d{4}$/.test(password)) {
      setError("비밀번호는 숫자 4자리로 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    const payload = {
      title: title.trim(),
      algoProblemId: problemId ? Number(problemId) : null,
      languageId: Number(languageId),
      levelMode,
      betAmount: Number(betAmount || 0),
      ...(maxDuration ? { maxDurationMinutes: Number(maxDuration) } : {}),
      ...(isPrivate ? { password } : {}),
    };
    const res = await createRoom(payload);
    setLoading(false);

    if (res?.error) {
      setError(res.message);
      return;
    }
    if (isPrivate && password) {
      try {
        sessionStorage.setItem(`battleRoomPassword:${res.roomId || res.roomID || res.id}`, password);
      } catch {
        // ignore storage errors
      }
    }
    onCreated(res);
  };

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] w-full max-w-lg p-6 border border-gray-200 dark:border-[#3f3f46]">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">방 만들기</h2>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => {
                    setIsPrivate(e.target.checked);
                    if (!e.target.checked) setPassword("");
                  }}
                />
                <span>🔒 비밀방</span>
              </label>
              {isPrivate && (
                <div className="flex items-center border rounded px-2 py-1 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46]">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    maxLength={4}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setPassword(digits);
                    }}
                    className="w-24 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="숫자4자리"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-gray-600 dark:text-gray-400 text-xs ml-1"
                    aria-label="비밀번호 보기"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              )}
            </div>
            {isPrivate && password.length < 4 && (
              <div className="text-xs text-red-600 dark:text-red-400 text-right">비밀번호는 숫자 4자리로 입력해 주세요.</div>
            )}
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">방 제목</label>
            <input
              value={title}
              onChange={(e) => {
                const next = e.target.value;
                if (next.length > 50) {
                  setError("방 제목은 50자 이내로 입력해 주세요.");
                  setTitle(next.slice(0, 50));
                  return;
                }
                setTitle(next);
                if (error) setError(null);
              }}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="방 제목을 입력해 주세요"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">문제 선택</label>
                {problemId && (
                  <button
                    type="button"
                    onClick={() => setProblemId("")}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-lg"
                    aria-label="문제 선택 해제"
                  >
                    ×
                  </button>
                )}
              </div>
              <SearchableCombobox
                label={null}
                items={problemItems}
                value={problemId}
                onChange={(val) => setProblemId(val)}
                placeholder="문제를 선택해 주세요"
                helperText="설정 하지 않으면 랜덤 선택"
              />
              {problemItems.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">문제 목록을 불러오는 중입니다...</p>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">언어 선택</label>
                {languageId && (
                  <button
                    type="button"
                    onClick={() => setLanguageId("")}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-lg"
                    aria-label="언어 선택 해제"
                  >
                    ×
                  </button>
                )}
              </div>
              <SearchableCombobox
                label={null}
                items={languageItems}
                value={languageId}
                onChange={(val) => setLanguageId(val)}
                placeholder="언어를 선택해 주세요"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">매칭 규칙</label>
              <select
                value={levelMode}
                onChange={(e) => setLevelMode(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-gray-100"
              >
                <option value="SAME">동일 레벨만</option>
                <option value="ANY">제한 없음</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">베팅 금액 (P)</label>
              <input
                type="number"
                min="0"
                max="99999"
                value={betAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (Number(value) > 99999) {
                    setBetAmount(99999);
                    setError("베팅 금액은 99,999P 이하만 가능합니다.");
                    return;
                  }
                  setBetAmount(value);
                  if (error) setError(null);
                }}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">최대 진행시간</label>
            <input
              type="number"
              min="1"
              max="120"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46] text-gray-900 dark:text-gray-100"
              placeholder="비워두면 기본값 적용"
            />
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <div>비워두면 서버 기본값 적용 (허용 범위 {durationHelper.min}~{durationHelper.max}분)</div>
              {durationHelper.defaults && Object.keys(durationHelper.defaults).length > 0 && (
                <div className="border rounded p-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46]">
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">난이도별 기본시간</div>
                  <div className="grid grid-cols-2 gap-1 text-gray-700 dark:text-gray-300">
                    {["BRONZE", "SILVER", "GOLD", "PLATINUM"]
                      .filter((k) => durationHelper.defaults[k] !== undefined)
                      .map((k) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <DifficultyBadge value={k} />
                          <span className="tabular-nums">{durationHelper.defaults[k]}분</span>
                        </div>
                      ))}
                  </div>
                  {durationHelper.defaults.DEFAULT !== undefined && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-2">
                      * 난이도 정보가 없으면 DEFAULT: {durationHelper.defaults.DEFAULT}분 적용
                    </div>
                  )}
                </div>
              )}
              {durationHelper.base && (
                <div>
                  선택 문제 기준 기본값: {durationHelper.base}분
                  {durationHelper.difficulty ? ` (난이도: ${durationHelper.difficulty})` : ""}
                </div>
              )}
            </div>
          </div>
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-200 dark:border-[#3f3f46] hover:border-gray-300 dark:hover:border-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || (isPrivate && password.length !== 4)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "생성 중..." : "만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
