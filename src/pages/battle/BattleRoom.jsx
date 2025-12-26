import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CodeEditor from "../../components/algorithm/editor/CodeEditor";
import SearchableCombobox from "../../components/battle/SearchableCombobox";
import { getDifficultyColorClasses } from "../../constants/difficultyColors";
import { useLogin } from "../../context/login/useLogin";
import {
  fetchRoom,
  leaveRoom,
  joinRoom,
  kickGuest,
  resetRoom,
  updateRoom,
  surrender,
  fetchDurationPolicy,
} from "../../service/battle/battleApi";
import { getLanguages, getProblem, getProblems } from "../../service/algorithm/AlgorithmApi";
import { useBattleWebSocket } from "../../hooks/battle/useBattleWebSocket";

const STATUS_LABEL = {
  WAITING: "대기중",
  COUNTDOWN: "카운트다운",
  RUNNING: "진행중",
  FINISHED: "종료",
  CANCELED: "취소",
};

const LANGUAGE_ALIAS_TABLE = {
  python: ["파이썬", "파이선", "파이썬3", "파이썬 3"],
  java: ["자바"],
  javascript: ["자바스크립트", "자스", "js"],
  typescript: ["타입스크립트", "ts"],
  csharp: ["씨샵", "시샵", "씨샾", "시샾", "c샵", "c샾", "csharp"],
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

const getAliasesByKey = (key) => {
  if (LANGUAGE_ALIAS_TABLE[key]) return LANGUAGE_ALIAS_TABLE[key];
  if (key === "go") return LANGUAGE_ALIAS_TABLE.golang || [];
  if (key === "golang") return LANGUAGE_ALIAS_TABLE.go || [];
  return [];
};

export default function BattleRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useLogin();

  const [room, setRoom] = useState(null);
  const [problemTitle, setProblemTitle] = useState("");
  const [languages, setLanguages] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [code, setCode] = useState("");
  const [submitState, setSubmitState] = useState("IDLE");
  const [message, setMessage] = useState(null);
  const [readyLoading, setReadyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState("");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [problems, setProblems] = useState([]);
  const [durationPolicy, setDurationPolicy] = useState(null);
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [kickConfirmOpen, setKickConfirmOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [postGameSeconds, setPostGameSeconds] = useState(null);
  const [startOverlay, setStartOverlay] = useState(null);
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false);
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [judgeSummary, setJudgeSummary] = useState(null);
  const [judgeDetail, setJudgeDetail] = useState(null);
  const [judgeScore, setJudgeScore] = useState(null);
  const [readyCooldownSeconds, setReadyCooldownSeconds] = useState(0);

  const containerRef = useRef(null);
  const violationStateRef = useRef({});

  const myUserId = user?.userId;

  const getViolationState = () => {
    const key = myUserId != null ? String(myUserId) : "anonymous";
    if (!violationStateRef.current[key]) {
      violationStateRef.current[key] = { count: 0, lastAt: 0, auto: false };
    }
    return violationStateRef.current[key];
  };

  const resetViolations = useCallback(() => {
    const key = myUserId != null ? String(myUserId) : "anonymous";
    violationStateRef.current[key] = { count: 0, lastAt: 0, auto: false };
  }, [myUserId]);

  const triggerAutoSurrender = async () => {
    const state = getViolationState();
    if (state.auto) return;
    state.auto = true;
    setMessage("부정행위가 감지되어 몰수패 처리됩니다.");
    const res = await surrender(roomId);
    if (res?.error) {
      setMessage(res.message || "몰수 패배 처리에 실패했습니다.");
      return;
    }
    setRoom(res);
    setShowResult(true);
  };

  const registerViolation = (reason) => {
    if (!(room?.status === "RUNNING" || room?.status === "COUNTDOWN")) return;
    const state = getViolationState();
    const now = Date.now();
    if (now - state.lastAt < 800) return;
    state.lastAt = now;
    const next = Math.min(2, state.count + 1);
    state.count = next;
    setMessage(`${reason} (${next}/2)`);
    if (next >= 2) {
      triggerAutoSurrender();
    }
  };

  const loadRoom = async () => {
    const res = await fetchRoom(roomId);
    if (res?.error) {
      const msg = res.message || "존재하지 않는 방입니다.";
      if (res.code === "B001" || msg.includes("존재하지 않는")) {
        try {
          sessionStorage.setItem("battleLobbyNotice", msg);
        } catch {}
        navigate("/battle", { replace: true });
        return;
      }
      setMessage(msg);
      return;
    }
    setRoom(res);
  };

  const resetToWaiting = useCallback(async () => {
    const res = await resetRoom(roomId);
    if (res?.error) {
      setMessage(res.message || "방 초기화에 실패했습니다.");
      return;
    }
    setRoom(res);
    setShowResult(false);
    setResultData(null);
    setMessage(null);
    resetViolations();
    setJudgeModalOpen(false);
    setJudgeSummary(null);
    setJudgeDetail(null);
    setJudgeScore(null);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [roomId, resetViolations]);

  useEffect(() => {
    loadRoom();
    try {
      const pw = sessionStorage.getItem(`battleRoomPassword:${roomId}`) || "";
      setSavedPassword(pw);
    } catch {
      setSavedPassword("");
    }
    (async () => {
      const langRes = await getLanguages();
      const list = langRes?.data || langRes?.languages || langRes;
      if (Array.isArray(list)) {
        const map = {};
        list.forEach((lang) => {
          const id = lang.languageId ?? lang.id;
          const name = lang.languageName ?? lang.name ?? lang.label;
          if (id) map[id] = name;
        });
        setLanguages(map);
      }
    })();
    (async () => {
      const res = await getProblems({ page: 1, size: 200 });
      const list = res?.data?.problems || res?.problems || res?.data || [];
      if (Array.isArray(list)) setProblems(list);
    })();
    (async () => {
      const res = await fetchDurationPolicy();
      if (!res?.error) {
        setDurationPolicy(res);
      }
    })();
  }, [roomId]);

  useEffect(() => {
    resetViolations();
  }, [roomId, resetViolations]);

  useEffect(() => {
    resetViolations();
  }, [myUserId, resetViolations]);

  useEffect(() => {
    if (room?.status === "WAITING") {
      resetViolations();
    }
  }, [room?.status]);

  useEffect(() => {
    if (!room?.status) return;
    if (room.status === "FINISHED" || room.status === "CANCELED") {
      setMessage(null);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [room?.status]);

  const problemItems = useMemo(
    () =>
      problems.map((p) => {
        const id = p.algoProblemId ?? p.problemId ?? p.id;
        const title = p.algoProblemTitle || p.title || `문제 #${id}`;
        const difficulty = (p.algoProblemDifficulty || p.difficulty || "").toUpperCase();
        return {
          value: id,
          label: `#${id} · ${title}`,
          subLabel: difficulty ? `난이도: ${difficulty}` : null,
          badge: difficulty || null,
        };
      }),
    [problems]
  );

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

  const selectedSettingsProblem = useMemo(() => {
    if (!settings?.algoProblemId) return null;
    return problems.find(
      (p) => String(p.algoProblemId ?? p.problemId ?? p.id) === String(settings.algoProblemId)
    );
  }, [problems, settings?.algoProblemId]);

  const selectedSettingsDefault = useMemo(() => {
    const defaults = durationPolicy?.difficultyDefaults || {};
    const difficulty = (selectedSettingsProblem?.algoProblemDifficulty || selectedSettingsProblem?.difficulty || "").toUpperCase();
    if (difficulty && defaults[difficulty] != null) return defaults[difficulty];
    if (defaults.DEFAULT != null) return defaults.DEFAULT;
    return null;
  }, [durationPolicy, selectedSettingsProblem]);

  const settingsDurationHelper = useMemo(() => {
    const min = durationPolicy?.minMinutes ?? 1;
    const max = durationPolicy?.maxMinutes ?? 120;
    const base = selectedSettingsDefault ?? null;
    const difficulty =
      (selectedSettingsProblem?.algoProblemDifficulty || selectedSettingsProblem?.difficulty || "") || null;
    const defaults = durationPolicy?.difficultyDefaults || {};
    return { min, max, base, difficulty, defaults };
  }, [durationPolicy, selectedSettingsDefault, selectedSettingsProblem]);

  useEffect(() => {
    if (!room?.algoProblemId) return;
    (async () => {
      const res = await getProblem(room.algoProblemId);
      const title =
        res?.data?.algoProblemTitle ||
        res?.algoProblemTitle ||
        res?.data?.title ||
        `문제 #${room.algoProblemId}`;
      setProblemTitle(title);
    })();
  }, [room?.algoProblemId]);

  useEffect(() => {
    if (!room?.startedAt || room.status !== "RUNNING") {
      setElapsedSeconds(0);
      return;
    }
    const startMs = new Date(room.startedAt).getTime();
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.startedAt, room?.status]);

  useEffect(() => {
    const postGameUntil = resultData?.postGameUntil || room?.postGameUntil;
    if (postGameUntil) {
      setShowResult(true);
      const target = new Date(postGameUntil).getTime();
      const tick = () => {
        const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
        setPostGameSeconds(diff);
        if (diff <= 0) {
          resetToWaiting();
        }
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    } else {
      setPostGameSeconds(null);
    }
  }, [room?.postGameUntil, resultData?.postGameUntil, resetToWaiting]);

  useEffect(() => {
    const until = room?.readyCooldownUntil;
    if (!until) {
      setReadyCooldownSeconds(0);
      return;
    }
    const target = new Date(until).getTime();
    if (Number.isNaN(target)) {
      setReadyCooldownSeconds(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setReadyCooldownSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.readyCooldownUntil]);

  useEffect(() => {
    const activePlay = room?.status === "RUNNING" || room?.status === "COUNTDOWN";
    if (!activePlay || !containerRef.current) return undefined;
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
    el.scrollIntoView?.({ block: "start" });
    window.scrollTo({ top: 0, left: 0 });
    window.focus?.();
    const handleKey = (e) => {
      const key = e.key?.toLowerCase();
      if (e.ctrlKey && ["c", "v", "x", "a"].includes(key)) {
        e.preventDefault();
        registerViolation("복사/붙여넣기 단축키가 감지되었습니다.");
      }
      if (e.altKey && key === "tab") {
        registerViolation("창 전환이 감지되었습니다.");
      }
      if (key === "f12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))) {
        e.preventDefault();
        registerViolation("개발자 도구 사용이 감지되었습니다.");
      }
      if (key === "escape") {
        e.preventDefault();
        registerViolation("전체화면이 해제되었습니다.");
        setTimeout(() => {
          if (activePlay && containerRef.current) {
            containerRef.current.requestFullscreen?.().catch(() => {});
            containerRef.current.scrollIntoView?.({ block: "start" });
            window.scrollTo({ top: 0, left: 0 });
          }
        }, 0);
      }
    };
    const handleContext = (e) => {
      e.preventDefault();
      registerViolation("우클릭이 제한되었습니다.");
    };
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const handleBlur = () => {
      registerViolation("창 전환이 감지되었습니다.");
    };
    const handleVisibility = () => {
      if (document.hidden) {
        registerViolation("창 전환이 감지되었습니다.");
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("contextmenu", handleContext);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("contextmenu", handleContext);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [room?.status]);

  useEffect(() => {
    const handleFsChange = () => {
      const activePlay = room?.status === "RUNNING" || room?.status === "COUNTDOWN";
      if (activePlay && containerRef.current && !document.fullscreenElement) {
        registerViolation("전체화면이 해제되었습니다.");
        containerRef.current.requestFullscreen?.().catch(() => {});
        containerRef.current.scrollIntoView?.({ block: "start" });
        window.scrollTo({ top: 0, left: 0 });
        window.focus?.();
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [room?.status]);

  const mergeRoomState = (prev, payload) => {
    if (!payload) return prev || {};
    const merged = { ...(prev || {}), ...payload };
    const keepKeys = [
      "roomId",
      "matchId",
      "title",
      "algoProblemId",
      "languageId",
      "levelMode",
      "betAmount",
      "maxDurationMinutes",
      "isPrivate",
      "createdAt",
    ];
    keepKeys.forEach((k) => {
      if (payload[k] === null || payload[k] === undefined) {
        merged[k] = prev ? prev[k] : merged[k];
      }
    });
    if (!payload.participants && prev?.participants) {
      merged.participants = prev.participants;
    }
    return merged;
  };

  const { status: wsStatus, sendReady, sendSubmit } = useBattleWebSocket({
    accessToken,
    roomId,
    onRoomState: (payload) => {
      setRoom((prev) => mergeRoomState(prev, payload));
      setReadyLoading(false);
    },
    onCountdown: ({ seconds }) => setCountdown(seconds),
    onStart: (payload) => {
      setRoom((prev) => mergeRoomState(prev, payload));
      setCountdown(null);
      setStartOverlay("START");
      setTimeout(() => setStartOverlay(null), 1500);
    },
    onSubmitResult: (payload) => {
      if (payload?.userId === myUserId) {
        const accepted = payload?.accepted !== false;
        if (!accepted) {
          setSubmitState("IDLE");
          setMessage(payload?.judgeSummary || payload?.message || "AI 오류! 채점을 다시 눌러주세요.");
          return;
        }
        setSubmitState("DONE");
        setJudgeScore(payload?.baseScore ?? null);
        const summary = payload?.judgeSummary || payload?.message || null;
        const detail = payload?.judgeDetail || payload?.message || null;
        if (summary || detail) {
          setJudgeSummary(summary);
          setJudgeDetail(detail);
          setJudgeModalOpen(true);
        } else if (payload?.message) {
          setMessage(payload.message);
        }
      }
    },
    onFinish: (payload) => {
      if (payload?.matchId) {
        setResultData(payload);
      }
      setRoom((prev) => ({
        ...(prev || {}),
        status: "FINISHED",
        winnerUserId: payload?.winnerUserId ?? prev?.winnerUserId,
        winReason: payload?.winReason ?? prev?.winReason,
        postGameUntil: payload?.postGameUntil ?? prev?.postGameUntil,
      }));
      setSubmitState("DONE");
      setShowResult(true);
      setJudgeModalOpen(false);
      loadRoom();
    },
    onError: (payload) => {
      const code = payload?.code;
      const msg = payload?.message || "서버 오류가 발생했습니다.";
      setMessage(msg);
      if (code === "B025" || code === "B026") {
        const notice = "방에서 강퇴당하였습니다.";
        try {
          sessionStorage.setItem("battleLobbyNotice", notice);
        } catch {}
        navigate("/battle", { replace: true });
        return;
      }
      if (code === "B032") {
        const notice = msg || "방 설정 변경 규칙에 맞지 않아 로비로 나갑니다.";
        try {
          sessionStorage.setItem("battleLobbyNotice", notice);
        } catch {}
        navigate("/battle", { replace: true });
        return;
      }
      if (code === "B001") {
        const notice = msg || "존재하지 않는 방입니다.";
        try {
          sessionStorage.setItem("battleLobbyNotice", notice);
        } catch {}
        navigate("/battle", { replace: true });
      }
    },
  });

  const participants = useMemo(() => room?.participants || {}, [room]);
  const host = room?.hostUserId ? participants[room.hostUserId] : null;
  const guest = room?.guestUserId ? participants[room.guestUserId] : null;
  const buildResultParticipant = (userId, state) => {
    if (!userId) return null;
    return {
      userId,
      nickname:
        state?.nickname ||
        state?.nickName ||
        state?.userNickname ||
        state?.name ||
        `사용자#${userId}`,
      grade: state?.grade ?? state?.userGrade ?? state?.level ?? null,
      baseScore: state?.baseScore ?? null,
      bonusScore: state?.timeBonus ?? null,
      finalScore: state?.finalScore ?? null,
      elapsedMs: state?.elapsedSeconds != null ? state.elapsedSeconds * 1000 : null,
      judgeMessage: state?.judgeMessage || state?.review || state?.message || null,
    };
  };
  const resultHost = resultData?.host || buildResultParticipant(room?.hostUserId, host);
  const resultGuest = resultData?.guest || buildResultParticipant(room?.guestUserId, guest);
  const resultWinnerId = resultData?.winnerUserId ?? room?.winnerUserId ?? null;
  const winReason = resultData?.winReason ?? room?.winReason ?? null;
  const iAmHost = room?.hostUserId && room.hostUserId === myUserId;
  const iAmGuest = room?.guestUserId && room.guestUserId === myUserId;
  const isParticipant = iAmHost || iAmGuest;
  const isJudgeLocked = judgeModalOpen && room?.status === "RUNNING";
  const headCount = useMemo(() => {
    if (room?.headCount != null) return room.headCount;
    const ids = new Set();
    if (room?.hostUserId) ids.add(room.hostUserId);
    if (room?.guestUserId) ids.add(room.guestUserId);
    Object.keys(participants || {}).forEach((id) => ids.add(Number(id)));
    return ids.size;
  }, [room?.headCount, room?.hostUserId, room?.guestUserId, participants]);

  const roomOpen =
    room &&
    (room.status === "WAITING" || room.status === "COUNTDOWN") &&
    (room.guestUserId == null || room.hostUserId == null);
  const languageName = useMemo(() => languages[room?.languageId] || "java", [languages, room?.languageId]);

  const handleReady = () => {
    setMessage(null);
    if (wsStatus !== "CONNECTED") {
      setMessage("서버 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setReadyLoading(true);
    const current = participants[myUserId];
    const nextReady = !(current?.ready);
    sendReady(roomId, nextReady);
  };

  const handleLeave = async () => {
    if (room?.status === "RUNNING" || room?.status === "COUNTDOWN") {
      setSurrenderConfirmOpen(true);
      return;
    }
    await leaveRoom(roomId);
    navigate("/battle");
  };

  const handleJoin = async () => {
    if (!room?.isPrivate) {
      const res = await joinRoom(roomId, null);
      if (res?.error) {
        setMessage(mapJoinError(res));
        return;
      }
      setRoom(res);
      return;
    }
    setJoinModalOpen(true);
    setJoinPassword("");
    setJoinError("");
  };

  const submitJoinWithPassword = async () => {
    if (!/^\d{4}$/.test(joinPassword)) {
      setJoinError("비밀번호는 숫자 4자리로 입력해 주세요.");
      return;
    }
    const res = await joinRoom(roomId, joinPassword);
    if (res?.error) {
      setJoinError(mapJoinError(res));
      return;
    }
    try {
      sessionStorage.setItem(`battleRoomPassword:${roomId}`, joinPassword);
      setSavedPassword(joinPassword);
    } catch {}
    setRoom(res);
    setJoinModalOpen(false);
    setJoinPassword("");
    setJoinError("");
  };
  const handleSubmit = () => {
    if (isJudgeLocked) {
      return;
    }
    if (!room?.algoProblemId || !room?.languageId) {
      setMessage("문제 또는 언어 정보가 없습니다.");
      return;
    }
    if (room?.status !== "RUNNING") {
      setMessage("진행중에만 제출할 수 있습니다.");
      return;
    }
    if (wsStatus !== "CONNECTED") {
      setMessage("서버 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSubmitState("SENDING");
    sendSubmit({
      roomId,
      languageId: room.languageId,
      problemId: room.algoProblemId,
      source: code,
    });
  };

  const handleKick = async () => {
    const res = await kickGuest(roomId);
    if (res?.error) {
      setMessage(res.message);
      return;
    }
    setRoom(res);
    setKickConfirmOpen(false);
  };

  const handleSurrender = async () => {
    const res = await surrender(roomId);
    setSurrenderConfirmOpen(false);
    if (res?.error) {
      setMessage(res.message || "몰수 패배 처리에 실패했습니다.");
      return;
    }
    setRoom(res);
    setShowResult(true);
  };

  const openSettings = () => {
    if (!room) return;
    setSettings({
      title: room.title || "",
      algoProblemId: room.algoProblemId,
      languageId: room.languageId,
      levelMode: room.levelMode,
      betAmount: room.betAmount,
      maxDurationMinutes: room.maxDurationMinutes,
      isPrivate: room.isPrivate,
      newPassword: "",
    });
    setShowSettingsPassword(false);
    setSettingsOpen(true);
    setSettingsError("");
  };

  if (!room) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-gray-600">방 정보를 불러오는 중...</p>
      </div>
    );
  }

  const readyText = participants[myUserId]?.ready ? "준비 취소" : "준비";
  const readyDisabled =
    readyLoading ||
    readyCooldownSeconds > 0 ||
    room.status === "RUNNING" ||
    room.status === "FINISHED" ||
    room.status === "CANCELED";
  const winReasonDetail = formatWinReasonDetail(winReason, resultWinnerId, resultHost, resultGuest);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{room.title || `방 ${roomId}`}</h1>
          {room.isPrivate && <span className="text-sm text-gray-600">비밀방</span>}
        </div>
        <div className="flex items-center gap-2">
          {iAmHost && room.status === "WAITING" && (
            <button
              type="button"
              onClick={openSettings}
              className="px-4 py-2 rounded border border-gray-200 hover:border-gray-300"
            >
              설정
            </button>
          )}
          <button
            type="button"
            onClick={handleLeave}
            className="px-4 py-2 rounded border border-gray-200 hover:border-gray-300"
          >
            나가기
          </button>
        </div>
      </div>

      {message && <div className="text-sm text-red-600">{message}</div>}

      <div className="flex flex-wrap gap-2 items-center">
        <InfoChip label="상태" value={STATUS_LABEL[room.status] || room.status} />
        <InfoChip label="인원" value={`${headCount}/2`} />
        <InfoChip label="베팅" value={formatPoint(room.betAmount)} />
        <InfoChip label="문제" value={problemTitle || "-"} />
        <InfoChip label="언어" value={languageName || `언어 #${room.languageId || "-"}`} />
        <InfoChip label="매칭" value={levelModeText(room.levelMode)} />
        <InfoChip label="최대 진행" value={`${room.maxDurationMinutes || "-"}분`} />
        {countdown != null && room.status === "COUNTDOWN" && (
          <InfoChip label="카운트다운" value={`${countdown}초`} />
        )}
        {room.startedAt && room.status === "RUNNING" && (
          <InfoChip label="경과" value={formatElapsed(elapsedSeconds)} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ParticipantCard title="방장" userId={room.hostUserId} state={host} />
        <ParticipantCard
          title="유저"
          userId={room.guestUserId}
          state={guest}
          onKick={iAmHost && room.status === "WAITING" && room.guestUserId ? () => setKickConfirmOpen(true) : undefined}
        />
      </div>

      {isParticipant ? (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          {room.status !== "RUNNING" && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span>준비 후 두 명 모두 준비 완료 시 자동으로 카운트다운 후 시작합니다.</span>
              {room.betAmount > 0 && <span className="text-red-600">베팅 방은 포인트가 홀드됩니다.</span>}
            </div>
          )}
          <div className="flex items-center gap-2">
            {room.status !== "RUNNING" && (
              <button
                type="button"
                onClick={handleReady}
                disabled={readyDisabled || isJudgeLocked}
                className={`px-4 py-2 rounded ${participants[myUserId]?.ready ? "bg-red-600 text-white" : "bg-blue-600 text-white"} disabled:opacity-60`}
              >
                {readyText}
              </button>
            )}
            {room.status === "RUNNING" && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitState === "SENDING" || wsStatus !== "CONNECTED" || isJudgeLocked}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitState === "SENDING" ? "채점 요청 중..." : "제출"}
              </button>
            )}
          </div>
          {readyCooldownSeconds > 0 && (
            <div className="text-xs text-gray-600">
              방 설정이 변경되어 {readyCooldownSeconds}s 후 준비 가능합니다.
            </div>
          )}
          {room.status === "RUNNING" && (
            <div className="space-y-2">
              <div className="text-sm text-gray-700">문제: {problemTitle}</div>
              <CodeEditor
                language={languageName}
                value={code}
                onChange={(val) => setCode(val ?? "")}
                readOnly={isJudgeLocked}
                className="border rounded"
              />
            </div>
          )}
          {room.status === "FINISHED" && (
            <div className="text-sm text-gray-700">
              게임이 종료되었습니다. 결과를 확인하세요.
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            방에 참가하려면 입장을 눌러주세요.
          </div>
          <button
            type="button"
            onClick={handleJoin}
            disabled={!roomOpen}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            입장
          </button>
        </div>
      )}

      {room && (
        <div className="text-sm text-gray-700 space-y-1">
          <div>생성 시간: {room.createdAt ? new Date(room.createdAt).toLocaleString() : "-"}</div>
          {savedPassword && <div className="text-xs text-gray-500">저장된 비밀번호가 있습니다.</div>}
        </div>
      )}

      {countdown != null && room.status === "COUNTDOWN" && (
        <div className="fixed inset-0 bg-black/70 text-white flex items-center justify-center z-40">
          <div className="text-7xl font-extrabold">{countdown}</div>
        </div>
      )}

      {startOverlay && (
        <div className="fixed inset-0 bg-black/60 text-white flex items-center justify-center z-40">
          <div className="text-6xl font-extrabold animate-pulse">{startOverlay}</div>
        </div>
      )}
      {joinModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">비밀방 입장</h3>
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="text-gray-500 text-sm"
              >
                닫기
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-700">비밀번호 (숫자 4자리)</label>
              <div className="flex items-center border rounded px-2 py-1 bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  value={joinPassword}
                  maxLength={4}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setJoinPassword(digits);
                    if (digits.length === 4) {
                      setJoinError("");
                    }
                  }}
                  className="flex-1 outline-none text-sm"
                  placeholder="****"
                />
                <button
                  type="button"
                  className="text-xs text-gray-600 ml-1"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>
              {joinError && <div className="text-xs text-red-600">{joinError}</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-3 py-2 text-sm rounded border border-gray-200 hover:border-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitJoinWithPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                입장
              </button>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && settings && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">방 설정</h3>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={settings.isPrivate}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, isPrivate: e.target.checked, newPassword: "" }))
                      }
                    />
                    <span>🔒 비밀방</span>
                  </label>
                  {settings.isPrivate && (
                    <div className="flex items-center border rounded px-2 py-1 bg-white">
                      <input
                        type={showSettingsPassword ? "text" : "password"}
                        maxLength={4}
                        value={settings.newPassword}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            newPassword: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        className="w-24 outline-none text-sm"
                        placeholder="숫자4자리"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSettingsPassword((v) => !v)}
                        className="text-gray-600 text-xs ml-1"
                        aria-label="비밀번호 보기"
                      >
                        {showSettingsPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  )}
                </div>
                {settings.isPrivate && settings.newPassword.length > 0 && settings.newPassword.length < 4 && (
                  <div className="text-xs text-red-600 text-right">비밀번호는 숫자 4자리로 입력해 주세요.</div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">방 제목</label>
                <input
                  value={settings.title}
                  onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  placeholder="방 제목"
                  maxLength={50}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <label className="text-sm font-semibold text-gray-700">문제 선택</label>
                    {settings.algoProblemId && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, algoProblemId: "" }))}
                        className="w-9 h-9 flex items-center justify-center rounded-md border border-red-200 text-red-600 text-lg"
                        aria-label="문제 선택 해제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <SearchableCombobox
                    label={null}
                    items={problemItems}
                    value={settings.algoProblemId}
                    onChange={(val) => setSettings((prev) => ({ ...prev, algoProblemId: val }))}
                    placeholder="문제를 선택해 주세요"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <label className="text-sm font-semibold text-gray-700">언어 선택</label>
                    {settings.languageId && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, languageId: "" }))}
                        className="w-9 h-9 flex items-center justify-center rounded-md border border-red-200 text-red-600 text-lg"
                        aria-label="언어 선택 해제"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <SearchableCombobox
                    label={null}
                    items={languageItems}
                    value={settings.languageId}
                    onChange={(val) => setSettings((prev) => ({ ...prev, languageId: val }))}
                    placeholder="언어를 선택해 주세요"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">매칭 규칙</label>
                  <select
                    value={settings.levelMode}
                    onChange={(e) => setSettings((prev) => ({ ...prev, levelMode: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="SAME">동일 레벨만</option>
                    <option value="ANY">제한 없음</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">베팅 금액(P)</label>
                  <input
                    type="number"
                    min="0"
                    max="99999"
                    value={settings.betAmount}
                    onChange={(e) => setSettings((prev) => ({ ...prev, betAmount: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">최대 진행시간</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.maxDurationMinutes || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, maxDurationMinutes: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <div>
                    비워두면 서버 기본값 적용 (허용 범위 {settingsDurationHelper.min}~{settingsDurationHelper.max}분)
                  </div>
                  {settingsDurationHelper.defaults &&
                    Object.keys(settingsDurationHelper.defaults).length > 0 && (
                      <div className="border rounded p-2 bg-gray-50">
                        <div className="font-semibold text-gray-700 mb-1">난이도별 기본시간</div>
                        <div className="grid grid-cols-2 gap-1 text-gray-700">
                          {["BRONZE", "SILVER", "GOLD", "PLATINUM"]
                            .filter((k) => settingsDurationHelper.defaults[k] !== undefined)
                            .map((k) => (
                              <div key={k} className="flex items-center justify-between text-xs">
                                <DifficultyBadge value={k} />
                                <span className="tabular-nums">{settingsDurationHelper.defaults[k]}분</span>
                              </div>
                            ))}
                        </div>
                        {settingsDurationHelper.defaults.DEFAULT !== undefined && (
                          <div className="text-[11px] text-gray-600 mt-2">
                            * 난이도 정보가 없으면 DEFAULT: {settingsDurationHelper.defaults.DEFAULT}분 적용
                          </div>
                        )}
                      </div>
                    )}
                  {settingsDurationHelper.base && (
                    <div>
                      선택 문제 기준 기본값: {settingsDurationHelper.base}분
                      {settingsDurationHelper.difficulty
                        ? ` (난이도: ${settingsDurationHelper.difficulty})`
                        : ""}
                    </div>
                  )}
                </div>
              </div>
              {settingsError && <div className="text-sm text-red-600">{settingsError}</div>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-3 py-2 text-sm rounded border border-gray-200 hover:border-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={async () => {
                  setSettingsError("");
                  if (!settings.title.trim()) {
                    setSettingsError("방 제목을 입력해 주세요.");
                    return;
                  }
                  if (!settings.algoProblemId || !settings.languageId) {
                    setSettingsError("문제와 언어를 선택해 주세요.");
                    return;
                  }
                  if (settings.isPrivate && (!settings.newPassword || settings.newPassword.length !== 4)) {
                    setSettingsError("비밀방은 새 비밀번호 4자리가 필요합니다.");
                    return;
                  }
                  const payload = {
                    title: settings.title.trim(),
                    algoProblemId: Number(settings.algoProblemId),
                    languageId: Number(settings.languageId),
                    levelMode: settings.levelMode,
                    betAmount: Number(settings.betAmount || 0),
                    maxDurationMinutes: settings.maxDurationMinutes ? Number(settings.maxDurationMinutes) : undefined,
                    isPrivate: settings.isPrivate,
                    ...(settings.isPrivate && settings.newPassword ? { newPassword: settings.newPassword } : {}),
                  };
                  setSavingSettings(true);
                  const res = await updateRoom(roomId, payload);
                  setSavingSettings(false);
                  if (res?.error) {
                    setSettingsError(res.message || "설정 변경에 실패했습니다.");
                    return;
                  }
                  setRoom(res);
                  if (payload.newPassword) {
                    try {
                      sessionStorage.setItem(`battleRoomPassword:${roomId}`, payload.newPassword);
                      setSavedPassword(payload.newPassword);
                    } catch {}
                  } else if (!payload.isPrivate) {
                    try {
                      sessionStorage.removeItem(`battleRoomPassword:${roomId}`);
                      setSavedPassword("");
                    } catch {}
                  }
                  setSettingsOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {savingSettings ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {kickConfirmOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">강퇴 확인</h3>
              <button
                type="button"
                onClick={() => setKickConfirmOpen(false)}
                className="text-gray-500 text-sm"
              >
                닫기
              </button>
            </div>
            <p className="text-sm text-gray-800">상대를 강퇴하시겠습니까?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setKickConfirmOpen(false)}
                className="px-3 py-2 text-sm rounded border border-gray-200 hover:border-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleKick}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                강퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {surrenderConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">나가기 경고</h3>
              <button
                type="button"
                onClick={() => setSurrenderConfirmOpen(false)}
                className="text-sm text-gray-500"
              >
                닫기
              </button>
            </div>
            <p className="text-sm text-gray-700">
              지금 나가면 몰수패 처리됩니다. 나가시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSurrenderConfirmOpen(false)}
                className="px-3 py-2 text-sm rounded border border-gray-200 hover:border-gray-300"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={handleSurrender}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                나가기(몰수)
              </button>
            </div>
          </div>
        </div>
      )}

      {judgeModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">제출 완료! AI 평가</h3>
              <span className="text-sm text-gray-500">상대방 제출 대기 중...</span>
            </div>
            <div className="text-sm text-gray-700">
              AI 점수: {formatScore(judgeScore)} / 100.00
              <span className="text-xs text-gray-500 ml-2">(시간 보너스는 정산에서 합산)</span>
            </div>
            {judgeSummary && (
              <div className="text-sm text-gray-700">
                한줄평: {judgeSummary}
              </div>
            )}
            <div className="text-sm text-gray-700 whitespace-pre-wrap border rounded p-3 bg-gray-50 max-h-[50vh] overflow-y-auto">
              {judgeDetail || "평가 결과가 없습니다."}
            </div>
          </div>
        </div>
      )}

      {showResult && (room.status === "FINISHED" || room.status === "CANCELED") && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">정산 중</h3>
              <span className="text-sm text-gray-500">
                {postGameSeconds != null ? `자동 복귀 ${postGameSeconds}s` : ""}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                승자: {resultWinnerId
                  ? (resultWinnerId === resultHost?.userId
                      ? resultHost?.nickname
                      : resultWinnerId === resultGuest?.userId
                        ? resultGuest?.nickname
                        : null) || `사용자#${resultWinnerId}`
                  : "없음"}
              </div>
              <div>정산: {resultData?.settlementStatus || "정보 없음"}</div>
              <div>베팅: {resultData?.betAmount != null ? formatPoint(resultData.betAmount) : "0 P"}</div>
              {winReason && <div>승리 사유: {winReasonDetail}</div>}
              <div className="text-xs text-gray-500">
                시간차는 1초당 0.01점 보너스를 지급합니다.
              </div>
            </div>
            {room.status === "FINISHED" && (
              <div>
                <table className="min-w-full text-sm border rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">참가자</th>
                      <th className="px-3 py-2 text-right">Base</th>
                      <th className="px-3 py-2 text-right">Bonus</th>
                      <th className="px-3 py-2 text-right">Final</th>
                      <th className="px-3 py-2 text-right">시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { role: "방장", data: resultHost },
                      { role: "유저", data: resultGuest },
                    ].map((row, idx) => {
                      if (!row.data?.userId) return null;
                      const isWinner = resultWinnerId && row.data.userId === resultWinnerId;
                      const isDraw = !resultWinnerId;
                      const isForfeit = isForfeitReason(winReason);
                      const rowClass = isDraw
                        ? "bg-green-50"
                        : isWinner
                          ? "bg-blue-50"
                          : "bg-red-50";
                      const badgeClass = isDraw
                        ? "bg-green-100 text-green-700"
                        : isWinner
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700";
                      const badgeText = isDraw
                        ? "무승부"
                        : isWinner
                          ? "승리"
                          : isForfeit
                            ? "몰수패"
                            : "패배";
                      return (
                        <tr key={`${row.data.userId}-${idx}`} className={`border-t ${rowClass}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <GradeGem grade={row.data.grade} size={12} />
                                <span>{row.data.nickname || `사용자#${row.data.userId}`} ({row.role})</span>
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
                            </div>
                            {row.data.judgeMessage && (
                              <div className="text-xs text-gray-500 mt-1 max-w-[420px] truncate">
                                평가: {row.data.judgeMessage}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">{formatScore(row.data.baseScore)}</td>
                          <td className="px-3 py-2 text-right">{formatScore(row.data.bonusScore)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatScore(row.data.finalScore)}</td>
                          <td className="px-3 py-2 text-right">{formatElapsedMs(row.data.elapsedMs)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetToWaiting();
                }}
                className="px-4 py-2 rounded border border-gray-200 hover:border-gray-300"
              >
                방으로 돌아가기
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await leaveRoom(roomId);
                  if (res?.error) {
                    if (res.code !== "B001") {
                      setMessage(res.message || "로비 이동에 실패했습니다.");
                      return;
                    }
                  }
                  navigate("/battle");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                로비로 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function formatElapsed(seconds) {
  if (!seconds && seconds !== 0) return "-";
  const s = Number(seconds);
  if (Number.isNaN(s) || s < 0) return "-";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatElapsedMs(ms) {
  if (!ms && ms !== 0) return "-";
  const num = Number(ms);
  if (Number.isNaN(num) || num < 0) return "-";
  return formatElapsed(Math.floor(num / 1000));
}

function formatScore(val) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(2);
}

function isForfeitReason(reason) {
  if (!reason) return false;
  const upper = String(reason).toUpperCase();
  return upper === "SURRENDER" || upper === "DISCONNECT";
}

function formatWinReason(reason) {
  if (!reason) return "-";
  const upper = String(reason).toUpperCase();
  if (upper === "SURRENDER") return "몰수패";
  if (upper === "DISCONNECT") return "몰수패(이탈)";
  if (upper === "SCORE") return "점수 승리";
  if (upper === "ACCEPTED") return "정답 제출";
  if (upper === "TIMEOUT") return "시간 종료";
  if (upper === "DRAW") return "무승부";
  if (upper === "CANCELED") return "취소";
  return reason;
}

function formatWinReasonDetail(reason, winnerId, host, guest) {
  if (!reason) return "-";
  const upper = String(reason).toUpperCase();
  const winner =
    winnerId && host?.userId === winnerId
      ? host
      : winnerId && guest?.userId === winnerId
        ? guest
        : null;
  const loser = winner
    ? winner.userId === host?.userId
      ? guest
      : host
    : null;
  if (upper === "SURRENDER" || upper === "DISCONNECT") {
    const loserName = loser?.nickname || (loser?.userId ? `사용자#${loser.userId}` : "상대");
    return `${loserName}의 몰수패로`;
  }
  if (upper === "SCORE" && winner && loser) {
    const winScore = Number(winner.finalScore);
    const loseScore = Number(loser.finalScore);
    if (!Number.isNaN(winScore) && !Number.isNaN(loseScore)) {
      return `${Math.abs(winScore - loseScore).toFixed(2)}점 차이로 승리`;
    }
  }
  return formatWinReason(upper);
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

function InfoChip({ label, value }) {
  return (
    <span className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 text-gray-800">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function ParticipantCard({ title, userId, state, onKick }) {
  if (!userId) {
    return (
      <div className="border rounded p-3 bg-gray-50 text-gray-500">
        {title} 대기중
      </div>
    );
  }
  const highlight = state?.ready;
  const displayName =
    state?.nickname ||
    state?.name ||
    state?.nickName ||
    state?.userNickname ||
    `사용자#${userId}`;
  const pointBalance = state?.pointBalance;
  const grade = state?.grade ?? state?.userGrade ?? state?.level ?? null;
  return (
    <div className={`relative border rounded p-3 ${highlight ? "bg-green-50 border-green-200" : "bg-white"}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="font-semibold text-gray-900 flex items-center gap-1">
            <GradeGem grade={grade} size={14} />
            <span>{displayName}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">보유 포인트: {formatPoint(pointBalance)}</div>
        </div>
        {onKick && (
          <button
            type="button"
            onClick={onKick}
            className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
          >
            강퇴
          </button>
        )}
      </div>
      <div
        className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded ${
          highlight ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
        }`}
      >
        {highlight ? "준비완료" : "대기"}
      </div>
    </div>
  );
}

function levelModeText(mode) {
  if (!mode) return "제한 없음";
  const upper = String(mode).toUpperCase();
  if (upper.includes("SAME")) return "동일 레벨만";
  return "제한 없음";
}

function formatPoint(val) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return "-";
  return `${num.toLocaleString("ko-KR")} P`;
}

function mapJoinError(res) {
  const code = res?.code;
  const msg = res?.message || "";
  if (code === "B018") return "잘못된 비밀번호이거나 존재하지 않는 방입니다.";
  if (code === "B002") return "가득 찬 방입니다.";
  if (code === "B027") return msg || "아직 게임이 종료되지 않았습니다.";
  if (code === "B032") return msg || "동일 레벨이 아닙니다.";
  return msg || "입장에 실패했습니다.";
}

const GRADE_GEMS = {
  1: { name: "에메랄드", main: "#34d399", light: "#bbf7d0", dark: "#059669" },
  2: { name: "사파이어", main: "#60a5fa", light: "#bfdbfe", dark: "#2563eb" },
  3: { name: "루비", main: "#f87171", light: "#fecaca", dark: "#dc2626" },
  4: { name: "다이아", main: "#67e8f9", light: "#cffafe", dark: "#0891b2" },
  5: { name: "아메시스트", main: "#c084fc", light: "#e9d5ff", dark: "#7c3aed" },
};

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
