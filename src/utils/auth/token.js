// accessToken & refreshToken 저장된 auth 객체 가져오기
export const getAuth = () => {
    const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    return raw ? JSON.parse(raw) : null;
};

// auth 객체 저장
export const saveAuth = (auth) => {
    // localStorage 또는 sessionStorage에 저장된 auth가 있는 곳에 맞춰 재저장
    if (localStorage.getItem("auth") !== null) {
        localStorage.setItem("auth", JSON.stringify(auth));
    } else if (sessionStorage.getItem("auth") === null) {
        // 기본은 localStorage에 저장
        localStorage.setItem("auth", JSON.stringify(auth));
    } else {
        sessionStorage.setItem("auth", JSON.stringify(auth));
    }
};

// auth 삭제
export const removeAuth = () => {
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");
};