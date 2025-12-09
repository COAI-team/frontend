import {useState, useEffect, useContext} from "react";
import {AiOutlineMessage, AiOutlineClose} from "react-icons/ai";
import {LoginContext} from "../../context/LoginContext";

export default function ChatbotButton() {
    const { user, hydrated, isAlertOpen } = useContext(LoginContext);

    const [isOpen, setIsOpen] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(60);
    const [messages, setMessages] = useState([
        { sender: "ai", text: "안녕하세요! 무엇을 도와드릴까요?" }
    ]);

    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        const scrollArea = document.getElementById("scrollArea");
        if (!scrollArea) return;

        const handleScroll = () => {
            setBottomOffset(60);
        };

        scrollArea.addEventListener("scroll", handleScroll);
        return () => scrollArea.removeEventListener("scroll", handleScroll);
    }, []);

    if (!hydrated) return null;
    if (!user) return null;
    if (isAlertOpen) return null;

    const handleSend = () => {
        if (!inputValue.trim()) return;

        setMessages((prev) => [...prev, { sender: "user", text: inputValue }]);
        setInputValue("");

        // 간단한 AI 답변 (원하면 제거 가능)
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: "좋은 질문이네요! 더 알려주세요." }
            ]);
        }, 500);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed right-15 z-9999
                           w-16 h-16 rounded-full border flex items-center justify-center shadow-lg
                           dark:bg-neutral-800 transition-all duration-300"
                style={{ bottom: bottomOffset + 85 }}
            >
                {isOpen ? <AiOutlineClose size={28}/> : <AiOutlineMessage size={28}/> }
            </button>

            {/* WhatsApp Style Chat */}
            {isOpen && (
                <div
                    className="fixed right-15 w-80 h-96
                               bg-white dark:bg-neutral-900 rounded-xl shadow-xl border dark:border-neutral-700
                               z-9999 flex flex-col overflow-hidden transition-all duration-300"
                    style={{ bottom: bottomOffset + 165 }}
                >
                    {/* Header (WhatsApp 스타일 초록색 바) */}
                    <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                        <h2 className="font-semibold">Chatbot</h2>
                        <button onClick={() => setIsOpen(false)}>
                            <AiOutlineClose size={20} className="text-white"/>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50 dark:bg-neutral-800/30">

                        {messages.map(msg =>
                            msg.sender === "ai" ? (
                                <div key={msg.id} className="flex">
                                    <div
                                        className="max-w-[75%] bg-white dark:bg-neutral-700
                           text-gray-800 dark:text-gray-200
                           px-3 py-2 rounded-lg shadow-sm"
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ) : (
                                <div key={msg.id} className="flex justify-end">
                                    <div
                                        className="max-w-[75%]
                           bg-[#DCF8C6] text-gray-800
                           px-3 py-2 rounded-lg shadow-sm"
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    {/* Input Area */}
                    <div className="p-3 flex bg-white dark:bg-neutral-900 border-t dark:border-neutral-700">
                        <input
                            type="text"
                            placeholder="메시지를 입력하세요…"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 border dark:border-neutral-700 rounded-lg
                                       px-3 py-2 text-sm bg-white dark:bg-neutral-800
                                       text-gray-800 dark:text-gray-200"
                        />
                        <button
                            onClick={handleSend}
                            className="ml-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5a]
                                       text-white rounded-lg text-sm"
                        >
                            보내기
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}