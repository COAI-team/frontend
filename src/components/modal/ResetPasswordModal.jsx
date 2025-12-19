import {useState, useEffect, useCallback, useMemo} from "react";
import AlertModal from "./AlertModal";
import {requestPasswordReset} from "../../service/user/User";
import {ResetPasswordModalPropTypes} from "../../utils/propTypes";
import { useTheme } from "../../context/theme/useTheme";
import LoadingButton from "../button/LoadingButton";

// 상수 및 캐싱
const COLORS = {
  light: {
    primary: "#04BDF2",
    secondary: "#2DD4BF",
    accent1: "#CC67FA",
    accent2: "#FF90CD",
    outline: "#d1d5db",
    outlineDark: "rgba(255,255,255,0.2)"
  },
  dark: {
    primary: "#CC67FA",
    secondary: "#2DD4BF",
    accent1: "#FF90CD",
    accent2: "#FFFA99",
    outline: "rgba(255,255,255,0.2)",
    outlineDark: "rgba(255,255,255,0.2)"
  }
};

const CLASS_MAP = {
  light: {
    bg: "bg-white",
    title: "text-gray-900",
    desc: "text-gray-600",
    label: "text-gray-700",
    inputBg: "bg-white text-gray-900 outline outline-slate-300",
    cancelBtn: "bg-gray-300 hover:bg-gray-400 text-gray-900",
    cancelBg: "bg-gray-300"
  },
  dark: {
    bg: "bg-gray-900",
    title: "text-white",
    desc: "text-gray-400",
    label: "text-gray-300",
    inputBg: "bg-gray-800 text-white outline outline-white/20",
    cancelBtn: "bg-gray-700 hover:bg-gray-600 text-white",
    cancelBg: "bg-gray-700"
  }
};

export default function ResetPasswordModal({open, onClose}) {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null
  });
  const [loadingReset, setLoadingReset] = useState(false);

  const {theme} = useTheme();
  const isDark = theme === "dark";

  // 스타일 캐싱 (리렌더링 방지)
  const styles = useMemo(() => {
    const colorSet = COLORS[isDark ? 'dark' : 'light'];
    const classSet = CLASS_MAP[isDark ? 'dark' : 'light'];
    return { ...colorSet, ...classSet };
  }, [isDark]);

  // 최적화된 handleSubmit
  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      setAlert({
        open: true,
        type: "warning",
        title: "이메일 필요",
        message: "이메일을 입력해주세요."
      });
      return;
    }

    setLoadingReset(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.error) {
        setAlert({
          open: true,
          type: "error",
          title: "요청 실패",
          message: result.error.response?.data?.message || "오류가 발생했습니다."
        });
        return;
      }

      setAlert({
        open: true,
        type: "success",
        title: "이메일 발송 완료",
        message: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
        onConfirm: () => {
          setEmail("");
          setAlert(prev => ({...prev, open: false}));
          onClose();
        }
      });
    } catch (error) {
      console.error('Password reset error:', error);
      setAlert({
        open: true,
        type: "error",
        title: "요청 실패",
        message: error.message || "네트워크 오류가 발생했습니다."
      });
    } finally {
      setLoadingReset(false);
    }
  }, [email, onClose]);

  // 키보드 핸들러 최적화 (passive 옵션)
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    globalThis.addEventListener("keydown", handleKey, { passive: true });
    return () => globalThis.removeEventListener("keydown", handleKey);
  }, [open, handleSubmit, onClose]);

  // 이메일 입력 핸들러 안정화
  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-xl shadow-lg p-6 ${styles.bg}`}>
        <h2 className={`text-xl font-bold text-center ${styles.title}`}>
          비밀번호 재설정
        </h2>

        <p className={`mt-2 text-sm text-center ${styles.desc}`}>
          가입한 이메일을 입력하면 비밀번호 재설정 링크가 전송됩니다.
        </p>

        <div className="mt-6">
          <label
            htmlFor="email"
            className={`block text-sm font-medium ${styles.label}`}
          >
            이메일 주소
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="example@email.com"
            className={`mt-2 block w-full rounded-md px-3 py-2 placeholder:text-gray-400 ${styles.inputBg}`}
            style={{
              outlineWidth: "1px",
              outlineColor: styles.outline
            }}
            onFocus={(e) => {
              e.target.style.outlineColor = styles.primary;
            }}
            onBlur={(e) => {
              e.target.style.outlineColor = styles.outline;
            }}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold ${styles.cancelBtn}`}
            onClick={onClose}
            style={{ backgroundColor: styles.cancelBg }}
          >
            취소
          </button>

          <div className="flex-1">
            <LoadingButton
              text="비번 재설정 메일 받기"
              isLoading={loadingReset}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white w-full"
              style={{ backgroundColor: styles.primary }}
            />
          </div>
        </div>
      </div>

      <AlertModal
        open={alert.open}
        onClose={() => setAlert(prev => ({...prev, open: false}))}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}

ResetPasswordModal.propTypes = ResetPasswordModalPropTypes;
