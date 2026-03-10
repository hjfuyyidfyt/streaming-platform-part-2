import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Play, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import VideoCard from '../../components/video/VideoCard.jsx';
import { api } from '../../services/api.js';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        totalViews: 0,
        totalVideos: 0,
        totalUsers: 1, // Mock for now
        growth: '+12%'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getAnalyticsSummary();
                setStats({
                    totalViews: data.total_views,
                    totalVideos: data.total_videos,
                    totalUsers: data.total_categories, // abusing this field label for categories count
                    growth: '+5%' // Still mock
                });
            } catch (error) {
                console.error("Failed to load stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Play, color: 'text-blue-500' },
        { title: 'Total Videos', value: stats.totalVideos.toLocaleString(), icon: BarChart3, color: 'text-purple-500' },
        { title: 'Categories', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-green-500' },
        { title: 'Growth', value: stats.growth, icon: TrendingUp, color: 'text-red-500' },
    ];

    return (
        <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {loading ? (
                    <div className="col-span-full text-center text-gray-400">Loading stats...</div>
                ) : (
                    cards.map((card, i) => (
                        <div key={i} className="bg-[#242424] border border-gray-800 p-6 rounded-xl flex items-center space-x-4">
                            <div className={`${card.color} p-3 rounded-full bg-gray-800`}>
                                <card.icon size={24} />
                            </div>
                            <div>
                                <div className="text-gray-400 text-sm mb-1">{card.title}</div>
                                <div className="text-3xl font-bold">{card.value}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-[#242424] border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                <p>Recent activity will appear here...</p>
            </div>
        </div>
    );
};

export default DashboardHome;
