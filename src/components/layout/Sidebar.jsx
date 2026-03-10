import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
    Home,
    Compass,
    PlaySquare,
    Clock,
    ThumbsUp,
    ListVideo,
    History,
    Flame,
    Music,
    Gamepad2,
    Trophy,
    Film,
    Radio,
    Settings,
    HelpCircle,
    Flag,
    ChevronRight,
    Video,
    User
} from 'lucide-react';

/* ─── NavItem with gradient active bar ─── */
const NavItem = ({ icon: IconComponent, label, path, isActive }) => (
    <Link
        to={path}
        className="flex items-center gap-5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden"
        style={{
            background: isActive ? 'var(--accent-glow)' : 'transparent',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
        {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                style={{ background: 'var(--accent-gradient)' }} />
        )}
        <IconComponent className="w-5 h-5 transition-colors" style={{
            color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)'
        }} />
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

const SectionHeader = ({ title, showArrow = false }) => (
    <div className="flex items-center justify-between px-3 pt-4 pb-1">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</h3>
        {showArrow && <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
    </div>
);

const Divider = () => (
    <div className="my-3 mx-3" style={{ borderTop: '1px solid var(--border-color)' }} />
);

const Sidebar = ({ isOpen = true, categories = [], onClose = () => { }, isOverlay = false }) => {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const isActive = (path) => location.pathname === path;

    const mainItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Compass, label: 'Explore', path: '/explore' },
        { icon: PlaySquare, label: 'Shorts', path: '/shorts' },
        { icon: Radio, label: 'Subscriptions', path: '/subscriptions' },
    ];

    const youItems = [
        { icon: Video, label: 'Your videos', path: '/your-videos' },
        { icon: History, label: 'History', path: '/history' },
        { icon: ListVideo, label: 'Playlists', path: '/playlists' },
        { icon: Clock, label: 'Watch later', path: '/watch-later' },
        { icon: ThumbsUp, label: 'Liked videos', path: '/liked' },
    ];

    const exploreItems = [
        { icon: Flame, label: 'Trending', path: '/trending' },
        { icon: Music, label: 'Music', path: '/category/music' },
        { icon: Gamepad2, label: 'Gaming', path: '/category/gaming' },
        { icon: Trophy, label: 'Sports', path: '/category/sports' },
        { icon: Film, label: 'Movies', path: '/category/movies' },
    ];

    const bottomItems = [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: Flag, label: 'Report history', path: '/report-history' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
    ];

    // Collapsed mini sidebar
    if (!isOpen && !isOverlay) {
        return (
            <aside
                className="hidden lg:flex flex-col items-center w-[72px] h-[calc(100vh-56px)] overflow-y-auto fixed top-14 left-0 z-40 py-3"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                {mainItems.slice(0, 4).map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all duration-200"
                        style={{
                            background: isActive(item.path) ? 'var(--accent-glow)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                        onMouseLeave={(e) => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <item.icon className="w-5 h-5 mb-1" style={{
                            color: isActive(item.path) ? 'var(--accent-primary)' : 'var(--text-muted)'
                        }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    </Link>
                ))}
            </aside>
        );
    }

    return (
        <>
            {/* Overlay backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 ${isOverlay ? '' : 'lg:hidden'} ${isOpen ? 'block' : 'hidden'}`}
                onClick={onClose}
                style={{ backdropFilter: 'blur(4px)' }}
            />

            <aside
                className={`
                    w-60 h-[calc(100vh-56px)] overflow-y-auto scrollbar-hide
                    fixed top-14 left-0 z-50
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : `-translate-x-full ${!isOverlay ? 'lg:translate-x-0 lg:w-[72px]' : ''}`}
                `}
                style={{
                    backgroundColor: 'var(--bg-sidebar)',
                    backdropFilter: 'blur(12px)',
                    borderRight: '1px solid var(--border-color)'
                }}
            >
                <div className="py-3 px-2">
                    <nav className="space-y-0.5">
                        {mainItems.map(item => (
                            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} isActive={isActive(item.path)} />
                        ))}
                    </nav>

                    <Divider />

                    <SectionHeader title="You" showArrow />
                    <nav className="space-y-0.5">
                        {youItems.map(item => (
                            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} isActive={isActive(item.path)} />
                        ))}
                    </nav>

                    {!isAuthenticated && (
                        <div className="mx-3 mt-4 p-3 rounded-lg" style={{ border: '1px solid var(--border-color)' }}>
                            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                                Sign in to like videos, comment, and subscribe.
                            </p>
                            <Link
                                to="/auth"
                                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-full text-sm font-medium transition-all"
                                style={{
                                    border: '1px solid var(--accent-primary)',
                                    color: 'var(--accent-primary)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-glow)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <User className="w-4 h-4" />
                                Sign in
                            </Link>
                        </div>
                    )}

                    <Divider />

                    <SectionHeader title="Explore" />
                    <nav className="space-y-0.5">
                        {exploreItems.map(item => (
                            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} isActive={isActive(item.path)} />
                        ))}
                    </nav>

                    {categories.length > 0 && (
                        <>
                            <Divider />
                            <SectionHeader title="Categories" />
                            <nav className="space-y-0.5">
                                {categories.filter(c => c.slug !== 'all').slice(0, 8).map(cat => (
                                    <Link
                                        key={cat.slug}
                                        to={`/category/${cat.slug}`}
                                        className="flex items-center gap-5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
                                        style={{
                                            background: location.pathname === `/category/${cat.slug}` ? 'var(--accent-glow)' : 'transparent',
                                            color: location.pathname === `/category/${cat.slug}` ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        }}
                                        onMouseEnter={(e) => { if (location.pathname !== `/category/${cat.slug}`) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                                        onMouseLeave={(e) => { if (location.pathname !== `/category/${cat.slug}`) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {location.pathname === `/category/${cat.slug}` && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                                                style={{ background: 'var(--accent-gradient)' }} />
                                        )}
                                        <span className="text-sm">{cat.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </>
                    )}

                    <Divider />

                    <nav className="space-y-0.5">
                        {bottomItems.map(item => (
                            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} isActive={isActive(item.path)} />
                        ))}
                    </nav>

                    <div className="mt-4 px-3 pb-6">
                        <div className="text-xs space-y-2" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                <a href="#" className="hover:underline">About</a>
                                <a href="#" className="hover:underline">Press</a>
                                <a href="#" className="hover:underline">Copyright</a>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                <a href="#" className="hover:underline">Contact us</a>
                                <a href="#" className="hover:underline">Creators</a>
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                <a href="#" className="hover:underline">Terms</a>
                                <a href="#" className="hover:underline">Privacy</a>
                                <a href="#" className="hover:underline">Policy & Safety</a>
                            </div>
                            <p className="pt-3" style={{ color: 'var(--text-muted)' }}>© 2026 vPlyer</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
