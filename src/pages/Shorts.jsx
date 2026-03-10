import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import ShortsPlayer from '../components/shorts/ShortsPlayer';
import Sidebar from '../components/layout/Sidebar';
import { Menu, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

const Shorts = () => {
    const [shorts, setShorts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchShorts = async () => {
            try {
                const data = await api.getShorts(0, 50);
                setShorts(data);
            } catch (err) {
                console.error("Failed to fetch shorts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchShorts();
    }, []);

    const handleScroll = (e) => {
        const container = e.target;
        const index = Math.round(container.scrollTop / container.clientHeight);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    const scrollToIndex = (index) => {
        if (index < 0 || index >= shorts.length) return;
        containerRef.current.scrollTo({
            top: index * containerRef.current.clientHeight,
            behavior: 'smooth'
        });
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (shorts.length === 0) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-4">
                <h2 className="text-2xl font-bold mb-4">No Shorts Yet</h2>
                <p className="text-gray-400">Be the first to upload a short vertical video!</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black overflow-hidden flex flex-col">
            {/* Simple Top Nav */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors pointer-events-auto"
                >
                    <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="bg-black/20 px-3 py-1 rounded-full pointer-events-auto">
                    <span className="text-sm font-bold text-white tracking-widest">SHORTS</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isOverlay={true}
            />

            {/* Scroll Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            >
                {shorts.map((short, index) => (
                    <div key={short.id} className="h-full w-full snap-start snap-always">
                        <ShortsPlayer
                            video={short}
                            isActive={index === currentIndex}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
                <button
                    onClick={() => scrollToIndex(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="p-2 bg-gray-800/40 hover:bg-gray-800/60 rounded-full transition-colors disabled:opacity-0"
                >
                    <ChevronUp className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => scrollToIndex(currentIndex + 1)}
                    disabled={currentIndex === shorts.length - 1}
                    className="p-2 bg-gray-800/40 hover:bg-gray-800/60 rounded-full transition-colors disabled:opacity-0"
                >
                    <ChevronDown className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    );
};

export default Shorts;
