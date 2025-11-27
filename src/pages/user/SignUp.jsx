import { useState, useRef } from "react";
import { FcCamera } from "react-icons/fc";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { signup, sendEmailCode, verifyEmailCode } from "../../service/user/User";
import AlertModal from "../../components/modal/AlertModal";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import LoadingButton from "../../components/button/LoadingButton";

import {
    ProfileUploadPropTypes,
    SignUpFormPropTypes,
    EmailSectionPropTypes,
    PasswordSectionPropTypes,
    PasswordInputPropTypes,
    InputFieldPropTypes,
} from "../../utils/propTypes";

/** ---- 비밀번호 규칙 ---- */
function getPasswordError(pw) {
    if (!pw) return "";

    const rules = [
        { test: pw.length >= 8 && pw.length <= 20, msg: "비밀번호의 길이가 8~20자가 되어야 합니다." },
        { test: /[A-Z]/.test(pw), msg: "비밀번호에 대문자가 최소 1개 포함되어야 합니다." },
        { test: /[A-Za-z]/.test(pw), msg: "비밀번호에 영문이 포함되어야 합니다." },
        { test: /\d/.test(pw), msg: "비밀번호에 숫자가 포함되어야 합니다." },
        {
            test: /[!@#$%^&*()_+~\-={}[\]|;:"<>,.?/]/.test(pw),
            msg: "비밀번호에 특수문자가 포함되어야 합니다."
        }
    ];

    const failed = rules.find((r) => !r.test);
    return failed ? failed.msg : "";
}

function validateBeforeSubmit(isVerified, passwordMessage, isPasswordMatch) {
    if (!isVerified)
        return { title: "이메일 인증 필요", message: "회원가입을 위해 이메일 인증을 완료해주세요!" };

    if (passwordMessage)
        return { title: "비밀번호 조건 불충족", message: passwordMessage };

    if (!isPasswordMatch)
        return { title: "비밀번호 불일치", message: "비밀번호가 일치하지 않습니다." };

    return null;
}

function createFormData(form, pw, file) {
    const formData = new FormData();
    formData.append("name", form.name.value);
    formData.append("nickname", form.nickname.value);
    formData.append("email", form.email.value);
    formData.append("password", pw);
    if (file) formData.append("image", file);
    return formData;
}

export default function SignUp() {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [alertModal, setAlertModal] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
        onConfirm: null
    });

    const [profilePreview, setProfilePreview] = useState(null);
    const [profileFile, setProfileFile] = useState(null);

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const [remainingTime, setRemainingTime] = useState(null);
    const timerRef = useRef(null);

    const [isVerified, setIsVerified] = useState(false);
    const [code, setCode] = useState("");

    /** 🔥 로딩 상태 추가 */
    const [loadingSendEmail, setLoadingSendEmail] = useState(false);
    const [loadingVerifyEmail, setLoadingVerifyEmail] = useState(false);
    const [loadingSignup, setLoadingSignup] = useState(false);

    const uploadBtn = theme === "light" ? "bg-[#04BDF2]" : "bg-[#CC67FA]";
    const sendEmailBtn = "bg-[#2DD4BF]";
    const verifyBtn = theme === "light" ? "bg-[#CC67FA]" : "bg-[#FFFA99]";
    const signupBtn = "bg-[#FF90CD]";

    const passwordMessage = getPasswordError(password);
    const isPasswordMatch = password === passwordConfirm;

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertModal({
            open: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    /** --------------------------
     *   이메일 인증번호 발송
     * -------------------------- */
    const handleSendEmail = async () => {
        const email = getEmailInput();
        if (!email) return showAlert("warning", "입력 필요", "이메일을 입력해주세요!");

        setLoadingSendEmail(true);
        await processEmailCodeSend(email);
        setLoadingSendEmail(false);
    };

    /** --------------------------
     *   인증번호 확인
     * -------------------------- */
    const handleVerifyCode = async () => {
        const email = getEmailInput();
        if (!email || !code) {
            return showAlert("warning", "입력 필요", "이메일과 인증번호를 입력해주세요.");
        }

        setLoadingVerifyEmail(true);
        await processEmailVerify(email, code);
        setLoadingVerifyEmail(false);
    };

    /** --------------------------
     *   회원가입
     * -------------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateBeforeSubmit(isVerified, passwordMessage, isPasswordMatch);
        if (validationError) return showAlert("error", validationError.title, validationError.message);

        setLoadingSignup(true);

        const formData = createFormData(e.target, password, profileFile);
        const res = await signup(formData);

        setLoadingSignup(false);

        if (res.error) {
            return showAlert("error", "회원가입 실패", res.message);
        }

        showAlert("success", "회원가입 성공!", "정상적으로 회원가입이 완료되었습니다!", () =>
            navigate("/SignIn")
        );
    };

    async function processEmailCodeSend(email) {
        const result = await sendEmailCode(email);

        if (result.error)
            return showAlert("error", "발송 실패", "인증번호 발송 실패!");

        startTimer(result.expireAt);
        setIsVerified(false);
        showAlert("success", "전송 완료", "인증번호가 발송되었습니다!");
    }

    async function processEmailVerify(email, code) {
        const result = await verifyEmailCode(email, code);

        console.log("🔍 verifyEmailCode result:", result);

        /** ✔ 이메일 인증 성공 조건 정확히 처리 */
        if (result?.success === true) {
            setIsVerified(true);
            return showAlert("success", "이메일 인증 완료", "이메일 인증이 완료되었습니다!");
        }

        setIsVerified(false);
        showAlert("error", "인증 실패", "인증번호가 올바르지 않습니다.");
    }

    const startTimer = (expireTime) => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const diff = expireTime - Date.now();

            if (diff <= 0) {
                setRemainingTime("만료됨");
                clearInterval(timerRef.current);
                return;
            }

            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff / 1000) % 60);
            setRemainingTime(`${m}:${s < 10 ? "0" + s : s}`);
        }, 1000);
    };

    const getEmailInput = () => document.getElementById("email")?.value;

    return (
        <div className="flex h-full overflow-hidden">

            <div className="hidden lg:block w-1/2 relative">
                <img
                    alt=""
                    src="/Main.gif"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
                <div className="mx-auto w-full max-w-xl border dark:border-gray-700 rounded-xl shadow-lg p-8 dark:bg-gray-900">
                    <h2 className="mt-2 text-2xl font-bold dark:text-white text-center">회원가입</h2>

                    <ProfileUpload
                        profilePreview={profilePreview}
                        uploadBtn={uploadBtn}
                        setProfilePreview={setProfilePreview}
                        setProfileFile={setProfileFile}
                    />

                    <SignUpForm
                        handleSubmit={handleSubmit}
                        handleSendEmail={handleSendEmail}
                        handleVerifyCode={handleVerifyCode}
                        remainingTime={remainingTime}
                        setCode={setCode}
                        code={code}
                        password={password}
                        setPassword={setPassword}
                        passwordConfirm={passwordConfirm}
                        setPasswordConfirm={setPasswordConfirm}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        showPasswordConfirm={showPasswordConfirm}
                        setShowPasswordConfirm={setShowPasswordConfirm}
                        passwordMessage={passwordMessage}
                        isPasswordMatch={isPasswordMatch}
                        isVerified={isVerified}
                        verifyBtn={verifyBtn}
                        sendEmailBtn={sendEmailBtn}
                        signupBtn={signupBtn}
                        loadingSendEmail={loadingSendEmail}
                        loadingVerifyEmail={loadingVerifyEmail}
                        loadingSignup={loadingSignup}
                    />
                </div>
            </div>

            <AlertModal
                open={alertModal.open}
                onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
                onConfirm={alertModal.onConfirm}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
            />
        </div>
    );
}

