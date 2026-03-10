import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import './LikeButton.css';

const LikeButton = ({ videoId }) => {
    const { token, isAuthenticated } = useAuth();
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userLiked, setUserLiked] = useState(null); // true=liked, false=disliked, null=none

    const loadStatus = async () => {
        try {
            const data = await api.getLikeStatus(videoId, token);
            setLikes(data.likes);
            setDislikes(data.dislikes);
            setUserLiked(data.user_liked);
        } catch (err) {
            console.error('Failed to load like status:', err);
        }
    };

    useEffect(() => {
        loadStatus();
    }, [videoId, token]);

    const handleLike = async () => {
        if (!isAuthenticated) {
            alert('Please login to like videos');
            return;
        }

        try {
            const result = await api.likeVideo(videoId, true, token);
            if (result.action === 'added') {
                setLikes(likes + 1);
                if (userLiked === false) setDislikes(dislikes - 1);
                setUserLiked(true);
            } else if (result.action === 'removed') {
                setLikes(likes - 1);
                setUserLiked(null);
            } else if (result.action === 'switched') {
                setLikes(likes + 1);
                setDislikes(dislikes - 1);
                setUserLiked(true);
            }
        } catch (err) {
            console.error('Failed to like:', err);
        }
    };

    const handleDislike = async () => {
        if (!isAuthenticated) {
            alert('Please login to dislike videos');
            return;
        }

        try {
            const result = await api.likeVideo(videoId, false, token);
            if (result.action === 'added') {
                setDislikes(dislikes + 1);
                if (userLiked === true) setLikes(likes - 1);
                setUserLiked(false);
            } else if (result.action === 'removed') {
                setDislikes(dislikes - 1);
                setUserLiked(null);
            } else if (result.action === 'switched') {
                setDislikes(dislikes + 1);
                setLikes(likes - 1);
                setUserLiked(false);
            }
        } catch (err) {
            console.error('Failed to dislike:', err);
        }
    };

    const formatCount = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <div className="like-button-group">
            <button
                className={`like-btn ${userLiked === true ? 'active' : ''}`}
                onClick={handleLike}
            >
                <ThumbsUp size={20} />
                <span>{formatCount(likes)}</span>
            </button>
            <div className="divider" />
            <button
                className={`dislike-btn ${userLiked === false ? 'active' : ''}`}
                onClick={handleDislike}
            >
                <ThumbsDown size={20} />
                <span>{formatCount(dislikes)}</span>
            </button>
        </div>
    );
};

export default LikeButton;
