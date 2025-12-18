import axiosInstance from "../../server/AxiosConfig";

// ✅ 인터셉터가 토큰 자동 처리 → headers 불필요!
export const sendChatMessage = async (payload) => {
  const res = await axiosInstance.post("/chat/messages", payload);
  return res.data;
};

// ✅ 기본값 + 자동 파라미터 처리
export const getChatMessages = async (sessionId = "1", limit = "50", userId = "") => {
  const res = await axiosInstance.get("/chat/messages", {
    params: { sessionId, limit, userId }
  });
  return res.data;
};
