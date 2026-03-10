import React, { useRef, useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Heart } from 'lucide-react';
import { api } from '../../services/api';

const ShortsPlayer = ({ video, isActive }) => {
    const videoRef = useRef(null);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(err => console.log("Shorts autoplay failed", err));
            api.recordView(video.id);
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isActive, video.id]);

    const handleLike = () => {
        setLiked(!liked);
        const token = localStorage.getItem('token');
        if (token) {
            api.likeVideo(video.id, !liked, token).catch(err => console.error(err));
        }
    };

    const streamUrl = api.getStreamUrl(video.id);

    return (
        <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
            <video
                ref={videoRef}
                src={streamUrl}
                className="h-full w-auto max-w-full object-contain"
                loop
                playsInline
            />

            {/* Right Action Bar */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
                <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className={`p-3 rounded-full transition-colors ${liked ? 'bg-red-600' : 'bg-gray-800/60 group-hover:bg-gray-700'}`}>
                        <Heart className={`w-6 h-6 ${liked ? 'fill-current text-white' : 'text-white'}`} />
                    </div>
                    <span className="text-xs font-medium text-white shadow-sm">{video.likes_count || 0}</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-gray-800/60 rounded-full group-hover:bg-gray-700 transition-colors">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white shadow-sm">Comments</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-gray-800/60 rounded-full group-hover:bg-gray-700 transition-colors">
                        <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-white shadow-sm">Share</span>
                </button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm text-white">
                        {video.uploader?.display_name?.[0] || 'U'}
                    </div>
                    <span className="font-bold text-white text-[15px]">@{video.uploader?.username}</span>
                    <button className="px-3 py-1 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-200 transition-colors">
                        Subscribe
                    </button>
                </div>
                <h3 className="text-white text-sm line-clamp-2 pr-12">{video.title}</h3>
            </div>
        </div>
    );
};

export default ShortsPlayer;
