import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import { ListVideo, Trash2, Lock, Globe, Clock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Playlists = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getPlaylists(token);
            setPlaylists(data.playlists || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Delete this playlist?")) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${api.API_URL || 'http://localhost:8000'}/playlists/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPlaylists(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
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
                    <div className="max-w-[1600px] mx-auto">
                        <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <ListVideo className="text-red-500" />
                            Your Playlists
                        </h1>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                        ) : playlists.length === 0 ? (
                            <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800">
                                <ListVideo size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
                                <p className="text-gray-400">Save videos to a playlist to see them here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {playlists.map(pl => (
                                    <Link key={pl.id} to={`/playlist/${pl.id}`} className="group relative block bg-[#1a1a1a] rounded-xl overflow-hidden hover:bg-[#252525] transition-colors border border-gray-800">
                                        <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                                            {pl.is_watch_later ? (
                                                <Clock size={48} className="text-blue-500" />
                                            ) : (
                                                <ListVideo size={48} className="text-gray-600" />
                                            )}

                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="fill-white text-white w-12 h-12" />
                                            </div>

                                            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs rounded font-medium">
                                                {pl.video_count} videos
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold line-clamp-1 group-hover:text-red-500 transition-colors">{pl.name}</h3>
                                                {!pl.is_watch_later && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, pl.id)}
                                                        className="text-gray-500 hover:text-red-500 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                {pl.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                                <span>{pl.is_public ? 'Public' : 'Private'}</span>
                                            </div>
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

export default Playlists;
