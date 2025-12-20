import { useState, useMemo, useEffect, useCallback } from "react";
import { LoginContext } from "./LoginContext";
import { LoginProviderPropTypes } from "../../utils/propTypes";
import { getUserInfo } from "../../service/user/User";
import { getAuth, saveAuth, removeAuth } from "../../utils/auth/token";
import { normalizeUser } from "../../utils/normalizeUser";

export default function LoginProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [loginResult, setLoginResult] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ===============================================================
  // 저장된 로그인 정보 복원 + 서버에서 AccessToken 검증
  // ===============================================================
  useEffect(() => {
    const saved = getAuth();

    // 저장된 토큰이 아예 없으면 → 그냥 hydration 완료 처리
    if (!saved?.accessToken) {
      setHydrated(true);
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
        // 사용자 정보 확인 실패 시 저장된 인증 정보를 모두 제거
        removeAuth();
        setAuth(null);
        console.warn("getUserInfo 실패로 인증 정보를 초기화했습니다:", err?.message || err);
      })
      .finally(() => {
        setHydrated(true);
      });
  }, []); // ✅ 빈 배열 유지 - 마운트 시 한 번만 실행

  // ===============================================================
  // ✅ useCallback으로 login 함수 메모이제이션
  // ===============================================================
  const login = useCallback((loginResponse, remember = false) => {
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
    saveAuth(newAuth, remember);
    setHydrated(true);
  }, []);

  // ===============================================================
  // ✅ useCallback으로 logout 함수 메모이제이션
  // ===============================================================
  const logout = useCallback(() => {
    setAuth(null);
    setLoginResult(null);
    removeAuth();
  }, []);

  // ===============================================================
  // ✅ useCallback으로 setUser 함수 메모이제이션
  // ===============================================================
  const setUser = useCallback((updatedUser) => {
    setAuth((prev) => {
      if (!prev) return prev;

      const newAuth = {
        ...prev,
        user: normalizeUser(updatedUser, prev.user),
      };

      saveAuth(newAuth);

      return newAuth;
    });
  }, []);

  // ===============================================================
  // ✅ useMemo 의존성 배열에 함수들 추가
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
    [auth, loginResult, hydrated, isAlertOpen, login, logout, setUser]
  );

  return (
    <LoginContext.Provider value={value}>
      {children}
    </LoginContext.Provider>
  );
}

LoginProvider.propTypes = LoginProviderPropTypes;
