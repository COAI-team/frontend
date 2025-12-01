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

        if (!saved) return;

        try {
            const parsed = JSON.parse(saved);

            // 토큰이 없으면 인증 정보 삭제
            if (!parsed.accessToken || !parsed.user) {
                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
                return;
            }

            parsed.user = {
                ...parsed.user,
                image:
                    parsed.user.image ??
                    parsed.user.avatar_url ??   // GitHub avatar
                    parsed.user.profileImageUrl ??
                    null,
            };

            setAuth(parsed);
        } catch (err) {
            console.error("Failed to parse saved auth:", err);
            localStorage.removeItem("auth");
            sessionStorage.removeItem("auth");
        }
    }, []);

    /**
     * 🔥 로그인 저장 함수
     * loginResponse = { accessToken, refreshToken, user }
     */
    const login = (loginResponse, remember = false) => {
        if (
            !loginResponse ||
            !loginResponse.accessToken ||
            !loginResponse.refreshToken ||
            !loginResponse.user
        ) {
            console.error("Invalid login response:", loginResponse);
            return;
        }

        const updated = {
            ...loginResponse,
            user: {
                ...loginResponse.user,
                image:
                    loginResponse.user.image ??
                    loginResponse.user.avatar_url ??
                    loginResponse.user.profileImageUrl ??
                    null,
            },
        };

        setAuth(updated);

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("auth", JSON.stringify(updated));
    };

    /**
     * 🔥 로그아웃
     */
    const logout = () => {
        setAuth(null);
        setLoginResult(null);
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
    };

    /**
     * 🔥 프로필 정보만 부분 수정 (토큰은 유지)
     */
    const setUser = (updatedUser) => {
        setAuth((prev) => {
            if (!prev) return prev;

            const newAuth = {
                ...prev,
                user: {
                    ...prev.user,
                    ...updatedUser,
                    image:
                        updatedUser.image ??
                        updatedUser.avatar_url ??
                        prev.user.image ??
                        null,
                },
            };

            // 저장된 auth 동기화
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

    /**
     * 🔥 Context value 최적화
     */
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