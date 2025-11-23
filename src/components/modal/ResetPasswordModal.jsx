import { useState } from "react";
import AlertModal from "./AlertModal";
import { requestPasswordReset } from "../../service/user/User";
import { ResetPasswordModalPropTypes } from "../../utils/propTypes";

export default function ResetPasswordModal({ open, onClose }) {
    const [email, setEmail] = useState("");
    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null
    });

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
                setAlert(prev => ({ ...prev, open: false }));
                onClose();
            }
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-lg p-6">

                <h2 className="text-xl font-bold text-center dark:text-white">
                    비밀번호 재설정
                </h2>

                <p className="mt-2 text-sm text-center dark:text-gray-400">
                    가입한 이메일을 입력하면 임시 비밀번호가 발급됩니다.
                </p>

                <div className="mt-6">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium dark:text-gray-300">
                        이메일 주소
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="mt-2 block w-full rounded-md bg-white px-3 py-2 text-gray-900
                            outline outline-gray-300 placeholder:text-gray-400
                            focus:outline-2 focus:outline-indigo-600
                            dark:bg-white/5 dark:text-white dark:outline-white/10
                            dark:focus:outline-indigo-500"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-300 hover:bg-gray-400
                        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                        onClick={onClose}
                    >
                        취소
                    </button>

                    <button
                        className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500
                        dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        onClick={handleSubmit}
                    >
                        임시 비밀번호 받기
                    </button>
                </div>
            </div>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert(prev => ({ ...prev, open: false }))}
                onConfirm={alert.onConfirm}
                type={alert.type}
                title={alert.title}
                message={alert.message}
            />
        </div>
    );
}

ResetPasswordModal.propTypes = ResetPasswordModalPropTypes;