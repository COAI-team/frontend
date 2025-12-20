import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../context/login/useLogin";
import axiosInstance from "../server/AxiosConfig";
import { useTheme } from "../context/theme/useTheme";
import {
  DashboardSection,
  GuestLandingPage,
} from "../components/main";
import LoggedInMain from "./LoggedInMain";

import { getUserLevel, getUsageInfo } from "../service/algorithm/AlgorithmApi";

export default function Main() {
  const { theme } = useTheme();
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

      // 2. Fetch Popular Posts from both Boards
      const [freeboardRes, codeboardRes] = await Promise.all([
        axiosInstance.get("/freeboard", { params: { page: 1, size: 5, sort: "views" } }),
        axiosInstance.get("/codeboard", { params: { page: 1, size: 5, sort: "VIEW_COUNT", direction: "DESC" } })
      ]);

      // Combine and tag them
      const freeSchema = (freeboardRes.data.content || []).map(p => ({ ...p, type: 'free', title: p.title, id: p.id, author: p.authorName, views: p.views, date: p.createdDate }));
      const codeSchema = (codeboardRes.data.data?.content || []).map(p => ({ ...p, type: 'code', title: p.codeboardTitle, id: p.codeboardId, author: p.userNickname, views: p.codeboardClick, date: p.codeboardCreatedAt }));
      
      const combined = [...freeSchema, ...codeSchema].sort((a, b) => b.views - a.views).slice(0, 10);
      setPopularPosts(combined);

    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    if (post.type === 'free') navigate(`/freeboard/${post.id}`);
    else navigate(`/codeboard/${post.id}`);
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#0a0a0a]'}`}>
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
