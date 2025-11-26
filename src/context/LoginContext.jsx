import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { LoginProviderPropTypes } from "../utils/propTypes";

const LoginContext = createContext();

export function LoginProvider({ children }) {

    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // 🔥 앱 로딩 시 저장된 로그인 정보 복원
    useEffect(() => {
        const saved =
            localStorage.getItem("auth") || sessionStorage.getItem("auth");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // accessToken 없는 경우 — 무효 데이터 → 삭제
                if (!parsed.accessToken) {
                    localStorage.removeItem("auth");
                    sessionStorage.removeItem("auth");
                } else {
                    console.log("🟢 저장된 로그인 복원:", parsed);
                    setAuth(parsed);
                }
            } catch (e) {
                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
            }
        }
    }, []);

    // 🔵 로그인 (전체 응답 저장)
    const login = (loginResponse, remember = false) => {
        console.log("🔵 login() 호출됨:", loginResponse);

        setAuth(loginResponse);

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("auth", JSON.stringify(loginResponse));
    };

    // 🔴 로그아웃
    const logout = () => {
        console.log("🔴 logout() 호출됨");
        setAuth(null);
        setLoginResult(null);

        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
    };

    console.log("📌 현재 auth 상태:", auth);
    console.log("📌 현재 loginResult 상태:", loginResult);

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

export function useLogin() {
    return useContext(LoginContext);
}

export { LoginContext };