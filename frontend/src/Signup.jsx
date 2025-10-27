import Navbar from './Navbar';
import { useState } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Sign up user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Insert full name into profiles
    const userId = data?.user?.id;
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, email })
        .eq('id', userId);
      if (profileError) setError(profileError.message);
    }
    setSuccess('Check your email for a confirmation link!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      {/* Navbar */}
      <Navbar />
      {/* Signup Form Content */}
      <div className="flex flex-1 items-center justify-center">
        <form onSubmit={handleSignup} className="w-full max-w-sm mx-auto bg-white/90 p-8 rounded-2xl shadow-lg flex flex-col items-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">Sign Up</h2>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mb-4 w-full px-4 py-2 border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full px-4 py-2 border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full px-4 py-2 border border-green-200 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
          {success && <div className="text-green-600 mb-2 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-full font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
