import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import { Trash2, Clock, Play } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getHistory(token);
            setHistory(data.history || []);
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear your entire watch history?")) return;
        try {
            const token = localStorage.getItem('token');
            await api.clearHistory(token);
            setHistory([]);
        } catch (err) {
            console.error("Failed to clear history", err);
        }
    };

    const removeEntry = async (id, e) => {
        e.preventDefault(); // Prevent link click
        e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await api.delete('/history/' + id, token); // Using generic delete
            setHistory(history.filter(h => h.id !== id));
        } catch (err) {
            console.error("Failed to remove entry", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] h-14 px-4 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-1">
                        <span className="text-xl font-bold tracking-tighter">
                            Stream<span className="text-red-600">Platform</span>
                        </span>
                    </Link>
                </div>
            </nav>

            <div className="flex pt-14">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Clock className="text-red-500" />
                                Watch History
                            </h1>
                            {history.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-500 transition-colors text-sm font-medium"
                                >
                                    <Trash2 size={16} />
                                    Clear all watch history
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800">
                                <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No watch history yet</h3>
                                <p className="text-gray-400 mb-6">Videos you watch will appear here.</p>
                                <Link to="/" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors">
                                    Start Watching
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {history.map(item => (
                                    <Link key={item.id} to={`/video/${item.video_id}`} className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group relative">
                                        <div className="relative w-full sm:w-64 aspect-video bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.thumbnail_url || "https://via.placeholder.com/320x180"}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="opacity-0 group-hover:opacity-100 text-white fill-current w-8 h-8 drop-shadow-lg transform scale-90 group-hover:scale-100 transition-all" />
                                            </div>
                                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                                {new Date(item.duration * 1000).toISOString().substr(14, 5)}
                                            </span>
                                            {/* Progress Bar */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                                <div
                                                    className="h-full bg-red-600"
                                                    style={{ width: `${Math.min(100, (item.progress_seconds / item.duration) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 py-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-semibold line-clamp-2 leading-tight mb-1 group-hover:text-red-400 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <button
                                                    onClick={(e) => removeEntry(item.id, e)}
                                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Remove from history"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-400 mb-2">Channel Name • {new Date(item.watched_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {/* Description or other info could go here */}
                                                Stopped at {Math.floor(item.progress_seconds / 60)}:{(item.progress_seconds % 60).toString().padStart(2, '0')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default History;
