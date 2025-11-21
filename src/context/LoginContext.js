import React, { createContext, useContext, useState, useMemo } from "react";

const LoginContext = createContext();

export function LoginProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    const login = (userInfo) => {
        console.log("🔵 login() 호출됨. 전달된 userInfo:", userInfo);
        setUser(userInfo);
    };

    const logout = () => {
        console.log("🔴 logout() 호출됨.");
        setUser(null);
        setLoginResult(null);
    };

    // 상태 변화 확인용 콘솔
    console.log("📌 현재 user 상태:", user);
    console.log("📌 현재 loginResult 상태:", loginResult);

    const value = useMemo(() => ({
        user,
        loginResult,
        setLoginResult,
        login,
        logout
    }), [user, loginResult]);

    return React.createElement(
        LoginContext.Provider,
        { value },
        children
    );
}

export function useLogin() {
    return useContext(LoginContext);
}

export { LoginContext };