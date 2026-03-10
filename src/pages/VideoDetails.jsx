import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_URL } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Share2, Eye, Calendar, Settings, User, LogOut, AlertCircle, RefreshCw, ThumbsUp, ThumbsDown, Download, MoreHorizontal, ChevronDown, ChevronUp, Search, Bell, Menu, Sun, Moon, Upload } from 'lucide-react';
import VideoCard from '../components/video/VideoCard.jsx';
import AdBanner from '../components/layout/AdBanner.jsx';
import InlineAdBanner from '../components/layout/InlineAdBanner.jsx';
import LikeButton from '../components/video/LikeButton.jsx';
import CommentSection from '../components/video/CommentSection.jsx';
import SubscribeButton from '../components/video/SubscribeButton.jsx';
import AddToPlaylist from '../components/video/AddToPlaylist.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import { ListPlus } from 'lucide-react';

/* ═══ Theme Toggle (shared design) ═══ */
const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    const [animating, setAnimating] = useState(false);
    const handleClick = () => {
        setAnimating(true);
        toggleTheme();
        setTimeout(() => setAnimating(false), 700);
    };
    return (
        <button onClick={handleClick}
            className="relative w-9 h-9 rounded-full flex items-center justify-center overflow-visible"
            style={{
                background: isDark ? 'linear-gradient(135deg, #0f0f30, #1a1a60)' : 'linear-gradient(135deg, #fff3e0, #ffcc80)',
                boxShadow: isDark ? '0 0 14px rgba(124,92,252,0.4)' : '0 0 14px rgba(255,152,0,0.4)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: animating ? 'scale(1.3)' : 'scale(1)',
            }}
        >
            <div style={{ position: 'absolute', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)', transform: isDark ? 'rotate(0) scale(1)' : 'rotate(360deg) scale(0)', opacity: isDark ? 1 : 0 }}>
                <Moon className="w-4 h-4 text-blue-200" style={{ filter: 'drop-shadow(0 0 4px rgba(147,197,253,0.8))' }} />
            </div>
            <div style={{ position: 'absolute', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)', transform: isDark ? 'rotate(-360deg) scale(0)' : 'rotate(0) scale(1)', opacity: isDark ? 0 : 1 }}>
                <Sun className="w-4 h-4 text-amber-800" style={{ filter: 'drop-shadow(0 0 4px rgba(255,152,0,0.8))' }} />
            </div>
        </button>
    );
};

const VideoDetails = () => {
    const { id } = useParams();
    const { user, isAuthenticated, logout } = useAuth();
    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);
    const [activeSource, setActiveSource] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [currentResolution, setCurrentResolution] = useState(null);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);
    const videoRef = useRef(null);
    const lastSavedTime = useRef(0);
    const initialSeekDone = useRef(false);
    const [adOverlayVisible, setAdOverlayVisible] = useState(true);
    const settingsButtonRef = useRef(null);
    const settingsMenuRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [scrolled, setScrolled] = useState(false);

    // Close settings menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showQualityMenu && settingsMenuRef.current && !settingsMenuRef.current.contains(e.target) && settingsButtonRef.current && !settingsButtonRef.current.contains(e.target)) {
                setShowQualityMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showQualityMenu]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAdClick = () => {
        const adsDisabled = localStorage.getItem('ads_enabled') === 'false';
        if (!adsDisabled) {
            const adUrl = "https://www.effectivegatecpm.com/ieyn4dw3fw?key=390a194dfdfcc7ab638a23fab9da0fa2";
            if (adUrl && adUrl !== "#") window.open(adUrl, "_blank");
        }
        setAdOverlayVisible(false);
        if (videoRef.current) videoRef.current.play().catch(err => console.error("Play failed", err));
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [videoData, categoriesData] = await Promise.all([api.getVideo(id), api.getCategories()]);
                setVideo(videoData);
                setCategories([{ name: "All", slug: "all" }, ...categoriesData]);
                const videoSources = videoData.sources || [];
                if (videoData.telegram_info && !videoSources.find(s => s.provider === 'telegram')) {
                    videoSources.push({ id: 'tg-synth-' + id, provider: 'telegram', resolution: videoData.original_resolution || 'Original', file_id: videoData.telegram_info.file_id });
                }
                if (videoData.resolutions && videoData.resolutions.length > 0) {
                    videoData.resolutions.forEach(res => {
                        if (!videoSources.find(s => s.provider === 'telegram' && s.resolution === res.resolution)) {
                            videoSources.push({ id: `tg-res-synth-${res.id}`, provider: 'telegram', resolution: res.resolution, file_id: res.file_id });
                        }
                    });
                }
                if (videoSources.length === 0 && (videoData.storage_mode === 'streamtape' || videoData.storage_mode === 'doodstream')) {
                    videoSources.push({ id: 'primary', provider: videoData.storage_mode, resolution: videoData.original_resolution || 'Original', embed_url: videoData.embed_url });
                }

                // Add new Direct URL and Embed Code modes seamlessly to the sources list
                if (videoData.direct_url) {
                    videoSources.push({ id: 'direct-upload', provider: 'direct_url', resolution: videoData.original_resolution || 'Original', direct_url: videoData.direct_url });
                }
                if (videoData.embed_code) {
                    videoSources.push({ id: 'embed-upload', provider: 'embed_code', resolution: videoData.original_resolution || 'Original', embed_code: videoData.embed_code });
                }
                setSources(videoSources);
                if (videoSources.length > 0) {
                    const telegramSources = videoSources.filter(s => s.provider === 'telegram');
                    const localSources = videoSources.filter(s => s.provider === 'local');
                    const preferredSources = telegramSources.length > 0 ? telegramSources : localSources.length > 0 ? localSources : videoSources;
                    const sorted = [...preferredSources].sort((a, b) => {
                        const resA = parseInt(a.resolution) || 0;
                        const resB = parseInt(b.resolution) || 0;
                        return resB - resA;
                    });
                    setActiveSource(sorted[0]);
                    setCurrentResolution(sorted[0].resolution);
                }
                try {
                    const related = await api.getVideos(0, 12);
                    setRelatedVideos(related.filter(v => v.id !== parseInt(id)).slice(0, 10));
                } catch (e) { console.error("Failed to load related", e); }
                if (videoData.id) {
                    try { await api.recordView(videoData.id); } catch (e) { /* silent */ }
                }
            } catch (err) { console.error("Error fetching video details", err); }
            finally { setLoading(false); }
        };
        fetchData();
        setPlaybackError(false);
        setAdOverlayVisible(true);
        initialSeekDone.current = false;
        lastSavedTime.current = 0;
    }, [id]);

    // Redirect to external URL for "URL Only" uploaded videos
    useEffect(() => {
        if (video && video.direct_url && !video.embed_code) {
            // Check if the only source is direct_url (no telegram, local, or other providers)
            const nonDirectSources = sources.filter(s => s.provider !== 'direct_url');
            if (nonDirectSources.length === 0 && sources.length > 0) {
                // Record view then redirect
                window.location.href = video.direct_url;
            }
        }
    }, [video, sources]);

    useEffect(() => {
        let interval;
        if (isProcessing && sources.length === 0) {
            interval = setInterval(async () => {
                try {
                    const updatedVideo = await api.getVideo(id);
                    const newSources = updatedVideo.sources || [];
                    if (newSources.length > 0) {
                        setSources(newSources);
                        setActiveSource(newSources[0]);
                        setCurrentResolution(newSources[0].resolution);
                        setIsProcessing(false);
                    }
                } catch (e) { /* silent */ }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isProcessing, sources.length, id]);

    const handleReloadVideo = () => {
        setPlaybackError(false);
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(e => console.error("Play failed on retry", e));
        }
    };

    const handleManualRefresh = async () => {
        try {
            const updatedVideo = await api.getVideo(id);
            setVideo(updatedVideo);
            const newSources = updatedVideo.sources || [];
            setSources(newSources);
            if (newSources.length > 0) {
                const sorted = [...newSources].sort((a, b) => (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0));
                setActiveSource(sorted[0]);
                setCurrentResolution(sorted[0].resolution);
                setIsProcessing(false);
            }
        } catch (err) { console.error("Manual refresh failed", err); }
    };

    useEffect(() => {
        const fetchProgress = async () => {
            if (!isAuthenticated || !video) return;
            try {
                const token = localStorage.getItem('token');
                const progress = await api.getProgress(video.id, token);
                if (progress && progress.progress_seconds > 0 && videoRef.current && !initialSeekDone.current) {
                    videoRef.current.currentTime = progress.progress_seconds;
                    initialSeekDone.current = true;
                }
            } catch (e) { /* silent */ }
        };
        fetchProgress();
    }, [video, isAuthenticated]);

    const handleTimeUpdate = () => {
        if (!videoRef.current || !isAuthenticated || !video) return;
        const currentTime = Math.floor(videoRef.current.currentTime);
        const duration = Math.floor(videoRef.current.duration);
        if (currentTime > 0 && currentTime - lastSavedTime.current >= 10) {
            lastSavedTime.current = currentTime;
            const token = localStorage.getItem('token');
            api.saveProgress(video.id, currentTime, duration, token).catch(() => { });
        }
    };

    const handleServerChange = (newProvider) => {
        const providerSources = sources.filter(s => s.provider === newProvider);
        if (providerSources.length > 0) {
            const sorted = [...providerSources].sort((a, b) => (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0));
            setActiveSource(sorted[0]);
            setCurrentResolution(sorted[0].resolution);
            setShowQualityMenu(false);
        }
    };

    const handleQualityChange = (newResolution) => {
        if (!activeSource) return;
        const match = sources.find(s => s.provider === activeSource.provider && s.resolution === newResolution);
        if (match) {
            const currentTime = videoRef.current?.currentTime || 0;
            setActiveSource(match);
            setCurrentResolution(newResolution);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = currentTime;
                    videoRef.current.play().catch(() => { });
                }
            }, 100);
        }
    };

    const distinctProviders = [...new Set(sources.map(s => s.provider))];
    const currentProviderResolutions = sources
        .filter(s => s.provider === activeSource?.provider)
        .map(s => s.resolution)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => {
            const va = parseInt(a) || 0;
            const vb = parseInt(b) || 0;
            return vb - va;
        });

    const formatViews = (views) => {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return views;
    };

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 2592000) return Math.floor(diff / 86400) + ' days ago';
        if (diff < 31536000) return Math.floor(diff / 2592000) + ' months ago';
        return Math.floor(diff / 31536000) + ' years ago';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="animate-spin rounded-full h-12 w-12" style={{ borderTop: '2px solid var(--accent-primary)', borderBottom: '2px solid var(--accent-secondary)', borderLeft: '2px solid transparent', borderRight: '2px solid transparent' }}></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center animate-fadeIn" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <h2 className="text-2xl font-bold mb-4">Video not found</h2>
                <Link to="/" className="transition-colors" style={{ color: 'var(--accent-primary)' }}>Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Background orbs */}
            <div className="bg-orbs" />

            {/* ═══ Glassmorphism Navbar ═══ */}
            <nav className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between no-transition animate-navSlideDown"
                style={{
                    background: scrolled ? 'var(--bg-navbar)' : 'var(--bg-primary)',
                    backdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
                    borderBottom: `1px solid ${scrolled ? 'var(--border-color)' : 'transparent'}`,
                    boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
                    transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s, box-shadow 0.3s'
                }}
            >
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full transition-all duration-200"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1) rotate(0)'; }}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link to="/" className="flex items-center gap-0.5">
                        <svg className="w-8 h-8" viewBox="0 0 90 20" fill="var(--accent-red)">
                            <path d="M27.973 3.123A3.5 3.5 0 0 0 25.5 2H4.5A3.5 3.5 0 0 0 1 5.5v9A3.5 3.5 0 0 0 4.5 18h21a3.5 3.5 0 0 0 3.5-3.5v-9c0-.97-.395-1.841-1.027-2.377zM12 14V6l5.5 4L12 14z" />
                        </svg>
                        <span className="text-xl font-semibold tracking-tighter hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                            v<span className="font-light" style={{ color: 'var(--text-secondary)' }}>Plyer</span>
                        </span>
                    </Link>
                </div>

                <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center">
                    <div className="flex flex-1 rounded-full">
                        <input type="text" placeholder="Search" className="w-full rounded-l-full py-2 pl-4 pr-4 focus:outline-none text-sm"
                            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                        <button className="px-5 rounded-r-full" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderLeft: 'none', color: 'var(--text-muted)' }}>
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <>
                            <button className="p-2 rounded-full transition-all" style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <Bell className="w-5 h-5" />
                            </button>
                            <button onClick={logout} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                                style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-glow)' }}>
                                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </button>
                        </>
                    ) : (
                        <Link to="/auth" className="flex items-center gap-2 py-1.5 px-3 rounded-full font-medium text-sm transition-all"
                            style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-sm font-medium">Sign in</span>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Sidebar Overlay */}
            <Sidebar isOpen={sidebarOpen} categories={categories} onClose={() => setSidebarOpen(false)} isOverlay={true} />

            {/* ═══ Main Content ═══ */}
            <div className="pt-14 w-full lg:max-w-[1700px] lg:mx-auto flex flex-col lg:flex-row gap-0 lg:gap-8 lg:pt-4 relative z-10">

                {/* LEFT COLUMN */}
                <div className="w-full flex-1 min-w-0">

                    {/* Video Player */}
                    <div className="sticky top-14 z-40 lg:static" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div className="w-full aspect-video bg-black overflow-hidden relative lg:rounded-xl" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
                            {activeSource ? (
                                activeSource.provider === 'local' || activeSource.provider === 'telegram' || activeSource.provider === 'direct_url' ? (
                                    <>
                                        <video
                                            key={`${activeSource.provider}-${activeSource.resolution}`}
                                            ref={videoRef} controls autoPlay
                                            className="w-full h-full object-contain bg-black no-transition"
                                            src={activeSource.provider === 'direct_url' ? activeSource.direct_url : api.getStreamUrl(video.id, activeSource.resolution, activeSource.provider)}
                                            poster={video.thumbnail_url}
                                            onTimeUpdate={handleTimeUpdate}
                                            onError={() => setPlaybackError(true)}
                                            onPlay={() => setAdOverlayVisible(false)}
                                        >Your browser does not support the video tag.</video>

                                        {adOverlayVisible && (
                                            <div className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors group" onClick={handleAdClick}>
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                                                    style={{ background: 'var(--accent-gradient)', boxShadow: '0 0 40px rgba(124,92,252,0.4)' }}>
                                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        )}

                                        {playbackError && (
                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 animate-fadeIn">
                                                <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--accent-red)' }} />
                                                <p className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Video failed to load</p>
                                                <button onClick={handleReloadVideo}
                                                    className="px-6 py-2 rounded-full font-medium text-sm text-white flex items-center gap-2 transition-all hover:scale-105"
                                                    style={{ background: 'var(--accent-gradient)' }}>
                                                    <RefreshCw className="w-4 h-4" /> Retry
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    activeSource.embed_code ? (
                                        <div
                                            key={`${activeSource.provider}-${activeSource.resolution}`}
                                            className="w-full h-full absolute inset-0 no-transition [&>iframe]:w-full [&>iframe]:h-full"
                                            dangerouslySetInnerHTML={{ __html: activeSource.embed_code }}
                                        />
                                    ) : activeSource.embed_url ? (
                                        <iframe key={`${activeSource.provider}-${activeSource.resolution}`} src={activeSource.embed_url}
                                            className="w-full h-full absolute inset-0 no-transition" allowFullScreen scrolling="no" frameBorder="0" title={video.title} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                                            <RefreshCw className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--accent-primary)' }} />
                                            <p className="font-medium">Video is still processing...</p>
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full gap-3" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                                    <AlertCircle className="w-10 h-10" style={{ color: 'var(--accent-red)' }} />
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Video Unavailable</p>
                                    <Link to="/" className="mt-2 px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 text-white"
                                        style={{ background: 'var(--accent-gradient)' }}>Back to Home</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ad unit above title */}
                    {localStorage.getItem('ads_enabled') !== 'false' && (
                        <div className="w-full px-4 lg:px-0 mt-3 mb-1 flex justify-center overflow-hidden">
                            <div ref={(el) => {
                                if (el && !el.dataset.adLoaded) {
                                    el.dataset.adLoaded = 'true';
                                    const isMobile = window.innerWidth < 468;
                                    const adWidth = isMobile ? 320 : 468; const adHeight = isMobile ? 50 : 60;
                                    const configScript = document.createElement('script');
                                    configScript.text = `atOptions = {'key':'92ddfa4ed8b775183e950459a641f268','format':'iframe','height':${adHeight},'width':${adWidth},'params':{}};`;
                                    el.appendChild(configScript);
                                    const invokeScript = document.createElement('script');
                                    invokeScript.src = 'https://www.highperformanceformat.com/92ddfa4ed8b775183e950459a641f268/invoke.js';
                                    el.appendChild(invokeScript);
                                }
                            }} className="min-h-[50px] sm:min-h-[60px] w-full flex justify-center" />
                        </div>
                    )}

                    {/* ─── Video Title & Controls ─── */}
                    <div className="w-full px-4 lg:px-0 mt-3 animate-fadeIn" style={{ position: 'relative', zIndex: 50 }}>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-[18px] sm:text-xl font-bold leading-tight break-words flex-1 animate-slideInTitle"
                                style={{ color: 'var(--text-primary)' }}>{video.title}</h1>

                            {/* Settings gear */}
                            <div className="relative flex-shrink-0" style={{ zIndex: showQualityMenu ? 100 : 'auto' }}>
                                <button ref={settingsButtonRef} onClick={() => setShowQualityMenu(!showQualityMenu)}
                                    className="settings-gear-btn p-2 rounded-full transition-all duration-200"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    <Settings className={`w-5 h-5 transition-transform duration-300 ${showQualityMenu ? 'rotate-90' : ''}`} />
                                </button>

                                {showQualityMenu && (
                                    <div ref={settingsMenuRef} className="absolute top-full right-0 mt-2 rounded-xl shadow-2xl min-w-[220px] animate-fadeIn"
                                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(16px)', zIndex: 100 }}>
                                        {/* Server List */}
                                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', borderRadius: '12px 12px 0 0' }}>
                                            Select Server
                                        </div>
                                        <div className="py-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            {distinctProviders.map((provider, idx) => (
                                                <button key={provider}
                                                    onClick={(e) => { e.stopPropagation(); handleServerChange(provider); }}
                                                    className="settings-menu-item w-full px-3 py-2.5 text-left text-xs flex items-center justify-between cursor-pointer"
                                                    style={{ color: activeSource?.provider === provider ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                                                >
                                                    <span>Server {idx + 1} ({provider})</span>
                                                    {activeSource?.provider === provider && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Quality List */}
                                        {currentProviderResolutions.length > 1 && (
                                            <>
                                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}>
                                                    Select Quality
                                                </div>
                                                <div className="py-1">
                                                    {currentProviderResolutions.map((res) => (
                                                        <button key={res}
                                                            onClick={(e) => { e.stopPropagation(); handleQualityChange(res); setShowQualityMenu(false); }}
                                                            className="settings-menu-item w-full px-3 py-2.5 text-left text-xs flex items-center justify-between cursor-pointer"
                                                            style={{ color: currentResolution === res ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                                                        >
                                                            <span>{res}</span>
                                                            {currentResolution === res && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* Refresh */}
                                        <div className="p-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                                            <button
                                                onClick={async (e) => { e.stopPropagation(); await handleManualRefresh(); setShowQualityMenu(false); }}
                                                className="settings-menu-item w-full flex items-center gap-2 px-3 py-2 text-[10px] cursor-pointer"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <RefreshCw className="w-3 h-3" /> Refresh Sources
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── Channel Info & Subscribe ─── */}
                    <div className="w-full px-4 lg:px-0 mt-3 flex items-center justify-between animate-fadeIn" style={{ animationDelay: '0.1s', position: 'relative', zIndex: 1 }}>
                        <div className="flex items-center gap-3 min-w-0">
                            <Link to="#" className="flex-shrink-0">
                                {video.uploader?.avatar_url ? (
                                    <img src={video.uploader.avatar_url} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover no-transition" alt="Channel" />
                                ) : (
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase text-white"
                                        style={{ background: 'var(--accent-gradient)' }}>
                                        {(video.uploader?.display_name || video.uploader?.username || "U")[0]}
                                    </div>
                                )}
                            </Link>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm sm:text-[15px] leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                    {video.uploader?.display_name || video.uploader?.username || "Unknown"}
                                </h3>
                                <p className="text-[11px] sm:text-xs mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>Uploader</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <SubscribeButton channelId={video.uploader_id || video.uploader?.id} />
                        </div>
                    </div>

                    {/* ─── Action Buttons (Pills) ─── */}
                    <div className="w-full px-4 lg:px-0 mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide animate-fadeIn" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 1 }}>
                        <div className="flex items-center rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-card)' }}>
                            <LikeButton videoId={video.id} />
                        </div>

                        <button onClick={() => navigator.share?.({ title: video.title, url: window.location.href }) || navigator.clipboard.writeText(window.location.href)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Share2 className="w-4 h-4" /><span>Share</span>
                        </button>

                        <button onClick={() => isAuthenticated ? setShowPlaylistModal(true) : alert("Please login to save")}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <ListPlus className="w-4 h-4" /><span>Save</span>
                        </button>

                        <button className="flex items-center justify-center w-9 h-9 rounded-full transition-all flex-shrink-0"
                            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ─── Description Box ─── */}
                    <div className="w-full px-4 lg:px-0 mt-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <div className="rounded-xl p-3 cursor-pointer transition-all duration-200"
                            style={{ backgroundColor: 'var(--bg-card)' }}
                            onClick={() => setDescExpanded(!descExpanded)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                        >
                            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                <span>{formatViews(video.views)} views</span>
                                <span>{timeAgo(video.upload_date)}</span>
                            </div>
                            <div className={`text-sm mt-1 whitespace-pre-wrap ${!descExpanded ? 'line-clamp-2' : ''}`} style={{ color: 'var(--text-secondary)' }}>
                                {video.description || "No description provided for this video."}
                            </div>
                            <button className="text-sm font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                                {descExpanded ? 'Show less' : '...more'}
                            </button>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="w-full mt-6">
                        <CommentSection videoId={video.id} />
                    </div>

                    {/* Related Videos (Mobile) */}
                    <div className="lg:hidden px-4 mt-6 flex flex-col gap-4">
                        <h3 className="text-base font-bold animate-slideInTitle" style={{ color: 'var(--text-primary)' }}>Related Videos</h3>
                        <div className="flex flex-col gap-3 stagger-children">
                            {relatedVideos.map((vid, i) => (
                                <VideoCard key={vid.id} video={vid} index={i} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT COLUMN ═══ */}
                <div className="hidden lg:block w-[402px] flex-shrink-0 pt-0 pr-4">
                    <div className="mb-4">
                        <InlineAdBanner className="my-0" />
                    </div>

                    <h3 className="text-base font-bold mb-3 animate-slideInTitle" style={{ color: 'var(--text-primary)' }}>Up next</h3>
                    <div className="flex flex-col gap-2">
                        {relatedVideos.map((vid, i) => (
                            <RelatedVideoItem key={vid.id} vid={vid} index={i} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Playlist Modal */}
            {showPlaylistModal && (
                <AddToPlaylist videoId={video.id} onClose={() => setShowPlaylistModal(false)} />
            )}
        </div>
    );
};

/* ─── Related Video Item with hover effects ─── */
const RelatedVideoItem = ({ vid, index = 0 }) => {
    const [hovered, setHovered] = useState(false);

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatViews = (views) => {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M views';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K views';
        return views + ' views';
    };

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 2592000) return Math.floor(diff / 86400) + ' days ago';
        if (diff < 31536000) return Math.floor(diff / 2592000) + ' months ago';
        return Math.floor(diff / 31536000) + ' years ago';
    };

    return (
        <Link to={`/video/${vid.id}`} className="flex gap-2 group rounded-lg p-1 transition-all duration-200"
            style={{
                background: hovered ? 'var(--bg-card-hover)' : 'transparent',
                transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                animationDelay: `${index * 0.08}s`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="relative flex-shrink-0 w-[168px] aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <img
                    src={vid.thumbnail_url?.startsWith('http') ? vid.thumbnail_url : `${API_URL}${vid.thumbnail_url}`}
                    alt={vid.title}
                    className="w-full h-full object-cover no-transition"
                    style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.4s ease' }}
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://via.placeholder.com/336x189?text=${encodeURIComponent(vid.title)}`; }}
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] font-medium px-1 rounded backdrop-blur-sm">
                    {formatDuration(vid.duration)}
                </span>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="font-medium text-sm leading-tight line-clamp-2 transition-colors"
                    style={{ color: hovered ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                    {vid.title}
                </h4>
                <p className="text-xs mt-1.5 leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                    {vid.uploader?.display_name || vid.uploader?.username || 'vPlyer'}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {formatViews(vid.views)} • {timeAgo(vid.upload_date)}
                </p>
            </div>
        </Link>
    );
};

export default VideoDetails;
