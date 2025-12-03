import { useState, useMemo, useEffect } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../utils/propTypes";
import { getUserInfo } from "../service/user/User.js";
import axios from "axios";

export default function LoginProvider({ children }) {
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

    // 🔥 auth가 변경될 때 axios Authorization 자동 설정
    useEffect(() => {
        if (auth?.accessToken) {
            axios.defaults.headers.common["Authorization"] =
                `Bearer ${auth.accessToken}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [auth]);

    // 🔥 저장된 로그인 정보 복원 + 서버에서 유저 정보 검증
    useEffect(() => {
        const saved =
            localStorage.getItem("auth") || sessionStorage.getItem("auth");

        if (!saved) return;

        try {
            const parsed = JSON.parse(saved);

            if (!parsed.accessToken) {
                localStorage.removeItem("auth");
                sessionStorage.removeItem("auth");
                return;
            }

            // 우선 auth 설정 → axios 헤더 적용
            setAuth(parsed);

            getUserInfo()
                .then((res) => {
                    // 백엔드는 error 필드 안 보냄 → 그냥 res 제대로 왔는지 판단
                    if (!res || res?.error) {
                        localStorage.removeItem("auth");
                        sessionStorage.removeItem("auth");
                        setAuth(null);
                        return;
                    }

                    // 🔥 normalize 처리
                    setAuth((prev) => {
                        if (!prev) return prev;

                        const normalizedUser = {
                            ...prev.user,
                            ...res,
                            image:
                                res.userImage ??
                                res.image ??
                                res.avatar_url ??
                                prev.user?.image ??
                                null,
                            nickname:
                                res.userNickname ??
                                res.nickname ??
                                prev.user?.nickname ??
                                null,
                            role:
                                res.userRole ??
                                res.role ??
                                prev.user?.role ??
                                null,
                        };

                        const newAuth = {
                            ...prev,
                            user: normalizedUser,
                        };

                        const storage = localStorage.getItem("auth")
                            ? localStorage
                            : sessionStorage;

                        storage.setItem("auth", JSON.stringify(newAuth));

                        return newAuth;
                    });
                })
                .catch(() => {
                    localStorage.removeItem("auth");
                    sessionStorage.removeItem("auth");
                    setAuth(null);
                });
        } catch (err) {
            console.error("Failed to parse saved auth:", err);
            localStorage.removeItem("auth");
            sessionStorage.removeItem("auth");
        }
    }, []);

    // 🔥 로그인 저장 함수
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
                    loginResponse.user.userImage ??
                    loginResponse.user.image ??
                    loginResponse.user.avatar_url ??
                    loginResponse.user.profileImageUrl ??
                    null,
                nickname:
                    loginResponse.user.userNickname ??
                    loginResponse.user.nickname ??
                    null,
                role:
                    loginResponse.user.userRole ??
                    loginResponse.user.role ??
                    null,
            },
        };

        setAuth(updated);

        // 🔥 로그인 직후에도 axios Authorization 자동 적용
        axios.defaults.headers.common["Authorization"] =
            `Bearer ${loginResponse.accessToken}`;

        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("auth", JSON.stringify(updated));
    };

    const logout = () => {
        setAuth(null);
        setLoginResult(null);
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");

        // 🔥 Authorization 헤더 제거
        delete axios.defaults.headers.common["Authorization"];
    };

    // 🔥 프로필 정보만 부분 수정
    const setUser = (updatedUser) => {
        setAuth((prev) => {
            if (!prev) return prev;

            const newAuth = {
                ...prev,
                user: {
                    ...prev.user,
                    ...updatedUser,
                    image:
                        updatedUser.userImage ??
                        updatedUser.image ??
                        updatedUser.avatar_url ??
                        prev.user?.image ??
                        null,
                    nickname:
                        updatedUser.userNickname ??
                        updatedUser.nickname ??
                        prev.user?.nickname ??
                        null,
                    role:
                        updatedUser.userRole ??
                        updatedUser.role ??
                        prev.user?.role ??
                        null,
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