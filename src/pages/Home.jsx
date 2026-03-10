import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import VideoCard from '../components/video/VideoCard.jsx';
import SkeletonVideoCard from '../components/video/SkeletonVideoCard.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import InlineAdBanner from '../components/layout/InlineAdBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Search, Menu, Bell, Upload, User, Loader2, Sun, Moon } from 'lucide-react';

import { api } from '../services/api.js';

const VIDEOS_PER_PAGE = 12;

/* ═══ Dramatic Animated Theme Toggle ═══ */
const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    const [animating, setAnimating] = useState(false);
    const handleClick = () => {
        setAnimating(true);
        toggleTheme();
        setTimeout(() => setAnimating(false), 700);
    };
    return (
        <button
            onClick={handleClick}
            className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-visible"
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, #0f0f30, #1a1a60, #2d2d8e)'
                    : 'linear-gradient(135deg, #fff3e0, #ffcc80, #ff9800)',
                boxShadow: isDark
                    ? '0 0 20px rgba(124, 92, 252, 0.5), inset 0 0 8px rgba(0, 212, 255, 0.2)'
                    : '0 0 20px rgba(255, 152, 0, 0.5), inset 0 0 8px rgba(255, 235, 59, 0.3)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: animating ? 'scale(1.3)' : 'scale(1)',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div style={{
                position: 'absolute',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(360deg) scale(0)',
                opacity: isDark ? 1 : 0
            }}>
                <Moon className="w-[18px] h-[18px] text-blue-200" style={{ filter: 'drop-shadow(0 0 6px rgba(147,197,253,0.8))' }} />
            </div>
            <div style={{
                position: 'absolute',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isDark ? 'rotate(-360deg) scale(0)' : 'rotate(0deg) scale(1)',
                opacity: isDark ? 0 : 1
            }}>
                <Sun className="w-[18px] h-[18px] text-amber-800" style={{ filter: 'drop-shadow(0 0 6px rgba(255,152,0,0.8))' }} />
            </div>
        </button>
    );
};

