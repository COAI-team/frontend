import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepositorySelector = ({ onSelect }) => {
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/github/repos');
                setRepositories(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch repositories.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

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
            <select
                onChange={(e) => onSelect(repositories.find(repo => repo.fullName === e.target.value))}
                className="w-full p-2 border rounded bg-gray-700 text-white"
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
