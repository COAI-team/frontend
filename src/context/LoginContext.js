import React, { createContext, useContext, useState, useMemo } from "react";

const LoginContext = createContext();

export function LoginProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    const login = (userInfo) => {
        setUser(userInfo);
    };

    const logout = () => {
        setUser(null);
        setLoginResult(null);
    };

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