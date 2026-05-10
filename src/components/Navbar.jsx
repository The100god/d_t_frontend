import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-midnight/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <img src={logo} alt="Doubts and Topics Walla" className="h-10 w-10 rounded-full transition-all duration-300 cursor-pointer" />
          <span className="text-xl font-bold text-white tracking-tight hidden md:block">Doubts and Topics Walla</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/profile" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <User size={18} />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-sm font-medium ml-4"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
