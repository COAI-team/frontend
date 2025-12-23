import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch User Stats (Parallel)
      if (user.userId) {
        const [levelRes, usageRes] = await Promise.all([
          getUserLevel(user.userId),
          getUsageInfo(user.userId)
        ]);
        
        setUserStats({
          level: levelRes.data || null,
          exp: levelRes.data?.exp || 0,
          totalSolved: usageRes.data?.totalSolved || 0
        });
      }

      // 2. Fetch Popular Posts from Weekly Popular APIs
      const [freeboardRes, codeboardRes] = await Promise.all([
        axiosInstance.get("/popular/freeboard"),
        axiosInstance.get("/popular/codeboard")
      ]);

      // Transform to unified schema
      const freeSchema = (freeboardRes.data || []).map(p => ({ 
        ...p, 
        type: 'free', 
        title: p.freeboardTitle, 
        id: p.freeboardId, 
        author: p.userNickname || 'Unknown',
        views: p.freeboardClick, 
        date: p.freeboardCreatedAt,
        likes: p.likeCount,
        comments: p.commentCount,
        score: p.popularityScore,
        ranking: p.ranking,
        plainText: p.freeboardPlainText || '내용 없음',
        image: p.freeboardRepresentImage
      }));

      const codeSchema = (codeboardRes.data || []).map(p => ({ 
        ...p, 
        type: 'code', 
        title: p.codeboardTitle, 
        id: p.codeboardId, 
        author: p.userNickname || 'Unknown',
        views: p.codeboardClick, 
        date: p.codeboardCreatedAt,
        likes: p.likeCount,
        comments: p.commentCount,
        score: p.popularityScore,
        ranking: p.ranking,
        plainText: p.codeboardPlainText || '내용 없음', 
        aiScore: p.aiScore,
        image: p.codeboardRepresentImage
      }));
      
      // Combine: 자유게시판 3개 + 코드게시판 3개
      const combined = [...freeSchema, ...codeSchema];
      setPopularPosts(combined);

    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      setPopularPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    if (post.type === 'free') navigate(`/freeboard/${post.id}`);
    else navigate(`/codeboard/${post.id}`);
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