import axiosInstance from "../../server/AxiosConfig";
const readStoredAccessToken = () => {
  try {
    const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.accessToken) return parsed.accessToken;
    }
  } catch {}
  const legacyAccess = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  return legacyAccess || null;
};


const unwrap = (res) => res?.data?.data ?? res?.data;

const handleError = (err, fallback) => {
  const message =
    err?.response?.data?.message ||
    err?.message ||
    fallback ||
    "서버 요청 처리 중 문제가 발생했습니다.";
  return { error: true, message, code: err?.response?.data?.code };
};

const buildConfig = () => {
  const accessToken = readStoredAccessToken();
  return {
    headers: {
      "X-Skip-Auth-Redirect": "true",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    _skipAuthRedirect: true,
  };
};

export const fetchRooms = async (params = {}) => {
  try {
    const cfg = buildConfig();
    cfg.params = params;
    const res = await axiosInstance.get("/battle/rooms", cfg);
    return unwrap(res);
  } catch (err) {
    return handleError(err, "방 목록을 불러오는 중 오류가 발생했습니다.");
  }
};

export const fetchRoom = async (roomId) => {
  try {
    const res = await axiosInstance.get(`/battle/rooms/${roomId}`, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "방 정보를 불러오는 중 오류가 발생했습니다.");
  }
};

export const fetchMyRoom = async () => {
  try {
    const res = await axiosInstance.get("/battle/rooms/me", buildConfig());
    if (res?.status === 204) return null;
    return unwrap(res);
  } catch (err) {
    if (err?.response?.status === 204) return null;
    return handleError(err, "내 방 정보를 불러오는 중 오류가 발생했습니다.");
  }
};

export const createRoom = async (payload) => {
  try {
    const res = await axiosInstance.post("/battle/rooms", payload, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, err?.response?.data?.message || "방 생성에 실패했습니다.");
  }
};

export const joinRoom = async (roomId, password) => {
  try {
    const cfg = buildConfig();
    const res = await axiosInstance.post(
      `/battle/rooms/${roomId}/join`,
      password ? { password } : {},
      {
        ...cfg,
        headers: {
          ...cfg.headers,
          "Content-Type": "application/json",
        },
      }
    );
    return unwrap(res);
  } catch (err) {
    return handleError(err, "입장에 실패했습니다.");
  }
};

export const leaveRoom = async (roomId) => {
  try {
    const res = await axiosInstance.post(`/battle/rooms/${roomId}/leave`, null, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "방 나가기에 실패했습니다.");
  }
};

export const updateRoom = async (roomId, payload) => {
  try {
    const res = await axiosInstance.patch(`/battle/rooms/${roomId}`, payload, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "방 설정 변경에 실패했습니다.");
  }
};

export const kickGuest = async (roomId) => {
  try {
    const res = await axiosInstance.post(`/battle/rooms/${roomId}/kick`, null, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "강퇴에 실패했습니다.");
  }
};

export const resetRoom = async (roomId) => {
  try {
    const res = await axiosInstance.post(`/battle/rooms/${roomId}/reset`, null, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "방 초기화에 실패했습니다.");
  }
};

export const surrender = async (roomId) => {
  try {
    const res = await axiosInstance.post(`/battle/rooms/${roomId}/surrender`, null, buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "몰수 패배 처리에 실패했습니다.");
  }
};

export const fetchDurationPolicy = async () => {
  try {
    const res = await axiosInstance.get("/battle/policies/duration", buildConfig());
    return unwrap(res);
  } catch (err) {
    return handleError(err, "진행시간 정책을 불러오지 못했습니다.");
  }
};
