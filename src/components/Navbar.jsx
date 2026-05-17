import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-midnight/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center justify-start gap-4" onClick={() => setIsOpen(false)}>
          <img src={logo} alt="Doubts and Topics Walla" className="h-10 w-10 rounded-full transition-all duration-300 cursor-pointer" />
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block">Doubts and Topics Walla</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
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
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-sm font-medium ml-4 cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="absolute right-6 top-16 w-56 mt-2 rounded-2xl border border-white/10 bg-midnight/95 backdrop-blur-xl shadow-2xl p-3 space-y-2 z-50 md:hidden transition-all duration-300 ease-in-out">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm font-medium py-2 px-3 hover:bg-white/5 rounded-xl"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm font-medium py-2 px-3 hover:bg-white/5 rounded-xl"
          >
            <User size={18} />
            Profile
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full text-red-400 hover:text-red-300 transition-colors flex items-center gap-3 text-sm font-medium py-2 px-3 hover:bg-red-500/10 rounded-xl text-left cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

