import { useState, useMemo, useEffect } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../utils/propTypes";
import { getUserInfo } from "../service/user/User";
import { getAuth, saveAuth, removeAuth } from "../utils/auth/token";
import { normalizeUser } from "../utils/normalizeUser";

export default function LoginProvider({ children }) {
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // ===============================================================
    // 저장된 로그인 정보 복원 + 서버에서 AccessToken 검증
    // ===============================================================
    useEffect(() => {
        const saved = getAuth();
        if (!saved?.accessToken) return;

        setAuth(saved);

        // AccessToken으로 유저 정보 확인
        getUserInfo()
            .then((res) => {
                if (!res) {
                    removeAuth();
                    setAuth(null);
                    return;
                }

                setAuth((prev) => {
                    if (!prev) return prev;

                    const newAuth = {
                        ...prev,
                        user: normalizeUser(res, prev.user),
                    };

                    saveAuth(newAuth);

                    return newAuth;
                });
            })
            .catch(() => {
                removeAuth();
                setAuth(null);
            });
    }, []);

    // ===============================================================
    // 로그인 처리
    // ===============================================================
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

        const newAuth = {
            ...loginResponse,
            user: normalizeUser(loginResponse.user),
        };

        setAuth(newAuth);

        // 저장 (remember = localStorage / 아니면 sessionStorage)
        saveAuth(newAuth, remember);
    };

    // ===============================================================
    // 로그아웃 처리
    // ===============================================================
    const logout = () => {
        setAuth(null);
        setLoginResult(null);
        removeAuth();
    };

    // ===============================================================
    // 프로필 정보 부분 업데이트
    // ===============================================================
    const setUser = (updatedUser) => {
        setAuth((prev) => {
            if (!prev) return prev;

            const newAuth = {
                ...prev,
                user: normalizeUser(updatedUser, prev.user),
            };

            saveAuth(newAuth);

            return newAuth;
        });
    };

    // ===============================================================
    // Context Memo
    // ===============================================================
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