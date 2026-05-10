import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

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
