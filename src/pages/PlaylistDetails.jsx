import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import { ListVideo, Trash2, Lock, Globe, Play, Shuffle, Clock } from 'lucide-react';

const PlaylistDetails = () => {
    const { id } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getPlaylist(id, token);
            setPlaylist(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveVideo = async (videoId) => {
        if (!window.confirm("Remove from playlist?")) return;
        try {
            const token = localStorage.getItem('token');
            // If watch later
            if (playlist.is_watch_later) {
                await api.toggleWatchLater(videoId, token);
            } else {
                await api.removeFromPlaylist(id, videoId, token);
            }

            setPlaylist(prev => ({
                ...prev,
                videos: prev.videos.filter(v => v.video_id !== videoId),
                video_count: prev.video_count - 1
            }));
        } catch (error) {
            console.error("Failed to remove", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
    );

    if (!playlist) return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
                <Link to="/playlists" className="text-red-500 hover:text-red-400">Back to Playlists</Link>
            </div>
        </div>
    );

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
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Info Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 sticky top-20">
                                <div className="aspect-video bg-gray-800 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                                    {playlist.videos.length > 0 ? (
                                        <img src={playlist.videos[0].thumbnail_url} className="w-full h-full object-cover opacity-80" alt="Playlist Cover" />
                                    ) : (
                                        playlist.is_watch_later ? <Clock size={64} className="text-blue-500/50" /> : <ListVideo size={64} className="text-gray-600" />
                                    )}
                                </div>

                                <h1 className="text-2xl font-bold mb-2">{playlist.name}</h1>

                                {playlist.description && (
                                    <p className="text-gray-400 mb-4 text-sm">{playlist.description}</p>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                                    <span>{playlist.video_count} videos</span>
                                    <span className="flex items-center gap-1">
                                        {playlist.is_public ? <Globe size={14} /> : <Lock size={14} />}
                                        {playlist.is_public ? 'Public' : 'Private'}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {playlist.video_count > 0 && (
                                        <Link
                                            to={`/video/${playlist.videos[0].video_id}`}
                                            className="flex-1 bg-white text-black py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                        >
                                            <Play size={18} className="fill-black" />
                                            Play All
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Video List */}
                        <div className="lg:col-span-2 space-y-2">
                            {playlist.videos.length === 0 ? (
                                <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800 border-dashed">
                                    <p className="text-gray-500">No videos in this playlist yet.</p>
                                </div>
                            ) : (
                                playlist.videos.map((video, index) => (
                                    <div key={video.item_id} className="group flex gap-4 p-2 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer border border-transparent hover:border-gray-800">
                                        <div className="flex items-center text-gray-500 w-6 justify-center">
                                            {index + 1}
                                        </div>

                                        <Link to={`/video/${video.video_id}`} className="block w-40 aspect-video bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                                        </Link>

                                        <div className="flex-1 py-1 min-w-0">
                                            <Link to={`/video/${video.video_id}`}>
                                                <h3 className="font-semibold text-white line-clamp-2 mb-1 group-hover:text-red-500 transition-colors">
                                                    {video.title}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{new Date(video.duration * 1000).toISOString().substr(11, 8)}</span>
                                                <span>•</span>
                                                <span>{video.views} views</span>
                                                <span>•</span>
                                                <span>Added {new Date(video.added_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center px-2">
                                            <button
                                                onClick={() => handleRemoveVideo(video.video_id)}
                                                className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove from playlist"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlaylistDetails;
