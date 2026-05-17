import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Moon, Sun } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [themeMode, setThemeMode] = useState(localStorage.getItem('app-mode') || 'dark');

  useEffect(() => {
    const savedMode = localStorage.getItem('app-mode') || 'dark';
    setThemeMode(savedMode);
  }, []);

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('app-mode', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-8 animate-pulse">
        <div className="h-10 skeleton w-1/3" />
        <div className="h-96 skeleton w-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">User Profile</h1>
      
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-vibrant-primary/20 rounded-full flex items-center justify-center text-vibrant-primary">
            <User size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.email.split('@')[0]}</h2>
            <p className="text-slate-400 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-slate-300">
            <Mail className="text-vibrant-primary" size={20} />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Email Address</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <Shield className="text-vibrant-secondary" size={20} />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Account Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-300">
            <Calendar className="text-emerald-500" size={20} />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Account Status</p>
              <p className="font-medium text-emerald-500">Active</p>
            </div>
          </div>
        </div>

        {/* Application Theme Settings Mode Toggle */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Application Theme Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer font-bold ${
                themeMode === 'dark'
                  ? 'bg-vibrant-primary/20 border-vibrant-primary text-white shadow-lg shadow-vibrant-primary/10'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Moon size={20} />
              <span>Dark Mode</span>
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all cursor-pointer font-bold ${
                themeMode === 'light'
                  ? 'bg-white border-vibrant-primary text-slate-900 shadow-lg shadow-black/5'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sun size={20} />
              <span>Light Mode</span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <p className="text-slate-500 text-sm italic">
            You are currently logged in as a {user.role}. 
            {user.role === 'admin' ? ' You have full access to create and manage quizzes.' : ' You can attempt quizzes and view your graded results.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
