import { useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * InviteUser: Form to invite a user by email and role.
 * Calls backend API to send invite and store profile.
 */
export default function InviteUser() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInvite = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Call backend API to invite user and store profile
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const result = await res.json();
    if (result.error) setError(result.error);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <form onSubmit={handleInvite} className="flex flex-col gap-2 p-4 border rounded bg-white max-w-md mx-auto">
      <h3 className="font-bold mb-2">Invite User</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="border px-2 py-1 rounded"
      />
      <select value={role} onChange={e => setRole(e.target.value)} className="border px-2 py-1 rounded">
        <option value="coach">Coach</option>
        <option value="player">Player</option>
        <option value="assistant">Assistant</option>
      </select>
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>
        {loading ? 'Inviting...' : 'Send Invite'}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Invite sent!</div>}
    </form>
  );
}
