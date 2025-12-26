import { useCallback, useMemo, memo } from "react";
import { SignUpFormPropTypes } from "../../utils/propTypes";
import InputField from "./InputField";
import EmailSection from "./EmailSection";
import PasswordSection from "./PasswordSection";
import LoadingButton from "../../components/button/LoadingButton";

const SignUpForm = (props) => {
  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handleNameChange = useCallback((e) => {
    props.setName(e.target.value);
  }, [props]);

  const handleNicknameChange = useCallback((e) => {
    const v = e.target.value;
    props.setNickname(v);
    props.setNicknameError(props.validateNickname(v));
  }, [props]);

  // ✅ useMemo로 LoadingButton className 메모이제이션
  const buttonClassName = useMemo(() => {
    return props.isVerified
      ? `${props.signupBtn} text-white hover:opacity-80`
      : "bg-gray-400 cursor-not-allowed";
  }, [props.isVerified, props.signupBtn]);

  // ✅ useMemo로 버튼 비활성화 상태 메모이제이션
  const isButtonDisabled = useMemo(() =>
      !props.isVerified,
    [props.isVerified]
  );

  return (
    <form className="mt-8 space-y-6" onSubmit={props.handleSubmit}>

      {/* 이름 + 닉네임 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <InputField
          label="이름"
          id="name"
          value={props.name}
          onChange={handleNameChange}
          placeholder="이름 입력"
          required
        />

        <InputField
          label="닉네임"
          id="nickname"
          value={props.nickname}
          onChange={handleNicknameChange}
          error={props.nicknameError}
          placeholder="닉네임 입력"
          required
        />
      </div>

      <EmailSection {...props} />

      <PasswordSection {...props} />

      <LoadingButton
        text="회원가입"
        isLoading={props.loadingSignup}
        disabled={isButtonDisabled}
        className={buttonClassName}
      />
    </form>
  );
};

SignUpForm.propTypes = SignUpFormPropTypes;

export default memo(SignUpForm);
