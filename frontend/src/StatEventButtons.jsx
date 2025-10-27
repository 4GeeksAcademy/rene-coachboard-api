import { useState } from 'react';
import { supabase } from './supabaseClient';

/**
 * StatEventButtons: UI for logging stat events for a player during a game.
 * Props:
 *   - gameId: the current game id
 *   - userId: the player user id
 *   - onLogged: callback after logging event
 */
export default function StatEventButtons({ gameId, userId, onLogged }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statTypes = [
    { type: 'shot_made_2', label: '2PT Made' },
    { type: 'shot_made_3', label: '3PT Made' },
    { type: 'shot_missed_2', label: '2PT Missed' },
    { type: 'shot_missed_3', label: '3PT Missed' },
    { type: 'assist', label: 'Assist' },
    { type: 'rebound_off', label: 'Off Reb' },
    { type: 'rebound_def', label: 'Def Reb' },
    { type: 'steal', label: 'Steal' },
    { type: 'block', label: 'Block' },
    { type: 'turnover', label: 'Turnover' },
    { type: 'foul', label: 'Foul' },
  ];

  const logEvent = async (event_type) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('stat_events').insert({
      game_id: gameId,
      user_id: userId,
      event_type,
      period: 1,
      game_clock_ms: null,
      metadata: null,
    });
    if (error) setError(error.message);
    setLoading(false);
    if (!error && onLogged) onLogged();
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {statTypes.map(s => (
        <button
          key={s.type}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
          onClick={() => logEvent(s.type)}
          disabled={loading}
        >
          {s.label}
        </button>
      ))}
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
    </div>
  );
}
