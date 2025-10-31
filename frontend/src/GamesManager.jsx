import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import LineupManager from './LineupManager';
import GameDashboard from './GameDashboard';

export default function GamesManager({ teamId, isCoach, user }) {
  // Delete a game
  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    setDeletingId(gameId);
    setError(null);
    const { error } = await supabase.from('games').delete().eq('id', gameId);
    if (error) setError(error.message);
    else setGames(games => games.filter(g => g.id !== gameId));
    setDeletingId(null);
  };
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ opponent: '', date: '', location: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false });
    console.log('[fetchGames] teamId:', teamId, 'data:', data, 'error:', error);
    if (error) setError(error.message);
    else setGames(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (teamId) fetchGames();
    // eslint-disable-next-line
  }, [teamId]);

  const handleFormChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    if (!form.opponent || !form.date) {
      setError('Opponent and date are required.');
      setFormLoading(false);
      return;
    }
    // Debug: fetch the team's coach_id before inserting
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('coach_id')
      .eq('id', teamId)
      .single();
    // Await session for access token
    let session = null;
    let currentUserId = user?.id;
    if (supabase.auth && supabase.auth.getSession) {
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData?.session || null;
      if (session?.user?.id) currentUserId = session.user.id;
    } else if (supabase.auth?.session) {
      session = supabase.auth.session;
      if (session?.user?.id) currentUserId = session.user.id;
    }
    console.log('[handleCreate] teamId:', teamId, 'user.id:', user?.id, 'session user.id:', currentUserId, 'team coach_id:', teamData?.coach_id, 'teamError:', teamError, 'session:', session);
    // Use Supabase client for insert
    const { data, error } = await supabase.from('games').insert({
      team_id: teamId,
      opponent: form.opponent,
      date: form.date,
      location: form.location,
    }).select();
    console.log('[handleCreate] Inserted game:', data, 'error:', error);
    if (error) setError(error.message);
    else {
      setForm({ opponent: '', date: '', location: '' });
      fetchGames();
    }
    setFormLoading(false);
  };

  const [showDashboard, setShowDashboard] = useState(null); // gameId or null

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Games</h3>
      {isCoach && (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 mb-4">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              name="opponent"
              placeholder="Opponent"
              value={form.opponent}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-44"
              required
            />
            <input
              name="date"
              type="datetime-local"
              placeholder="Date"
              value={form.date}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-44"
              required
            />
            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-44"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 w-full md:w-auto"
            disabled={formLoading}
          >
            Add Game
          </button>
        </form>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? <div>Loading games...</div> : (
        <ul className="space-y-2">
          {games.map(game => (
            <li key={game.id} className="p-2 bg-gray-100 rounded flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-semibold">{game.opponent}</span>
                <span className="ml-2 text-sm text-gray-500">{new Date(game.date).toLocaleString()}</span>
                {game.location && <span className="ml-2 text-sm text-gray-500">@ {game.location}</span>}
                <span className="ml-2 text-xs text-gray-400">Status: {game.status || 'scheduled'}</span>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <LineupManager gameId={game.id} teamId={teamId} />
                <button
                  className="mt-2 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  onClick={() => setShowDashboard(game.id)}
                >
                  Live Dashboard
                </button>
                {isCoach && (
                  <button
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => handleDelete(game.id)}
                    disabled={deletingId === game.id}
                  >
                    {deletingId === game.id ? 'Deleting...' : 'Delete Game'}
                  </button>
                )}
              </div>
              {showDashboard === game.id && (
                <div
                  className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
                  onClick={e => {
                    if (e.target === e.currentTarget) setShowDashboard(null);
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="bg-white rounded shadow-lg p-4 w-full max-w-md relative z-50 flex flex-col"
                    style={{ maxHeight: '80vh', minHeight: '300px', overflowY: 'auto' }}
                  >
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-black"
                      style={{ zIndex: 100 }}
                      onClick={() => setShowDashboard(null)}
                    >
                      ✕
                    </button>
                    <div style={{ paddingTop: '2rem' }}>
                      <GameDashboard
                        gameId={game.id}
                        teamId={teamId}
                        user={user}
                        isCoach={isCoach}
                      />
                    </div>
                  </div>
                  <style>{`
                    body { overflow: hidden !important; }
                  `}</style>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!games.length && !loading && <div className="mt-2 text-gray-500">No games found.</div>}
    </div>
  );
}
