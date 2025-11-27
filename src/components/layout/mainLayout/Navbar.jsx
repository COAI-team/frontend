import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
} from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    XMarkIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { NavLinksPropTypes } from "../../../utils/propTypes";
import AlertModal from "../../modal/AlertModal";
import { useLogin } from "../../../context/LoginContext";
import Dropdown from "../../dropdown/Dropdown";

const initialNavigation = [
    { name: '코드 분석', href: '/codeAnalysis' },
    { name: '알고리즘', href: '/algorithm' },
    { name: '결제', href: '/payments' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function NavLinks({ mobile = false, navigation, onLinkClick }) {
    const { theme } = useTheme()

    const baseClass = mobile
        ? 'block rounded-md px-3 py-2 text-base font-bold'
        : 'rounded-md px-3 py-2 text-sm font-bold'

    return (
        <>
            {navigation.map((item) => {
                let themeClass

                if (item.current) {
                    themeClass =
                        theme === 'light'
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-gray-900 text-white'
                } else if (theme === 'light') {
                    themeClass = 'text-gray-700 hover:text-black hover:bg-gray-100'
                } else {
                    themeClass = 'text-gray-300 hover:text-white hover:bg-white/5'
                }

                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => onLinkClick(item.href)}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(themeClass, baseClass)}
                    >
                        {item.name}
                    </Link>
                )
            })}
        </>
    )
}

export default function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [navigation, setNavigation] = useState(
        initialNavigation.map((item) => ({ ...item, current: false }))
    )

    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const BASE_URL = import.meta.env.VITE_API_URL;
    const { user, logout } = useLogin()

    useEffect(() => setMounted(true), [])

    // 현재 경로에 따라 active 메뉴 변경
    useEffect(() => {
        setNavigation((prev) =>
            prev.map((item) => ({
                ...item,
                current: item.href === location.pathname,
            }))
        )
    }, [location.pathname])

    const handleLinkClick = (href) => {
        setNavigation((prev) =>
            prev.map((item) => ({
                ...item,
                current: item.href === href,
            }))
        )
    }

    if (!mounted) return null

    return (
        <Disclosure
            as="nav"
            className={`relative transition-colors border-b border-gray-500
                ${theme === 'light'
                ? 'bg-white text-gray-700'
                : 'dark:bg-gray-800/50 text-gray-300'
            }
                dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10`}
        >
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">

                    {/* Mobile menu button */}
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <DisclosureButton
                            className={`group relative inline-flex items-center justify-center rounded-md p-2 focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500
                                ${theme === 'light'
                                ? 'text-gray-700 hover:bg-gray-100 hover:text-black'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon
                                aria-hidden="true"
                                className="block size-6 group-data-[open]:hidden"
                            />
                            <XMarkIcon
                                aria-hidden="true"
                                className="hidden size-6 group-data-[open]:block"
                            />
                        </DisclosureButton>
                    </div>

                    {/* Logo & Nav Links */}
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex shrink-0 items-center">
                            <Link to="/">
                                <div
                                    className={`p-1.5 rounded-md transition-colors duration-300 ${
                                        theme === 'dark' ? '' : 'bg-black'
                                    }`}
                                >
                                    <img
                                        alt="Logo"
                                        src="/Logo.png"
                                        className="h-8 w-auto cursor-pointer"
                                    />
                                </div>
                            </Link>
                        </div>

                        <div className="hidden sm:flex sm:flex-1 sm:justify-center">
                            <div className="flex space-x-6">
                                <NavLinks
                                    navigation={navigation}
                                    onLinkClick={handleLinkClick}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right side icons */}
                    <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

                        {/* Notification Button */}
                        <button
                            type="button"
                            className={`relative rounded-full p-1 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500 
                                ${theme === 'light'
                                ? 'text-gray-700 hover:text-black'
                                : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            <span className="sr-only">View notifications</span>
                            <BellIcon aria-hidden="true" className="size-6" />
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className={`rounded-md p-1.5 focus:outline-none transition-transform hover:scale-110 
                                ${theme === 'light'
                                ? 'text-gray-700 hover:text-black'
                                : 'text-gray-300 hover:text-white'
                            }`}
                        >
                            {theme === 'light' ? (
                                <MoonIcon className="w-5 h-5" />
                            ) : (
                                <SunIcon className="w-5 h-5" />
                            )}
                        </button>

                        {/* 로그인 상태 */}
                        {user ? (
                            <Dropdown
                                button={
                                    <div className="flex items-center gap-2 cursor-pointer">
                                        <img
                                            src={
                                                user.image?.startsWith("http")
                                                    ? user.image
                                                    : `${BASE_URL}${user.image || ""}`
                                            }
                                            className="w-8 h-8 rounded-full object-cover border border-gray-300"
                                            alt="프로필"
                                        />
                                        <span className="text-sm font-bold">{user.nickname}</span>
                                    </div>
                                }
                                items={[
                                    { label: "마이페이지", href: "/mypage" },
                                    ...(user?.role === "ROLE_ADMIN" ? [{ label: "관리자 페이지", href: "/admin" }] : []),
                                    {
                                        label: "로그아웃",
                                        onClick: () => {
                                            logout();
                                            navigate("/");
                                        },
                                    },
                                ]}
                            />
                        ) : (
                            <Link
                                to="/signin"
                                className={`ml-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm
                                ${theme === 'light'
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                                }`}
                            >
                                로그인
                            </Link>
                        )}

                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <DisclosurePanel className="sm:hidden">
                <div className="space-y-1 px-2 pt-2 pb-3">
                    <NavLinks
                        mobile
                        navigation={navigation}
                        onLinkClick={handleLinkClick}
                    />
                </div>
            </DisclosurePanel>
        </Disclosure>
    )
}

AlertModal.propTypes = NavLinksPropTypes;
NavLinks.propTypes = NavLinksPropTypes;