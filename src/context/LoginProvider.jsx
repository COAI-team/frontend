import { useState, useMemo, useEffect } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../utils/propTypes";
import { getUserInfo } from "../service/user/User";
import { getAuth, saveAuth, removeAuth } from "../utils/auth/token";
import { normalizeUser } from "../utils/normalizeUser";

export default function LoginProvider({ children }) {
    const [auth, setAuth] = useState(null);
    const [loginResult, setLoginResult] = useState(null);

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
            .catch((err) => {
                // 토큰 검증 실패만 auth 제거, 기타 오류는 유지
                const status = err?.response?.status;
                if (status === 401) {
                    removeAuth();
                    setAuth(null);
                } else {
                    console.warn("getUserInfo 실패(토큰 유지):", err?.message || err);
                }
            })
            .finally(() => {
                // ✅ 성공이든 실패든 검사는 끝난 거니까 여기서 hydration 완료
                setHydrated(true);
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
            hydrated, // ✅ 여기서 컨텍스트로 내보내기
        }),
        [auth, loginResult, hydrated]
    );

    return (
        <LoginContext.Provider value={value}>
            {children}
        </LoginContext.Provider>
    );
}

LoginProvider.propTypes = LoginProviderPropTypes;
