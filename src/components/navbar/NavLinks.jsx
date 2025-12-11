import { Link } from "react-router-dom";

export function NavLinks({ mobile = false, navigation, onLinkClick, themeKey }) {
    const baseClass = mobile
        ? "block rounded-md px-3 py-2 text-base font-bold"
        : "rounded-md px-3 py-2 text-sm font-bold";

    return navigation.map((item) => {
        const finalKey = `${item.name}-${themeKey}`;

        const themeClass = item.current
            ? "bg-indigo-600 text-white dark:bg-indigo-500"
            : "dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5";

        console.log(`🎨 ${item.name} themeClass:`, themeClass);

        return (
            <Link
                key={finalKey} // ← 동적 key
                to={item.href}
                onClick={() => onLinkClick(item.href)}
                aria-current={item.current ? "page" : undefined}
                className={`${themeClass} ${baseClass} transition-colors`}
            >
                {item.name}
            </Link>
        );
    });
}