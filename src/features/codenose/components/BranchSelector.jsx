import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
                const response = await axios.get(`/api/github/repos/${repository.owner}/${repository.name}/branches`);
                setBranches(response.data);
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
            <h2 className="text-xl font-semibold mb-2">2. Select Branch</h2>
            <select
                disabled={!repository || loading}
                onChange={handleSelect}
                className="w-full p-2 border rounded bg-gray-700 text-white disabled:opacity-50"
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
            {loading && <p>Loading branches...</p>}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
};

export default BranchSelector;
