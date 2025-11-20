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