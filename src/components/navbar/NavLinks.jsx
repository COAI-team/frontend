import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { NavLinksPropTypes } from "../../utils/propTypes";

const NavLinks = ({ mobile = false, navigation, onLinkClick }) => {
  // ✅ useMemo로 baseClass 메모이제이션
  const baseClass = useMemo(() =>
      mobile
        ? "block rounded-md px-3 py-2 text-base font-bold"
        : "rounded-md px-3 py-2 text-sm font-bold",
    [mobile]
  );

  // ✅ useCallback으로 클릭 핸들러 메모이제이션
  const handleLinkClick = useCallback((href) => {
    onLinkClick(href);
  }, [onLinkClick]);

  // ✅ 각 Link를 개별 메모이제이션
  const renderedLinks = useMemo(() =>
      navigation.map((item) => {
        const themeClass = item.current
          ? "dark:bg-indigo-500"
          : "dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5 dark:hover:bg-indigo-900/20";

        const linkClassName = `${themeClass} ${baseClass} transition-all`;

        return (
          <Link
            key={item.name} // ✅ 정적 key (동적 key 제거)
            to={item.href}
            onClick={() => handleLinkClick(item.href)}
            aria-current={item.current ? "page" : undefined}
            className={linkClassName}
          >
            {item.name}
          </Link>
        );
      }),
    [navigation, baseClass, handleLinkClick]
  );

  return <>{renderedLinks}</>;
};

// ✅ 완전한 PropTypes 정의
NavLinks.propTypes = NavLinksPropTypes;

// ✅ React.memo 적용 후 기본 export
export default memo(NavLinks);
