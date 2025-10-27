import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from './supabaseClient';

export default function RoleCaptureModal({ user, profile, onRoleSet }) {
  const [open, setOpen] = useState(!profile?.role);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!role) return;
    setLoading(true);
    setError(null);
    // Upsert role into profiles table
    const { error } = await supabase
      .from('profiles')
  .upsert({ id: user.id, role }, { onConflict: ['id'] });
    if (error) setError(error.message);
    else {
      setOpen(false);
      onRoleSet(role);
    }
    setLoading(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center animate-fade-in">
          <Dialog.Title className="text-2xl font-bold text-blue-700 text-center mb-2">Set Your Role</Dialog.Title>
          <form
            onSubmit={e => { e.preventDefault(); handleSave(); }}
            className="flex flex-col gap-4 w-full items-center"
          >
            <label className="font-semibold text-lg text-gray-700">Select your role:</label>
            <select
              className="border border-blue-200 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            >
              <option value="">Choose...</option>
              <option value="coach">Coach</option>
              <option value="player">Player</option>
            </select>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading || !role}
            >
              {loading ? 'Saving...' : 'Save Role'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}