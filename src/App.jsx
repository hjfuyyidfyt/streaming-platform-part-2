import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import VideoDetails from './pages/VideoDetails';
import Auth from './pages/Auth';
import YourVideos from './pages/YourVideos';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import DashboardHome from './pages/admin/DashboardHome';
import UploadVideo from './pages/admin/UploadVideo';
import Categories from './pages/admin/Categories';
import Storage from './pages/admin/Storage';
import Settings from './pages/admin/Settings';
import History from './pages/History';
import Subscriptions from './pages/Subscriptions';
import Playlists from './pages/Playlists';
import PlaylistDetails from './pages/PlaylistDetails';
import Shorts from './pages/Shorts';

import GlobalAdController from './components/layout/GlobalAdController.jsx';
import AgeVerification from './components/common/AgeVerification.jsx';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AgeVerification />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GlobalAdController />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoDetails />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/your-videos" element={<YourVideos />} />
            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <Subscriptions />
              </ProtectedRoute>
            } />
            <Route path="/playlists" element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            } />
            <Route path="/playlist/:id" element={
              <ProtectedRoute>
                <PlaylistDetails />
              </ProtectedRoute>
            } />
            <Route path="/category/:slug" element={<Home />} />
            <Route path="/admin/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="upload" element={<UploadVideo />} />
              <Route path="categories" element={<Categories />} />
              <Route path="storage" element={<Storage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
