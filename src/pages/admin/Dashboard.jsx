import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogOut, Upload, Film, LayoutGrid } from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

const Dashboard = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => {
        return location.pathname === path ? "bg-red-600/10 text-red-500" : "text-gray-400 hover:bg-white/5 hover:text-white";
    };

    const handleNav = (path) => {
        console.log("Navigating to:", path);
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white flex">
            {/* Sidebar */}
            <aside style={{ pointerEvents: 'auto', position: 'fixed', zIndex: 9999 }} className="w-64 bg-[#242424] border-r border-gray-800 p-6 flex flex-col h-full">
                <h1 className="text-xl font-bold tracking-tighter text-red-600 mb-10">
                    STREAM<span className="text-white">ADMIN</span>
                </h1>

                <nav className="space-y-2 flex-1">
                    <button onClick={() => handleNav('/admin')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive('/admin')}`}>
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <button onClick={() => handleNav('/admin/upload')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive('/admin/upload')}`}>
                        <Upload className="w-5 h-5" />
                        <span className="font-medium">Upload Video</span>
                    </button>
                    <button onClick={() => handleNav('/admin/categories')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive('/admin/categories')}`}>
                        <Film className="w-5 h-5" />
                        <span className="font-medium">Categories</span>
                    </button>
                    <button onClick={() => handleNav('/admin/storage')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive('/admin/storage')}`}>
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-medium">Storage</span>
                    </button>
                    <button onClick={() => handleNav('/admin/settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive('/admin/settings')}`}>
                        <Film className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                </nav>

                <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="ml-64 flex-1">
                <header className="sticky top-0 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-gray-800 px-8 py-4 flex justify-between items-center z-20">
                    <h2 className="text-xl font-bold capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold">
                            A
                        </div>
                    </div>
                </header>

                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;

