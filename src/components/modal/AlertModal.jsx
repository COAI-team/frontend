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
} from "@heroicons/react/24/outline";

export default function AlertModal({
                                       open,
                                       onClose,
                                       onConfirm,
                                       type = "success",
                                       title,
                                       message,
                                       confirmText = "확인",
                                   }) {
    // 상태별 스타일 매핑
    const TYPE_CONFIG = {
        success: {
            bg: "bg-green-100",
            iconColor: "text-green-600",
            Icon: CheckCircleIcon,
            buttonColor: "bg-green-600 hover:bg-green-500",
        },
        warning: {
            bg: "bg-yellow-100",
            iconColor: "text-yellow-600",
            Icon: ExclamationTriangleIcon,
            buttonColor: "bg-yellow-600 hover:bg-yellow-500",
        },
        error: {
            bg: "bg-red-100",
            iconColor: "text-red-600",
            Icon: XCircleIcon,
            buttonColor: "bg-red-600 hover:bg-red-500",
        },
    };

    const { bg, iconColor, Icon, buttonColor } = TYPE_CONFIG[type];

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity
                data-closed:opacity-0 data-enter:duration-300 data-leave:duration-200"
            />

            <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white
                        px-4 pt-5 pb-4 text-left shadow-xl transition-all
                        data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300
                        sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:scale-95"
                    >
                        <div className="sm:flex sm:items-start">
                            <div
                                className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${bg} sm:mx-0 sm:size-10`}
                            >
                                <Icon aria-hidden="true" className={`size-6 ${iconColor}`} />
                            </div>

                            <div className="mt-3 sm:ml-4 sm:mt-0 sm:text-left text-center">
                                <DialogTitle className="text-base font-semibold text-gray-900">
                                    {title}
                                </DialogTitle>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">{message}</p>
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
                                className={`inline-flex w-full justify-center rounded-md px-3 py-2
                                text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${buttonColor}`}
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