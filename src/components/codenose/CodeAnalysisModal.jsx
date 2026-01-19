import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FolderIcon, DocumentIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../server/AxiosConfig';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../context/login/useLogin';

const CodeAnalysisModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useLogin();

    // Modal steps: 'github-id' -> 'repo-select' -> 'file-tree' -> 'file-confirm'
    const [step, setStep] = useState('github-id');

    // State for GitHub ID
    const [githubId, setGithubId] = useState('');

    // State for repositories
    const [repositories, setRepositories] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [loadingRepos, setLoadingRepos] = useState(false);

    // State for file tree
    const [fileTree, setFileTree] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFile, setSelectedFile] = useState(null);
    const [loadingTree, setLoadingTree] = useState(false);

    // State for file content
    const [fileContent, setFileContent] = useState('');
    const [loadingContent, setLoadingContent] = useState(false);

    // Error state
    const [error, setError] = useState('');

    // Reset modal state when closed
    const handleClose = () => {
        setStep('github-id');
        setGithubId('');
        setRepositories([]);
        setSelectedRepo(null);
        setFileTree([]);
        setExpandedFolders(new Set());
        setSelectedFile(null);
        setFileContent('');
        setError('');
        onClose();
    };

    // Step 1: Submit GitHub ID and fetch repositories
    const handleGithubIdSubmit = async (e) => {
        e.preventDefault();
        if (!githubId.trim()) {
            setError('GitHub ID를 입력해주세요.');
            return;
        }

        setLoadingRepos(true);
        setError('');

        try {
            // API: GET /api/github/repos?username={githubId}
            const response = await axiosInstance.get(`/api/github/repos`, {
                params: { owner: githubId }
            });

            setRepositories(response.data);
            setStep('repo-select');
        } catch (err) {
            console.error('Failed to fetch repositories:', err);
            setError('레포지토리를 가져오는데 실패했습니다. GitHub ID를 확인해주세요.');
        } finally {
            setLoadingRepos(false);
        }
    };

    // Step 2: Select repository and fetch file tree
    const handleRepoSelect = async (repo) => {
        setSelectedRepo(repo);
        setLoadingTree(true);
        setError('');

        try {
            // API: GET /api/github/repos/{owner}/{repo}/tree/main
            // Default branch를 main으로 가정, 실제로는 branch 선택 로직 추가 가능
            const response = await axiosInstance.get(
                `/api/github/repos/${repo.owner}/${repo.name}/tree/main`
            );

            // Build tree structure from flat list
            const treeData = buildTreeStructure(response.data);
            setFileTree(treeData);
            setStep('file-tree');
        } catch (err) {
            console.error('Failed to fetch file tree:', err);
            setError('파일 트리를 가져오는데 실패했습니다.');
        } finally {
            setLoadingTree(false);
        }
    };

    // Build hierarchical tree structure from flat file list
    const buildTreeStructure = (flatList) => {
        const tree = [];
        const map = {};

        flatList.forEach(item => {
            const pathParts = item.path.split('/');
            let currentLevel = tree;
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (index === pathParts.length - 1) {
                    // It's a file
                    currentLevel.push({
                        name: part,
                        path: item.path,
                        type: 'file',
                        fullData: item
                    });
                } else {
                    // It's a folder
                    let folder = currentLevel.find(f => f.name === part && f.type === 'folder');
                    if (!folder) {
                        folder = {
                            name: part,
                            path: currentPath,
                            type: 'folder',
                            children: []
                        };
                        currentLevel.push(folder);
                    }
                    currentLevel = folder.children;
                }
            });
        });

        return tree;
    };

    // Toggle folder expansion
    const toggleFolder = (folderPath) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderPath)) {
                newSet.delete(folderPath);
            } else {
                newSet.add(folderPath);
            }
            return newSet;
        });
    };

    // Step 3: Select file and fetch content
    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        setLoadingContent(true);
        setError('');

        try {
            // API: GET /api/github/repos/{owner}/{repo}/content?path={filePath}
            const response = await axiosInstance.get(
                `api/github/repos/${selectedRepo.owner}/${selectedRepo.name}/content`,
                {
                    params: { path: file.path }
                }
            );

            setFileContent(response.data.content);
            setStep('file-confirm');
        } catch (err) {
            console.error('Failed to fetch file content:', err);
            setError('파일 내용을 가져오는데 실패했습니다.');
        } finally {
            setLoadingContent(false);
        }
    };

    // Step 4: Confirm and proceed to analysis page
    const handleConfirmFile = async () => {
        try {
            // Save file to DB using API: POST /api/github/save-file
            const saveResponse = await axiosInstance.post('api/github/save-file', {
                repositoryUrl: selectedRepo.repoUrl,
                owner: selectedRepo.owner,
                repo: selectedRepo.name,
                filePath: selectedFile.path,
                userId: user?.userId
            });

            console.log('Save response:', saveResponse.data); // 디버깅용


            const fileId = saveResponse.data.Data.fileId || saveResponse.data.fileId;
            console.log('File ID:', fileId);

            // Navigate to analysis options page with file data
            navigate('/code-analysis/options', {
                state: {
                    analysisId: fileId,
                    repositoryUrl: selectedRepo.repoUrl,
                    filePath: selectedFile.path,
                    fileContent: fileContent,
                    repoName: selectedRepo.name
                }
            });

            handleClose();
        } catch (err) {
            console.error('Failed to save file:', err);
            setError('파일 저장에 실패했습니다.');
        }
    };

    // Render file tree recursively
    const renderTreeNode = (node, level = 0) => {
        if (node.type === 'file') {
            return (
                <div
                    key={node.path}
                    onClick={() => handleFileSelect(node)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                    style={{ paddingLeft: `${level * 20 + 12}px` }}
                >
                    <DocumentIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200 truncate">{node.name}</span>
                </div>
            );
        } else {
            const isExpanded = expandedFolders.has(node.path);
            return (
                <div key={node.path}>
                    <div
                        onClick={() => toggleFolder(node.path)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                        style={{ paddingLeft: `${level * 20 + 12}px` }}
                    >
                        <ChevronRightIcon
                            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <FolderIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-gray-200 truncate font-medium">{node.name}</span>
                    </div>
                    {isExpanded && node.children && (
                        <div>
                            {node.children.map(child => renderTreeNode(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-2xl font-bold text-white">
                                        {step === 'github-id' && 'GitHub ID 입력'}
                                        {step === 'repo-select' && 'Repository 선택'}
                                        {step === 'file-tree' && '파일 선택'}
                                        {step === 'file-confirm' && '파일 확인'}
                                    </Dialog.Title>
                                    <button
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Step Content */}
                                <div className="min-h-[400px]">
                                    {/* Step 1: GitHub ID Input */}
                                    {step === 'github-id' && (
                                        <form onSubmit={handleGithubIdSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    GitHub Username
                                                </label>
                                                <input
                                                    type="text"
                                                    value={githubId}
                                                    onChange={(e) => setGithubId(e.target.value)}
                                                    placeholder="예: octocat"
                                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loadingRepos}
                                                className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {loadingRepos ? '조회 중...' : 'Repository 조회'}
                                            </button>
                                        </form>
                                    )}

                                    {/* Step 2: Repository Selection */}
                                    {step === 'repo-select' && (
                                        <div className="space-y-3">
                                            <p className="text-gray-300 mb-4">
                                                분석할 Repository를 선택해주세요.
                                            </p>
                                            <div className="max-h-96 overflow-y-auto space-y-2">
                                                {repositories.map((repo) => (
                                                    <div
                                                        key={repo.fullName}
                                                        onClick={() => handleRepoSelect(repo)}
                                                        className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors border border-gray-600"
                                                    >
                                                        <h3 className="text-white font-semibold">{repo.name}</h3>
                                                        <p className="text-sm text-gray-400">{repo.fullName}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setStep('github-id')}
                                                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                            >
                                                뒤로가기
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 3: File Tree */}
                                    {step === 'file-tree' && (
                                        <div className="space-y-3">
                                            <p className="text-gray-300 mb-4">
                                                분석할 파일을 선택해주세요.
                                            </p>
                                            {loadingTree ? (
                                                <p className="text-gray-400">파일 목록을 불러오는 중...</p>
                                            ) : (
                                                <div className="max-h-96 overflow-y-auto bg-gray-900 rounded-lg p-2">
                                                    {fileTree.map(node => renderTreeNode(node))}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setStep('repo-select')}
                                                className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                            >
                                                뒤로가기
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 4: File Content Confirmation */}
                                    {step === 'file-confirm' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-2">
                                                    선택한 파일: {selectedFile?.path}
                                                </h3>
                                                <p className="text-sm text-gray-400 mb-4">
                                                    아래 코드가 맞는지 확인해주세요.
                                                </p>
                                            </div>

                                            {loadingContent ? (
                                                <p className="text-gray-400">파일 내용을 불러오는 중...</p>
                                            ) : (
                                                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                                        {fileContent}
                                                    </pre>
                                                </div>
                                            )}

                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    onClick={() => setStep('file-tree')}
                                                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                                >
                                                    다른 파일 선택
                                                </button>
                                                <button
                                                    onClick={handleConfirmFile}
                                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                                                >
                                                    확인 및 분석 설정으로
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CodeAnalysisModal;
