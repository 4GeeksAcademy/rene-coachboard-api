import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

export default function PlayerTeamsManager() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Get all teams where user is a member
    supabase
      .from('team_members')
      .select('team_id, teams!team_id(*)')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        // Flatten teams from join
        const joinedTeams = (data || []).map(tm => tm.teams);
        setTeams(joinedTeams);
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-start p-8">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">My Teams</h1>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </button>
            <DeleteAccount userId={user.id} onDeleted={() => supabase.auth.signOut()} />
          </div>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading teams...</div>
        ) : (
          <ul className="w-full max-w-lg space-y-3">
            {teams.map(team => (
              <li key={team.id} className="flex items-center justify-between bg-white/90 rounded-xl shadow p-4 hover:bg-blue-50 transition cursor-pointer">
                <span onClick={() => navigate(`/team/${team.id}`)} className="font-semibold text-lg text-blue-700 hover:underline">{team.name}</span>
                <span className="ml-4 text-sm text-gray-500">{team.sport}</span>
              </li>
            ))}
            {teams.length === 0 && <li className="text-gray-500 text-center">You are not a member of any teams.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