const Home = () => {
    const { slug } = useParams();
    const [videos, setVideos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [continueWatching, setContinueWatching] = useState([]);
    const [activeCategory, setActiveCategory] = useState({ name: 'All', slug: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [scrolled, setScrolled] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadMoreRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await api.getCategories();
                setCategories([{ name: "All", slug: "all" }, ...cats]);
            } catch (err) { console.error("Failed to load categories", err); }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories.length === 0) return;
        if (slug) {
            const cat = categories.find(c => c.slug === slug);
            if (cat && cat.slug !== activeCategory.slug) setActiveCategory(cat);
        } else if (!slug && activeCategory.slug !== 'all') {
            setActiveCategory({ name: 'All', slug: 'all' });
        }
    }, [slug, categories, activeCategory.slug]);

    const fetchVideos = useCallback(async (pageNum, reset = false) => {
        if (reset) { setIsLoading(true); setHasMore(true); } else setIsLoadingMore(true);
        try {
            const skip = pageNum * VIDEOS_PER_PAGE;
            let data;
            if (searchQuery) data = await api.searchVideos(searchQuery, skip, VIDEOS_PER_PAGE);
            else if (activeCategory.slug !== 'all') data = await api.getVideosByCategory(activeCategory.slug, skip, VIDEOS_PER_PAGE);
            else data = await api.getVideos(skip, VIDEOS_PER_PAGE);
            if (data.length < VIDEOS_PER_PAGE) setHasMore(false);
            if (reset) setVideos(data); else setVideos(prev => [...prev, ...data]);
            if (reset && isAuthenticated) {
                const cwData = await api.getContinueWatching(localStorage.getItem('token'));
                setContinueWatching(cwData.continue_watching || []);
            }
        } catch (err) {
            console.error("Failed to fetch videos", err);
            if (reset) setError(err.message || 'Failed to load videos');
        } finally { setIsLoading(false); setIsLoadingMore(false); }
    }, [searchQuery, activeCategory, isAuthenticated]);

    useEffect(() => {
        setPage(0);
        const t = setTimeout(() => fetchVideos(0, true), 300);
        return () => clearTimeout(t);
    }, [searchQuery, activeCategory, fetchVideos]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
                    setPage(prev => { const n = prev + 1; fetchVideos(n, false); return n; });
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isLoadingMore, fetchVideos]);

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {/* ═══ Floating Gradient Orbs ═══ */}
            <div className="bg-orbs" />

            {/* ═══ Glassmorphism Navbar ═══ */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between no-transition animate-navSlideDown"
                style={{
                    background: scrolled ? 'var(--bg-navbar)' : 'var(--bg-primary)',
                    backdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(150%)' : 'none',
                    borderBottom: `1px solid ${scrolled ? 'var(--border-color)' : 'transparent'}`,
                    boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
                    transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s, box-shadow 0.3s'
                }}
            >
                {/* Left: Menu + Logo */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-full transition-all duration-200"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <Link to="/" className="flex items-center gap-1 group">
                        <div className="relative animate-popIn">
                            <svg className="w-8 h-8" viewBox="0 0 90 20" fill="var(--accent-red)">
                                <path d="M27.973 3.123A3.5 3.5 0 0 0 25.5 2H4.5A3.5 3.5 0 0 0 1 5.5v9A3.5 3.5 0 0 0 4.5 18h21a3.5 3.5 0 0 0 3.5-3.5v-9c0-.97-.395-1.841-1.027-2.377zM12 14V6l5.5 4L12 14z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold tracking-tighter hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                            v<span className="font-light" style={{ color: 'var(--text-secondary)' }}>Plyer</span>
                        </span>
                    </Link>
                </div>

                {/* Center: Search Bar with glow */}
                <div className="flex-1 max-w-2xl mx-4 hidden md:flex items-center">
                    <div className="flex flex-1 rounded-full" style={{
                        boxShadow: searchFocused ? '0 0 0 2px var(--accent-primary), 0 0 20px var(--accent-glow)' : 'none',
                        transition: 'box-shadow 0.3s ease'
                    }}>
                        <input
                            type="text"
                            placeholder="Search videos..."
                            className="w-full rounded-l-full py-2 pl-4 pr-4 focus:outline-none text-sm"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                border: `1px solid ${searchFocused ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                color: 'var(--text-primary)',
                                transition: 'border-color 0.3s'
                            }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                        <button
                            className="px-5 rounded-r-full"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                border: `1px solid ${searchFocused ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                borderLeft: 'none',
                                color: 'var(--text-muted)',
                                transition: 'border-color 0.3s, background 0.2s'
                            }}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Right: Theme Toggle + Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <>
                            <button className="p-2 rounded-full transition-all duration-200" style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-full transition-all duration-200" style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <Bell className="w-5 h-5" />
                            </button>
                            <button
                                onClick={logout}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white animate-popIn"
                                style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-glow)' }}
                            >
                                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className="flex items-center gap-2 py-1.5 px-3 rounded-full font-medium text-sm transition-all"
                            style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-glow)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <User className="w-5 h-5" />
                            <span>Sign in</span>
                        </Link>
                    )}
                </div>
            </nav>

            <div className="flex pt-14 relative z-10">
                <Sidebar isOpen={sidebarOpen} categories={categories} onClose={() => setSidebarOpen(false)} />

                <main className={`flex-1 p-4 lg:p-6 min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-[72px]'}`}>

                    {/* Mobile Categories */}
                    <div className="lg:hidden flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide stagger-pills">
                        {categories.map(cat => (
                            <button
                                key={cat.slug}
                                onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                                style={{
                                    background: activeCategory.slug === cat.slug ? 'var(--accent-gradient)' : 'var(--bg-card)',
                                    color: activeCategory.slug === cat.slug ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${activeCategory.slug === cat.slug ? 'transparent' : 'var(--border-color)'}`,
                                    boxShadow: activeCategory.slug === cat.slug ? 'var(--shadow-glow)' : 'none'
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Continue Watching */}
                    {continueWatching.length > 0 && (
                        <div className="mb-8 animate-fadeIn">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 animate-slideInTitle" style={{ color: 'var(--text-primary)' }}>
                                <span style={{ color: 'var(--accent-red)' }}>▶</span> Continue Watching
                            </h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {continueWatching.map(vid => (
                                    <Link key={vid.video_id} to={`/video/${vid.video_id}`} className="min-w-[240px] w-[240px] group">
                                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2" style={{ backgroundColor: 'var(--bg-card)' }}>
                                            <img src={vid.thumbnail_url} alt={vid.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <div className="rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg"
                                                    style={{ background: 'var(--accent-gradient)' }}>
                                                    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                                <div className="h-full" style={{ width: `${vid.progress_percent}%`, background: 'var(--accent-gradient)' }}></div>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{vid.title}</h3>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Header */}
                    <h2 className="text-xl font-bold mb-6 animate-slideInTitle" style={{ color: 'var(--text-primary)' }}>
                        ✨ Recommended for you
                    </h2>

                    {/* Video Grid */}
                    {error && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fadeIn">
                            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>😔 Could not load videos</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
                            <button
                                onClick={() => { setError(null); fetchVideos(0, true); }}
                                className="px-6 py-2 text-white rounded-full text-sm font-medium transition-all hover:scale-110"
                                style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-glow)' }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-6 sm:gap-y-8 gap-x-4 w-full max-w-[350px] mx-auto sm:max-w-none ${!isLoading ? 'stagger-children' : ''}`}>
                            {isLoading
                                ? Array(8).fill(null).map((_, i) => <SkeletonVideoCard key={i} />)
                                : videos.map((video, index) => (
                                    <React.Fragment key={video.id}>
                                        <VideoCard video={video} index={index} />
                                        {(index + 1) % 4 === 0 && (
                                            <InlineAdBanner key={`ad-${index}`} />
                                        )}
                                    </React.Fragment>
                                ))
                            }
                        </div>
                    )}

                    {/* Infinite Scroll Trigger */}
                    <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 animate-fadeIn" style={{ color: 'var(--text-muted)' }}>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Loading more videos...</span>
                            </div>
                        )}
                        {!hasMore && videos.length > 0 && (
                            <p className="text-sm animate-fadeIn" style={{ color: 'var(--text-muted)' }}>No more videos to load</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Home;
