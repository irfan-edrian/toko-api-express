import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Keuangan from './pages/Keuangan';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch(e) {}
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md shadow-lg p-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-40">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Toko API Dashboard
      </h1>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span className="text-sm font-semibold text-slate-300 bg-slate-800/50 border border-slate-700 px-4 py-1.5 rounded-full shadow-inner">
              👋 {user.username}
            </span>
            <Link to="/" className={`text-slate-300 hover:text-blue-400 transition font-medium ${location.pathname === '/' ? 'text-blue-400' : ''}`}>Dashboard</Link>
            <Link to="/keuangan" className={`text-slate-300 hover:text-emerald-400 transition font-medium ${location.pathname === '/keuangan' ? 'text-emerald-400' : ''}`}>Keuangan</Link>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition font-medium ml-2 border border-red-900/50 px-4 py-1.5 rounded-lg hover:bg-red-900/20 bg-red-900/10 shadow-sm">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="text-slate-300 hover:text-blue-400 transition font-medium">Login</Link>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500/30">
        <Navbar />
        
        <main className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/keuangan" element={<Keuangan />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
