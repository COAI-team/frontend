import { useContext, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "../../context/theme/useTheme";
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

// 상수 및 캐싱 (모듈 수준)
const VALID_TYPES = new Set(["success", "warning", "error", "info"]);
const DEFAULT_TYPE = "success";

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

const ICON_MAP = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

export default function AlertModal({
  open = false,
  onClose = () => {},
  onConfirm,
  onCancel,
  type = DEFAULT_TYPE,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
}) {
  const context = useContext(useTheme);
  const theme = context?.theme || "light";

  // useMemo로 스타일/아이콘 캐싱 (리렌더링 방지)
  const styles = useMemo(() => {
    const validType = VALID_TYPES.has(type) ? type : DEFAULT_TYPE;
    const currentBg =
      COLOR_MAP[theme]?.[validType] || COLOR_MAP.light[DEFAULT_TYPE];
    const Icon = ICON_MAP[validType] || ICON_MAP.success;

    return {
      bgColor: currentBg,
      Icon,
      backdrop: theme === "dark" ? "bg-black/70" : "bg-gray-500/75",
      panel: theme === "dark" ? "bg-gray-800" : "bg-white",
      title: theme === "dark" ? "text-gray-100" : "text-gray-900",
      text: theme === "dark" ? "text-gray-300" : "text-gray-600",
      cancelBtn:
        theme === "dark"
          ? "bg-gray-700 text-white"
          : "bg-gray-200 text-gray-800",
    };
  }, [theme, type]);

  // useCallback으로 이벤트 핸들러 안정화
  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onClose();
  }, [onConfirm, onClose]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

  // 키보드 핸들러 (useEffect import 추가 + passive 옵션)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    // passive: true로 스크롤 성능 향상
    globalThis.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [open, handleConfirm, onClose]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className={`fixed inset-0 transition-opacity ${styles.backdrop}`}
      />

      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform overflow-hidden rounded-lg shadow-xl transition-all
              ${styles.panel} px-4 pt-5 pb-4 text-left sm:my-8 sm:w-full sm:max-w-lg sm:p-6`}
          >
            <div className="sm:flex sm:items-start">
              <div
                className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10"
                style={{ backgroundColor: styles.bgColor }}
              >
                {/* styles.Icon → styles.Icon 컴포넌트 호출로 수정 */}
                <styles.Icon aria-hidden="true" className="size-6 text-black" />
              </div>

              <div className="mt-3 sm:ml-4 sm:mt-0 sm:text-left text-center">
                <DialogTitle
                  className={`text-base font-semibold ${styles.title}`}
                >
                  {title}
                </DialogTitle>
                <div className="mt-2">
                  <p className={`text-sm whitespace-pre-line ${styles.text}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
              <button
                autoFocus
                onClick={handleConfirm}
                className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-black shadow-sm sm:w-auto"
                style={{ backgroundColor: styles.bgColor }}
              >
                {confirmText}
              </button>

              {onCancel && (
                <button
                  onClick={handleCancel}
                  className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:w-auto 
                    ${styles.cancelBtn}`}
                >
                  {cancelText}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

AlertModal.propTypes = AlertModalPropTypes;
