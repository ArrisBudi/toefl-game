import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../lib/supabase';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/games', label: 'Games', icon: '🎮' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/badges', label: 'Badges', icon: '🏅' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="text-3xl">🎮</div>
            <span className="text-white text-xl font-bold">TOEFL Game</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <div className="hidden md:block">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              🚪 Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-white text-2xl"
          >
            {showMenu ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-blue-700 border-t border-blue-500">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMenu(false)}
                className={`block px-4 py-3 rounded-lg font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-white text-blue-600'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;