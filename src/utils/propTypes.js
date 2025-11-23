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
            label: PropTypes.string.isRequired,   // 메뉴 이름
            href: PropTypes.string,               // 링크 이동
            onClick: PropTypes.func,              // 클릭 이벤트
        })
    ).isRequired,
    width: PropTypes.string,                     // 메뉴 너비 (옵션)
};

/* ----------------------------------------
 * LoginProvider PropTypes
 * ---------------------------------------- */
export const LoginProviderPropTypes = {
    children: PropTypes.node.isRequired,
};

/* ----------------------------------------
 * ResetPasswordModal PropTypes  ← ★ 추가됨
 * ---------------------------------------- */
export const ResetPasswordModalPropTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};