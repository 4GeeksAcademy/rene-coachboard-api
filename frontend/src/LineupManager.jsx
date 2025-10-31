import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function LineupManager({ gameId, teamId, isCoach }) {
  const [members, setMembers] = useState([]);
  const [lineup, setLineup] = useState({}); // { user_id: true/false }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch team members
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('team_members')
      .select('user_id, profiles(full_name, email)')
      .eq('team_id', teamId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMembers(data || []);
        setLoading(false);
      });
  }, [teamId]);

  // Fetch current lineup
  useEffect(() => {
    if (!gameId) return;
    supabase
      .from('game_lineups')
      .select('*')
      .eq('game_id', gameId)
      .then(({ data }) => {
        const starters = {};
        (data || []).forEach(l => { starters[l.user_id] = !!l.starter; });
        setLineup(starters);
      });
  }, [gameId]);

  const handleToggle = user_id => {
    setLineup(l => ({ ...l, [user_id]: !l[user_id] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    // Remove all existing lineups for this game
    await supabase.from('game_lineups').delete().eq('game_id', gameId);
    // Insert new lineup
    const inserts = Object.entries(lineup)
      .filter(([_, starter]) => starter)
      .map(([user_id]) => ({ game_id: gameId, user_id, starter: true }));
    if (inserts.length) {
      const { error } = await supabase.from('game_lineups').insert(inserts);
      if (error) setError(error.message);
    }
    setSaving(false);
  };

  // Only coaches can assign starters
  if (!isCoach) return null;
  return (
    <div className="mt-2">
      <h4 className="font-semibold mb-1">Assign Starters</h4>
      {loading ? <div>Loading members...</div> : (
        <ul className="space-y-1">
          {members
            .filter(m => m.profiles?.email !== 'leinz30@icloud.com')
            .map(m => (
              <li key={m.user_id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!lineup[m.user_id]}
                  onChange={() => handleToggle(m.user_id)}
                  id={`starter-${m.user_id}`}
                />
                <label htmlFor={`starter-${m.user_id}`} className="cursor-pointer">
                  {m.profiles?.full_name || m.profiles?.email || m.user_id}
                </label>
              </li>
            ))}
        </ul>
      )}
      <button
        className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Lineup'}
      </button>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
}
