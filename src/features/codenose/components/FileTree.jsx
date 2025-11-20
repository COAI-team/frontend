import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileTree = ({ repository, branch, onSelect }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!repository || !branch) {
            setFiles([]);
            return;
        }

        const fetchTree = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/github/repos/${repository.owner}/${repository.name}/tree/${branch.name}`);
                // Filter for files ("blob") only for simplicity
                const fileList = response.data.filter(node => node.type === 'blob');
                setFiles(fileList);
                setError(null);
            } catch (err) {
                setError('Failed to fetch file tree.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTree();
    }, [repository, branch]);

    return (
        <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">3. Select File</h2>
            <div className="border rounded h-64 overflow-y-auto p-2 bg-gray-800">
                {loading && <p>Loading files...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && files.map((file) => (
                    <div
                        key={file.path}
                        onClick={() => onSelect(file)}
                        className="p-1 cursor-pointer hover:bg-gray-700 rounded"
                    >
                        {file.path}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileTree;
