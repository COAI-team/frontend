import { useEffect, useState } from "react";
import { AiOutlineArrowUp } from "react-icons/ai";

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(60);

    useEffect(() => {
        const scrollArea = document.getElementById("scrollArea");
        if (!scrollArea) return;

        const handleScroll = () => {
            setIsVisible(scrollArea.scrollTop > 1);
            setBottomOffset(60); // ChatbotButton 과 동일 로직
        };

        scrollArea.addEventListener("scroll", handleScroll);
        return () => scrollArea.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        const scrollArea = document.getElementById("scrollArea");
        if (!scrollArea) return;

        scrollArea.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed right-15 z-9999 w-16 h-16 rounded-full
                        bg-linear-to-br from-blue-500 via-blue-600 to-blue-700
                        hover:from-blue-600 hover:via-blue-700 hover:to-blue-800
                        flex items-center justify-center shadow-2xl transition-all duration-300 
                        active:scale-95 border border-white/10
                        dark:from-blue-600 dark:via-blue-700 dark:to-blue-800
                        ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ bottom: bottomOffset + 5 }}
        >
            <AiOutlineArrowUp size={28} className="text-white" />
        </button>
    );
}