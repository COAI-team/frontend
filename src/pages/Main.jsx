import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../context/login/useLogin";
import axiosInstance from "../server/AxiosConfig";
import { GuestLandingPage } from "../components/main";
import LoggedInMain from "./LoggedInMain";
import { getUserLevel, getUsageInfo } from "../service/algorithm/AlgorithmApi";

export default function Main() {
  const { user } = useLogin();
  const navigate = useNavigate();

  const [popularPosts, setPopularPosts] = useState([]);
  const [userStats, setUserStats] = useState({ level: null, exp: 0, totalSolved: 0 });
  const [loading, setLoading] = useState(false);

  // JSON 형식의 plainText에서 실제 텍스트 추출
  const extractPlainText = (jsonText) => {
    if (!jsonText) return "내용 없음";
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (
          (parsed[0].content || "")
            .replaceAll(/<[^>]+>/g, "")
            .replaceAll('&nbsp;', " ")
            .replaceAll('&lt;', "<")
            .replaceAll('&gt;', ">")
            .replaceAll('&amp;', "&")
            .trim() || "내용 없음"
        );
      }
    } catch {
      return jsonText || "내용 없음";
    }
    return "내용 없음";
  };

  // ✅ 반드시 useCallback + useEffect 위
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      if (user?.userId) {
        const [levelRes, usageRes] = await Promise.all([
          getUserLevel(user.userId),
          getUsageInfo(user.userId),
        ]);

        setUserStats({
          level: levelRes.data || null,
          exp: levelRes.data?.exp || 0,
          totalSolved: usageRes.data?.totalSolved || 0,
        });
      }

      const [freeboardRes, codeboardRes] = await Promise.all([
        axiosInstance.get("/popular/freeboard"),
        axiosInstance.get("/popular/codeboard"),
      ]);

      const freeSchema = (freeboardRes.data || []).map((p) => ({
        ...p,
        type: "free",
        title: p.freeboardTitle,
        id: p.freeboardId,
        author: p.userNickname || "Unknown",
        profileImage: p.userImage,
        views: p.freeboardClick,
        date: p.freeboardCreatedAt,
        likes: p.likeCount,
        comments: p.commentCount,
        score: p.popularityScore,
        ranking: p.ranking,
        plainText: extractPlainText(p.freeboardPlainText),
        image: p.freeboardRepresentImage,
      }));

      const codeSchema = (codeboardRes.data || []).map((p) => ({
        ...p,
        type: "code",
        title: p.codeboardTitle,
        id: p.codeboardId,
        author: p.userNickname || "Unknown",
        profileImage: p.userImage,
        views: p.codeboardClick,
        date: p.codeboardCreatedAt,
        likes: p.likeCount,
        comments: p.commentCount,
        score: p.popularityScore,
        ranking: p.ranking,
        plainText: extractPlainText(p.codeboardPlainText),
        aiScore: p.aiScore,
        image: p.codeboardRepresentImage,
      }));

      setPopularPosts([...freeSchema, ...codeSchema]);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setPopularPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ 이제 안전
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const handlePostClick = (post) => {
    post.type === "free"
      ? navigate(`/freeboard/${post.id}`)
      : navigate(`/codeboard/${post.id}`);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="w-full h-full flex flex-col items-center">
        {user ? (
          <LoggedInMain
            user={user}
            userStats={userStats}
            popularPosts={popularPosts}
            loading={loading}
            onPostClick={handlePostClick}
          />
        ) : (
          <GuestLandingPage />
        )}
      </div>
    </main>
  );
}
