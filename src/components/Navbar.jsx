import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Menu, X, Image, Download } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      window.deferredPrompt = e; // Store globally for other page accesses
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA Installation Choice: ${outcome}`);
    setDeferredPrompt(null);
    window.deferredPrompt = null;
    setIsInstallable(false);
  };

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
          {user.role === 'admin' && (
            <Link to="/library" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
              <Image size={18} />
              Library
            </Link>
          )}
          {isInstallable && (
            <button
              onClick={handleInstallApp}
              className="text-vibrant-primary hover:text-white bg-vibrant-primary/10 hover:bg-vibrant-primary px-3 py-1.5 rounded-xl border border-vibrant-primary/20 flex items-center gap-1.5 text-xs font-bold transition-all duration-300 cursor-pointer animate-pulse ml-2"
            >
              <Download size={14} />
              Install App
            </button>
          )}
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
          {user.role === 'admin' && (
            <Link
              to="/library"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-3 text-sm font-medium py-2 px-3 hover:bg-white/5 rounded-xl"
            >
              <Image size={18} />
              Library
            </Link>
          )}
          {isInstallable && (
            <button
              onClick={() => {
                setIsOpen(false);
                handleInstallApp();
              }}
              className="w-full text-vibrant-primary hover:text-white transition-colors flex items-center gap-3 text-sm font-bold py-2 px-3 bg-vibrant-primary/10 rounded-xl text-left cursor-pointer animate-pulse"
            >
              <Download size={18} />
              Install Mobile App
            </button>
          )}
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

