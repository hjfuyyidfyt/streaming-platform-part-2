import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import { api } from '../services/api.js';
import {
    Upload,
    Video,
    Plus,
    Trash2,
    Eye,
    Clock,
    ArrowLeft,
    X,
    Check
} from 'lucide-react';

const YourVideos = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [categories, setCategories] = useState([]);

    // Upload form state
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category_slug: 'entertainment'
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMetrics, setUploadMetrics] = useState({
        speed: 0,
        uploaded: 0,
        total: 0
    });
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, navigate]);

    // Fetch categories (no auth needed)
    useEffect(() => {
        api.getCategories()
            .then(data => setCategories(data))
            .catch(err => console.error('Failed to load categories:', err));
    }, []);

    // Fetch user's videos (needs auth)
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                setIsLoading(true);
                const videosData = await api.getMyVideos();
                setVideos(videosData);
            } catch (err) {
                console.error('Failed to fetch videos:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            setUploadError('');
        } else {
            setUploadError('Please select a valid video file');
        }
    };

    const handleThumbnailSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setThumbnailFile(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!videoFile) {
            setUploadError('Please select a video file');
            return;
        }

        if (!uploadData.title.trim()) {
            setUploadError('Please enter a title');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', videoFile);
            formData.append('title', uploadData.title);
            formData.append('description', uploadData.description || '');
            const selectedCategory = categories.find(c => c.slug === uploadData.category_slug);
            const categoryId = selectedCategory?.id || categories[0]?.id || 1;
            formData.append('category_id', categoryId);

            if (thumbnailFile) {
                formData.append('thumbnail', thumbnailFile);
            }

            let lastLoaded = 0;
            let lastTime = Date.now();

            await api.uploadVideo(formData, (progressInfo) => {
                const currentTime = Date.now();
                const timeDiff = (currentTime - lastTime) / 1000;

                // Debug log to see real progress events
                console.log('Upload Event:', progressInfo);

                // Update metrics if it's the first update, or 200ms passed, or it's 100%
                if (lastLoaded === 0 || timeDiff > 0.2 || progressInfo.percent === 100) {
                    const bytesDiff = progressInfo.loaded - lastLoaded;
                    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

                    const newMetrics = {
                        speed: speed,
                        uploaded: progressInfo.loaded,
                        total: progressInfo.total || videoFile.size
                    };

                    console.log('Setting Metrics:', newMetrics);
                    setUploadMetrics(newMetrics);

                    lastLoaded = progressInfo.loaded;
                    lastTime = currentTime;
                }

                setUploadProgress(progressInfo.percent);
            });
            setUploadProgress(100);
            setUploadSuccess(true);

            // Refresh videos list (don't let this override the success message)
            try {
                const updatedVideos = await api.getMyVideos();
                setVideos(updatedVideos);
            } catch (refreshErr) {
                console.warn('Video list refresh failed after upload (upload was successful):', refreshErr);
                // Don't overwrite the success — just silently fail the refresh
            }

            // Reset form after short delay
            setTimeout(() => {
                setShowUploadForm(false);
                setUploadData({ title: '', description: '', category_slug: 'entertainment' });
                setVideoFile(null);
                setThumbnailFile(null);
                setUploadProgress(0);
                setUploadSuccess(false);
            }, 2000);

        } catch (err) {
            console.error('Upload failed:', err);
            let errMsg = 'Upload failed. Please try again.';
            if (err.response && err.response.data && err.response.data.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    errMsg = detail.map(d => `${d.loc[1]}: ${d.msg} `).join(', ');
                } else if (typeof detail === 'object') {
                    errMsg = JSON.stringify(detail);
                } else {
                    errMsg = detail;
                }
            } else if (err.message) {
                errMsg = err.message;
            }

            // If auth error, prompt re-login
            if (err.response?.status === 401 || errMsg.includes('Not authenticated')) {
                errMsg = 'Session expired. Please log out and log in again, then retry.';
            }
            setUploadError(errMsg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            await api.deleteVideo(videoId);
            setVideos(videos.filter(v => v.id !== videoId));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete video');
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#0f0f0f] border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-white/10 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold">Your Videos</h1>
                    </div>

                    <button
                        onClick={() => setShowUploadForm(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Upload Video
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <Video className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{videos.length}</p>
                                <p className="text-sm text-gray-400">Total Videos</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <Eye className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {videos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-400">Total Views</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {Math.floor(videos.reduce((sum, v) => sum + (v.duration || 0), 0) / 60)}min
                                </p>
                                <p className="text-sm text-gray-400">Total Duration</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Videos Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-16">
                        <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-400 mb-2">No videos yet</h3>
                        <p className="text-gray-500 mb-6">Upload your first video to get started!</p>
                        <button
                            onClick={() => setShowUploadForm(true)}
                            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Upload Your First Video
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {videos.map(video => (
                            <div key={video.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 flex gap-4">
                                <Link to={`/ video / ${video.id} `} className="flex-shrink-0">
                                    <img
                                        src={video.thumbnail_url || '/placeholder.jpg'}
                                        alt={video.title}
                                        className="w-48 h-28 object-cover rounded-lg"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/ video / ${video.id} `}>
                                        <h3 className="font-medium text-lg hover:text-blue-400 transition-colors line-clamp-2">
                                            {video.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{video.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {video.views?.toLocaleString() || 0} views
                                        </span>
                                        <span>{video.original_resolution || 'Processing'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDeleteVideo(video.id)}
                                        className="p-2 hover:bg-red-600/20 rounded-lg text-red-500 transition-colors"
                                        title="Delete video"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Upload Video</h2>
                            <button
                                onClick={() => !isUploading && setShowUploadForm(false)}
                                className="p-2 hover:bg-white/10 rounded-full"
                                disabled={isUploading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-6 space-y-6">
                            {/* Video File */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Video File *</label>
                                {!videoFile ? (
                                    <label className="block border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-red-600 transition-colors">
                                        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                        <p className="text-gray-400">Click to select video</p>
                                        <p className="text-sm text-gray-600 mt-1">MP4, WebM, MKV up to 2GB</p>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoSelect}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-3 bg-[#0f0f0f] rounded-lg p-4">
                                        <Video className="w-8 h-8 text-green-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{videoFile.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVideoFile(null)}
                                            className="p-2 hover:bg-white/10 rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                                    placeholder="Enter video title"
                                    maxLength={100}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600 min-h-24"
                                    placeholder="Describe your video"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    value={uploadData.category_slug}
                                    onChange={(e) => setUploadData({ ...uploadData, category_slug: e.target.value })}
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Thumbnail */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Thumbnail (Optional)</label>
                                <label className="block border border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-red-600 transition-colors">
                                    {thumbnailFile ? (
                                        <p className="text-green-500">✓ {thumbnailFile.name}</p>
                                    ) : (
                                        <p className="text-gray-400">Click to select thumbnail image</p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailSelect}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Error */}
                            {uploadError && (
                                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
                                    {uploadError}
                                </div>
                            )}

                            {/* Progress */}
                            {isUploading && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-white">Uploading Video...</span>
                                        <span className="font-bold text-red-500">{uploadProgress}%</span>
                                    </div>

                                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-600 transition-all duration-300 relative"
                                            style={{ width: `${uploadProgress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                                        <div className="bg-black/40 p-3 rounded-xl border border-gray-800/50">
                                            <p className="uppercase tracking-widest text-[10px] text-gray-500 mb-1">Upload Speed</p>
                                            <p className="font-mono text-white text-base">
                                                {uploadMetrics.speed > 1024 * 1024
                                                    ? `${(uploadMetrics.speed / (1024 * 1024)).toFixed(2)} MB/s`
                                                    : `${(uploadMetrics.speed / 1024).toFixed(2)} KB/s`}
                                            </p>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-xl border border-gray-800/50">
                                            <p className="uppercase tracking-widest text-[10px] text-gray-500 mb-1">Progress</p>
                                            <p className="font-mono text-white text-base">
                                                {(uploadMetrics.uploaded / (1024 * 1024)).toFixed(1)} / {(uploadMetrics.total / (1024 * 1024)).toFixed(1)} MB
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] text-center text-gray-500 italic">
                                        Keep this window open until upload is complete
                                    </p>
                                </div>
                            )}

                            {/* Success */}
                            {uploadSuccess && (
                                <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 text-green-400 flex items-center gap-2">
                                    <Check className="w-5 h-5" />
                                    Video uploaded successfully! Processing will continue in background.
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isUploading || uploadSuccess}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition-colors"
                            >
                                {isUploading ? 'Uploading...' : 'Upload Video'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YourVideos;
