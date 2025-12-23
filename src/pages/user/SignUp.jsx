import {useState, useRef, useEffect} from "react";
import {signup, sendEmailCode, verifyEmailCode} from "../../service/user/User";
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";
import {useNavigate} from "react-router-dom";
import {useTheme} from "../../context/theme/useTheme";

import ProfileUpload from "../../components/signup/ProfileUpload";
import SignUpForm from "../../components/signup/SignUpForm";

import {
  validateNameError,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordRules,
} from "../../utils/validators";

import {createFormData} from "../../utils/forms/createFormData";

export default function SignUp() {
  const navigate = useNavigate();
  const {alert, showAlert, closeAlert} = useAlert();

  /* 입력 값 */
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  /* 에러 상태 */
  const [nicknameError, setNicknameError] = useState("");
  const [emailError, setEmailError] = useState("");

  /* 비밀번호 */
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const passwordMessage = validatePassword(password);
  const passwordRules = validatePasswordRules(password);
  const isPasswordMatch = password === passwordConfirm;

  /* 인증 */
  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState("");
  const [remainingTime, setRemainingTime] = useState(null);
  const timerRef = useRef(null);

  /* 로딩 */
  const [loadingSendEmail, setLoadingSendEmail] = useState(false);
  const [loadingVerifyEmail, setLoadingVerifyEmail] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);

  // 공통 로딩 헬퍼
  const withLoading = async (setLoading, fn) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  /* 이메일 발송 */
  const handleSendEmail = async () => {
    if (emailError) {
      showAlert("error", "이메일 오류", emailError);
      return;
    }

    if (!email) {
      showAlert({
        type: "warning",
        title: "입력 필요",
        message: "이메일을 입력해주세요.",
      });
      return;
    }

    await withLoading(setLoadingSendEmail, async () => {
      const result = await sendEmailCode(email);

      if (result && result.error) {
        showAlert({
          type: "error",
          title: "발송 실패",
          message: "인증번호 발송 실패!",
        });
        return;
      }

      // 서버에서 expireAt(타임스탬프)를 내려준다고 가정
      startTimer(result.expireAt);
      setIsVerified(false);

      showAlert({
        type: "success",
        title: "전송 완료",
        message: "인증번호가 발송되었습니다.",
      });
    });
  };

  /* 인증 확인 */
  const handleVerifyCode = async () => {
    if (!email || !code) {
      showAlert({
        type: "warning",
        title: "입력 필요",
        message: "이메일과 인증번호를 입력해주세요.",
      });
      return;
    }

    await withLoading(setLoadingVerifyEmail, async () => {
      const result = await verifyEmailCode(email, code);

      if (result && result.success) {
        setIsVerified(true);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRemainingTime(null);

        showAlert({
          type: "success",
          title: "인증 완료",
          message: "이메일 인증 성공!",
        });
        return;
      }

      setIsVerified(false);
      showAlert({
        type: "error",
        title: "인증 실패",
        message: "인증번호가 올바르지 않습니다.",
      });
    });
  };

  /* 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameErr = validateNameError(name);
    if (nameErr)
      return showAlert({
        type: "error",
        title: "이름 오류",
        message: nameErr,
      });

    if (nicknameError)
      return showAlert({
        type: "error",
        title: "닉네임 오류",
        message: nicknameError,
      });

    if (emailError)
      return showAlert({
        type: "error",
        title: "이메일 오류",
        message: emailError,
      });

    if (passwordMessage)
      return showAlert({
        type: "error",
        title: "비밀번호 오류",
        message: passwordMessage,
      });

    if (!isPasswordMatch)
      return showAlert({
        type: "error",
        title: "불일치",
        message: "비밀번호가 일치하지 않습니다.",
      });

    if (!isVerified)
      return showAlert({
        type: "error",
        title: "인증 필요",
        message: "이메일 인증이 필요합니다.",
      });

    await withLoading(setLoadingSignup, async () => {
      const formData = createFormData(e.target, password, profileFile);

      try {
        const res = await signup(formData);

        if (res && res.error) {
          showAlert({
            type: "error",
            title: "회원가입 실패",
            message: res.message,
          });
          return;
        }

        showAlert({
          type: "success",
          title: "회원가입 성공!",
          message: "회원가입이 완료되었습니다!",
          onConfirm: () => navigate("/signin"),
        });
      } catch (error) {
        showAlert({
          type: "error",
          title: "회원가입 실패",
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "회원가입 중 오류가 발생했습니다.",
        });
      }
    });
  };

  /* 타이머 */
  const startTimer = (expireTime) => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const diff = expireTime - Date.now();

      if (diff <= 0) {
        setRemainingTime("만료됨");
        clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff / 1000) % 60);
      setRemainingTime(`${m}:${s < 10 ? "0" + s : s}`);
    }, 1000);
  };

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  /* 테마 */
  const {theme} = useTheme();
  const uploadBtn = theme === "light" ? "bg-[#04BDF2]" : "bg-[#CC67FA]";
  const sendEmailBtn = "bg-[#2DD4BF]";
  const verifyBtn = theme === "light" ? "bg-[#CC67FA]" : "bg-[#FFFA99]";
  const signupBtn = "bg-[#FF90CD]";

  /* 프로필 */
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  return (
    <div className="flex h-full overflow-hidden dark:bg-[#131313]">
      <div className="hidden lg:block w-1/2 relative">
        <img
          alt=""
          src="/Main.gif"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="w-full py-4 lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2e2e] rounded-xl shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-8">
          <h2 className="text-2xl font-bold dark:text-white text-center">
            회원가입
          </h2>

          <ProfileUpload
            profilePreview={profilePreview}
            uploadBtn={uploadBtn}
            setProfilePreview={setProfilePreview}
            setProfileFile={setProfileFile}
          />

          <SignUpForm
            {...{
              handleSubmit,
              name,
              nickname,
              email,
              nicknameError,
              emailError,
              setName,
              setNickname,
              setEmail,
              setNicknameError,
              setEmailError,
              validateNickname,
              validateEmail,
              handleSendEmail,
              handleVerifyCode,
              remainingTime,
              code,
              setCode,
              password,
              setPassword,
              passwordConfirm,
              setPasswordConfirm,
              passwordMessage,
              passwordRules,
              isPasswordMatch,
              showPassword,
              setShowPassword,
              showPasswordConfirm,
              setShowPasswordConfirm,
              isVerified,
              verifyBtn,
              sendEmailBtn,
              signupBtn,
              loadingSendEmail,
              loadingVerifyEmail,
              loadingSignup,
            }}
          />
        </div>
      </div>

      <AlertModal
        open={alert.open}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
}
