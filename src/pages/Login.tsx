import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FolderKanban, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans selection:bg-neutral-800">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-neutral-900 border-r border-neutral-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent)] pointer-events-none" />
        
        <div className="flex items-center gap-2 z-10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-neutral-900" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">TeamFlow</span>
        </div>

        <div className="z-10 max-w-md">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-6 leading-tight"
          >
            Manage projects. <br/>
            Track progress. <br/>
            Scale teams.
          </motion.h2>
          <div className="space-y-4">
            {[
              "Real-time task synchronization",
              "Advanced project analytics",
              "Role-based access control",
              "Secure data encryption"
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (i * 0.1) }}
                className="flex items-center gap-3 text-neutral-400"
              >
                <CheckCircle className="w-5 h-5 text-neutral-100" />
                <span className="text-sm font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="z-10 text-neutral-500 text-xs">
          Built for modern distributed teams. © 2026 TeamFlow.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-neutral-500">Sign in to your dashboard to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-900/50 text-red-400 text-sm font-medium animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-neutral-400">Password</label>
              </div>
              <input
                type="password"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Continue"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-neutral-500 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:underline font-semibold decoration-neutral-700 underline-offset-4">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
