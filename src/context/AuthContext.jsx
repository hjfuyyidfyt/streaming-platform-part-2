import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (token) {
                try {
                    const userData = await api.getMe(token);
                    setUser(userData);
                } catch (err) {
                    // Only clear token if it's actually invalid (401/403)
                    // Do NOT clear on network errors, server crashes, etc.
                    const msg = (err.message || '').toLowerCase();
                    if (msg.includes('not authenticated') ||
                        msg.includes('token') ||
                        msg.includes('401') ||
                        msg.includes('expired') ||
                        msg.includes('invalid')) {
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    } else {
                        // Network/server error — keep token, user can retry
                        console.warn('Auth check failed (keeping token):', err.message);
                    }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        try {
            const data = await api.login(email, password);
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);

            // Get user info
            const userData = await api.getMe(data.access_token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, password, displayName) => {
        try {
            await api.register(username, email, password, displayName);
            // Auto-login after register
            return await login(email, password);
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // Admin check (keep for backward compatibility)
    const isAdmin = user?.email === 'admin@example.com';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAdmin,
            login,
            register,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
