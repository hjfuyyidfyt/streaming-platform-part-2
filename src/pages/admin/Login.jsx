import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await login(email, password);
            if (result?.success) {
                navigate('/admin');
            } else {
                setError(result?.error || 'Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
            <div className="bg-[#242424] p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-red-600/10 p-3 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Admin Login</h2>
                    <p className="text-gray-400 text-sm mt-2">Access the management dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#121212] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
