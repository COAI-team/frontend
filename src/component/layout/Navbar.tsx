import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Navbar() {
    const menuItems = [
        { name: "Dashboard", to: "/dashboard" },
        { name: "Team", to: "/team" },
        { name: "Projects", to: "/projects" },
        { name: "Calendar", to: "/calendar" },
    ];

    const navClassActive =
        "inline-flex items-center border-b-2 border-indigo-600 px-1 pt-1 text-sm font-medium text-gray-900 dark:border-indigo-500 dark:text-white";
    const navClassDefault =
        "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white";

    const mobileNavClassActive =
        "block border-l-4 border-indigo-600 bg-indigo-50 py-2 pr-4 pl-3 text-base font-medium text-indigo-700 dark:border-indigo-500 dark:bg-indigo-600/10 dark:text-indigo-400";
    const mobileNavClassDefault =
        "block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white";

    const userMenu = [
        { name: "Your profile", to: "/profile" },
        { name: "Settings", to: "/settings" },
        { name: "Sign out", to: "/signout" },
    ];

    return (
        <Disclosure
            as="nav"
            // 👇 Navbar를 화면 상단에 고정 (fixed)
            className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10"
        >
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
                <div className="flex h-16 justify-between">
                    {/* Left Section */}
                    <div className="flex px-2 lg:px-0">
                        <div className="flex shrink-0 items-center">
                            <Link to="/">
                                <img
                                    alt="Your Company"
                                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                    className="h-8 w-auto dark:hidden"
                                />
                                <img
                                    alt="Your Company"
                                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                                    className="h-8 w-auto not-dark:hidden"
                                />
                            </Link>
                        </div>
                        <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.to}
                                    className={
                                        item.name === "Dashboard"
                                            ? navClassActive
                                            : navClassDefault
                                    }
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
                        <div className="grid w-full max-w-lg grid-cols-1 lg:max-w-xs">
                            <input
                                name="search"
                                type="search"
                                placeholder="Search"
                                className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                            <MagnifyingGlassIcon
                                aria-hidden="true"
                                className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center lg:hidden">
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-600 dark:hover:bg-white/5 dark:hover:text-white dark:focus:outline-indigo-500">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon
                                aria-hidden="true"
                                className="block size-6 group-data-open:hidden"
                            />
                            <XMarkIcon
                                aria-hidden="true"
                                className="hidden size-6 group-data-open:block"
                            />
                        </DisclosureButton>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="hidden lg:ml-4 lg:flex lg:items-center">
                        <Menu as="div" className="relative ml-4 shrink-0">
                            <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500">
                                <span className="absolute -inset-1.5" />
                                <span className="sr-only">Open user menu</span>
                                <img
                                    alt=""
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    className="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                                />
                            </MenuButton>

                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
                            >
                                {userMenu.map((menu) => (
                                    <MenuItem key={menu.name}>
                                        <Link
                                            to={menu.to}
                                            className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 dark:text-gray-300 dark:data-focus:bg-white/5"
                                        >
                                            {menu.name}
                                        </Link>
                                    </MenuItem>
                                ))}
                            </MenuItems>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Mobile Panel */}
            <DisclosurePanel className="lg:hidden">
                <div className="space-y-1 pt-2 pb-3">
                    {menuItems.map((item) => (
                        <DisclosureButton
                            key={item.name}
                            as="a"
                            href="#"
                            className={
                                item.name === "Dashboard"
                                    ? mobileNavClassActive
                                    : mobileNavClassDefault
                            }
                        >
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
                <div className="border-t border-gray-200 pt-4 pb-3 dark:border-white/10">
                    <div className="flex items-center px-4">
                        <img
                            alt=""
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            className="size-10 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                        />
                        <div className="ml-3">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                Tom Cook
                            </div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                tom@example.com
                            </div>
                        </div>
                        <button
                            type="button"
                            className="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 dark:hover:text-white"
                        >
                            <span className="sr-only">View notifications</span>
                            <BellIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>

                    <div className="mt-3 space-y-1">
                        {userMenu.map((menu) => (
                            <DisclosureButton
                                key={menu.name}
                                as="a"
                                href="#"
                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                {menu.name}
                            </DisclosureButton>
                        ))}
                    </div>
                </div>
            </DisclosurePanel>
        </Disclosure>
    );
}