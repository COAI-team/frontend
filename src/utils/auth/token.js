// 캐싱 및 재사용을 위한 상수
const AUTH_KEY = "auth";
const LEGACY_ACCESS_KEY = "accessToken";
const LEGACY_REFRESH_KEY = "refreshToken";

// accessToken & refreshToken 저장된 auth 객체 가져오기
export const getAuth = (() => {
  let cachedAuth = null;

  return () => {
    // 캐시 확인
    if (cachedAuth !== null) return cachedAuth;

    // localStorage 우선, sessionStorage fallback
    let raw = localStorage.getItem(AUTH_KEY);
    if (!raw) raw = sessionStorage.getItem(AUTH_KEY);

    if (raw) {
      try {
        cachedAuth = JSON.parse(raw);
        return cachedAuth;
      } catch (e) {
        console.warn("auth 파싱 실패, 삭제합니다.", e);
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
      }
    }

    // 레거시 대응 (한 번만 실행)
    const legacyAccess = localStorage.getItem(LEGACY_ACCESS_KEY) ||
      sessionStorage.getItem(LEGACY_ACCESS_KEY);
    const legacyRefresh = localStorage.getItem(LEGACY_REFRESH_KEY) ||
      sessionStorage.getItem(LEGACY_REFRESH_KEY);

    if (legacyAccess) {
      cachedAuth = {
        accessToken: legacyAccess,
        refreshToken: legacyRefresh || null,
        user: null,
      };
      return cachedAuth;
    }

    cachedAuth = null;
    return null;
  };
})();

// auth 객체 저장 (캐시 무효화)
export const saveAuth = (auth) => {
  const data = JSON.stringify(auth);
  localStorage.setItem(AUTH_KEY, data);
  sessionStorage.setItem(AUTH_KEY, data);
  getAuth.cachedAuth = null; // 캐시 무효화
};

// auth 삭제 (캐시 무효화)
export const removeAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  sessionStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
  sessionStorage.removeItem(LEGACY_REFRESH_KEY);
  getAuth.cachedAuth = null; // 캐시 무효화
};
