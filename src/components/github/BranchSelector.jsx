import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';

const BranchSelector = ({ repository, onSelect }) => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!repository) {
            setBranches([]);
            return;
        }

        const fetchBranches = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/api/github/repos/${repository.owner}/${repository.name}/branches`);
                setBranches(response.data);
                if (response.data.length === 1) {
                    onSelect(response.data[0]);
                }
                setError(null);
            } catch (err) {
                setError('Failed to fetch branches.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, [repository]);

    const handleSelect = (e) => {
        const selectedBranch = branches.find(branch => branch.name === e.target.value);
        onSelect(selectedBranch);
    };

    return (
        <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">2. Select Branch</h2>
            <select
                disabled={!repository || loading}
                onChange={handleSelect}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue=""
            >
                <option value="" disabled>
                    {repository ? 'Choose a branch' : 'Select a repository first'}
                </option>
                {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                        {branch.name}
                    </option>
                ))}
            </select>
            {loading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading branches...</p>}
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default BranchSelector;
