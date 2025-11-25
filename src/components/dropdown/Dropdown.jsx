import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { DropdownPropTypes } from "../../utils/propTypes";
import { useApplyThemeClass } from "../../hooks/useApplyThemeClass";

export default function Dropdown({ button, items, width = "w-40" }) {
    const theme = useApplyThemeClass(); // theme 가져오기

    return (
        <Menu as="div" className="relative inline-block text-left">
            {/* 버튼 */}
            <MenuButton className="inline-flex items-center gap-1 focus:outline-none">
                <span className={theme === "dark" ? "text-gray-200" : "text-gray-700"}>
                    {button}
                </span>
                <ChevronDownIcon
                    className={`w-4 h-4 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                    }`}
                />
            </MenuButton>

            {/* Dropdown 메뉴 */}
            <MenuItems
                transition
                className={`absolute right-0 z-10 mt-2 ${width} origin-top-right rounded-md 
                    ${theme === "dark" ? "bg-gray-800" : "bg-white"}
                    shadow-lg outline-1 
                    ${theme === "dark" ? "outline-white/10" : "outline-black/5"}
                    data-closed:scale-95 data-closed:opacity-0 
                    data-enter:duration-100 data-leave:duration-75`}
            >
                <div className="py-1">
                    {items.map((item) => (
                        <MenuItem key={item.label}>
                            {({ focus }) => {
                                // hover 배경
                                let hoverBg = "";
                                if (focus) {
                                    hoverBg =
                                        theme === "dark" ? "bg-white/10" : "bg-gray-100";
                                }

                                // 텍스트 색
                                const textColor =
                                    theme === "dark" ? "text-gray-200" : "text-gray-700";

                                const baseClass = `block px-4 py-2 text-sm ${textColor} ${hoverBg}`;

                                return item.href ? (
                                    <a href={item.href} className={baseClass}>
                                        {item.label}
                                    </a>
                                ) : (
                                    <button
                                        onClick={item.onClick}
                                        className={`${baseClass} text-left w-full`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            }}
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    );
}

Dropdown.propTypes = DropdownPropTypes;