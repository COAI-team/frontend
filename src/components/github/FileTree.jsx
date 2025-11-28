import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';

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
                const response = await axiosInstance.get(`/api/github/repos/${repository.owner}/${repository.name}/tree`, {
                    params: { branch: branch.name }
                });
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
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">3. Select File</h2>
            <div className="border border-gray-300 dark:border-gray-600 rounded h-64 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading files...</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!loading && !error && files.map((file) => (
                    <div
                        key={file.path}
                        onClick={() => onSelect(file)}
                        className="p-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-white rounded transition-colors text-sm"
                    >
                        📄 {file.path}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileTree;
