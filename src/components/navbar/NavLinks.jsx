import { memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { NavLinksPropTypes } from "../../utils/propTypes";
import "../../styles/NavLinks.css";

const NavLinks = ({ mobile = false, navigation, onLinkClick }) => {
  // ✅ useCallback으로 클릭 핸들러 메모이제이션
  const handleLinkClick = useCallback((href) => {
    onLinkClick(href);
  }, [onLinkClick]);

  // ✅ 각 Link를 개별 메모이제이션
  const renderedLinks = useMemo(() =>
      navigation.map((item) => {
        const baseClass = mobile
          ? "block rounded-md px-3 py-2 text-base font-bold"
          : "nav-link-bracket relative rounded-md px-4 py-2 text-base font-bold";

        // 라이트모드 + 다크모드 스타일 모두 정의
        const themeClass = item.current
          ? "nav-link-active text-gray-900 dark:text-white"
          : "text-gray-700 dark:text-gray-300";

        const linkClassName = `${themeClass} ${baseClass} transition-all duration-300`;

        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => handleLinkClick(item.href)}
            aria-current={item.current ? "page" : undefined}
            className={linkClassName}
          >
            {/* Bracket 효과 - 모바일이 아닐 때만 (활성/비활성 모두 표시) */}
            {!mobile && (
              <>
                <span className={`nav-bracket nav-bracket-left ${item.current ? 'nav-bracket-active' : ''}`}>{"{"}</span>
                <span className={`nav-bracket nav-bracket-right ${item.current ? 'nav-bracket-active' : ''}`}>{"}"}</span>
                {/* 그라데이션 배경 - 비활성 메뉴만 */}
                {!item.current && <span className="nav-gradient-bg" />}
              </>
            )}
            <span className="relative z-10">{item.name}</span>
          </Link>
        );
      }),
    [navigation, mobile, handleLinkClick]
  );

  return <>{renderedLinks}</>;
};

// ✅ 완전한 PropTypes 정의
NavLinks.propTypes = NavLinksPropTypes;

// ✅ React.memo 적용 후 기본 export
export default memo(NavLinks);
