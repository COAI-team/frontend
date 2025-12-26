import { useState, useMemo, useEffect } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../../utils/propTypes";
import { getUserInfo } from "../../service/user/User";
import { getAuth, saveAuth, removeAuth } from "../../utils/auth/token";
import { normalizeUser } from "../../utils/normalizeUser";
import axiosInstance from "../../server/AxiosConfig";

export default function LoginProvider({ children }) {
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // ✅ 1) hydration 상태 추가
    const [hydrated, setHydrated] = useState(false);

    // ===============================================================
    // 저장된 로그인 정보 복원 + 서버에서 AccessToken 검증
    // ===============================================================
    useEffect(() => {
        const saved = getAuth();

        // 저장된 토큰이 아예 없으면 → 그냥 hydration 완료 처리
        if (!saved?.accessToken) {
            setHydrated(true); // ✅ 토큰 없어도 "검사 끝" 표시
            return;
        }

        // 🔥 accessToken 없으면 사용자 정보 요청 금지
        if (!saved?.accessToken) {
            setAuth(null);
            return;
        }

        // 🔥 저장된 auth 복원
        setAuth(saved);

        // 🔥 이미 user 정보가 있으면 /users/me 호출 불필요
        if (saved.user) {
            setHydrated(true);
            return;
        }

        // 🔥 accessToken은 있지만 user 정보가 없을 때만 /users/me 요청
        getUserInfo()
            .then((res) => {
                if (!res) {
                    removeAuth();
                    setAuth(null);
                    return;
                }

                const newAuth = {
                    ...saved,
                    user: normalizeUser(res),
                };

                saveAuth(newAuth);
                setAuth(newAuth);
            })
            .catch((err) => {
                // 사용자 정보 확인 실패 시 저장된 인증 정보를 모두 제거해 로그아웃 상태가 확실히 반영되도록 처리
                removeAuth();
                setAuth(null);
                console.warn("getUserInfo 실패로 인증 정보를 초기화했습니다:", err?.message || err);
            })
            .finally(() => {
                setHydrated(true);
            });
    }, []);

    // accessToken 변경 시 Axios 기본 Authorization 헤더도 동기화
    useEffect(() => {
        if (auth?.accessToken) {
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${auth.accessToken}`;
        } else {
            delete axiosInstance.defaults.headers.common.Authorization;
        }
    }, [auth?.accessToken]);

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

        // 이미 로그인 성공했으니 이 시점 이후 화면 들어온 곳에서는 hydration 완료된 상태라고 봐도 됨
        setHydrated(true);
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
            hydrated,
            isAlertOpen,
            setIsAlertOpen
        }),
        [auth, loginResult, hydrated, isAlertOpen]
    );

    return (
        <LoginContext.Provider value={value}>
            {children}
        </LoginContext.Provider>
    );
}

LoginProvider.propTypes = LoginProviderPropTypes;
