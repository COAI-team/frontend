import React from "react";
import {LoadingButtonPropTypes} from "../../utils/propTypes.js";

const LoadingButton = ({
                           text = "로딩중…",
                           isLoading,
                           onClick,
                           disabled = false,
                           className = "",
                           ...rest
                       }) => {
    return (
        <button
            type="submit"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`
                flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-black
                ${className}
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            {...rest}
        >
            {isLoading && (
                <svg
                    className="mr-2 size-5 animate-spin text-black"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}

            {isLoading ? "로딩중…" : text}
        </button>
    );
};

LoadingButton.propTypes = LoadingButtonPropTypes;

export default LoadingButton;