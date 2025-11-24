import { AlertModalPropTypes } from "../../utils/propTypes";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function AlertModal({
                                       open,
                                       onClose,
                                       onConfirm,
                                       type = "success",
                                       title,
                                       message,
                                       confirmText = "확인",
                                   }) {
    const { theme } = useTheme();

    useEffect(() => {
        console.log("current theme =", theme);
    }, [theme]);

    // HEX 색상 매핑
    const COLOR_MAP = {
        light: {
            success: "#2DD4BF",
            warning: "#CC67FA",
            error: "#FF90CD",
            info: "#04BDF2",
        },
        dark: {
            success: "#FFFA99",
            warning: "#2DD4BF",
            error: "#FF90CD",
            info: "#CC67FA",
        },
    };

    // 아이콘 매핑
    const ICON_MAP = {
        success: CheckCircleIcon,
        warning: ExclamationTriangleIcon,
        error: XCircleIcon,
        info: InformationCircleIcon,
    };

    const currentBg = theme === "dark"
        ? COLOR_MAP.dark[type]
        : COLOR_MAP.light[type];

    const Icon = ICON_MAP[type] ?? CheckCircleIcon;

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className={`fixed inset-0 transition-opacity
                    ${theme === "dark" ? "bg-black/70" : "bg-gray-500/75"}`}
            />

            <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

                    <DialogPanel
                        transition
                        className={`
                            relative transform overflow-hidden rounded-lg shadow-xl transition-all
                            ${theme === "dark" ? "bg-gray-800" : "bg-white"}
                            px-4 pt-5 pb-4 text-left
                            sm:my-8 sm:w-full sm:max-w-lg sm:p-6
                        `}
                    >

                        {/* 아이콘 + 배경 컬러 */}
                        <div className="sm:flex sm:items-start">
                            <div
                                className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10"
                                style={{ backgroundColor: currentBg }}
                            >
                                <Icon aria-hidden="true" className="size-6 text-black" />
                            </div>

                            <div className="mt-3 sm:ml-4 sm:mt-0 sm:text-left text-center">
                                <DialogTitle
                                    className={`text-base font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
                                >
                                    {title}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 확인 버튼 */}
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    onClose();
                                }}
                                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-black shadow-sm sm:ml-3 sm:w-auto`}
                                style={{ backgroundColor: currentBg }}
                            >
                                {confirmText}
                            </button>
                        </div>

                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}

AlertModal.propTypes = AlertModalPropTypes;