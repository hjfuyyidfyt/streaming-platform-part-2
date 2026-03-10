import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Upload, X, Check, FileVideo, AlertCircle, Image as ImageIcon, Link as LinkIcon, Code, CloudDownload, HardDrive, Zap } from 'lucide-react';

const UploadVideo = () => {
    const { user } = useAuth();

    // Upload Modes: 'local', 'url', 'embed', 'remote', 'cloud'
    const [uploadMode, setUploadMode] = useState('local');

    // States for Local Upload
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploadMetrics, setUploadMetrics] = useState({ speed: 0, uploaded: 0, total: 0 });

    // States for alternative uploads
    const [videoUrl, setVideoUrl] = useState('');
    const [embedCode, setEmbedCode] = useState('');
    const [extractedDuration, setExtractedDuration] = useState(0);

    // Shared States
    const [thumbnail, setThumbnail] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [categories, setCategories] = useState([]);
    const [providers, setProviders] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '', // will be ID
        storage_mode: 'multi',
        is_short: false
    });

    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);

    React.useEffect(() => {
        const fetchCats = async () => {
            try {
                const cats = await api.getCategories();
                setCategories(cats || []);
                if (cats && cats.length > 0) {
                    setFormData(prev => ({ ...prev, category: cats[0].id }));
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        fetchCats();
    }, []);

    // Fetch System Settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await api.getSystemSettings();
                if (settings) {
                    const activeProvs = Object.entries(settings.storage_providers)
                        .map(([key, val]) => ({ id: key, name: val.name, enabled: val.enabled }))
                        .filter(p => p.enabled);
                    setProviders(activeProvs);
                    setFormData(prev => ({ ...prev, storage_mode: settings.default_storage }));
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        fetchSettings();
    }, []);

    // Auto-Thumbnail + Auto-Title for Embed (YouTube)
    React.useEffect(() => {
        if (uploadMode === 'embed' && embedCode && !thumbnail) {
            // YouTube video IDs are always exactly 11 characters: letters, digits, hyphens, underscores
            const ytEmbedRegex = /youtube\.com\/embed\/([\w-]{11})/;
            const match = embedCode.match(ytEmbedRegex);
            const ytShortRegex = /youtu\.be\/([\w-]{11})/;
            const shortMatch = embedCode.match(ytShortRegex);

            const videoId = match?.[1] || shortMatch?.[1];

            if (videoId) {
                // Instant thumbnail from YouTube
                const ytThumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                console.log('YouTube thumbnail URL:', ytThumbUrl);
                setThumbnail(ytThumbUrl);

                // Also fetch title + duration from backend via yt-dlp (async)
                if (!formData.title) {
                    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    api.generateThumbnailFromUrl(ytUrl).then(result => {
                        if (result.title && !formData.title) {
                            console.log('Embed auto-title extracted:', result.title);
                            setFormData(prev => ({ ...prev, title: result.title }));
                        }
                        if (result.duration > 0) {
                            console.log('Embed auto-duration extracted:', result.duration, 'seconds');
                            setExtractedDuration(result.duration);
                        }
                    }).catch(err => {
                        console.warn('Embed title extraction failed:', err.message);
                    });
                }
            }
        }
    }, [embedCode, uploadMode, thumbnail]);

    // Auto-Thumbnail for URL Only and Remote Fetch (via backend FFmpeg)
    const [thumbnailLoading, setThumbnailLoading] = React.useState(false);

    React.useEffect(() => {
        if ((uploadMode === 'url' || uploadMode === 'remote' || uploadMode === 'cloud') && videoUrl && !thumbnail) {
            // Validate it looks like a real URL before calling backend
            if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) return;

            // Debounce: wait 1.5s after user stops typing
            const timeoutId = setTimeout(async () => {
                setThumbnailLoading(true);
                try {
                    const result = await api.generateThumbnailFromUrl(videoUrl);
                    if (result.file) {
                        console.log('Auto-thumbnail generated:', result.file);
                        setThumbnail(result.file);
                    }
                    // Auto-fill title if user hasn't typed one yet
                    if (result.title && !formData.title) {
                        console.log('Auto-title extracted:', result.title);
                        setFormData(prev => ({ ...prev, title: result.title }));
                    }
                    // Store extracted duration
                    if (result.duration > 0) {
                        console.log('Auto-duration extracted:', result.duration, 'seconds');
                        setExtractedDuration(result.duration);
                    }
                } catch (err) {
                    console.warn('Auto-thumbnail failed (backend):', err.message);
                    // Silently fail - user can still manually select a thumbnail
                } finally {
                    setThumbnailLoading(false);
                }
            }, 1500);

            return () => clearTimeout(timeoutId);
        }
    }, [videoUrl, uploadMode, thumbnail]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile.type.startsWith('video/')) {
            alert('Please upload a video file');
            return;
        }
        // Check size (e.g. 2GB max)
        if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
            alert('File size exceeds 2GB limit');
            return;
        }
        setFile(selectedFile);
        // Auto-fill title if empty
        if (!formData.title) {
            setFormData(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "") }));
        }
    };

    const handleThumbnailChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            setThumbnail(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mode specific validation
        if (uploadMode === 'local' && !file) return alert("Please select a local video file.");
        if (uploadMode === 'url' && !videoUrl) return alert("Please enter a direct video URL.");
        if (uploadMode === 'embed' && !embedCode) return alert("Please enter the embed iframe code.");
        if (uploadMode === 'remote' && !videoUrl) return alert("Please enter a remote download URL.");
        if (uploadMode === 'cloud' && !videoUrl) return alert("Please enter a cloud link URL.");

        setUploading(true);
        setProgress(10); // Start progress

        try {
            if (uploadMode === 'local') {
                const data = new FormData();
                data.append('file', file);
                data.append('title', formData.title);
                data.append('description', formData.description);
                data.append('category_id', formData.category);
                data.append('is_short', formData.is_short);
                if (thumbnail) {
                    data.append('thumbnail', thumbnail);
                }

                let lastLoaded = 0;
                let lastTime = Date.now();

                await api.uploadVideo(data, (progressInfo) => {
                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastTime) / 1000;
                    if (lastLoaded === 0 || timeDiff > 0.2 || progressInfo.percent === 100) {
                        const bytesDiff = progressInfo.loaded - lastLoaded;
                        const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
                        setUploadMetrics({
                            speed: speed,
                            uploaded: progressInfo.loaded,
                            total: progressInfo.total || file.size
                        });
                        lastLoaded = progressInfo.loaded;
                        lastTime = currentTime;
                    }
                    setProgress(progressInfo.percent);
                });
            } else {
                // For URL, Embed, and Remote modes (FormData payloads APIs)
                const data = new FormData();
                data.append('title', formData.title || 'Untitled Video');
                if (formData.description) data.append('description', formData.description);
                data.append('category_id', formData.category);
                data.append('is_short', formData.is_short);
                if (extractedDuration > 0) {
                    data.append('duration', extractedDuration);
                }
                if (thumbnail) {
                    if (typeof thumbnail === 'string') {
                        data.append('thumbnail_url', thumbnail); // It's a URL
                    } else {
                        data.append('thumbnail', thumbnail); // It's a File
                    }
                }

                setProgress(50); // Simulate API call wait

                if (uploadMode === 'url') {
                    data.append('url', videoUrl);
                    await api.uploadViaUrl(data);
                } else if (uploadMode === 'embed') {
                    data.append('embed_code', embedCode);
                    await api.uploadViaEmbed(data);
                } else if (uploadMode === 'remote') {
                    data.append('url', videoUrl);
                    await api.uploadRemoteTelegram(data);
                } else if (uploadMode === 'cloud') {
                    data.append('url', videoUrl);
                    await api.uploadCloudLink(data);
                }
            }

            setProgress(100);

            // Success Feedback
            const successMessages = {
                'local': 'Local Video Uploaded Successfully!',
                'url': 'Direct Link Saved Successfully!',
                'embed': 'Embed Code Processed Successfully!',
                'remote': 'Remote Download Task Queued Successfully!',
                'cloud': 'Cloud Link Transfer Started (Zero Resource)!'
            };
            alert(successMessages[uploadMode]);

            // Reset Form Complete
            setFile(null);
            setVideoUrl('');
            setEmbedCode('');
            setThumbnail(null);
            setFormData({ title: '', description: '', category: categories[0]?.id || '', is_short: false });

        } catch (error) {
            console.error("Upload failed", error);
            alert(`Upload Failed: ${error.message}`);
        } finally {
            setUploading(false);
            setProgress(0);
            setUploadMetrics({ speed: 0, uploaded: 0, total: 0 });
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <h2 className="text-3xl font-bold mb-2 text-white">Publish Content</h2>
            <p className="text-gray-400 mb-8 border-b border-gray-800 pb-4">Select your preferred method to add videos to your streaming platform.</p>

            {/* Upload Method Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={() => setUploadMode('local')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${uploadMode === 'local' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <HardDrive className="w-5 h-5" />
                    Local Upload
                </button>
                <button
                    onClick={() => setUploadMode('url')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${uploadMode === 'url' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <LinkIcon className="w-5 h-5" />
                    URL Only
                </button>
                <button
                    onClick={() => setUploadMode('embed')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${uploadMode === 'embed' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <Code className="w-5 h-5" />
                    Embed Code
                </button>
                <button
                    onClick={() => setUploadMode('remote')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${uploadMode === 'remote' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <CloudDownload className="w-5 h-5" />
                    Remote Fetch (Telegram)
                </button>
                <button
                    onClick={() => setUploadMode('cloud')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${uploadMode === 'cloud' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-gray-800'}`}
                >
                    <Zap className="w-5 h-5" />
                    Cloud Link (No PC Resource)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Interfaces */}
                <div className="lg:col-span-2 space-y-6">

                    {/* -- MODE: LOCAL -- */}
                    {uploadMode === 'local' && (
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-gray-500 bg-[#242424]'
                                } ${file ? 'border-green-500/50' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {!file ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                    <div className="bg-gray-800 p-4 rounded-full shadow-inner">
                                        <Upload className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-medium text-white">Drag & drop your video here</p>
                                        <p className="text-gray-500 text-sm mt-1">MP4, WebM, or HLS supported</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="bg-[#121212] hover:bg-red-600 text-white border border-gray-700 hover:border-red-500 px-6 py-2.5 rounded-lg font-medium transition-all"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gray-800/80 p-5 rounded-xl border border-gray-700">
                                    <div className="flex items-center space-x-5">
                                        <div className="bg-red-900/40 p-3 rounded-lg">
                                            <FileVideo className="w-8 h-8 text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-white text-lg truncate max-w-[250px]">{file.name}</div>
                                            <div className="text-gray-400 text-sm mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                                        </div>
                                    </div>
                                    <button onClick={removeFile} className="bg-gray-900 p-2 hover:bg-red-600 hover:text-white rounded-full transition-colors text-gray-500 group">
                                        <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                    </button>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleChange} />
                        </div>
                    )}

                    {/* -- MODE: URL -- */}
                    {uploadMode === 'url' && (
                        <div className="bg-[#242424] border border-blue-900/30 rounded-xl p-8 shadow-inner shadow-blue-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-600/20 p-2 rounded-lg"><LinkIcon className="text-blue-500 w-6 h-6" /></div>
                                <h3 className="text-xl font-medium text-white">Direct URL Link</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Enter a direct link to a video file (.mp4, .m3u8). The video will stream directly from this URL without eating up your server bandwidth.</p>
                            <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://example.com/video.mp4"
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                            />
                        </div>
                    )}

                    {/* -- MODE: EMBED -- */}
                    {uploadMode === 'embed' && (
                        <div className="bg-[#242424] border border-amber-900/30 rounded-xl p-8 shadow-inner shadow-amber-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-amber-600/20 p-2 rounded-lg"><Code className="text-amber-500 w-6 h-6" /></div>
                                <h3 className="text-xl font-medium text-white">Iframe Embed Code</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Paste an iframe snippet from YouTube, Doodstream, Streamtape, or any supported provider. It will render perfectly inside your custom player wrapper.</p>
                            <textarea
                                value={embedCode}
                                onChange={(e) => setEmbedCode(e.target.value)}
                                placeholder='<iframe src="https://..." width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono text-sm h-32 resize-none"
                            />
                        </div>
                    )}

                    {/* -- MODE: REMOTE -- */}
                    {uploadMode === 'remote' && (
                        <div className="bg-[#242424] border border-purple-900/30 rounded-xl p-8 shadow-inner shadow-purple-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-purple-600/20 p-2 rounded-lg"><CloudDownload className="text-purple-500 w-6 h-6" /></div>
                                <h3 className="text-xl font-medium text-white">Remote Auto-Fetch</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Enter a download link. The backend will securely download the video on the server-side, upload it dynamically to your configured providers (Telegram natively), and free up server space invisibly.</p>
                            <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://example.com/download/movie.mp4"
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-lg"
                            />

                            <div className="mt-4 flex items-start gap-2 bg-purple-900/10 p-3 rounded-lg border border-purple-800/30">
                                <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-purple-300">This action runs in the background. High-resolution files might take a few minutes to appear on the frontend depending on your primary Telegram Bot API speed.</p>
                            </div>
                        </div>
                    )}

                    {/* -- MODE: CLOUD -- */}
                    {uploadMode === 'cloud' && (
                        <div className="bg-[#242424] border border-cyan-900/30 rounded-xl p-8 shadow-inner shadow-cyan-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-cyan-600/20 p-2 rounded-lg"><Zap className="text-cyan-500 w-6 h-6" /></div>
                                <h3 className="text-xl font-medium text-white">Cloud Link (Zero Resource)</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Enter a download link or platform URL (YouTube, etc.). The <b>Cloud Server</b> will directly transfer the video to StreamTape and DoodStream. Your PC bandwidth and disk will not be used at all.</p>
                            <input
                                type="url"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-lg"
                            />

                            <div className="mt-4 flex items-start gap-2 bg-cyan-900/10 p-3 rounded-lg border border-cyan-800/30">
                                <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-cyan-300">Note: Telegram upload is NOT supported in this mode to preserve resources. Video will be available on StreamTape/DoodStream servers.</p>
                            </div>
                        </div>
                    )}

                    {/* Meta Data Form - Always Visible */}
                    <div className="bg-[#242424] p-6 rounded-xl border border-gray-800 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Video Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                placeholder="Enter a catchy title"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                                    className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500 appearance-none"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3 bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 mt-7 cursor-pointer hover:border-red-600 transition-colors" onClick={() => setFormData({ ...formData, is_short: !formData.is_short })}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_short}
                                    onChange={(e) => setFormData({ ...formData, is_short: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-red-600 cursor-pointer"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">Flag as Short clip</p>
                                    <p className="text-[11px] text-gray-500 leading-tight">Vertical formats (9:16)</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500 h-28 resize-none"
                                placeholder="Describe your video..."
                            />
                        </div>

                        {(uploadMode === 'local' || uploadMode === 'remote' || uploadMode === 'cloud') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Processing Destinations</label>
                                <div className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-3 flex gap-2 flex-wrap">
                                    {providers.length > 0 ? (
                                        providers.map(p => (
                                            <span key={p.id} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-xs font-medium border border-gray-700">
                                                {p.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-xs italic">Default fallback (Telegram)</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Thumbnail & Actions */}
                <div className="space-y-6">
                    <div className="bg-[#242424] p-6 rounded-xl border border-gray-800">
                        <label className="block text-sm font-medium text-gray-400 mb-4">Custom Thumbnail</label>
                        <div
                            onClick={() => thumbnailInputRef.current.click()}
                            className="aspect-video bg-[#121212] border-2 border-gray-700 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors relative overflow-hidden group"
                        >
                            {thumbnail ? (
                                <>
                                    <img
                                        src={typeof thumbnail === 'string' ? thumbnail : URL.createObjectURL(thumbnail)}
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={() => {
                                            console.warn('Thumbnail image failed to load, clearing...');
                                            setThumbnail(null);
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-medium flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Change Cover</p>
                                    </div>
                                </>
                            ) : thumbnailLoading ? (
                                <div className="text-center">
                                    <div className="w-10 h-10 border-3 border-gray-600 border-t-red-500 rounded-full animate-spin mb-3 mx-auto"></div>
                                    <span className="text-sm font-medium text-gray-300 block mb-1">Generating Thumbnail...</span>
                                    <span className="text-xs text-gray-500">Extracting frame via FFmpeg</span>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-10 h-10 text-gray-600 mb-3 mx-auto" />
                                    <span className="text-sm font-medium text-gray-400 block mb-1">Select Custom Image</span>
                                    <span className="text-xs text-gray-600">1280x720 Recommended</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbnailChange}
                        />
                        {uploadMode !== 'local' && (
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                {uploadMode === 'embed'
                                    ? 'YouTube embeds get auto-thumbnails. Others: select manually.'
                                    : 'Auto-thumbnail via FFmpeg. You can also select manually.'}
                            </p>
                        )}
                    </div>

                    {uploading && (
                        <div className="bg-[#242424] p-6 rounded-xl border border-gray-800 shadow-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-white flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    Processing Action...
                                </span>
                                {uploadMode === 'local' && <span className="text-sm font-bold text-red-500">{progress}%</span>}
                            </div>

                            <div className="w-full bg-gray-800 rounded-full h-2 mb-5 overflow-hidden">
                                <div
                                    className="bg-red-600 h-full rounded-full transition-all duration-300 relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>

                            {uploadMode === 'local' && (
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800">
                                        <p className="text-gray-500 mb-1">Transfer Rate</p>
                                        <p className="font-mono font-medium text-gray-200">
                                            {uploadMetrics.speed > 1024 * 1024
                                                ? `${(uploadMetrics.speed / (1024 * 1024)).toFixed(2)} MB/s`
                                                : `${(uploadMetrics.speed / 1024).toFixed(2)} KB/s`}
                                        </p>
                                    </div>
                                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800">
                                        <p className="text-gray-500 mb-1">Data Handled</p>
                                        <p className="font-mono font-medium text-gray-200 truncate">
                                            {(uploadMetrics.uploaded / (1024 * 1024)).toFixed(1)} / {(uploadMetrics.total / (1024 * 1024)).toFixed(1)}M
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-center text-yellow-600 mt-4 italic">
                                Do not navigate away from this page
                            </p>
                        </div>
                    )}

                    {!uploading && (
                        <button
                            onClick={handleSubmit}
                            disabled={
                                (uploadMode === 'local' && !file) ||
                                (uploadMode === 'url' && !videoUrl) ||
                                (uploadMode === 'embed' && !embedCode) ||
                                (uploadMode === 'remote' && !videoUrl) ||
                                (uploadMode === 'cloud' && !videoUrl)
                            }
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${(uploadMode === 'local' && !file) ||
                                (uploadMode === 'url' && !videoUrl) ||
                                (uploadMode === 'embed' && !embedCode) ||
                                (uploadMode === 'remote' && !videoUrl) ||
                                (uploadMode === 'cloud' && !videoUrl)
                                ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-800'
                                : (() => {
                                    if (uploadMode === 'local') return 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-1';
                                    if (uploadMode === 'url') return 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-1';
                                    if (uploadMode === 'embed') return 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:-translate-y-1';
                                    if (uploadMode === 'remote') return 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:-translate-y-1';
                                    if (uploadMode === 'cloud') return 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:-translate-y-1';
                                })()
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                Launch Video Data
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadVideo;
