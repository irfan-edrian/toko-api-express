import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://toko-api-express-41u1.vercel.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('user', JSON.stringify({ 
          username, 
          token: data.token 
        }));
        navigate('/');
      } else {
        setError(data.message || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Tidak dapat terhubung ke server backend. Pastikan backend sudah berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Welcome Back</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Sign in to access your admin dashboard</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 text-red-400 border border-red-800/50 rounded-xl text-sm text-center shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3.5 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition placeholder-slate-500 shadow-inner" 
              placeholder="Enter your username" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-slate-900/50 border border-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition placeholder-slate-500 shadow-inner" 
              placeholder="Enter your password" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3.5 mt-2 rounded-xl text-white font-bold transition-all shadow-lg 
              ${isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25 transform hover:-translate-y-0.5'}`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
