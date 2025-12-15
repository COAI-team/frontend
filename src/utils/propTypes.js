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
    subscriptionInfo: PropTypes.shape({
        text: PropTypes.string,
        tone: PropTypes.oneOf(["muted", "primary", "error"]),
    }),
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

/* ----------------------------------------
 * MobileMenuButton PropTypes
 * ---------------------------------------- */
export const MobileMenuButtonPropTypes = {
    theme: PropTypes.oneOf(["light", "dark"]).isRequired,
};

/* ----------------------------------------
 * Logo PropTypes
 * ---------------------------------------- */
export const LogoPropTypes = {
    theme: PropTypes.oneOf(["light", "dark"]).isRequired,
};

/* ----------------------------------------
 * MobileNav PropTypes
 * ---------------------------------------- */
export const MobileNavPropTypes = {
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
 * RightActions PropTypes
 * ---------------------------------------- */
export const RightActionsPropTypes = {
    theme: PropTypes.oneOf(["light", "dark"]).isRequired,
    setTheme: PropTypes.func.isRequired,
    user: PropTypes.shape({
        nickname: PropTypes.string,
        image: PropTypes.string,
        role: PropTypes.string,
    }),
    logout: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
    BASE_URL: PropTypes.string.isRequired,
    accessToken: PropTypes.string,
    hydrated: PropTypes.bool,
};

export const RuleItemPropTypes = {
    ok: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired,
}

export const InputRuleItemPropTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
}

export const EmailRuleItemPropTypes = {
    email: PropTypes.string.isRequired,
    setEmail: PropTypes.func.isRequired,
    setEmailError: PropTypes.func.isRequired,
    validateEmail: PropTypes.func.isRequired,
    emailError: PropTypes.string,
    handleSendEmail: PropTypes.func.isRequired,
    handleVerifyCode: PropTypes.func.isRequired,
    remainingTime: PropTypes.string,
    sendEmailBtn: PropTypes.string.isRequired,
    verifyBtn: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    setCode: PropTypes.func.isRequired,
    isVerified: PropTypes.bool.isRequired,
    loadingSendEmail: PropTypes.bool.isRequired,
    loadingVerifyEmail: PropTypes.bool.isRequired,
}

export const PasswordRuleItemPropTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    error: PropTypes.string,
    placeholder: PropTypes.string,
}

export const PasswordInputPropTypes = {
    password: PropTypes.string.isRequired,
    setPassword: PropTypes.func.isRequired,
    passwordConfirm: PropTypes.string.isRequired,
    setPasswordConfirm: PropTypes.func.isRequired,
    showPassword: PropTypes.bool.isRequired,
    setShowPassword: PropTypes.func.isRequired,
    showPasswordConfirm: PropTypes.bool.isRequired,
    setShowPasswordConfirm: PropTypes.func.isRequired,
    passwordRules: PropTypes.object.isRequired,
    passwordMessage: PropTypes.string,
    isPasswordMatch: PropTypes.bool.isRequired,
}

export const SignUpFormPropTypes = {
    handleSubmit: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
}

export const ThemeContextPropTypes = {
    children: PropTypes.node.isRequired
}

export const ParagraphPropTypes = {
    children: PropTypes.node.isRequired,
}

export const StrongPropTypes = {
  children: PropTypes.node.isRequired,
}

export const TopicSelectorPropTypes = {
  selectedTopic: PropTypes.string,
  onTopicSelect: PropTypes.func.isRequired,
}

export const CodeEditorPropTypes = {
  language: PropTypes.oneOf(['javascript', 'python', 'cpp', 'java']).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onMount: PropTypes.func,
  height: PropTypes.string,
  theme: PropTypes.oneOf(['vs-dark', 'light']),
  readOnly: PropTypes.bool,
  className: PropTypes.string,
};
