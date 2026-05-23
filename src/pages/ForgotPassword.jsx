import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugLink, setDebugLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setDebugLink('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
      if (res.data.debugResetUrl) {
        setDebugLink(res.data.debugResetUrl);
      }
      
      // Automatically redirect to the reset password page using the token from the response
      if (res.data.token) {
        setTimeout(() => {
          navigate(`/reset-password?token=${res.data.token}`);
        }, 1500); // 1.5 second elegant delay so user can see the success message
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-md space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <KeyRound size={80} className="text-vibrant-primary" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm">Enter your email and we'll help you recover your password</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm animate-fade-in">
            {error}
          </div>
        )}

        {message && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-sm animate-fade-in">
              {message}
            </div>

            {/* Development Mode Helper Link */}
            {debugLink && (
              <div className="bg-vibrant-primary/10 border border-vibrant-primary/30 p-4 rounded-xl space-y-2 animate-fade-in">
                <span className="text-xs text-vibrant-primary font-bold uppercase tracking-wider block">Development Helper</span>
                <p className="text-xs text-slate-300">In development mode, we simulated the recovery email. Click below to reset directly:</p>
                <a
                  href={debugLink}
                  className="inline-block text-xs bg-vibrant-primary hover:bg-vibrant-primary/95 text-white px-3 py-1.5 rounded-lg font-medium transition-all shadow-md shadow-vibrant-primary/20"
                >
                  Go to Reset Link
                </a>
              </div>
            )}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mail size={18} />
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
