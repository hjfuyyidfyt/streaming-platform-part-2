import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

const AgeVerification = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isVerified = localStorage.getItem('age-verified');
        if (!isVerified) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('age-verified', 'true');
        setIsVisible(false);
    };

    const handleLeave = () => {
        window.location.href = 'https://www.google.com';
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f0f]/95 backdrop-blur-md p-4">
            <div className="bg-[#1a1a1a] max-w-md w-full rounded-2xl border border-gray-800 p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="bg-red-500/20 p-4 rounded-full">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Age Verification</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        This website contains adult-themed content and is intended for individuals who are
                        <span className="text-white font-bold"> 18 years of age or older.</span>
                    </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-200 leading-tight">
                        By entering, you confirm that you are at least 18 years old and consent to viewing potentially sensitive material.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        onClick={handleAccept}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    >
                        I AM 18 OR OLDER - ENTER
                    </button>
                    <button
                        onClick={handleLeave}
                        className="w-full bg-transparent hover:bg-white/5 text-gray-400 font-medium py-2 rounded-xl transition-colors"
                    >
                        LEAVE WEBSITE
                    </button>
                </div>

                <p className="text-[10px] text-gray-600 uppercase tracking-widest pt-4">
                    vPlyer &copy; 2026
                </p>
            </div>
        </div>
    );
};

export default AgeVerification;
