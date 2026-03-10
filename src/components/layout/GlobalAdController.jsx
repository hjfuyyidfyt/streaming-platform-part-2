import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const GlobalAdController = () => {
    const { isAdmin } = useAuth();
    const location = useLocation();
    const [adConfig, setAdConfig] = useState(null);

    // Fetch ad settings from server on mount
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

    // Hide ads for admins or on admin pages
    const shouldHideAds = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (shouldHideAds || !adConfig) return;

        // Check master toggle and popunder placement
        if (!adConfig.master_enabled) return;
        if (!adConfig.placements?.popunder?.enabled) return;

        const adUrl = adConfig.urls?.popunder_url;
        const cooldown = (adConfig.cooldown_seconds || 60) * 1000;

        if (!adUrl) return;

        const handleClick = () => {
            const lastTime = localStorage.getItem('lastAdTime');
            const now = Date.now();

            if (!lastTime || (now - parseInt(lastTime)) > cooldown) {
                window.open(adUrl, '_blank');
                localStorage.setItem('lastAdTime', now.toString());
            }
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, [shouldHideAds, adConfig]);

    return null; // Logic only component
};

export default GlobalAdController;
