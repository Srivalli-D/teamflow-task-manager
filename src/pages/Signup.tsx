import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Signup() {
  const [name, setName] = useState('');
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
      const res = await api.post('/auth/signup', { name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex font-sans selection:bg-neutral-800">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 justify-center mb-12">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-neutral-900" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TeamFlow</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
            <p className="text-neutral-500">Start managing your team effectively</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-900/50 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400 ml-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label className="text-sm font-medium text-neutral-400 ml-1">Password</label>
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
              {loading ? "Creating account..." : "Sign up"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-neutral-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-semibold decoration-neutral-700 underline-offset-4">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
