import { useState, useMemo, useEffect } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../utils/propTypes";

export default function LoginProvider({ children }) {
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // 🔥 저장된 로그인 정보 복원
    useEffect(() => {
        const saved =
            localStorage.getItem("auth") || sessionStorage.getItem("auth");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                if (parsed.accessToken) {
                    parsed.user = {
                        ...parsed.user,
                        image:
                            parsed.user.image ??
                            parsed.user.profileImageUrl ??
                            null,
                    };
                    setAuth(parsed);
                } else {
                    localStorage.removeItem("auth");
                    sessionStorage.removeItem("auth");
                }
            } catch {
                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
            }
        }
    }, []);

    const login = (loginResponse, remember = false) => {
        const updated = {
            ...loginResponse,
            user: {
                ...loginResponse.user,
                image:
                    loginResponse.user.image ??
                    loginResponse.user.profileImageUrl ??
                    null,
            },
        };
        setAuth(updated);

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("auth", JSON.stringify(updated));
    };

    const logout = () => {
        setAuth(null);
        setLoginResult(null);
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
    };

    const setUser = (updatedUser) => {
        setAuth((prev) => {
            if (!prev) return prev;

            const newAuth = {
                ...prev,
                user: {
                    ...prev.user,
                    ...updatedUser,
                },
            };

            const saved =
                localStorage.getItem("auth") ||
                sessionStorage.getItem("auth");

            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.user = newAuth.user;

                if (localStorage.getItem("auth")) {
                    localStorage.setItem("auth", JSON.stringify(parsed));
                } else {
                    sessionStorage.setItem("auth", JSON.stringify(parsed));
                }
            }

            return newAuth;
        });
    };

    const value = useMemo(
        () => ({
            auth,
            user: auth?.user || null,
            accessToken: auth?.accessToken || null,
            refreshToken: auth?.refreshToken || null,
            login,
            logout,
            loginResult,
            setLoginResult,
            setUser,
        }),
        [auth, loginResult]
    );

    return (
        <LoginContext.Provider value={value}>
            {children}
        </LoginContext.Provider>
    );
}

LoginProvider.propTypes = LoginProviderPropTypes;