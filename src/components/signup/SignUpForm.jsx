import {SignUpFormPropTypes} from "../../utils/propTypes";
import InputField from "./InputField";
import EmailSection from "./EmailSection";
import PasswordSection from "./PasswordSection";
import LoadingButton from "../../components/button/LoadingButton";

export default function SignUpForm(props) {
    return (
        <form className="mt-8 space-y-6" onSubmit={props.handleSubmit}>

            {/* 이름 + 닉네임 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                <InputField
                    label="이름"
                    id="name"
                    value={props.name}
                    onChange={(e) => props.setName(e.target.value)}
                    placeholder="이름 입력"
                    required
                />

                <InputField
                    label="닉네임"
                    id="nickname"
                    value={props.nickname}
                    onChange={(e) => {
                        const v = e.target.value;
                        props.setNickname(v);
                        props.setNicknameError(props.validateNickname(v));
                    }}
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

SignUpForm.propTypes = SignUpFormPropTypes;