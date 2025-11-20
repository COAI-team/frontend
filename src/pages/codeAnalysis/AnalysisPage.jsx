import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RepositorySelector from '../../components/github/RepositorySelector';
import BranchSelector from '../../components/github/BranchSelector';
import FileTree from '../../components/github/FileTree';
import FileContentDisplay from '../../components/github/FileContentDisplay';
import AnalysisForm from '../../components/github/AnalysisForm';

const AnalysisPage = () => {
    // Selection state
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    
    // Analysis state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleRepoSelect = (repo) => {
        setSelectedRepo(repo);
        setSelectedBranch(null);
        setSelectedFile(null);
        setFileContent('');
        setAnalysisResult(null);
    };
    
    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch);
        setSelectedFile(null);
        setFileContent('');
        setAnalysisResult(null);
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        setAnalysisResult(null);
    };

    useEffect(() => {
        if (!selectedFile || !selectedRepo) {
            setFileContent('');
            return;
        }
        const fetchContent = async () => {
            try {
                const response = await axios.get(`/api/github/repos/${selectedRepo.owner}/${selectedRepo.name}/content`, {
                    params: { path: selectedFile.path }
                });
                setFileContent(response.data.content);
            } catch (err) {
                console.error("Failed to fetch file content:", err);
                setFileContent('// Failed to load content');
            }
        };
        fetchContent();
    }, [selectedFile, selectedRepo]);

    const handleAnalysisSubmit = async (formState) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        const requestDto = {
            code: fileContent,
            analysisTypes: formState.analysisTypes,
            toneLevel: formState.toneLevel,
            customRequirements: formState.customRequirements,
            repositoryUrl: selectedRepo.url,
            filePath: selectedFile.path,
            userId: 1, // Hardcoded for now, should come from auth
        };

        try {
            const response = await axios.post('/api/analysis/analyze', requestDto);
            setAnalysisResult(response.data);
        } catch (err) {
            setError('Analysis failed. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Start New Code Analysis</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Selection & Config */}
                <div>
                    <RepositorySelector onSelect={handleRepoSelect} />
                    {selectedRepo && <BranchSelector repository={selectedRepo} onSelect={handleBranchSelect} />}
                    {selectedBranch && <FileTree repository={selectedRepo} branch={selectedBranch} onSelect={handleFileSelect} />}
                    {selectedFile && (
                         <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">File: {selectedFile.path}</h2>
                            <FileContentDisplay repository={selectedRepo} file={selectedFile} />
                        </div>
                    )}
                </div>

                {/* Right Column: Analysis Form and Results */}
                <div>
                    {fileContent && (
                        <AnalysisForm onSubmit={handleAnalysisSubmit} isLoading={isLoading} />
                    )}
                    {isLoading && <p className="mt-4">Analyzing code...</p>}
                    {error && <p className="mt-4 text-red-500">{error}</p>}
                    {analysisResult && (
                        <div className="mt-6">
                            <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                            <pre className="bg-gray-800 p-4 rounded text-sm overflow-x-auto">
                                {JSON.stringify(analysisResult, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
