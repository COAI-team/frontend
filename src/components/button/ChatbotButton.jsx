import { useState, useEffect, useContext, useRef } from "react";
import { AiOutlineMessage, AiOutlineClose, AiFillRobot, AiOutlineArrowDown } from "react-icons/ai";
import { LoginContext } from "../../context/login/LoginContext";
import { sendChatMessage, getChatMessages } from "../../service/chat/Chatbot.js";

export default function ChatbotButton() {
    const { user, hydrated, isAlertOpen } = useContext(LoginContext);

    const [isOpen, setIsOpen] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(60);

    const [messages, setMessages] = useState([
        { id: 0, sender: "ai", text: "안녕하세요! 무엇을 도와드릴까요?" }
    ]);

    const [inputValue, setInputValue] = useState("");
    const [nextId, setNextId] = useState(1);
    const messagesEndRef = useRef(null);

    // 스크롤 이벤트
    useEffect(() => {
        const scrollArea = document.getElementById("scrollArea");
        if (!scrollArea) return;

        const handleScroll = () => setBottomOffset(60);
        scrollArea.addEventListener("scroll", handleScroll);
        return () => scrollArea.removeEventListener("scroll", handleScroll);
    }, []);

    // 자동 스크롤 맨 아래로 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 채팅창 열 때 히스토리 불러오기
    useEffect(() => {
        if (!isOpen) return;

        const fetchHistory = async () => {
            try {
                const res = await getChatMessages(1, 50);

                if (!res || res.error || !res.messages) {
                    console.warn("No chat history available");
                    return;
                }

                const historyMessages = res.messages.map((msg, index) => ({
                    id: index + 1,
                    sender: msg.role === "assistant" ? "ai" : "user",
                    text: formatMessageText(msg.content),
                }));

                setMessages([
                    { id: 0, sender: "ai", text: "안녕하세요! 무엇을 도와드릴까요?" },
                    ...historyMessages
                ]);

                setNextId(historyMessages.length + 2);
            } catch (err) {
                console.error("getChatMessages error:", err);
            }
        };

        fetchHistory();
    }, [isOpen]);

    // 메시지 텍스트 formatting
    const formatMessageText = (text) => {
        if (!text) return "";
        return (
            text
                .trim()
                .replaceAll(/\n{3,}/g, "\n\n")
                .slice(0, 500) + (text.length > 500 ? "..." : "")
        );
    };

    if (!hydrated || !user || isAlertOpen) return null;

    const handleSend = async () => {
        const content = inputValue.trim();
        if (!content) return;

        const userMsgId = nextId;
        setNextId((prev) => prev + 1);

        // 유저 메시지 화면에 바로 출력
        setMessages((prev) => [
            ...prev,
            { id: userMsgId, sender: "user", text: content },
        ]);
        setInputValue("");

        try {
            const res = await sendChatMessage({
                content,
                userId: user.userId,
            });

            const serverMessages = res.messages ?? [];
            const lastAssistant = [...serverMessages].reverse().find((m) => m.role === "assistant");

            if (lastAssistant) {
                const aiMsgId = userMsgId + 1;
                setNextId((prev) => Math.max(prev, aiMsgId + 1));

                const formattedText = formatMessageText(lastAssistant.content);

                setMessages((prev) => [
                    ...prev,
                    { id: aiMsgId, sender: "ai", text: formattedText },
                ]);
            }
        } catch (err) {
            console.error("❌ sendChatMessage error:", err);

            const aiMsgId = userMsgId + 1;

            setMessages((prev) => [
                ...prev,
                {
                    id: aiMsgId,
                    sender: "ai",
                    text: "서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                },
            ]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-35 bottom-20 z-9999 w-16 h-16 rounded-full
                           bg-linear-to-br from-blue-500 via-blue-600 to-blue-700
                           hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
                           flex items-center justify-center shadow-2xl
                           transition-all duration-300 active:scale-95
                           dark:from-blue-600 dark:via-blue-700 dark:to-blue-800"
                style={{ bottom: bottomOffset + 5 }}
            >
                {isOpen ? (
                    <AiOutlineArrowDown size={28} className="text-white" />
                ) : (
                    <AiOutlineMessage size={28} className="text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed right-35 w-96 h-9/12 bg-white dark:bg-neutral-900
                               rounded-3xl shadow-2xl border dark:border-neutral-800
                               z-9999 flex flex-col overflow-hidden transition-all duration-300"
                    style={{ bottom: bottomOffset + 80 }}
                >
                    {/* Header */}
                    <div className="bg-linear-to-r from-blue-500 via-blue-600 to-blue-700
                                    text-white px-6 py-4 flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <AiFillRobot size={24} />
                            챗봇
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                        >
                            <AiOutlineClose size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4
                                    bg-linear-to-b from-blue-50/30 to-white
                                    dark:from-neutral-900 dark:to-neutral-900/95
                                    scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === "ai" ? "" : "justify-end"}`}>
                                <div
                                    className={`max-w-[80%] px-5 py-3.5 rounded-2xl shadow-sm 
                                                wrap-break-word leading-relaxed whitespace-pre-wrap 
                                                max-h-48 overflow-y-auto text-[12px]
                                                ${
                                        msg.sender === "ai"
                                            ? "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-neutral-700 rounded-tl-sm"
                                            : "bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 text-white font-medium rounded-tr-sm"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-5 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="메시지를 입력하세요"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 border-2 border-gray-200 dark:border-neutral-700
                                           rounded-xl px-4 py-3 text-[15px] bg-gray-50 dark:bg-neutral-800
                                           text-gray-800 dark:text-gray-100 placeholder-gray-400
                                           focus:outline-none focus:border-blue-500 focus:bg-white
                                           dark:focus:border-blue-600 dark:focus:bg-neutral-800
                                           transition-all duration-200"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-800
                                           text-white font-bold rounded-xl text-[15px] shadow-md
                                           hover:shadow-lg active:scale-95
                                           disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed
                                           transition-all duration-200 shrink-0"
                            >
                                전송
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}