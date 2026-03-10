import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import VideoCard from '../components/video/VideoCard.jsx';
import { Users, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const Subscriptions = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            const token = localStorage.getItem('token');
            const data = await api.getSubscriptionFeed(token);
            setVideos(data || []);
        } catch (err) {
            console.error("Failed to load subs feed", err);
        } finally {
            setLoading(false);
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
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <Users className="text-red-500" />
                                Subscriptions
                            </h1>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                        ) : videos.length === 0 ? (
                            <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800">
                                <Video size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
                                <p className="text-gray-400 mb-6">Subscribe to channels to see their latest videos here.</p>
                                <Link to="/" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors">
                                    Browse Channels
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {videos.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Subscriptions;
