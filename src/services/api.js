import axios from 'axios';
let rawUrl = (window.env && window.env.VITE_API_BASE_URL) || import.meta.env.VITE_API_BASE_URL;

if (!rawUrl || rawUrl.trim() === '' || rawUrl === 'undefined' || rawUrl === '/') {
    // Default to known production backend if deployed, else localhost
    rawUrl = window.location.hostname.includes('railway') 
        ? 'https://vplayer1.up.railway.app' 
        : 'http://localhost:8000';
}

rawUrl = rawUrl.trim();
// Force absolute URL protocol if user just typed the domain (e.g. "vplayer1.up.railway.app")
if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = 'https://' + rawUrl;
}
// Remove trailing slash to prevent double-slash in endpoints
rawUrl = rawUrl.replace(/\/$/, '');

console.log("[vPlyer Backend Connection] Connecting to:", rawUrl);
export const API_URL = rawUrl;

// Helper to get auth headers
const getAuthHeaders = (token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export const api = {
    get: async (endpoint, token = null) => {
        try {
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (Neon DB cold-start can take 15-30s)
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || 'Request failed');
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out — server may be unavailable');
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    post: async (endpoint, body, isFormData = false, token = null) => {
        try {
            const headers = isFormData
                ? (token ? { 'Authorization': `Bearer ${token}` } : {})
                : getAuthHeaders(token);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: isFormData ? body : JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Request failed');
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out — server may be unavailable');
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    // ========== AUTH ==========
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Login failed');
        }
        return await response.json();
    },

    register: async (username, email, password, displayName) => {
        return api.post('/auth/register', { username, email, password, display_name: displayName });
    },

    getMe: async (token) => api.get('/auth/me', token),

    // ========== VIDEOS ==========
    getVideos: (skip = 0, limit = 20) => api.get(`/videos/?skip=${skip}&limit=${limit}`),
    searchVideos: (query, skip = 0, limit = 20) => api.get(`/videos/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`),
    getVideosByCategory: (slug, skip = 0, limit = 20) => api.get(`/videos/category/${slug}?skip=${skip}&limit=${limit}`),
    getVideo: (id) => api.get(`/videos/${id}`),
    getShorts: (skip = 0, limit = 20) => api.get(`/videos/shorts?skip=${skip}&limit=${limit}`),

    // Categories
    getCategories: () => api.get(`/videos/categories/all`),
    createCategory: (data) => api.post('/categories/', data),
    deleteCategory: (id) => fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' }).then(r => r.json()),


    // Stream
    getStreamUrl: (videoId, resolution = null, provider = null) => {
        const base = `${API_URL}/stream/${videoId}`;
        const params = [];
        if (resolution) params.push(`resolution=${resolution}`);
        if (provider) params.push(`provider=${provider}`);
        return params.length ? `${base}?${params.join('&')}` : base;
    },
    getVideoResolutions: (videoId) => api.get(`/stream/${videoId}/resolutions`),
    recordView: (videoId) => api.post(`/videos/${videoId}/view`, {}),

    // Analytics
    getAnalyticsSummary: () => api.get('/analytics/summary'),
    getPopularVideos: () => api.get('/analytics/popular'),

    // ========== COMMENTS ==========
    getComments: (videoId, skip = 0, limit = 50) =>
        api.get(`/comments/video/${videoId}?skip=${skip}&limit=${limit}`),

    addComment: (videoId, content, parentId = null, superChat = null, token) => {
        const body = { video_id: videoId, content, parent_id: parentId };
        if (superChat) {
            body.is_super_chat = true;
            body.super_chat_amount = superChat.amount;
            body.super_chat_color = superChat.color;
        }
        return api.post('/comments/', body, false, token);
    },

    likeComment: (commentId, token) => api.post(`/comments/${commentId}/like`, {}, false, token),

    deleteComment: async (commentId, token) => {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    // ========== LIKES ==========
    likeVideo: (videoId, isLike = true, token) =>
        api.post(`/likes/video/${videoId}?is_like=${isLike}`, {}, false, token),

    getLikeStatus: (videoId, token = null) =>
        api.get(`/likes/video/${videoId}/status`, token),

    getLikedVideos: (token) => api.get('/likes/user/liked', token),

    // ========== HISTORY ==========
    saveProgress: (videoId, progressSeconds, completed = false, token) =>
        api.post('/history/', { video_id: videoId, progress_seconds: progressSeconds, completed }, false, token),

    getHistory: (token) => api.get('/history/', token),
    getContinueWatching: (token) => api.get('/history/continue', token),
    getVideoProgress: (videoId, token) => api.get(`/history/video/${videoId}`, token),
    clearHistory: async (token) => {
        const response = await fetch(`${API_URL}/history/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    // ========== SUBSCRIPTIONS ==========
    toggleSubscribe: (channelId, token) => api.post(`/subscriptions/channel/${channelId}`, {}, false, token),
    async updateSubscription(channelId) {
        const response = await api.post(`/subscriptions/channel/${channelId}`);
        return response.data;
    },
    getSubscriptionStatus: (channelId, token) => api.get(`/subscriptions/channel/${channelId}/status`, token),
    getSubscriberCount: (channelId) => api.get(`/subscriptions/channel/${channelId}/count`),
    getSubscriptionFeed: (token, skip = 0, limit = 20) => api.get(`/subscriptions/feed?skip=${skip}&limit=${limit}`, token),

    // ========== PLAYLISTS ==========
    getPlaylists: (token) => api.get('/playlists/', token),
    getPlaylist: (id, token = null) => api.get(`/playlists/${id}`, token),
    createPlaylist: (name, description, isPublic, token) =>
        api.post('/playlists/', { name, description, is_public: isPublic }, false, token),

    addToPlaylist: (playlistId, videoId, token) =>
        api.post(`/playlists/${playlistId}/add`, { video_id: videoId }, false, token),

    removeFromPlaylist: async (playlistId, videoId, token) => {
        const response = await fetch(`${API_URL}/playlists/${playlistId}/remove/${videoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    // Watch Later shortcuts
    getWatchLater: (token) => api.get('/playlists/watch-later/videos', token),
    toggleWatchLater: (videoId, token) => api.post(`/playlists/watch-later/add/${videoId}`, {}, false, token),

    // ========== USER VIDEOS ==========
    getMyVideos: async () => {
        const token = localStorage.getItem('token');
        return api.get('/upload/my-videos', token);
    },

    getUserVideos: (userId) => api.get(`/upload/user/${userId}/videos`),

    uploadVideo: async (formData, onProgress = null) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/upload/video`, formData, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const total = progressEvent.total || 0;
                    const loaded = progressEvent.loaded || 0;
                    const percentCompleted = total > 0 ? Math.round((loaded * 100) / total) : 0;

                    onProgress({
                        loaded: loaded,
                        total: total,
                        percent: percentCompleted
                    });
                }
            }
        });
        return response.data;
    },

    uploadViaUrl: async (formData) => {
        const token = localStorage.getItem('token');
        return api.post('/upload/url', formData, true, token);
    },

    uploadViaEmbed: async (formData) => {
        const token = localStorage.getItem('token');
        return api.post('/upload/embed', formData, true, token);
    },

    uploadRemoteTelegram: async (formData) => {
        const token = localStorage.getItem('token');
        return api.post('/upload/remote', formData, true, token);
    },

    uploadCloudLink: async (formData) => {
        const token = localStorage.getItem('token');
        return api.post('/upload/cloud-link', formData, true, token);
    },

    generateThumbnailFromUrl: async (videoUrl) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('url', videoUrl);
        const response = await fetch(`${API_URL}/upload/generate-thumbnail`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Thumbnail generation failed');
        }
        // Read title and duration from custom headers
        const rawTitle = response.headers.get('X-Video-Title');
        const title = rawTitle ? decodeURIComponent(rawTitle) : '';
        const duration = parseInt(response.headers.get('X-Video-Duration') || '0', 10);
        // Return thumbnail as File + extracted metadata
        const blob = await response.blob();
        const file = new File([blob], 'auto_thumbnail.jpg', { type: 'image/jpeg' });
        return { file, title, duration };
    },

    deleteVideo: async (videoId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/upload/video/${videoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Delete failed');
        }
        return response.json();
    },

    // ========== ADMIN STORAGE ==========
    getStorageStats: (token) => api.get('/admin/storage', token),
    cleanupStorage: (target, token) => fetch(`${API_URL}/admin/storage/cleanup?target=${target}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),

    // ========== ADMIN SETTINGS ==========
    getSystemSettings: (token) => api.get('/admin/settings', token),
    updateSystemSettings: (settings, token) => api.post('/admin/settings', settings, false, token),
    getAdSettings: () => api.get('/admin/ad-settings'),

    // ========== ADMIN VIDEO MANAGEMENT ==========
    adminListVideos: (token, skip = 0, limit = 20) => api.get(`/admin/videos?skip=${skip}&limit=${limit}`, token),
    adminDeleteVideo: async (videoId, token, provider = null, quality = null) => {
        let url = `${API_URL}/admin/video/${videoId}`;
        const params = [];
        if (provider) params.push(`provider=${provider}`);
        if (quality) params.push(`quality=${quality}`);
        if (params.length) url += '?' + params.join('&');
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Delete failed');
        }
        return response.json();
    },
    adminDeleteAllVideos: async (token) => {
        const response = await fetch(`${API_URL}/admin/videos/all`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Delete all failed');
        }
        return response.json();
    },
    adminSearchVideos: (query, token, skip = 0, limit = 20) => api.get(`/admin/videos/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`, token),
};
