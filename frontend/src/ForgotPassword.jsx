import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) setError(error.message);
    else setMessage('Password reset email sent! Check your inbox.');
    setLoading(false);
  };

  return (
    <form onSubmit={handleReset} className="w-full max-w-sm mx-auto bg-white/90 p-8 rounded-2xl shadow-lg flex flex-col items-center animate-fade-in mt-12">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="mb-4 w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
      {message && <div className="text-green-600 mb-2 text-sm">{message}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
    </form>
  );
}
