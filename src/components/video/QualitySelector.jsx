import React, { useState, useEffect as useComponentEffect } from 'react';
import { Settings } from 'lucide-react';
import { api } from '../../services/api.js';

const QualitySelector = ({ videoId, currentResolution, onQualityChange }) => {
    const [resolutions, setResolutions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useComponentEffect(() => {
        const fetchResolutions = async () => {
            try {
                const data = await api.getVideoResolutions(videoId);
                setResolutions(data.available_resolutions || []);
            } catch (error) {
                console.error('Failed to fetch resolutions:', error);
                setResolutions([]);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) {
            fetchResolutions();
        }
    }, [videoId]);

    // Sort resolutions by height (descending)
    const sortedResolutions = [...resolutions].sort((a, b) => {
        const getHeight = (res) => parseInt(res.resolution.replace('p', '')) || 0;
        return getHeight(b) - getHeight(a);
    });

    if (loading || resolutions.length <= 1) {
        // Don't show selector if only one quality available
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-black/70 hover:bg-black/90 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-white"
            >
                <Settings className="w-4 h-4" />
                <span>{currentResolution || 'Quality'}</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#242424] border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[120px] z-50">
                    <div className="py-1">
                        {sortedResolutions.map((res) => (
                            <button
                                key={res.resolution}
                                onClick={() => {
                                    onQualityChange(res.resolution);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${currentResolution === res.resolution
                                    ? 'text-red-500 font-medium'
                                    : 'text-white'
                                    }`}
                            >
                                <span>{res.label}</span>
                                {currentResolution === res.resolution && (
                                    <span className="text-red-500">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QualitySelector;
