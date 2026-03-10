import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';

/**
 * Inline banner ad (468x60) between video cards.
 * Each ad renders in its own iframe via blob URL for script isolation.
 */
const InlineAdBanner = ({ className = "" }) => {
    const location = useLocation();
    const iframeRef = useRef(null);
    const [adConfig, setAdConfig] = useState(null);
    const [hidden, setHidden] = useState(false);

    const shouldHideAds = location.pathname.startsWith('/admin');

    useEffect(() => {
        if (shouldHideAds) { setHidden(true); return; }

        const fetchConfig = async () => {
            try {
                const data = await api.getAdSettings();
                if (!data?.master_enabled || !data?.placements?.banner_home?.enabled) {
                    setHidden(true);
                    return;
                }
                setAdConfig(data);
            } catch (err) {
                setHidden(true);
            }
        };
        fetchConfig();
    }, [shouldHideAds]);

    useEffect(() => {
        if (!adConfig || !iframeRef.current) return;

        const scriptUrl = adConfig.urls?.inline_banner_script_url;
        const key = adConfig.urls?.inline_banner_key;
        if (!scriptUrl || !key) return;

        const html = `<!DOCTYPE html>
<html><head><style>*{margin:0;padding:0;}body{display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;}</style></head>
<body>
<script>atOptions={'key':'${key}','format':'iframe','height':60,'width':468,'params':{}};<\/script>
<script src="${scriptUrl}"><\/script>
</body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        iframeRef.current.src = blobUrl;

        return () => URL.revokeObjectURL(blobUrl);
    }, [adConfig]);

    if (hidden || shouldHideAds) return null;

    return (
        <div className={`col-span-full w-full flex justify-center my-3 ${className}`}>
            <iframe
                ref={iframeRef}
                style={{
                    width: '468px',
                    height: '60px',
                    border: 'none',
                    overflow: 'hidden'
                }}
                scrolling="no"
                title="Advertisement"
            />
        </div>
    );
};

export default InlineAdBanner;
