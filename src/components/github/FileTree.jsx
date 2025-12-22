import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../server/AxiosConfig';
import { Folder, FileCode, ChevronRight, ChevronDown, Search } from 'lucide-react';

const FileTree = ({ repository, branch, onSelect }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPaths, setExpandedPaths] = useState(new Set());

    useEffect(() => {
        if (!repository || !branch) {
            setFiles([]);
            return;
        }

        const fetchTree = async () => {
            try {
                setLoading(true);
                // "recursive=1" to get all files
                const response = await axiosInstance.get(`/api/github/repos/${repository.owner}/${repository.name}/tree`, {
                    params: { branch: branch.name }
                });
                
                // GitHub API returns a flat list. "tree" property contains the array.
                // Depending on the backend implementation, it might return the array directly or an object with "tree".
                // Based on previous code: response.data seems to be the array.
                // Let's assume response.data is the array of nodes.
                const fileList = Array.isArray(response.data) ? response.data : (response.data.tree || []);
                
                // Sort: Folders first, then files, alphabetically
                const sortedList = fileList.sort((a, b) => {
                    if (a.type === b.type) return a.path.localeCompare(b.path);
                    return a.type === 'tree' ? -1 : 1;
                });

                setFiles(sortedList);
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

    // Build hierarchical tree from flat list
    const treeStructure = useMemo(() => {
        const tree = [];
        const map = new Map(); // path -> node

        // First pass: create nodes
        files.forEach(file => {
            if (file.type !== 'blob' && file.type !== 'tree') return; // blobs and trees only
            
            const parts = file.path.split('/');
            const name = parts[parts.length - 1];
            const node = {
                ...file,
                name,
                children: []
            };
            map.set(file.path, node);
            
            if (parts.length === 1) {
                tree.push(node);
            } else {
                const parentPath = parts.slice(0, -1).join('/');
                // Ideally parent should exist if we verified it, but with recursive=1 it might not be strictly ordered or guaranteed?
                // GitHub recursive tree usually includes all folders.
                // If parent doesn't exist in map (e.g. strict filtering), we might need to create virtual parents?
                // For safety, let's try to find parent.
                const parent = map.get(parentPath);
                if (parent) {
                    parent.children.push(node);
                } else {
                    // Fallback: put at root if parent missing (shouldn't happen with full tree)
                    // Or maybe we need to build virtual nodes.
                    // Let's implement virtual node creation for robustness.
                    // Actually, simpler logic:
                }
            }
        });

        // Robust Tree Builder that handles missing parent nodes if necessary
        const root = [];
        const pathMap = {};

        files.forEach(file => {
            const parts = file.path.split('/');
            let currentLevel = root;
            let currentPath = "";

            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                // Check if node exists at this level
                let existingNode = currentLevel.find(n => n.name === part);

                if (!existingNode) {
                    const isFile = index === parts.length - 1 && file.type === 'blob';
                    existingNode = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'blob' : 'tree', // folder
                        children: [],
                        actualFile: isFile ? file : null // Store original file data if it's a leaf
                    };
                    currentLevel.push(existingNode);
                }
                
                if (existingNode.type === 'tree') {
                    currentLevel = existingNode.children;
                }
            });
        });

        // Sort levels
        const sortNodes = (nodes) => {
            nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'tree' ? -1 : 1;
            });
            nodes.forEach(n => {
                if (n.children.length > 0) sortNodes(n.children);
            });
        };
        sortNodes(root);

        return root;
    }, [files]);

    const handleToggle = (path) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    // Filtered flat list for search
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        return files.filter(f => 
            f.type === 'blob' && f.path.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    const TreeNode = ({ node, level = 0 }) => {
        const isFolder = node.type === 'tree';
        const isExpanded = expandedPaths.has(node.path);
        const paddingLeft = level * 1.5 + 0.5; // rem units or similar

        if (isFolder) {
            return (
                <div>
                    <div 
                        className="flex items-center py-1 px-2 cursor-pointer text-sm select-none"
                        style={{ paddingLeft: `${paddingLeft}rem` }}
                        onClick={() => handleToggle(node.path)}
                    >
                        <span className="mr-1">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <Folder size={16} className="mr-2 text-yellow-500 fill-yellow-500" />
                        <span className="truncate">{node.name}</span>
                    </div>
                    {isExpanded && node.children.map(child => (
                        <TreeNode key={child.path} node={child} level={level + 1} />
                    ))}
                </div>
            );
        }

        return (
            <div 
                className="flex items-center py-1 px-2 hover:bg-gray-300 cursor-pointer text-sm group"
                style={{ paddingLeft: `${paddingLeft}rem` }}
                onClick={() => onSelect(node.actualFile || node)} // Pass the full file object
            >
                <span className="mr-1 w-4"></span> {/* Spacer for chevron alignment */}
                <FileCode size={16} className="mr-2" />
                <span className="truncate">
                    {node.name}
                </span>
            </div>
        );
    };

    return (
        <div className="mt-4 flex flex-col h-[500px] border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Folder size={20} />
                    File Browser
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search files..." 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {loading && (
                    <div className="flex justify-center items-center h-full">
                        Loading...
                    </div>
                )}
                
                {error && (
                    <div className="text-red-500 p-4 text-center">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {searchTerm ? (
                            // Search Results View
                            <div className="space-y-1">
                                {searchResults.length === 0 ? (
                                    <p className="text-center py-4 text-sm">No files found.</p>
                                ) : (
                                    searchResults.map(file => (
                                        <div 
                                            key={file.path}
                                            onClick={() => onSelect(file)}
                                            className="flex items-center p-2 hover:bg-blue-50 cursor-pointer rounded text-sm"
                                        >
                                            <FileCode size={16} className="mr-2" />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-medium truncate">{file.path.split('/').pop()}</span>
                                                <span className="text-xs truncate">{file.path}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // Tree View
                            <div className="select-none">
                                {treeStructure.map(node => (
                                    <TreeNode key={node.path} node={node} />
                                ))}
                                {treeStructure.length === 0 && (
                                    <p className="text-center py-4 text-sm">Empty repository.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FileTree;
