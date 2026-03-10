import React, { useRef, useState } from 'react';
import { Play, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../services/api.js';

const VideoCard = ({ video, index = 0 }) => {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

    const getThumbnailUrl = () => {
        if (!video.thumbnail_url) return `${API_URL}/thumbnails/${video.id}`;
        if (video.thumbnail_url.startsWith('http')) return video.thumbnail_url;
        return `${API_URL}${video.thumbnail_url}`;
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // 3D tilt effect
        setTilt({
            x: (y - 0.5) * -15,
            y: (x - 0.5) * 15
        });

        // Glow follows cursor
        setGlowPos({ x: x * 100, y: y * 100 });
    };

    const handleMouseEnter = () => setIsHovered(true);

    const handleMouseLeave = () => {
        setIsHovered(false);
        setTilt({ x: 0, y: 0 });
    };

    return (
        <Link
            to={`/video/${video.id}`}
            ref={cardRef}
            className="group relative block rounded-xl overflow-hidden cursor-pointer"
            style={{
                backgroundColor: 'var(--bg-card)',
                perspective: '800px',
                animationDelay: `${(index % 12) * 0.06}s`,
                transform: isHovered
                    ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)`
                    : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
                boxShadow: isHovered
                    ? '0 20px 60px rgba(124, 92, 252, 0.2), 0 0 30px rgba(0, 212, 255, 0.1)'
                    : 'var(--shadow-sm)',
                transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease',
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Dynamic cursor glow overlay */}
            {isHovered && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                    style={{
                        background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(124, 92, 252, 0.15) 0%, transparent 60%)`,
                        transition: 'none'
                    }}
                />
            )}

            {/* Border glow on hover */}
            <div
                className="absolute inset-0 rounded-xl z-20 pointer-events-none"
                style={{
                    border: isHovered ? '1px solid rgba(124, 92, 252, 0.4)' : '1px solid transparent',
                    transition: 'border-color 0.3s',
                }}
            />

            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <img
                    src={getThumbnailUrl()}
                    alt={video.title}
                    className="w-full h-full object-cover no-transition"
                    style={{
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
                    }}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/640x360?text=${encodeURIComponent(video.title)}`;
                    }}
                />

                {/* Gradient overlay on hover */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: isHovered
                            ? 'linear-gradient(to top, rgba(10,10,20,0.6) 0%, transparent 50%)'
                            : 'transparent',
                        transition: 'background 0.4s'
                    }}
                />

                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono backdrop-blur-sm z-10">
                    {video.duration ? new Date(video.duration * 1000).toISOString().substr(14, 5) : "00:00"}
                </span>

                {/* Play button with pulse */}
                <div className="absolute inset-0 flex items-center justify-center z-10"
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    <div
                        className="rounded-full p-4 text-white"
                        style={{
                            background: 'var(--accent-gradient)',
                            boxShadow: '0 0 30px rgba(124, 92, 252, 0.5), 0 0 60px rgba(0, 212, 255, 0.2)',
                            transform: isHovered ? 'scale(1)' : 'scale(0.5)',
                            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        <Play className="w-6 h-6 fill-current" />
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3 relative z-10">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1.5"
                    style={{
                        color: isHovered ? 'var(--accent-secondary)' : 'var(--text-primary)',
                        transition: 'color 0.3s'
                    }}
                >
                    {video.title}
                </h3>
                <div className="flex items-center text-xs mt-2 space-x-3" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        <span>{video.views?.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center px-2 py-0.5 rounded"
                        style={{
                            background: isHovered ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                            transition: 'background 0.3s'
                        }}
                    >
                        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                            {video.category?.name || "Uncategorized"}
                        </span>
                    </div>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {new Date(video.upload_date).toLocaleDateString()}
                </div>
            </div>
        </Link>
    );
};

export default VideoCard;
