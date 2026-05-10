import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [stream, setStream] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ email, password, role, name, studentClass, stream });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-md space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <UserPlus size={80} />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join the learning platform today</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setRole('student')}
                className={`p-3 rounded-xl border transition-all ${role === 'student' ? 'border-vibrant-primary bg-vibrant-primary/10 text-vibrant-primary' : 'border-white/10 text-slate-400'}`}
              >
                Student
              </button>
              <button 
                type="button" 
                onClick={() => setRole('admin')}
                className={`p-3 rounded-xl border transition-all ${role === 'admin' ? 'border-vibrant-primary bg-vibrant-primary/10 text-vibrant-primary' : 'border-white/10 text-slate-400'}`}
              >
                Teacher
              </button>
            </div>
          </div>

          {role === 'student' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Class</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 12th"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  required={role === 'student'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Stream</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Science"
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  required={role === 'student'}
                />
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <UserPlus size={18} />
            Register
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          Already have an account? <Link to="/login" className="text-vibrant-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
