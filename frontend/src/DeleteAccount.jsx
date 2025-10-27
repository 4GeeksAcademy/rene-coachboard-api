import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function DeleteAccount({ userId, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setLoading(true);
    setError(null);
    // Remove from team_members
    const { error: tmError } = await supabase.from('team_members').delete().eq('user_id', userId);
    // Remove profile
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    // Remove auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (tmError || profileError || authError) {
      setError((tmError?.message || '') + (profileError?.message || '') + (authError?.message || ''));
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
    if (onDeleted) onDeleted();
  };

  return (
    <div className="mt-8">
      <button
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        onClick={handleDelete}
        disabled={loading}
      >
        Delete Account
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">Account deleted.</div>}
    </div>
  );
}
