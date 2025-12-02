import {useTheme} from "next-themes";
import {Link} from "react-router-dom";
import getThemeClass from "../../utils/getThemeClass";


export function NavLinks({ mobile = false, navigation, onLinkClick }) {
    const { theme } = useTheme();

    const baseClass = mobile
        ? "block rounded-md px-3 py-2 text-base font-bold"
        : "rounded-md px-3 py-2 text-sm font-bold";

    return navigation.map((item) => {
        const themeClass = getThemeClass(item.current, theme);

        return (
            <Link
                key={item.name}
                to={item.href}
                onClick={() => onLinkClick(item.href)}
                aria-current={item.current ? "page" : undefined}
                className={`${themeClass} ${baseClass}`}
            >
                {item.name}
            </Link>
        );
    });
}