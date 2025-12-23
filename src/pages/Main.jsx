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
  }, [fetchAllData, user]);

  // JSON 형식의 plainText에서 실제 텍스트 추출
  const extractPlainText = (jsonText) => {
    if (!jsonText) return '내용 없음';

    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const content = parsed[0].content || '';
        const plainText = content
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .trim();

        return plainText || '내용 없음';  // ✅ 빈 문자열도 처리
      }
    } catch (e) {
      return jsonText || '내용 없음';
    }

    return '내용 없음';  // ✅ 무조건 문자열 반환
  };

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
      const freeSchema = (freeboardRes.data || []).map(p => {
        const plainText = extractPlainText(p.freeboardPlainText);
        
        return { 
          ...p, 
          type: 'free', 
          title: p.freeboardTitle, 
          id: p.freeboardId, 
          author: p.userNickname || 'Unknown',
          profileImage: p.userImage,
          views: p.freeboardClick, 
          date: p.freeboardCreatedAt,
          likes: p.likeCount,
          comments: p.commentCount,
          score: p.popularityScore,
          ranking: p.ranking,
          plainText: plainText,
          image: p.freeboardRepresentImage
        };
      });

      const codeSchema = (codeboardRes.data || []).map(p => {
        const plainText = extractPlainText(p.codeboardPlainText);
        
        return { 
          ...p, 
          type: 'code', 
          title: p.codeboardTitle, 
          id: p.codeboardId, 
          author: p.userNickname || 'Unknown',
          profileImage: p.userImage,
          views: p.codeboardClick, 
          date: p.codeboardCreatedAt,
          likes: p.likeCount,
          comments: p.commentCount,
          score: p.popularityScore,
          ranking: p.ranking,
          plainText: plainText, 
          aiScore: p.aiScore,
          image: p.codeboardRepresentImage
        };
      });
      
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
