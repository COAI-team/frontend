import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { DropdownPropTypes } from "../../utils/propTypes";
import { useApplyThemeClass } from "../../hooks/useApplyThemeClass";

// 상수 및 캐싱 (모듈 수준)
const THEME_CLASSES = {
  light: {
    buttonText: "text-gray-700",
    icon: "text-gray-500",
    menuBg: "bg-white",
    menuBorder: "outline-black/5",
    text: "text-gray-700",
    hover: "bg-gray-100"
  },
  dark: {
    buttonText: "text-gray-200",
    icon: "text-gray-300",
    menuBg: "bg-gray-800",
    menuBorder: "outline-white/10",
    text: "text-gray-200",
    hover: "bg-white/10"
  }
};

export default function Dropdown({ button, items, width = "w-40" }) {
  const theme = useApplyThemeClass();

  // useMemo로 클래스 캐싱 (리렌더링 방지)
  const themeClasses = THEME_CLASSES[theme] || THEME_CLASSES.light;

  // useCallback으로 아이템 렌더링 최적화
  const renderItem = (item, focus) => {
    const baseClass = `block px-4 py-2 text-sm w-full text-center ${themeClasses.text}`;
    const hoverClass = focus ? themeClasses.hover : '';

    const itemClass = `${baseClass} ${hoverClass}`;

    if (item.href) {
      return (
        <a href={item.href} className={itemClass} key={item.label}>
          <strong>{item.label}</strong>
        </a>
      );
    }

    return (
      <button
        key={item.label}
        onClick={item.onClick}
        className={itemClass}
      >
        <strong>{item.label}</strong>
      </button>
    );
  };

  return (
    <Menu as="div" className="relative inline-block">
      {/* 버튼 */}
      <MenuButton className="inline-flex items-center gap-1 focus:outline-none">
                <span className={`w-full text-center ${themeClasses.buttonText}`}>
                    <strong>{button}</strong>
                </span>
        <ChevronDownIcon className={`w-4 h-4 ${themeClasses.icon}`} />
      </MenuButton>

      {/* Dropdown 메뉴 */}
      <MenuItems
        transition
        className={`absolute right-0 z-10 mt-2 ${width} origin-top-right rounded-md border
                    ${themeClasses.menuBg} shadow-lg outline-1 
                    ${themeClasses.menuBorder}
                    data-closed:scale-95 data-closed:opacity-0 
                    data-enter:duration-100 data-leave:duration-75`}
      >
        <div className="py-1">
          {items.map((item) => (
            <MenuItem key={item.label}>
              {({ focus }) => renderItem(item, focus)}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}

Dropdown.propTypes = DropdownPropTypes;
