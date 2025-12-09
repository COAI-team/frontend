import {useEffect, useState} from "react";
import {AiOutlineArrowUp} from "react-icons/ai";

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const scrollArea = document.getElementById("scrollArea");
        if (!scrollArea) return;

        const handleScroll = () => {
            setIsVisible(scrollArea.scrollTop > 50);
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
            className={`fixed right-15 z-9998 w-16 h-16 rounded-full 
    flex items-center justify-center shadow-lg transition-all duration-300 border
    dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600
    ${isVisible ? "bottom-16 opacity-100" : "bottom-16 opacity-0 pointer-events-none"}`}
        >
            <AiOutlineArrowUp size={28}/>
        </button>
    );
}