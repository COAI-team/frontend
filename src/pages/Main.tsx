import React from "react";
import { useTheme } from "next-themes"; // ✅ 다크모드 테마 사용 예시

export default function Main() {
    const { theme } = useTheme();

    // ✅ 조건부 스타일을 삼항식 대신 분리
    let containerStyle = "";
    if (theme === "light") {
        containerStyle = "text-gray-900";
    } else {
        containerStyle = "text-gray-100";
    }

    return (
        <main className={`min-h-screen transition-colors ${containerStyle}`}>
            <section className="flex flex-col items-center justify-center h-full">
                <h1 className="text-3xl font-bold mb-4">메인 페이지</h1>
                <p className="text-lg opacity-80">
                    현재 테마는 <strong>{theme === "light" ? "라이트 모드" : "다크 모드"}</strong>입니다.
                </p>
            </section>
        </main>
    );
}