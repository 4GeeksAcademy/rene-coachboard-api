
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from './supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Wait for session to be set in context
    let tries = 0;
    const maxTries = 10;
    const delay = ms => new Promise(res => setTimeout(res, ms));
    while (!supabase.auth.getSession && tries < maxTries) {
      await delay(100);
      tries++;
    }
  // Do not manually redirect; let App.jsx handle navigation based on user context
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      {/* Navbar */}
      <Navbar />
      {/* Login Form Content */}
      <div className="flex flex-1 items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto bg-white/90 p-8 rounded-2xl shadow-lg flex flex-col items-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Sign In</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <div className="mb-4 w-full relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
          <div className="w-full text-right mb-4">
            <Link to="/forgot-password" className="text-blue-600 text-sm hover:underline">Forgot password?</Link>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}