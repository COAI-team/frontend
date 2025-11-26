import PropTypes from "prop-types";

/* ----------------------------------------
 * AlertModal PropTypes
 * ---------------------------------------- */
export const AlertModalPropTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    type: PropTypes.oneOf(["success", "warning", "error"]),
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
};

/* ----------------------------------------
 * NavLinks PropTypes
 * ---------------------------------------- */
export const NavLinksPropTypes = {
    mobile: PropTypes.bool,
    navigation: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired,
            current: PropTypes.bool,
        })
    ).isRequired,
    onLinkClick: PropTypes.func.isRequired,
};

/* ----------------------------------------
 * Dropdown PropTypes
 * ---------------------------------------- */
export const DropdownPropTypes = {
    button: PropTypes.node.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            href: PropTypes.string,
            onClick: PropTypes.func,
        })
    ).isRequired,
    width: PropTypes.string,
};

/* ----------------------------------------
 * LoginProvider PropTypes
 * ---------------------------------------- */
export const LoginProviderPropTypes = {
    children: PropTypes.node.isRequired,
};

/* ----------------------------------------
 * ResetPasswordModal PropTypes
 * ---------------------------------------- */
export const ResetPasswordModalPropTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

/* ----------------------------------------
 * SignUp용 PropTypes
 * ---------------------------------------- */

/** ProfileUpload */
export const ProfileUploadPropTypes = {
    profilePreview: PropTypes.string,
    uploadBtn: PropTypes.string.isRequired,
    setProfilePreview: PropTypes.func.isRequired,
    setProfileFile: PropTypes.func.isRequired,
};

/** SignUpForm */
export const SignUpFormPropTypes = {
    handleSubmit: PropTypes.func.isRequired,
    handleSendEmail: PropTypes.func.isRequired,
    handleVerifyCode: PropTypes.func.isRequired,
    remainingTime: PropTypes.string,
    setCode: PropTypes.func.isRequired,
    code: PropTypes.string.isRequired,

    password: PropTypes.string.isRequired,
    setPassword: PropTypes.func.isRequired,
    passwordConfirm: PropTypes.string.isRequired,
    setPasswordConfirm: PropTypes.func.isRequired,

    showPassword: PropTypes.bool.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    showPasswordConfirm: PropTypes.bool.isRequired,
    setShowPasswordConfirm: PropTypes.func.isRequired,

    passwordMessage: PropTypes.string.isRequired,
    isPasswordMatch: PropTypes.bool.isRequired,
    isVerified: PropTypes.bool.isRequired,

    verifyBtn: PropTypes.string.isRequired,
    sendEmailBtn: PropTypes.string.isRequired,
    signupBtn: PropTypes.string.isRequired,
};

/** InputField */
export const InputFieldPropTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
};

/** EmailSection */
export const EmailSectionPropTypes = {
    handleSendEmail: PropTypes.func.isRequired,
    handleVerifyCode: PropTypes.func.isRequired,
    remainingTime: PropTypes.string,
    sendEmailBtn: PropTypes.string.isRequired,
    verifyBtn: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    setCode: PropTypes.func.isRequired,
    isVerified: PropTypes.bool.isRequired,
};

/** PasswordSection */
export const PasswordSectionPropTypes = {
    password: PropTypes.string.isRequired,
    setPassword: PropTypes.func.isRequired,
    passwordConfirm: PropTypes.string.isRequired,
    setPasswordConfirm: PropTypes.func.isRequired,
    showPassword: PropTypes.bool.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    showPasswordConfirm: PropTypes.bool.isRequired,
    setShowPasswordConfirm: PropTypes.func.isRequired,
    passwordMessage: PropTypes.string.isRequired,
    isPasswordMatch: PropTypes.bool.isRequired,
};

/** PasswordInput */
export const PasswordInputPropTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    error: PropTypes.string,
    placeholder: PropTypes.string,
};

/* ----------------------------------------
 * LoadingButton PropTypes
 * ---------------------------------------- */
export const LoadingButtonPropTypes = {
    text: PropTypes.string,
    isLoading: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    className: PropTypes.string,
};

/* ----------------------------------------
 * ViewModeCard PropTypes
 * ---------------------------------------- */
export const ViewModeCardPropTypes = {
    profile: PropTypes.shape({
        name: PropTypes.string,
        nickname: PropTypes.string,
        email: PropTypes.string,
        preview: PropTypes.string,
        image: PropTypes.string,
    }).isRequired,
    maskEmail: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
};

/* ----------------------------------------
 * EditModeCard PropTypes
 * ---------------------------------------- */
export const EditModeCardPropTypes = {
    profile: PropTypes.shape({
        name: PropTypes.string,
        nickname: PropTypes.string,
        email: PropTypes.string,
        preview: PropTypes.string,
        image: PropTypes.string,
    }).isRequired,
    setProfile: PropTypes.func.isRequired,
    handleImageChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
};