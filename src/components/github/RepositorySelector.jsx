import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { useLogin } from '../../context/useLogin';

const RepositorySelector = ({ onSelect }) => {
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
        const fetchLatestUserInfo = async () => {
            try {
                const res = await axiosInstance.get("/users/me");
                if (res.data && res.data.githubId) {
                    setOwner(res.data.githubId);
                    // 초기 로드시 값이 있으면 자동 조회 (선택 사항, 여기서는 자동 조회를 원치 않는다면 제거 가능하지만,
                    // "입력하지 않아도 ID가 입력되어 있습니다"라는 불만이 캐시 때문이라면 최신 값으로 덮어쓰기만 하면 됨.
                    // 만약 페이지 진입 시 자동으로 리스트가 뜨길 원하면 여기서 fetchRepositories() 호출)
                }
            } catch (err) {
                console.error("Failed to fetch fresh user info:", err);
            }
        };
        fetchLatestUserInfo();
    }, []);

    const fetchRepositories = async () => {
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

    useEffect(() => {
        fetchRepositories();
    }, []); // Mount 시 한 번 실행, owner 변경 시에는 버튼으로 실행하도록 변경 가능하지만 편의상 자동 로딩은 유지? 아니면 버튼?
    // 여기서 user가 로드되면 자동 실행되도록 owner를 dependency로 넣는게 좋음 owner 초기값이 있으므로.


    // user 변경 시 owner 업데이트 되므로 아래 useEffect로 fetch 트리거
    // user 변경 시 owner 업데이트 되므로 아래 useEffect로 fetch 트리거 -> REMOVE
    // useEffect(() => {
    //      fetchRepositories();
    // }, [owner]);

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
                />
                <button 
                    onClick={fetchRepositories}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
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
