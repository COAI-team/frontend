import { memo } from "react";
import { Link } from "react-router-dom";
import { NavLinkPropTypes } from "../../utils/propTypes";

const NavLink = memo(({
                        item,
                        baseClass,
                        onLinkClick,
                        mobile = false
                      }) => {
  // ✅ 중첩 삼항 완전 제거 → if-else 문
  let themeClass;
  if (item.current) {
    themeClass = "bg-indigo-600 text-white dark:bg-indigo-500 shadow-md";
  } else if (mobile) {
    themeClass = "hover:bg-indigo-100 dark:hover:bg-indigo-900/50";
  } else {
    themeClass = "dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 dark:hover:bg-indigo-900/20";
  }

  const linkClassName = `${themeClass} ${baseClass} transition-all duration-200 block`;

  return (
    <Link
      to={item.href}
      onClick={() => onLinkClick?.(item.href)}
      aria-current={item.current ? "page" : undefined}
      className={linkClassName}
    >
      {item.name}
    </Link>
  );
});

NavLink.propTypes = NavLinkPropTypes;

export default NavLink;
