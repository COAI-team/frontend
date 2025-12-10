import axiosInstance from "../../server/AxiosConfig";

// 채팅 메시지 보내기 (보호됨: POST /chat/messages)
export const sendChatMessage = async (payload) => {
    try {
        const token = localStorage.getItem("accessToken");
        const res = await axiosInstance.post("/chat/messages", payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (err) {
        console.error("❌ [sendChatMessage] 오류:", err);
        return { error: err };
    }
};

// 채팅 메시지 조회 (GET /chat/messages, 현재는 permitAll 이라 토큰 없어도 동작)
export const getChatMessages = async (sessionId, limit, userId) => {
    try {
        const params = {
            sessionId: sessionId?.toString() ?? "1",
            limit: limit?.toString() ?? "50",
            userId: userId?.toString() ?? ""
        };

        const res = await axiosInstance.get("/chat/messages", { params });

        return res.data;
    } catch (err) {
        console.error("❌ [getChatMessages] 오류:", err);
        return { error: err };
    }
};