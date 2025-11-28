import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLogin } from '../../context/useLogin';

const RepositorySelector = ({ onSelect }) => {
    const { user } = useLogin();
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                setLoading(true);
                // TODO: 사용자 정보에 githubUsername이 없는 경우 처리 필요
                // 현재는 테스트를 위해 하드코딩된 값 또는 user의 속성 사용
                const owner = user?.githubUsername || 'SungilBang12'; 
                
                const response = await axios.get(`/api/github/repos?owner=${owner}`);
                
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

        fetchRepositories();
    }, [user]);

    if (loading) {
        return <p>Loading repositories...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">1. Select Repository</h2>
            <select
                onChange={(e) => onSelect(repositories.find(repo => repo.fullName === e.target.value))}
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue=""
            >
                <option value="" disabled>Choose a repository</option>
                {repositories.map((repo) => (
                    <option key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default RepositorySelector;
