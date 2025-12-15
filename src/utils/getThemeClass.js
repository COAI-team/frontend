export default function getThemeClass(isCurrent, theme) {
    if (isCurrent) {
        return theme === "light"
            ? "bg-gray-200 text-gray-900"
            : "bg-gray-900 text-white";
    }
    return theme === "light"
        ? "hover:text-black hover:bg-gray-100"
        : "hover:text-white hover:bg-white/5";
}