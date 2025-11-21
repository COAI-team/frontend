import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { DropdownPropTypes } from "../../utils/propTypes";

export default function Dropdown({ button, items, width = "w-40" }) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            {/* 🔘 메뉴 버튼 (프로필 이미지, 텍스트, 아이콘 등 자유) */}
            <MenuButton className="inline-flex items-center gap-1 focus:outline-none">
                {button}
                <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-300" />
            </MenuButton>

            <MenuItems
                transition
                className={`absolute right-0 z-10 mt-2 ${width} origin-top-right rounded-md 
          bg-white shadow-lg outline-1 outline-black/5 transition 
          data-closed:scale-95 data-closed:opacity-0 
          data-enter:duration-100 data-leave:duration-75 
          dark:bg-gray-800 dark:outline-white/10`}
            >
                <div className="py-1">
                    {items.map((item, idx) => (
                        <MenuItem key={idx}>
                            {({ focus }) =>
                                item.href ? (
                                    <a
                                        href={item.href}
                                        className={`block px-4 py-2 text-sm 
                      ${focus ? "bg-gray-100 dark:bg-white/5" : ""}`}
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <button
                                        onClick={item.onClick}
                                        className={`block w-full text-left px-4 py-2 text-sm
                      ${focus ? "bg-gray-100 dark:bg-white/5" : ""}`}
                                    >
                                        {item.label}
                                    </button>
                                )
                            }
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    );
}
Dropdown.propTypes = DropdownPropTypes;