/* =======================================================================================
   ---------------------- 아래 컴포넌트들은 모두 PropTypes 포함됨 -------------------------
   ======================================================================================= */

function ProfileUpload({ profilePreview, uploadBtn, setProfilePreview, setProfileFile }) {
    return (
        <div className="flex justify-center mt-6">
            <div className="relative w-28 h-28">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {profilePreview ? (
                        <img src={profilePreview} className="object-cover w-full h-full" alt="" />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500 text-sm dark:text-gray-300">
                            미리보기
                        </div>
                    )}
                </div>

                <label
                    htmlFor="profileImage"
                    className={`absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:opacity-80 ${uploadBtn}`}
                >
                    <FcCamera />
                </label>

                <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setProfilePreview(URL.createObjectURL(file));
                            setProfileFile(file);
                        }
                    }}
                />
            </div>
        </div>
    );
}

function SignUpForm(props) {
    return (
        <form className="mt-8 space-y-6" onSubmit={props.handleSubmit} encType="multipart/form-data">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField label="이름" id="name" required placeholder="이름 입력" />
                <InputField label="닉네임" id="nickname" required placeholder="닉네임 입력" />
            </div>

            <EmailSection {...props} />

            <PasswordSection {...props} />

            <LoadingButton
                text="회원가입"
                isLoading={props.loadingSignup}
                disabled={!props.isVerified}
                className={
                    props.isVerified
                        ? `${props.signupBtn} text-white hover:opacity-80`
                        : "bg-gray-400 cursor-not-allowed"
                }
            />
        </form>
    );
}

