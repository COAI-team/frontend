import React, {useState, useEffect} from 'react';
import axiosInstance from '../../server/AxiosConfig';
import {getAuth} from '../../utils/auth/token';
import {useNavigate} from 'react-router-dom';
import AlertModal from "../../components/modal/AlertModal";
import {useAlert} from "../../hooks/common/useAlert";

const LikeButton = ({
                      referenceType,
                      referenceId,
                      initialIsLiked = false,
                      initialLikeCount = 0,
                      showCount = true,
                      showUsers = true,
                      size = 'md',
                      onChange
                    }) => {
  const {alert, showAlert, closeAlert} = useAlert();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeUsers, setLikeUsers] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 다크모드 여부 판단
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // 로그인 체크
  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      setCurrentUser(auth.user);
    }
  }, []);

  // props 변경 시 동기화
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  // 좋아요 토글
  const handleLike = async (e) => {
    e.stopPropagation();

    if (!currentUser) {
      const goLogin = globalThis.confirm(
        "로그인 후 좋아요를 누를 수 있습니다. 로그인 하시겠습니까?"
      );
      if (goLogin) {
        const redirect = encodeURIComponent(globalThis.location.pathname);
        navigate(`/signin?redirect=${redirect}`);
      }
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.post(`/like/${referenceType}/${referenceId}`);
      const newIsLiked = response.data.data.isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);

      // 부모 컴포넌트에 변경 알림
      if (onChange) {
        onChange(newIsLiked, newLikeCount);
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      const message =
        error.response?.data?.message === '좋아요 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.'
          ? '좋아요 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.'
          : '좋아요 처리에 실패했습니다.';

      showAlert({
        type: 'warning',
        title: '요청 실패',
        message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 좋아요 누른 사용자 목록 조회
  const fetchLikeUsers = async () => {
    if (!showUsers || likeCount === 0) return;

    try {
      const response = await axiosInstance.get(`/like/${referenceType}/${referenceId}/users`, {
        params: {limit: 10}
      });
      setLikeUsers(response.data.data.users);
    } catch (error) {
      console.error('좋아요 사용자 목록 조회 실패:', error);
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    if (showUsers && likeUsers.length === 0) {
      fetchLikeUsers();
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleLike}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          padding: 0,
          color: isLiked
            ? '#ef4444'
            : isDark
              ? '#9ca3af'
              : '#4b5563',
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <svg
          width="20"
          height="20"
          fill={isLiked ? '#ef4444' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          style={{transition: 'all 0.2s'}}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span style={{fontSize: '0.875rem', color: 'inherit'}}>좋아요</span>
        {showCount && (
          <span style={{fontWeight: '500', color: 'inherit'}}>
                        {likeCount}
                    </span>
        )}
      </button>

      {showTooltip && showUsers && likeCount > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg px-3 py-2 min-w-50 max-w-75">
            <div className="font-semibold mb-2">좋아요 {likeCount}개</div>
            {likeUsers.length > 0 ? (
              <div className="space-y-1.5 max-h-50 overflow-y-auto">
                {likeUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      backgroundColor: '#4b5563',
                      color: '#e5e7eb'
                    }}>
                      {user.userNickname ? user.userNickname.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs">{user.userNickname}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">로딩 중...</div>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
      <AlertModal
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={() => {
          closeAlert();
          alert.onConfirm?.();
        }}
        onClose={closeAlert}
      />
    </div>
  );
};

export default LikeButton;
