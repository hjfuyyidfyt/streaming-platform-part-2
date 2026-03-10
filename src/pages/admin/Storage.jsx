import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Trash2, RefreshCw, Folder } from 'lucide-react';

const Storage = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await api.getStorageStats(token);
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = async (target) => {
        if (!confirm(`Are you sure you want to clean ${target}? This cannot be undone.`)) return;
        try {
            await api.cleanupStorage(target, token);
            fetchStats();
        } catch (err) {
            alert('Cleanup failed');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading && !stats) return <div className="text-white p-8">Loading storage stats...</div>;

    return (
        <div className="text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Storage Monitor</h1>
                <button onClick={fetchStats} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-sm">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['temp_uploads', 'temp_transcodes', 'thumbnails'].map(key => {
                    const info = stats[key];
                    return (
                        <div key={key} className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <Folder className="w-5 h-5 text-yellow-500" />
                                    <h2 className="font-semibold capitalize">
                                        {key === 'thumbnails' ? 'Thumbnail ZIPs' : key.replace('_', ' ')}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => handleCleanup(key)}
                                    className="text-red-500 hover:text-red-400 p-2 hover:bg-white/5 rounded-full transition-colors"
                                    title={`Clean ${key}`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Files:</span>
                                    <span className="text-white font-mono">{info.count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span className="text-white font-mono">{(info.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>

                            {/* File List */}
                            <div className="mt-4 pt-4 border-t border-gray-800 h-48 overflow-y-auto scrollbar-thin">
                                {info.files.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">Empty</div>
                                ) : (
                                    <ul className="space-y-1">
                                        {info.files.map((f, i) => (
                                            <li key={i} className="text-xs text-gray-400 truncate flex justify-between items-center p-1 hover:bg-white/5 rounded">
                                                <span className="truncate flex-1 pr-2" title={f.name}>{f.name}</span>
                                                <span className="text-gray-600 whitespace-nowrap">
                                                    {f.is_dir ? 'DIR' : `${(f.size / 1024).toFixed(1)}KB`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded text-sm text-yellow-200">
                <p className="font-bold mb-1">Note:</p>
                <p>Files in <b>temp_uploads</b> and <b>temp_transcodes</b> should be automatically deleted after processing. <br />
                    <b>Thumbnail ZIPs</b> represent the extracted 10-frame packages from videos.</p>
                <p className="mt-2 text-indigo-300">Deleting <b>Thumbnail ZIPs</b> will ONLY remove the `.zip` packages to save server space. It will <b>NOT</b> delete the primary `.jpg` thumbnails displayed on the website.</p>
            </div>
        </div>
    );
};

export default Storage;
