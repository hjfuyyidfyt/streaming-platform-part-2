import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { X, Plus, Check, Lock, Globe } from 'lucide-react';

const AddToPlaylist = ({ videoId, onClose }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [processing, setProcessing] = useState(null); // playlist id being processed

    useEffect(() => {
        fetchPlaylists();
    }, [videoId]);

    const fetchPlaylists = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getPlaylists(token);
            const userPlaylists = data.playlists || [];

            // Check which playlists contain this video
            // This is N+1 but acceptable for small number of playlists
            // Ideally backend returns "is_contained" flag
            // For now, we rely on checking specific playlist content if needed
            // But getPlaylists returns count, not items.
            // We need to fetch details for each to know if video is in it?
            // Expensive.
            // Optimization: Add an endpoint or update getPlaylists to include 'contains_video_id' param?
            // Or just check on click (toggle).
            // Let's implement optimistic toggle or fetch details.
            // Actually, for a small app, fetching details of all playlists is okay-ish but slow if many videos.

            // Better approach: New endpoint `GET /playlists/check?video_id=123`
            // Or we just try to ADD. If 400 (already exists) -> we know it's there? No that's bad UX.

            // Let's load the playlists.
            // We will assume not checked initially, and we can check on-demand? 
            // no, user needs to see where it is saved.

            // I will iterate and fetch details. (Parallel)

            const detailedPlaylists = await Promise.all(userPlaylists.map(async (pl) => {
                try {
                    const details = await api.getPlaylist(pl.id, token);
                    const contains = details.videos.some(v => v.video_id === parseInt(videoId));
                    return { ...pl, contains };
                } catch (e) {
                    return { ...pl, contains: false };
                }
            }));

            setPlaylists(detailedPlaylists);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (playlist) => {
        if (processing) return;
        setProcessing(playlist.id);
        const token = localStorage.getItem('token');

        try {
            if (playlist.contains) {
                // Remove
                if (playlist.is_watch_later) {
                    await api.toggleWatchLater(videoId, token);
                } else {
                    await api.removeFromPlaylist(playlist.id, videoId, token);
                }

                setPlaylists(prev => prev.map(p =>
                    p.id === playlist.id ? { ...p, contains: false } : p
                ));
            } else {
                // Add
                if (playlist.is_watch_later) {
                    await api.toggleWatchLater(videoId, token);
                } else {
                    await api.addToPlaylist(playlist.id, videoId, token);
                }

                setPlaylists(prev => prev.map(p =>
                    p.id === playlist.id ? { ...p, contains: true } : p
                ));
            }
        } catch (error) {
            console.error("Failed to toggle", error);
        } finally {
            setProcessing(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const newPl = await api.createPlaylist(newPlaylistName, "", isPublic, token);

            // Auto add video to new playlist
            await api.addToPlaylist(newPl.id, videoId, token);

            setPlaylists(prev => [{ ...newPl, contains: true }, ...prev]);
            setNewPlaylistName('');
            setIsCreating(false);
        } catch (error) {
            console.error("Failed to create", error);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
            <div className="bg-[#1a1a1a] w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="font-semibold text-lg">Save to playlist</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <span className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {playlists.map(pl => (
                                <button
                                    key={pl.id}
                                    onClick={() => handleToggle(pl)}
                                    disabled={processing === pl.id}
                                    className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors text-left group"
                                >
                                    <div className={`w-5 h-5 flex items-center justify-center border rounded ${pl.contains ? 'bg-red-600 border-red-600' : 'border-gray-500 group-hover:border-white'
                                        }`}>
                                        {pl.contains && <Check size={14} className="text-white" />}
                                    </div>
                                    <span className="flex-1 truncate font-medium">{pl.name}</span>
                                    {pl.is_public ? (
                                        <Globe size={14} className="text-gray-500" />
                                    ) : (
                                        <Lock size={14} className="text-gray-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!isCreating ? (
                    <div className="p-4 border-t border-gray-800">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center space-x-2 text-white hover:text-red-500 transition-colors font-medium"
                        >
                            <Plus size={20} />
                            <span>Create new playlist</span>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="p-4 border-t border-gray-800 space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 font-medium">Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={newPlaylistName}
                                onChange={e => setNewPlaylistName(e.target.value)}
                                className="w-full bg-[#0f0f0f] border-b border-gray-600 focus:border-red-600 text-sm py-1 outline-none transition-colors"
                                placeholder="Enter playlist name"
                                maxLength={150}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Privacy</label>
                            <select
                                value={isPublic}
                                onChange={e => setIsPublic(e.target.value === 'true')}
                                className="w-full bg-[#0f0f0f] text-sm py-1 outline-none text-gray-300"
                            >
                                <option value="true">Public</option>
                                <option value="false">Private</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="text-sm px-3 py-1.5 hover:bg-white/10 rounded text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newPlaylistName.trim()}
                                className="text-sm px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddToPlaylist;
