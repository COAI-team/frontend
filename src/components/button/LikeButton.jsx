import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { getAuth } from '../../utils/auth/token';
import { useNavigate } from 'react-router-dom';
import AlertModal from "../modal/AlertModal";
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
  const navigate = useNavigate();
  const {alert, showAlert, closeAlert} = useAlert();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeUsers, setLikeUsers] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    const auth = getAuth();
    if (auth?.user) {
      setCurrentUser(auth.user);
    }
  }, []);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const getApiPath = (type) => {
    const pathMap = {
      'POST_FREEBOARD': 'freeboard',
      'POST_CODEBOARD': 'codeboard',
      'SUBMISSION': 'submission',
      'COMMENT': 'comment'
    };
    return pathMap[type] || type.toLowerCase().replace('post_', '');
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      const goLogin = window.confirm("로그인 후 좋아요를 누를 수 있습니다. 로그인 하시겠습니까?");
      if (goLogin) {
        const redirect = encodeURIComponent(window.location.pathname);
        navigate(`/signin?redirect=${redirect}`);
      }
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const apiPath = getApiPath(referenceType);
      const response = await axiosInstance.post(`/like/${apiPath}/${referenceId}`);
      const responseData = response.data.data;
      const newIsLiked = responseData.liked;
      const newLikeCount = responseData.likeCount;
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      if (onChange) {
        onChange(newIsLiked, newLikeCount);
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      if (error.response?.data?.message === '좋아요 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.') {
        showAlert({
          type: "warning",
          title: "잠시만요",
          message: "좋아요 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.",
        });
      } else {
        showAlert({
          type: "error",
          title: "오류",
          message: "좋아요 처리에 실패했습니다.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikeUsers = async () => {
    if (!showUsers || likeCount === 0) return;
    
    try {
      const apiPath = getApiPath(referenceType);
      const response = await axiosInstance.get(`/like/${apiPath}/${referenceId}/users`, {
        params: { limit: 10 }
      });
      const users = response.data.data;
      setLikeUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('좋아요 사용자 목록 조회 실패:', error);
      setLikeUsers([]);
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    if (showUsers && Array.isArray(likeUsers) && likeUsers.length === 0) {
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
          color: isLiked ? '#ef4444' : isDark ? '#9ca3af' : '#4b5563',
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <svg width="20" height="20" fill={isLiked ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ transition: 'all 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span style={{ fontSize: '0.875rem', color: 'inherit' }}>좋아요</span>
        {showCount && <span style={{ fontWeight: '500', color: 'inherit' }}>{likeCount}</span>}
      </button>

      {showTooltip && showUsers && likeCount > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '0',
          marginBottom: '0.5rem',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#111827',
            color: '#ffffff',
            fontSize: '0.875rem',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '0.75rem',
            minWidth: '200px',
            maxWidth: '300px'
          }}>
            <div style={{
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              좋아요 {likeCount}개
            </div>
            {Array.isArray(likeUsers) && likeUsers.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {likeUsers.map((user, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    backgroundColor: '#4b5563',
                    color: '#e5e7eb',
                    overflow: 'hidden'
                  }}>
                    {user?.userImage ? (
                      <img 
                        src={user.userImage} 
                        alt={user.userNickname}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      user?.userNickname ? user.userNickname.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem' }}>
                    {user?.userNickname || '사용자'}
                  </span>
                </div>
              ))}
              </div>
            ) : (
              <div style={{
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                로딩 중...
              </div>
            )}
          </div>
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '1rem',
            marginTop: '-0.25rem'
          }}>
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid #111827'
            }}></div>
          </div>
        </div>
      )}

      <AlertModal
        open={alert.open}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </div>
  );
};

export default LikeButton;