import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Bell } from 'lucide-react';

const SubscribeButton = ({ channelId }) => {
    const { isAuthenticated, user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subCount, setSubCount] = useState(0);

    useEffect(() => {
        fetchStatus();
    }, [channelId, isAuthenticated]);

    const fetchStatus = async () => {
        try {
            // Get count
            const countData = await api.getSubscriberCount(channelId);
            setSubCount(countData.count || 0);

            // Get status if logged in
            if (isAuthenticated && user?.id !== channelId) {
                const token = localStorage.getItem('token');
                const statusData = await api.getSubscriptionStatus(channelId, token);
                setIsSubscribed(statusData.subscribed);
            }
        } catch (error) {
            console.error("Failed to fetch sub status", error);
        }
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            alert("Please login to subscribe");
            return;
        }
        if (user?.id === channelId) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.toggleSubscribe(channelId, token);
            setIsSubscribed(response.subscribed);

            // Optimistic update of count
            setSubCount(prev => response.subscribed ? prev + 1 : Math.max(0, prev - 1));
        } catch (error) {
            console.error("Subscribe failed", error);
            alert("Failed to subscribe");
        } finally {
            setLoading(false);
        }
    };

    if (user?.id === channelId) {
        return (
            <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full text-sm font-medium">
                {subCount} Subscribers
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isSubscribed
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-white text-black hover:bg-gray-200'
                    }`}
            >
                {loading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <>
                        {isSubscribed && <Bell size={16} className="fill-current" />}
                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </>
                )}
            </button>
            <span className="text-sm text-gray-400">
                {subCount >= 1000 ? (subCount / 1000).toFixed(1) + 'K' : subCount}
            </span>
        </div>
    );
};

export default SubscribeButton;
