import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../context/login/useLogin";
import axiosInstance from "../server/AxiosConfig";
import { useTheme } from "../context/theme/useTheme";
import {
  DashboardSection,
  GuestLandingPage,
} from "../components/main";

export default function Main() {
  const { theme } = useTheme();
  const { user } = useLogin();
  const navigate = useNavigate();

  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPopularPosts();
    }
  }, [user]);

  const fetchPopularPosts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/freeboard", {
        params: { page: 1, size: 6, sort: "views" },
      });
      setPopularPosts(response.data.content || []);
    } catch (error) {
      console.error("인기 게시글 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/freeboard/${postId}`);
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#0a0a0a]'}`}>
      <div className="w-full h-full flex flex-col items-center">
        {user ? (
          <DashboardSection
            user={user}
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