function InputField({ label, id, ...rest }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium dark:text-gray-100">
                {label}
            </label>
            <input
                id={id}
                name={id}
                className="mt-2 block w-full rounded-md bg-white px-3 py-2
                           text-gray-900 outline outline-gray-300
                           focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                {...rest}
            />
        </div>
    );
}

function EmailSection({
                          handleSendEmail,
                          handleVerifyCode,
                          remainingTime,
                          sendEmailBtn,
                          verifyBtn,
                          code,
                          setCode,
                          isVerified,
                          loadingSendEmail,
                          loadingVerifyEmail
                      }) {
    return (
        <div>
            <label htmlFor="email" className="block text-sm font-medium dark:text-gray-100">
                이메일
            </label>

            <div className="mt-2 flex gap-2">
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="이메일 입력"
                    className="flex-[3] rounded-md bg-white px-3 py-2 text-gray-900
                   outline outline-gray-300 focus:outline-indigo-600
                   dark:bg-white/5 dark:text-white"
                />

                <div className="flex-[1]">
                    <LoadingButton
                        text="인증번호 발송"
                        isLoading={loadingSendEmail}
                        onClick={handleSendEmail}
                        className={`${sendEmailBtn} text-black w-full`}
                    />
                </div>
            </div>

            {remainingTime && <p className="mt-1 text-sm text-red-500">남은 시간: {remainingTime}</p>}

            <div className="mt-3 flex gap-2">
                <input
                    type="text"
                    placeholder="인증번호 입력"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-[3] rounded-md bg-white px-3 py-2 text-gray-900
                   outline outline-gray-300 focus:outline-indigo-600
                   dark:bg-white/5 dark:text-white"
                />

                <div className="flex-[1]">
                    <LoadingButton
                        text="인증 확인"
                        isLoading={loadingVerifyEmail}
                        onClick={handleVerifyCode}
                        className={`${verifyBtn} text-black w-full`}
                    />
                </div>
            </div>

            {isVerified && <p className="mt-1 text-sm text-green-400">✔ 이메일 인증 성공!</p>}
        </div>
    );
}

function PasswordSection({
                             password,
                             setPassword,
                             passwordConfirm,
                             setPasswordConfirm,
                             showPassword,
                             setShowPassword,
                             showPasswordConfirm,
                             setShowPasswordConfirm,
                             passwordMessage,
                             isPasswordMatch
                         }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <PasswordInput
                label="비밀번호"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                show={showPassword}
                setShow={setShowPassword}
                error={passwordMessage}
                placeholder="비밀번호 입력"
            />

            <PasswordInput
                label="비밀번호 확인"
                id="passwordConfirm"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                show={showPasswordConfirm}
                setShow={setShowPasswordConfirm}
                error={!isPasswordMatch && passwordConfirm.length > 0 ? "비밀번호가 일치하지 않습니다." : ""}
                placeholder="비밀번호 재입력"
            />
        </div>
    );
}

function PasswordInput({ label, id, value, onChange, show, setShow, error, placeholder }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium dark:text-gray-100">
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="mt-2 block w-full rounded-md bg-white px-3 py-2 pr-10
                               text-gray-900 outline outline-gray-300
                               focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
                />

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-300"
                >
                    {show ? <AiFillEyeInvisible /> : <AiFillEye />}
                </button>
            </div>

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

ProfileUpload.propTypes = ProfileUploadPropTypes;
SignUpForm.propTypes = SignUpFormPropTypes;
EmailSection.propTypes = EmailSectionPropTypes;
PasswordSection.propTypes = PasswordSectionPropTypes;
PasswordInput.propTypes = PasswordInputPropTypes;
InputField.propTypes = InputFieldPropTypes;