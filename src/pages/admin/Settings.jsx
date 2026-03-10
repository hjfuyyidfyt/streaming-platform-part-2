import React, { useEffect, useState, useRef } from 'react';
import { api, API_URL } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Save, Server, Globe, Shield, Megaphone, Check, ChevronRight, Sparkles, Send, Terminal, Bot, Trash2, AlertTriangle, Search, Download, Unlock, FileArchive } from 'lucide-react';

const Settings = () => {
    const { token } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('storage');
    const [isAiLaunched, setIsAiLaunched] = useState(false);
    const [command, setCommand] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', text: 'Welcome, Administrator. I\'m Nova — your AI system controller.\n\nI can help you manage storage, ads, analytics, and more. Type /help to see all available commands.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const chatEndRef = useRef(null);
    const [deleteMode, setDeleteMode] = useState(null); // null | { step: 'input' }
    const [findMode, setFindMode] = useState(null); // null | { step: 'input' }

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.getSystemSettings(token);
                setSettings(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [token]);

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            storage_providers: {
                ...prev.storage_providers,
                [key]: {
                    ...prev.storage_providers[key],
                    enabled: !prev.storage_providers[key].enabled
                }
            }
        }));
    };

    const handleDefaultChange = (key) => {
        setSettings(prev => ({
            ...prev,
            default_storage: key
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateSystemSettings(settings, token);
            alert('Settings saved successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const [isTyping, setIsTyping] = useState(false);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const executeCommand = async (cmd) => {
        const lower = cmd.trim().toLowerCase();
        const parts = lower.split(/\s+/);
        const primary = parts[0].replace('/', '');
        const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        try {
            // ===== /help =====
            if (primary === 'help') {
                return '📋 **Available Commands:**\n\n'
                    + '`/storage` — View storage provider status\n'
                    + '`/storage enable <provider>` — Enable a provider\n'
                    + '`/storage disable <provider>` — Disable a provider\n'
                    + '`/storage default <provider>` — Set default provider\n'
                    + '`/analytics` — View real analytics summary\n'
                    + '`/disk` — Check server disk usage\n'
                    + '`/cleanup [uploads|transcodes|thumbnails|all]` — Clean temp files\n'
                    + '`/videos` — List recent videos with sources\n'
                    + '`/find` — Search videos by title (interactive)\n'
                    + '`/delete` — Interactive video deletion tool\n'
                    + '`/reprocess <id>` — Re-transcode video & upload qualities\n'
                    + '`/ads` — View ad status\n'
                    + '`/ads off` — Disable all ads globally\n'
                    + '`/ads on` — Enable all ads globally\n'
                    + '`/help` — Show this list';
            }

            // ===== /storage =====
            if (primary === 'storage') {
                const currentSettings = await api.getSystemSettings(token);

                // /storage enable <provider> or /storage disable <provider>
                if (parts[1] === 'enable' || parts[1] === 'disable') {
                    const providerKey = parts[2];
                    if (!providerKey || !currentSettings.storage_providers[providerKey]) {
                        const available = Object.keys(currentSettings.storage_providers).join(', ');
                        return `❌ Unknown provider: "${parts[2] || ''}"\n\nAvailable: ${available}`;
                    }
                    const newEnabled = parts[1] === 'enable';
                    currentSettings.storage_providers[providerKey].enabled = newEnabled;
                    await api.updateSystemSettings(currentSettings, token);
                    // Also update local settings state
                    setSettings(currentSettings);
                    const icon = newEnabled ? '✅' : '⛔';
                    return `${icon} **${currentSettings.storage_providers[providerKey].name}** has been ${newEnabled ? 'enabled' : 'disabled'} successfully.\n\nChanges saved to server.`;
                }

                // /storage default <provider>
                if (parts[1] === 'default') {
                    const providerKey = parts[2];
                    if (!providerKey || !currentSettings.storage_providers[providerKey]) {
                        return `❌ Unknown provider: "${parts[2] || ''}"`;
                    }
                    if (!currentSettings.storage_providers[providerKey].enabled) {
                        return `⚠️ Cannot set "${providerKey}" as default — it is currently disabled. Enable it first.`;
                    }
                    currentSettings.default_storage = providerKey;
                    await api.updateSystemSettings(currentSettings, token);
                    setSettings(currentSettings);
                    return `✅ Default storage provider changed to **${currentSettings.storage_providers[providerKey].name}**.\n\nAll new uploads will use this provider.`;
                }

                // /storage (status)
                const lines = Object.entries(currentSettings.storage_providers).map(([key, p]) => {
                    const status = p.enabled ? '✅ Active' : '⛔ Disabled';
                    const def = currentSettings.default_storage === key ? ' ⭐ Default' : '';
                    return `• **${p.name}** (${key}) — ${status}${def}`;
                });
                return `💾 **Storage Providers:**\n\n${lines.join('\n')}`;
            }

            // ===== /analytics =====
            if (primary === 'analytics') {
                const data = await api.getAnalyticsSummary();
                return `📊 **Live Analytics:**\n\n`
                    + `• Total videos: ${data.total_videos ?? 'N/A'}\n`
                    + `• Total views: ${data.total_views?.toLocaleString() ?? 'N/A'}\n`
                    + `• Views today: ${data.views_today?.toLocaleString() ?? 'N/A'}\n`
                    + `• Views this week: ${data.views_this_week?.toLocaleString() ?? 'N/A'}\n`
                    + `• Views this month: ${data.views_this_month?.toLocaleString() ?? 'N/A'}\n`
                    + `• Total categories: ${data.total_categories ?? 'N/A'}`;
            }

            // ===== /disk =====
            if (primary === 'disk') {
                const stats = await api.getStorageStats(token);
                return `🖴 **Server Disk Usage:**\n\n`
                    + `📁 Temp Uploads: ${formatBytes(stats.temp_uploads.size)} (${stats.temp_uploads.count} files)\n`
                    + `📁 Transcodes: ${formatBytes(stats.temp_transcodes.size)} (${stats.temp_transcodes.count} files)\n`
                    + `📁 Thumbnails: ${formatBytes(stats.thumbnails.size)} (${stats.thumbnails.count} files)\n\n`
                    + `Total: ${formatBytes(stats.temp_uploads.size + stats.temp_transcodes.size + stats.thumbnails.size)}`;
            }

            // ===== /cleanup =====
            if (primary === 'cleanup') {
                const target = parts[1] || 'all';
                const validTargets = ['all', 'uploads', 'transcodes', 'thumbnails'];
                if (!validTargets.includes(target)) {
                    return `❌ Invalid target: "${target}"\n\nValid options: ${validTargets.join(', ')}`;
                }
                const result = await api.cleanupStorage(target, token);
                const count = result.cleaned?.length || 0;
                if (count === 0) return `✨ **No files to clean.** Storage directories are already clean.`;
                return `🧹 **Cleanup Complete:**\n\n`
                    + `Removed ${count} file(s) from ${target === 'all' ? 'all directories' : target}:\n`
                    + result.cleaned.slice(0, 10).map(f => `• ${f}`).join('\n')
                    + (count > 10 ? `\n... and ${count - 10} more` : '');
            }

            // ===== /videos =====
            if (primary === 'videos') {
                const videos = await api.adminListVideos(token, 0, 15);
                if (!videos || videos.length === 0) return '📹 No videos found on the platform.';
                const lines = videos.map((v, i) => {
                    const providers = v.sources.map(s => s.provider).filter((p, idx, arr) => arr.indexOf(p) === idx).join(', ');
                    return `${i + 1}. **${v.title}** (ID: ${v.id}) — ${v.views} views\n   Sources: ${providers || 'none'} (${v.source_count} total)`;
                });
                return `📹 **Videos (${videos.length}):**\n\n${lines.join('\n\n')}`;
            }

            // ===== /delete =====
            if (primary === 'delete') {
                setDeleteMode({ step: 'input' });
                return '__DELETE_PROMPT__';
            }

            // ===== /find =====
            if (primary === 'find') {
                setFindMode({ step: 'input' });
                return '__FIND_PROMPT__';
            }

            // ===== /ads =====
            if (primary === 'ads') {
                const action = parts[1];
                const currentSettings = await api.getSystemSettings(token);
                // Ensure ad_settings exists
                if (!currentSettings.ad_settings) {
                    currentSettings.ad_settings = { master_enabled: true, placements: {}, cooldown_seconds: 60, urls: {} };
                }
                if (action === 'off') {
                    currentSettings.ad_settings.master_enabled = false;
                    await api.updateSystemSettings(currentSettings, token);
                    setSettings(currentSettings);
                    return '🚫 **All Ads Disabled**\n\nBanner ads, popunder ads, and video overlay ads have been turned off globally via server settings.\n\nTo re-enable: `/ads on`';
                }
                if (action === 'on') {
                    currentSettings.ad_settings.master_enabled = true;
                    await api.updateSystemSettings(currentSettings, token);
                    setSettings(currentSettings);
                    return '✅ **All Ads Enabled**\n\nBanner ads, popunder ads, and video overlay ads are now active.\n\nTo disable: `/ads off`';
                }
                const currentState = currentSettings.ad_settings.master_enabled ? '✅ ON' : '🚫 OFF';
                const placements = currentSettings.ad_settings.placements || {};
                const placementLines = Object.entries(placements).map(([k, v]) => `• **${v.name}** — ${v.enabled ? '✅ ON' : '⛔ OFF'}`).join('\n');
                return `📢 **Ad Status:** ${currentState}\n\n**Placements:**\n${placementLines}\n\n**Cooldown:** ${currentSettings.ad_settings.cooldown_seconds || 60}s\n\nUsage:\n• \`/ads off\` — Disable all ads\n• \`/ads on\` — Enable all ads`;
            }

            // ===== /reprocess =====
            if (primary === 'reprocess') {
                const videoId = parts[1];
                if (!videoId || isNaN(videoId)) {
                    return '⚙️ **Reprocess Video**\n\nRe-triggers transcoding and upload of multiple quality versions (720p, 480p, 240p).\n\nUsage: `/reprocess <video_id>`\n\nExample: `/reprocess 47`';
                }
                try {
                    const res = await fetch(`${API_URL}/admin/reprocess/${videoId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        return `✅ **Reprocess Started!**\n\n${data.message}\n\n📁 Source: \`${data.source_file}\`\n🔌 Providers: ${data.active_providers.join(', ')}\n\n⏳ Transcoding + upload running in background. Check back in a few minutes.`;
                    } else {
                        return `❌ **Reprocess Failed**\n\n${data.detail || 'Unknown error'}`;
                    }
                } catch (err) {
                    return `❌ **Reprocess Error:** ${err.message}`;
                }
            }

            return `❓ Unknown command: "${cmd}"\n\nType \`/help\` to see available commands.`;

        } catch (error) {
            return `❌ **Error:** ${error.message || 'Command failed'}\n\nPlease try again or type \`/help\`.`;
        }
    };

    const handleSendCommand = async (e) => {
        e.preventDefault();
        if (!command.trim() || isTyping) return;

        const userCmd = command;
        setChatHistory(prev => [...prev, { role: 'user', text: userCmd, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setCommand('');
        setIsTyping(true);

        try {
            const response = await executeCommand(userCmd);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                text: response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (err) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                text: `❌ Unexpected error: ${err.message}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleDeleteAction = async (inputValue) => {
        const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDeleteMode(null);

        // Add user's input to chat
        setChatHistory(prev => [...prev, { role: 'user', text: inputValue, time: ts() }]);
        setIsTyping(true);

        try {
            const trimmed = inputValue.trim().toLowerCase();

            // /all — delete all videos
            if (trimmed === '/all' || trimmed === 'all') {
                const result = await api.adminDeleteAllVideos(token);
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    text: `🗑️ **All Videos Deleted**\n\n${result.deleted_count} video(s) have been permanently removed from the platform.\n\nAll sources, thumbnails, and metadata have been wiped.`,
                    time: ts()
                }]);
                setIsTyping(false);
                return;
            }

            // Parse: id | id, provider | id, provider, quality | quality, id, provider
            const parts = trimmed.split(',').map(s => s.trim());
            let videoId, provider = null, quality = null;

            if (parts.length === 1) {
                // Just video ID
                videoId = parseInt(parts[0]);
            } else if (parts.length === 2) {
                // id, provider
                videoId = parseInt(parts[0]);
                provider = parts[1];
            } else if (parts.length === 3) {
                // id, provider, quality  OR  quality, id, provider
                // Try to detect format
                if (isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                    // quality, id, provider
                    quality = parts[0];
                    videoId = parseInt(parts[1]);
                    provider = parts[2];
                } else {
                    // id, provider, quality
                    videoId = parseInt(parts[0]);
                    provider = parts[1];
                    quality = parts[2];
                }
            }

            if (isNaN(videoId)) {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    text: '❌ Invalid input. Please enter a valid video ID.\n\nExamples:\n• `20` — Delete video #20 completely\n• `20, streamtape` — Remove only StreamTape sources\n• `20, telegram, 480p` — Remove 480p from Telegram only\n• `/all` — Delete ALL videos',
                    time: ts()
                }]);
                setIsTyping(false);
                return;
            }

            const result = await api.adminDeleteVideo(videoId, token, provider, quality);

            let msg = '';
            if (result.mode === 'full') {
                msg = `🗑️ **Video #${videoId} Completely Deleted**\n\n`
                    + `Removed sources:\n${result.deleted_sources.map(s => `• ${s}`).join('\n') || '• None'}\n\n`
                    + `✅ Video record, thumbnails, view history — all removed permanently.`;
            } else if (result.mode === 'provider') {
                msg = `🗑️ **Removed ${provider} sources from Video #${videoId}**\n\n`
                    + `Deleted:\n${result.deleted_sources.map(s => `• ${s}`).join('\n') || '• None'}\n\n`
                    + `Remaining sources: ${result.remaining_sources}\n`
                    + `Video record kept intact.`;
            } else if (result.mode === 'selective') {
                msg = `🗑️ **Removed ${quality} from ${provider} — Video #${videoId}**\n\n`
                    + `Deleted:\n${result.deleted_sources.map(s => `• ${s}`).join('\n') || '• None'}\n\n`
                    + `Remaining sources: ${result.remaining_sources}\n`
                    + `Video record kept intact.`;
            }

            setChatHistory(prev => [...prev, { role: 'assistant', text: msg, time: ts() }]);
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                text: `❌ **Delete Failed:** ${error.message}\n\nMake sure the video ID is correct.`,
                time: ts()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFindAction = async (searchQuery) => {
        const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setFindMode(null);

        setChatHistory(prev => [...prev, { role: 'user', text: searchQuery, time: ts() }]);
        setIsTyping(true);

        try {
            const results = await api.adminSearchVideos(searchQuery.trim(), token, 0, 20);

            if (!results || results.length === 0) {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    text: `🔍 No videos found matching "${searchQuery.trim()}".\n\nTry different keywords or partial titles.`,
                    time: ts()
                }]);
            } else {
                setChatHistory(prev => [...prev, {
                    role: 'assistant',
                    text: '__SEARCH_RESULTS__',
                    searchResults: results,
                    searchQuery: searchQuery.trim(),
                    time: ts()
                }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                text: `❌ **Search Failed:** ${error.message}`,
                time: ts()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleVideoIdClick = (videoId) => {
        // Auto-trigger /delete command and paste the video ID
        setDeleteMode({ step: 'input' });
        const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            text: '__DELETE_PROMPT__',
            time: ts(),
            autoPasteId: videoId
        }]);
    };

    const handleVideoOptionsDialog = (video) => {
        const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            text: '__VIDEO_OPTIONS__',
            videoOptionsData: video,
            time: ts()
        }]);
    };

    const handleSendZipFile = (video) => {
        const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatHistory(prev => [...prev, {
            role: 'assistant',
            text: '__ZIP_FILE__',
            zipData: video,
            time: ts()
        }]);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
    );
    if (!settings) return <div className="text-white p-8 bg-red-500/10 border border-red-500/20 rounded-lg">Error loading settings.</div>;

    const navItems = [
        { id: 'general', label: 'General', icon: Globe, description: 'Basic site configuration' },
        { id: 'storage', label: 'Storage', icon: Server, description: 'Video upload providers' },
        { id: 'ads', label: 'Ad Management', icon: Megaphone, description: 'Monetization settings' },
        { id: 'security', label: 'Security', icon: Shield, description: 'Access and authentication' },
        { id: 'ai', label: 'AI Assistant', icon: Sparkles, description: 'Advanced AI controller' },
    ];

    return (
        <div className="text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-gray-400 mt-2">Manage your platform configuration and service providers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                ? 'bg-red-600 shadow-lg shadow-red-600/20 text-white'
                                : 'bg-[#1a1a1a] hover:bg-[#242424] text-gray-400 border border-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90 text-white' : 'text-gray-600 group-hover:text-white'}`} />
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-8 flex-1">
                            {activeTab === 'storage' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-semibold">Video Upload Providers</h2>
                                        <p className="text-sm text-gray-400 mt-1">Configure where your videos are stored and processed.</p>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        {Object.entries(settings.storage_providers).map(([key, provider]) => (
                                            <div key={key} className="flex items-center justify-between bg-[#242424] p-5 rounded-xl border border-gray-700/30 hover:border-gray-600 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${provider.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-100">{provider.name}</p>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{key}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    {/* Default Selector */}
                                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="radio"
                                                                name="default_storage"
                                                                checked={settings.default_storage === key}
                                                                onChange={() => handleDefaultChange(key)}
                                                                disabled={!provider.enabled}
                                                                className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 focus:ring-offset-gray-900 focus:ring-red-600"
                                                            />
                                                        </div>
                                                        <span className={`text-sm font-medium ${settings.default_storage === key ? 'text-white' : 'text-gray-500'}`}>
                                                            Default
                                                        </span>
                                                    </label>

                                                    {/* Enable Toggle */}
                                                    <button
                                                        onClick={() => handleToggle(key)}
                                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${provider.enabled
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20'
                                                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-750'
                                                            }`}
                                                    >
                                                        {provider.enabled ? 'ENABLED' : 'DISABLED'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'general' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-semibold">General Settings</h2>
                                        <p className="text-sm text-gray-400 mt-1">Basic identification and behavior of your platform.</p>
                                    </div>
                                    <div className="bg-[#242424] p-8 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                        <Globe className="w-10 h-10 text-gray-600" />
                                        <p className="text-gray-400">General settings module is being prepared.</p>
                                        <p className="text-xs text-gray-600 italic">Coming in next update</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ads' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-semibold">Ad Management</h2>
                                        <p className="text-sm text-gray-400 mt-1">Control advertisement placements, cooldown, and URLs.</p>
                                    </div>

                                    {/* Master Toggle */}
                                    <div className="flex items-center justify-between bg-[#242424] p-5 rounded-xl border border-gray-700/30">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${settings.ad_settings?.master_enabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                                            <div>
                                                <p className="font-semibold text-gray-100 text-lg">Master Ad Switch</p>
                                                <p className="text-xs text-gray-500 mt-0.5">পুরো সাইটের সব ad একসাথে বন্ধ/চালু</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSettings(prev => ({
                                                ...prev,
                                                ad_settings: { ...prev.ad_settings, master_enabled: !prev.ad_settings?.master_enabled }
                                            }))}
                                            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.ad_settings?.master_enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${settings.ad_settings?.master_enabled ? 'left-[30px]' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>

                                    {/* Per-Placement Toggles */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Ad Placements</h3>
                                        <div className="space-y-3">
                                            {settings.ad_settings?.placements && Object.entries(settings.ad_settings.placements).map(([key, placement]) => (
                                                <div key={key} className={`flex items-center justify-between bg-[#242424] p-4 rounded-xl border transition-all ${!settings.ad_settings?.master_enabled ? 'opacity-40 pointer-events-none border-gray-800' : 'border-gray-700/30 hover:border-gray-600'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${placement.enabled ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
                                                        <div>
                                                            <p className="font-medium text-gray-200 text-sm">{placement.name}</p>
                                                            <p className="text-[11px] text-gray-600 uppercase tracking-wider">{key}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSettings(prev => ({
                                                            ...prev,
                                                            ad_settings: {
                                                                ...prev.ad_settings,
                                                                placements: {
                                                                    ...prev.ad_settings.placements,
                                                                    [key]: { ...placement, enabled: !placement.enabled }
                                                                }
                                                            }
                                                        }))}
                                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${placement.enabled
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20'
                                                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-750'
                                                            }`}
                                                    >
                                                        {placement.enabled ? 'ON' : 'OFF'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cooldown Config */}
                                    <div className={`${!settings.ad_settings?.master_enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Popunder Cooldown</h3>
                                        <div className="bg-[#242424] p-5 rounded-xl border border-gray-700/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm text-gray-400">কত সেকেন্ড পরে আবার popunder দেখাবে</p>
                                                <span className="bg-indigo-500/15 text-indigo-400 px-3 py-1 rounded-lg text-sm font-bold">
                                                    {settings.ad_settings?.cooldown_seconds || 60}s
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="300"
                                                step="5"
                                                value={settings.ad_settings?.cooldown_seconds || 60}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    ad_settings: { ...prev.ad_settings, cooldown_seconds: parseInt(e.target.value) }
                                                }))}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                                <span>10s</span>
                                                <span>60s</span>
                                                <span>120s</span>
                                                <span>180s</span>
                                                <span>300s</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ad URLs */}
                                    <div className={`${!settings.ad_settings?.master_enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Ad URLs</h3>
                                        <div className="space-y-3">
                                            <div className="bg-[#242424] p-4 rounded-xl border border-gray-700/30">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Popunder Smartlink URL</label>
                                                <input
                                                    type="text"
                                                    value={settings.ad_settings?.urls?.popunder_url || ''}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        ad_settings: {
                                                            ...prev.ad_settings,
                                                            urls: { ...prev.ad_settings.urls, popunder_url: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="bg-[#242424] p-4 rounded-xl border border-gray-700/30">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Banner Script URL</label>
                                                <input
                                                    type="text"
                                                    value={settings.ad_settings?.urls?.banner_script_url || ''}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        ad_settings: {
                                                            ...prev.ad_settings,
                                                            urls: { ...prev.ad_settings.urls, banner_script_url: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                    placeholder="//script.url/invoke.js"
                                                />
                                            </div>
                                            <div className="bg-[#242424] p-4 rounded-xl border border-gray-700/30">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Banner Container ID</label>
                                                <input
                                                    type="text"
                                                    value={settings.ad_settings?.urls?.banner_container_id || ''}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        ad_settings: {
                                                            ...prev.ad_settings,
                                                            urls: { ...prev.ad_settings.urls, banner_container_id: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                    placeholder="container-xxxxxxxxxxxx"
                                                />
                                            </div>
                                            <div className="bg-[#242424] p-4 rounded-xl border border-gray-700/30">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Inline Banner Script URL (468x60)</label>
                                                <input
                                                    type="text"
                                                    value={settings.ad_settings?.urls?.inline_banner_script_url || ''}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        ad_settings: {
                                                            ...prev.ad_settings,
                                                            urls: { ...prev.ad_settings.urls, inline_banner_script_url: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                    placeholder="https://www.highperformanceformat.com/.../invoke.js"
                                                />
                                            </div>
                                            <div className="bg-[#242424] p-4 rounded-xl border border-gray-700/30">
                                                <label className="text-xs text-gray-500 font-medium block mb-2">Inline Banner Key</label>
                                                <input
                                                    type="text"
                                                    value={settings.ad_settings?.urls?.inline_banner_key || ''}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        ad_settings: {
                                                            ...prev.ad_settings,
                                                            urls: { ...prev.ad_settings.urls, inline_banner_key: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                                    placeholder="92ddfa4ed8b775183e950459a641f268"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
                                    {!isAiLaunched ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
                                                <div className="relative bg-[#242424] p-6 rounded-3xl border border-indigo-500/30">
                                                    <Bot className="w-16 h-16 text-indigo-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI System Administrator</h2>
                                                <p className="text-gray-400 max-w-sm mt-3 leading-relaxed">Execute advanced commands and platform overrides using natural language processing.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsAiLaunched(true)}
                                                className="group relative bg-[#1a1a1a] px-8 py-4 rounded-2xl overflow-hidden border border-indigo-500/30 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/10"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="relative flex items-center gap-3 font-bold text-indigo-400 group-hover:text-white transition-colors">
                                                    <Terminal className="w-5 h-5" /> Launch AI Controller
                                                </span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-[480px] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5" style={{ background: 'linear-gradient(180deg, #0f0a1a 0%, #0a0a0f 100%)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                                            {/* Premium Header with Gradient */}
                                            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(99,102,241,0.04) 100%)', borderBottom: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f0a1a]"></div>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-white">Nova AI</span>
                                                        <p className="text-[10px] text-emerald-400 font-medium">Online • Ready</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setIsAiLaunched(false)} className="text-[11px] text-gray-500 hover:text-red-400 transition-all px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                                                    End Session
                                                </button>
                                            </div>

                                            {/* Messages Area */}
                                            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.2) transparent' }}>
                                                {chatHistory.map((msg, i) => (
                                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`} style={{ animation: `fadeSlideIn 0.3s ease-out ${i * 0.05}s both` }}>
                                                        {/* Avatar */}
                                                        <div className="flex-shrink-0 mt-1">
                                                            {msg.role === 'assistant' ? (
                                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                                                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Bubble */}
                                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user'
                                                            ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/15 border border-indigo-500/20 text-indigo-50 rounded-tr-md'
                                                            : 'bg-white/[0.03] border border-white/[0.06] text-gray-200 rounded-tl-md'
                                                            }`} style={msg.role === 'assistant' ? { backdropFilter: 'blur(12px)' } : {}}>

                                                            {/* Interactive Delete Prompt */}
                                                            {msg.text === '__DELETE_PROMPT__' ? (
                                                                <div className="space-y-4 min-w-[320px]">
                                                                    {/* Warning Header */}
                                                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                                                                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                                        <div className="text-[12px] text-red-300/90 leading-relaxed">
                                                                            <p className="font-semibold text-red-300 mb-1">⚠️ Permanent Deletion</p>
                                                                            <p>This will remove the video from <span className="text-white font-medium">all providers</span> (DoodStream, StreamTape, Telegram, Local Storage), <span className="text-white font-medium">all qualities</span>, title, description, thumbnails — <span className="text-red-300 font-medium">everything</span>.</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Input Section */}
                                                                    <div>
                                                                        <p className="text-[11px] text-gray-400 mb-2 font-medium">Type video ID or <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">/all</code> to delete all videos:</p>
                                                                        <form onSubmit={(e) => {
                                                                            e.preventDefault();
                                                                            const val = e.target.deleteInput.value;
                                                                            if (val.trim()) handleDeleteAction(val);
                                                                        }} className="flex gap-2">
                                                                            <input
                                                                                name="deleteInput"
                                                                                type="text"
                                                                                autoFocus
                                                                                defaultValue={msg.autoPasteId ? String(msg.autoPasteId) : ''}
                                                                                placeholder="e.g. 20 or 20, streamtape or 20, telegram, 480p"
                                                                                className="flex-1 bg-[#0d0b14] border border-red-500/20 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500/40 transition-all placeholder:text-gray-600"
                                                                                disabled={deleteMode === null}
                                                                            />
                                                                            <button
                                                                                type="submit"
                                                                                disabled={deleteMode === null}
                                                                                className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold hover:from-red-500 hover:to-red-600 disabled:opacity-30 transition-all active:scale-95 flex items-center gap-1.5"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                                                            </button>
                                                                        </form>
                                                                    </div>

                                                                    {/* Format Examples */}
                                                                    <div className="text-[11px] text-gray-500 space-y-1 border-t border-white/[0.04] pt-3">
                                                                        <p className="text-gray-400 font-medium mb-1.5">📝 Input Formats:</p>
                                                                        <p>• <code className="text-gray-300 bg-white/5 px-1 rounded">20</code> — Delete video #20 completely</p>
                                                                        <p>• <code className="text-gray-300 bg-white/5 px-1 rounded">20, streamtape</code> — Remove only from StreamTape</p>
                                                                        <p>• <code className="text-gray-300 bg-white/5 px-1 rounded">20, telegram, 480p</code> — Remove 480p from Telegram</p>
                                                                        <p>• <code className="text-gray-300 bg-white/5 px-1 rounded">/all</code> — ⚠️ Delete ALL videos</p>
                                                                    </div>
                                                                </div>

                                                            ) : msg.text === '__FIND_PROMPT__' ? (
                                                                /* Interactive Find/Search Prompt */
                                                                <div className="space-y-3 min-w-[320px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <Search className="w-4 h-4 text-indigo-400" />
                                                                        <p className="text-[13px] font-semibold text-indigo-300">🔍 Video Search</p>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-400">Type keywords to search by title. Partial matches and multiple keywords supported.</p>
                                                                    <form onSubmit={(e) => {
                                                                        e.preventDefault();
                                                                        const val = e.target.findInput.value;
                                                                        if (val.trim()) handleFindAction(val);
                                                                    }} className="flex gap-2">
                                                                        <input
                                                                            name="findInput"
                                                                            type="text"
                                                                            autoFocus
                                                                            placeholder="Search video title..."
                                                                            className="flex-1 bg-[#0d0b14] border border-indigo-500/20 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-gray-600"
                                                                            disabled={findMode === null}
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            disabled={findMode === null}
                                                                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 transition-all active:scale-95 flex items-center gap-1.5"
                                                                        >
                                                                            <Search className="w-3.5 h-3.5" /> Find
                                                                        </button>
                                                                    </form>
                                                                </div>

                                                            ) : msg.text === '__SEARCH_RESULTS__' && msg.searchResults ? (
                                                                /* Search Results with Clickable IDs */
                                                                <div className="space-y-3 min-w-[320px]">
                                                                    <p className="text-[13px] font-semibold text-indigo-300">🔍 Results for "{msg.searchQuery}" ({msg.searchResults.length})</p>
                                                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.2) transparent' }}>
                                                                        {msg.searchResults.map((v) => {
                                                                            const providers = v.sources.map(s => s.provider).filter((p, idx, arr) => arr.indexOf(p) === idx).join(', ');
                                                                            return (
                                                                                <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/20 transition-all group">
                                                                                    <button
                                                                                        onClick={() => handleVideoOptionsDialog(v)}
                                                                                        className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/25 flex items-center justify-center text-indigo-300 text-xs font-bold hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/40 transition-all active:scale-90 cursor-pointer"
                                                                                        title={`View options for video #${v.id}`}
                                                                                    >
                                                                                        #{v.id}
                                                                                    </button>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-[12px] text-white font-medium truncate">{v.title}</p>
                                                                                        <p className="text-[10px] text-gray-500">{v.views} views • {providers || 'no sources'} • {v.source_count} source(s)</p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleVideoIdClick(v.id)}
                                                                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
                                                                                        title="Quick delete this video"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-600 border-t border-white/[0.04] pt-2">Click a video ID to view action options</p>
                                                                </div>
                                                            ) : msg.text === '__VIDEO_OPTIONS__' && msg.videoOptionsData ? (
                                                                <div className="space-y-4 min-w-[320px]">
                                                                    <div className="border border-indigo-500/20 bg-indigo-500/5 p-3 rounded-lg">
                                                                        <p className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold mb-1">Actions for Video</p>
                                                                        <p className="text-[13px] text-white font-medium truncate">{msg.videoOptionsData.title}</p>
                                                                        <p className="text-[10px] text-gray-500 mt-0.5">ID: {msg.videoOptionsData.id} • {msg.videoOptionsData.views} views</p>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        <button
                                                                            onClick={() => handleVideoIdClick(msg.videoOptionsData.id)}
                                                                            className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-left group"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-red-300">Delete Video</p>
                                                                                <p className="text-[10px] text-red-400/70">Open the deletion prompt for this video</p>
                                                                            </div>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleSendZipFile(msg.videoOptionsData)}
                                                                            className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-left group"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                                                <Download className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-blue-300">Generate Thumbnails ZIP</p>
                                                                                <p className="text-[10px] text-blue-400/70">Fetch ZIP file containing all 10 video thumbnails</p>
                                                                            </div>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => alert("This feature is coming soon!")}
                                                                            className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-left group"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                                                <Unlock className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-emerald-300">Decode</p>
                                                                                <p className="text-[10px] text-emerald-400/70 border border-emerald-400/30 bg-emerald-500/20 px-1.5 rounded inline-block">Coming Soon</p>
                                                                                <p className="text-[9px] text-gray-500 mt-1">Provide password to decode 9 remaining thumbnails</p>
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : msg.text === '__ZIP_FILE__' && msg.zipData ? (
                                                                <div className="min-w-[280px] bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border border-indigo-500/30 rounded-xl p-4 shadow-lg">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                                                            <FileArchive className="w-5 h-5" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-white truncate max-w-[180px]">video_{msg.zipData.id}_thumbnails.zip</p>
                                                                            <p className="text-[10px] text-indigo-300/80">ZIP Archive • 10 Images</p>
                                                                        </div>
                                                                    </div>
                                                                    <a
                                                                        href={`${API_URL}/thumbnails/download-all/${msg.zipData.id}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" />
                                                                        Download ZIP File
                                                                    </a>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                                    {msg.time && <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-400/50 text-right' : 'text-gray-600'}`}>{msg.time}</p>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Typing Indicator */}
                                                {isTyping && (
                                                    <div className="flex gap-3 items-start">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                                        </div>
                                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-md px-5 py-3.5 flex items-center gap-1.5" style={{ backdropFilter: 'blur(12px)' }}>
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400/60" style={{ animation: 'typingBounce 1.4s infinite ease-in-out' }}></div>
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400/60" style={{ animation: 'typingBounce 1.4s infinite ease-in-out 0.2s' }}></div>
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400/60" style={{ animation: 'typingBounce 1.4s infinite ease-in-out 0.4s' }}></div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>

                                            {/* Quick Actions */}
                                            {chatHistory.length <= 1 && !isTyping && (
                                                <div className="px-5 pb-2 flex flex-wrap gap-2">
                                                    {['/help', '/storage', '/analytics', '/disk', '/videos'].map(cmd => (
                                                        <button key={cmd} onClick={() => { setCommand(cmd); }} className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all">
                                                            {cmd}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Input Area */}
                                            <form onSubmit={handleSendCommand} className="p-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.08)', background: 'rgba(10, 10, 15, 0.6)' }}>
                                                <div className="relative group">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                                                    <div className="relative flex items-center bg-[#0d0b14] rounded-xl border border-white/[0.06] focus-within:border-indigo-500/30 transition-all">
                                                        <input
                                                            type="text"
                                                            value={command}
                                                            onChange={(e) => setCommand(e.target.value)}
                                                            placeholder="Type a command or ask anything..."
                                                            className="flex-1 bg-transparent py-3.5 px-4 text-sm text-white focus:outline-none placeholder:text-gray-600"
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={!command.trim() || isTyping}
                                                            className="mr-2 p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-90"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>

                                            {/* Inline Keyframe Styles */}
                                            <style>{`
                                                @keyframes typingBounce {
                                                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                                                    30% { transform: translateY(-6px); opacity: 1; }
                                                }
                                                @keyframes fadeSlideIn {
                                                    from { opacity: 0; transform: translateY(8px); }
                                                    to { opacity: 1; transform: translateY(0); }
                                                }
                                            `}</style>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div>
                                        <h2 className="text-xl font-semibold">Security Settings</h2>
                                        <p className="text-sm text-gray-400 mt-1">Manage admin access and safety protocols.</p>
                                    </div>
                                    <div className="bg-[#242424] p-8 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                        <Shield className="w-10 h-10 text-gray-600" />
                                        <p className="text-gray-400">Security management module is being prepared.</p>
                                        <p className="text-xs text-gray-600 italic">Coming soon</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer for Save */}
                        {activeTab !== 'ai' && (
                            <div className="bg-[#141414] border-t border-gray-800 p-6 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-red-900/20 transition-all active:scale-95"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
