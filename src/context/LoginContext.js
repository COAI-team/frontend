import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { LoginProviderPropTypes } from "../utils/propTypes";

const LoginContext = createContext();

export function LoginProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // 앱 초기 로딩 시 저장된 로그인 정보 복원
    useEffect(() => {
        const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log("🟢 저장된 로그인 복원:", parsed);
            setUser(parsed);
        }
    }, []);

    // 로그인
    const login = (userInfo, remember = false) => {
        console.log("🔵 login() 호출됨:", userInfo);

        setUser(userInfo);

        if (remember) {
            localStorage.setItem("user", JSON.stringify(userInfo));
        } else {
            sessionStorage.setItem("user", JSON.stringify(userInfo));
        }
    };

    // 로그아웃
    const logout = () => {
        console.log("🔴 logout() 호출됨");
        setUser(null);
        setLoginResult(null);

        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
    };

    console.log("📌 현재 user 상태:", user);
    console.log("📌 현재 loginResult 상태:", loginResult);

    const value = useMemo(() => ({
        user,
        loginResult,
        setLoginResult,
        login,
        logout,
    }), [user, loginResult]);

    // JSX 없이 React.createElement로 반환
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