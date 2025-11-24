import {useState, useEffect} from "react";
import AlertModal from "./AlertModal";
import {requestPasswordReset} from "../../service/user/User";
import {ResetPasswordModalPropTypes} from "../../utils/propTypes";
import {useTheme} from "next-themes";

export default function ResetPasswordModal({open, onClose}) {
    const [email, setEmail] = useState("");
    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null
    });

    const {theme} = useTheme();
    const isDark = theme === "dark";

    // 🔥 키보드 기능 추가: Enter = 제출, ESC = 취소
    useEffect(() => {
        if (!open) return;

        const handleKey = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, email]);  // email은 Enter시에 최신 email 반영

    // 색상 팔레트
    const COLORS = {
        light: {
            primary: "#04BDF2",
            secondary: "#2DD4BF",
            accent1: "#CC67FA",
            accent2: "#FF90CD",
        },
        dark: {
            primary: "#CC67FA",
            secondary: "#2DD4BF",
            accent1: "#FF90CD",
            accent2: "#FFFA99",
        }
    };

    const current = isDark ? COLORS.dark : COLORS.light;

    const handleSubmit = async () => {
        if (!email) {
            setAlert({
                open: true,
                type: "warning",
                title: "이메일 필요",
                message: "이메일을 입력해주세요."
            });
            return;
        }

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
            title: "임시 비밀번호 발급됨",
            message: "이메일로 임시 비밀번호가 전송되었습니다.",
            onConfirm: () => {
                setAlert(prev => ({...prev, open: false}));
                onClose();
            }
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
                className={`
                    w-full max-w-md rounded-xl shadow-lg p-6
                    ${isDark ? "bg-gray-900" : "bg-white"}
                `}
            >
                <h2
                    className={`text-xl font-bold text-center 
                    ${isDark ? "text-white" : "text-gray-900"}`}
                >
                    비밀번호 재설정
                </h2>

                <p
                    className={`mt-2 text-sm text-center 
                    ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                    가입한 이메일을 입력하면 임시 비밀번호가 발급됩니다.
                </p>

                <div className="mt-6">
                    <label
                        htmlFor="email"
                        className={`block text-sm font-medium
                        ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                        이메일 주소
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className={`
                            mt-2 block w-full rounded-md px-3 py-2 placeholder:text-gray-400
                            ${isDark
                            ? "bg-gray-800 text-white outline outline-white/20"
                            : "bg-white text-gray-900 outline outline-slate-300"
                        }   
                        `}
                        style={{
                            outlineWidth: "1px",
                            outlineColor: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db",
                        }}
                        onFocus={(e) => (e.target.style.outlineColor = current.primary)}
                        onBlur={(e) =>
                            (e.target.style.outlineColor = isDark
                                ? "rgba(255,255,255,0.2)"
                                : "#d1d5db")
                        }
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    {/* 취소 버튼 */}
                    <button
                        className={`
                            px-4 py-2 rounded-md text-sm font-semibold
                            ${isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-300 hover:bg-gray-400 text-gray-900"}`}
                        onClick={onClose}
                    >
                        취소
                    </button>

                    {/* 제출 버튼 */}
                    <button
                        className="px-4 py-2 rounded-md text-sm font-semibold text-white"
                        style={{
                            backgroundColor: current.primary,
                        }}
                        onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = isDark
                                ? COLORS.dark.secondary
                                : COLORS.light.secondary)
                        }
                        onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = current.primary)
                        }
                        onClick={handleSubmit}
                    >
                        임시 비밀번호 받기
                    </button>
                </div>
            </div>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert((prev) => ({...prev, open: false}))}
                onConfirm={alert.onConfirm}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />
        </div>
    );
}

ResetPasswordModal.propTypes = ResetPasswordModalPropTypes;