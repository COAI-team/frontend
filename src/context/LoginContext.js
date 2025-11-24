import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { LoginProviderPropTypes } from "../utils/propTypes";

const LoginContext = createContext();

export function LoginProvider({ children }) {

    // 전체 인증 정보 저장 (token + user)
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // 앱 초기 로딩 시 저장된 로그인 정보 복원
    useEffect(() => {
        const saved = localStorage.getItem("auth") || sessionStorage.getItem("auth");
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log("🟢 저장된 로그인 복원:", parsed);
            setAuth(parsed);
        }
    }, []);

    // 로그인 (전체 로그인 응답을 저장)
    const login = (loginResponse, remember = false) => {
        console.log("🔵 login() 호출됨:", loginResponse);

        // loginResponse = { accessToken, refreshToken, user }
        setAuth(loginResponse);

        if (remember) {
            localStorage.setItem("auth", JSON.stringify(loginResponse));
        } else {
            sessionStorage.setItem("auth", JSON.stringify(loginResponse));
        }
    };

    // 로그아웃
    const logout = () => {
        console.log("🔴 logout() 호출됨");
        setAuth(null);
        setLoginResult(null);

        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
    };

    console.log("📌 현재 auth 상태:", auth);
    console.log("📌 현재 loginResult 상태:", loginResult);

    // context로 제공할 값들
    const value = useMemo(
        () => ({
            auth,                     // 전체 데이터
            user: auth?.user || null, // user만 필요할 때 쉽게 접근
            accessToken: auth?.accessToken || null,
            refreshToken: auth?.refreshToken || null,

            login,
            logout,
            loginResult,
            setLoginResult,
        }),
        [auth, loginResult]
    );

    return React.createElement(
        LoginContext.Provider,
        { value },
        children
    );
}

LoginProvider.propTypes = LoginProviderPropTypes;

export function useLogin() {
    return useContext(LoginContext);
}

export { LoginContext };