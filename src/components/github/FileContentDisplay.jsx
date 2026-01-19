import React, { useState, useEffect } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import Editor from '@monaco-editor/react';

const FileContentDisplay = ({ repository, file }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!repository || !file) {
            setContent('');
            return;
        }

        const fetchContent = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/api/github/repos/${repository.owner}/${repository.name}/content`, {
                    params: { path: file.path }
                });
                setContent(response.data.content);
                setError(null);
            } catch (err) {
                setError('Failed to fetch file content.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [repository, file]);

    if (loading) {
        return <p>Loading file content...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }
    
    // Detect language from file extension
    const language = file?.path.split('.').pop();

    return (
        <div className="mt-4 border rounded" style={{ height: '400px' }}>
            <Editor
                height="100%"
                language={language}
                value={content}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    minimap: { enabled: false }
                }}
            />
        </div>
    );
};

export default FileContentDisplay;
