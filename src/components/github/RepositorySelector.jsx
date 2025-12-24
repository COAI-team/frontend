import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { useLogin } from '../../context/login/useLogin';

const RepositorySelector = ({ onSelect, onSearch, mockRepositories }) => {
    const { user } = useLogin();
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [owner, setOwner] = useState(user?.githubId || '');

    // user context가 로드되면 초기값 설정 (캐시된 값일 수 있음)
    useEffect(() => {
        if (user?.githubId) {
            setOwner(user.githubId);
        }
    }, [user]);

    // Mount 시 DB에서 최신 정보를 가져와서 owner 업데이트 (Stale Data 방지)
    useEffect(() => {
        if (!user?.githubId && !mockRepositories) { // Don't fetch user info if using mocks
             const fetchLatestUserInfo = async () => {
                try {
                    const res = await axiosInstance.get("/users/me");
                    if (res.data && res.data.githubId) {
                        setOwner(res.data.githubId);
                    }
                } catch (err) {
                    console.error("Failed to fetch fresh user info:", err);
                }
            };
            fetchLatestUserInfo();
        }
    }, [mockRepositories]);

    const fetchRepositories = async () => {
        if (mockRepositories) {
            setRepositories(mockRepositories);
            return;
        }

        if (!owner) return;
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/github/repos?owner=${owner}`);
            
            if (Array.isArray(response.data)) {
                setRepositories(response.data);
            } else {
                console.error("API response is not an array:", response.data);
                setRepositories([]);
                setError("Invalid response format from server.");
            }
            setError(null);
        } catch (err) {
            setError('Failed to fetch repositories.');
            console.error(err);
            setRepositories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = () => {
        // 사용자 본인의 GitHub ID인지 검증
        const isOwnRepo = user?.githubId && owner.toLowerCase() === user.githubId.toLowerCase();
        if (onSearch) onSearch(owner, isOwnRepo);
        fetchRepositories();
    };

    useEffect(() => {
        fetchRepositories();
    }, []); 


    if (loading) {
        return <p>Loading repositories...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">1. Select Repository</h2>
            <div className="flex gap-2 mb-2">
                <input 
                    type="text" 
                    value={owner} 
                    onChange={(e) => setOwner(e.target.value)} 
                    className="border p-2 rounded w-full"
                    placeholder="GitHub Username"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleManualSearch();
                    }}
                />
                <button 
                    onClick={handleManualSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 cursor-pointer"
                >
                    Search
                </button>
            </div>

            {repositories.length > 0 && (
                <select
                    onChange={(e) => onSelect(repositories.find(repo => repo.fullName === e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue=""
                >
                    <option value="" disabled>Choose a repository</option>
                    {repositories.map((repo) => (
                        <option key={repo.id} value={repo.fullName}>
                            {repo.fullName}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default RepositorySelector;
