import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const AdBanner = ({ format = "banner", placement = "banner_home", className = "" }) => {
    const bannerRef = useRef(null);
    const { isAdmin } = useAuth();
    const location = useLocation();
    const [adConfig, setAdConfig] = useState(null);

    const shouldHideAds = location.pathname.startsWith('/admin');

    useEffect(() => {
        const fetchAdSettings = async () => {
            try {
                const data = await api.getAdSettings();
                setAdConfig(data);
            } catch (err) {
                console.error('Failed to fetch ad settings:', err);
            }
        };
        fetchAdSettings();
    }, []);

    useEffect(() => {
        if (shouldHideAds || !bannerRef.current || !adConfig) return;

        // Check master toggle and placement toggle
        if (!adConfig.master_enabled) return;
        if (!adConfig.placements?.[placement]?.enabled) return;

        const scriptUrl = adConfig.urls?.banner_script_url;
        if (!scriptUrl) return;

        // Native Banner Implementation
        if (format === 'banner' || format === 'square') {
            if (bannerRef.current.querySelector('script')) return;

            const script = document.createElement('script');
            script.async = true;
            script.dataset.cfasync = "false";
            script.src = scriptUrl;

            try {
                bannerRef.current.appendChild(script);
            } catch (e) {
                console.error("Ad script injection failed", e);
            }
        }
    }, [format, adConfig, shouldHideAds, placement]);

    // Don't render if ads should be hidden
    if (shouldHideAds) return null;

    // Don't render until we know the config
    if (!adConfig || !adConfig.master_enabled) return null;
    if (!adConfig.placements?.[placement]?.enabled) return null;

    const containerId = adConfig.urls?.banner_container_id || "container-2260504880a1a301d3ee9ca7479cffa9";

    // Dimensions based on format
    const getDimensions = () => {
        switch (format) {
            case 'square': return 'w-[300px] h-[250px]';
            case 'vertical': return 'w-[160px] h-[600px]';
            case 'banner':
            default: return 'w-full max-w-[728px] h-[90px]';
        }
    };

    return (
        <div className={`flex justify-center my-6 ${className}`}>
            <div
                ref={bannerRef}
                className="bg-[#242424] flex items-center justify-center overflow-hidden min-h-[90px] min-w-[300px]"
            >
                {/* Native Banner Container */}
                <div id={containerId}></div>
            </div>
        </div>
    );
};

export default AdBanner;
