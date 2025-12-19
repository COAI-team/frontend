import {useState, useEffect, useContext, useRef, useCallback, useMemo} from "react";
import ReactMarkdown from "react-markdown";
import {AiOutlineMessage, AiOutlineClose, AiFillRobot, AiOutlineArrowDown} from "react-icons/ai";
import {LoginContext} from "../../context/login/LoginContext";
import {sendChatMessage, getChatMessages} from "../../service/chat/Chatbot.js";
import { MarkdownComponents } from "../common/MarkdownConfig.js";
import { useNavigate } from "react-router-dom";

const BILLING_KEYWORDS = [
  "구독 취소",
  "해지",
  "멤버십 해지",
  "결제 취소",
  "결제 해지",
  "환불",
  "환불 요청",
  "환불 해줘",
  "환불해주세요",
];

// ✅ 컴포넌트 외부로 이동 (매번 재생성 방지)
const containsBillingKeyword = (text) =>
  BILLING_KEYWORDS.some((kw) => text.includes(kw));

// ✅ 컴포넌트 외부로 이동 (매번 재생성 방지)
const formatMessageText = (text) => {
  if (!text) return "";
  const max = 4000;
  const trimmed = text.trim().replaceAll(/\n{3,}/g, "\n\n");
  return trimmed.slice(0, max) + (trimmed.length > max ? "..." : "");
};

export default function ChatbotButton() {
  const {user, hydrated, isAlertOpen} = useContext(LoginContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(60);

  const [messages, setMessages] = useState([
    {id: 0, sender: "ai", text: "안녕하세요! 무엇을 도와드릴까요?"}
  ]);

  const [inputValue, setInputValue] = useState("");
  const [nextId, setNextId] = useState(1);
  const messagesEndRef = useRef(null);

  // ✅ useCallback으로 스크롤 함수 메모이제이션
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, []);

  // ✅ useCallback으로 스크롤 핸들러 메모이제이션
  const handleScroll = useCallback(() => {
    setBottomOffset(60);
  }, []);

  // 스크롤 이벤트
  useEffect(() => {
    const scrollArea = document.getElementById("scrollArea");
    if (!scrollArea) return;

    scrollArea.addEventListener("scroll", handleScroll);
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // 자동 스크롤 맨 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

        const historyMessages = res.messages.map((msg, index) => {
          const formatted = formatMessageText(msg.content);
          return {
            id: index + 1,
            sender: msg.role === "assistant" ? "ai" : "user",
            text: formatted,
            showBillingButton:
              msg.role === "assistant" && containsBillingKeyword(formatted),
          };
        });

        setMessages([
          {id: 0, sender: "ai", text: "안녕하세요! 무엇을 도와드릴까요?"},
          ...historyMessages
        ]);

        setNextId(historyMessages.length + 2);
      } catch (err) {
        console.error("getChatMessages error:", err);
      }
    };

    fetchHistory();
  }, [isOpen]);

  // ✅ useCallback으로 메시지 전송 함수 메모이제이션
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    const userMsgId = nextId;
    setNextId((prev) => prev + 1);

    setMessages((prev) => [
      ...prev,
      {id: userMsgId, sender: "user", text: content},
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
        const showBillingButton = containsBillingKeyword(formattedText);

        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            sender: "ai",
            text: formattedText,
            showBillingButton,
          },
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
          showBillingButton: false,
        },
      ]);
    }
  }, [inputValue, nextId, user?.userId]);

  // ✅ useCallback으로 키 이벤트 핸들러 메모이제이션
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ✅ useCallback으로 결제 페이지 이동 함수 메모이제이션
  const goBilling = useCallback(() => {
    navigate("/mypage/billing");
  }, [navigate]);

  // ✅ useCallback으로 채팅창 토글 함수 메모이제이션
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // ✅ useCallback으로 input 변경 핸들러 메모이제이션
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // ✅ useMemo로 버튼 비활성화 상태 계산
  const isSendDisabled = useMemo(() =>
      !inputValue.trim(),
    [inputValue]
  );

  // ✅ useMemo로 스타일 계산 최적화
  const floatingButtonStyle = useMemo(() => ({
    bottom: bottomOffset + 5
  }), [bottomOffset]);

  const chatWindowStyle = useMemo(() => ({
    bottom: bottomOffset + 80
  }), [bottomOffset]);

  if (!hydrated || !user || isAlertOpen) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="fixed right-35 bottom-20 z-9999 w-16 h-16 rounded-full
                           bg-linear-to-br from-blue-500 via-blue-600 to-blue-700
                           hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
                           flex items-center justify-center shadow-2xl
                           transition-all duration-300 active:scale-95
                           dark:from-blue-600 dark:via-blue-700 dark:to-blue-800"
        style={floatingButtonStyle}
        aria-label={isOpen ? "채팅창 닫기" : "채팅창 열기"}
      >
        {isOpen ? (
          <AiOutlineArrowDown size={28} className="text-white"/>
        ) : (
          <AiOutlineMessage size={28} className="text-white"/>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed right-35 w-96 h-9/12 bg-white dark:bg-neutral-900
                               rounded-3xl shadow-2xl border dark:border-neutral-800
                               z-9999 flex flex-col overflow-hidden transition-all duration-300"
          style={chatWindowStyle}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-blue-500 via-blue-600 to-blue-700
                                    text-white px-6 py-4 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AiFillRobot size={24}/>
              챗봇
            </h2>
            <button
              onClick={toggleChat}
              className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
              aria-label="채팅창 닫기"
            >
              <AiOutlineClose size={20}/>
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
                      : "bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-tr-sm"
                  }`}
                >
                  <ReactMarkdown components={MarkdownComponents}>
                    {msg.text}
                  </ReactMarkdown>

                  {/* AI 답변 중 취소/환불 관련일 때만 버튼 노출 */}
                  {msg.sender === "ai" && msg.showBillingButton && (
                    <button
                      type="button"
                      onClick={goBilling}
                      className="mt-2 w-full px-3 py-2 text-xs font-semibold rounded-lg
                                 border border-blue-500 text-blue-600 hover:bg-blue-50
                                 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-neutral-800
                                 transition-colors"
                    >
                      취소 / 환불하러 가기
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="메시지를 입력하세요"
                value={inputValue}
                onChange={handleInputChange}
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
                disabled={isSendDisabled}
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
