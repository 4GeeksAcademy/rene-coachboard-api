import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

export default function TeamsManager() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('teams')
      .select('*')
      .eq('coach_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setTeams(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newTeamName.trim()) return;
    const { data, error } = await supabase
      .from('teams')
      .insert([{ name: newTeamName, coach_id: user.id }])
      .select();
    if (error) return setError(error.message);
    setTeams((prev) => [...prev, ...data]);
    setNewTeamName('');
  };

  const handleDeleteTeam = async (teamId) => {
    setError(null);
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (error) return setError(error.message);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      {/* Navbar removed, now rendered globally in App.jsx */}
      <div className="flex flex-1 flex-col items-center justify-start p-8">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">My Teams</h1>
        </div>
        <form onSubmit={handleAddTeam} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="px-4 py-2 rounded border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">Add Team</button>
        </form>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading teams...</div>
        ) : (
          <ul className="w-full max-w-lg space-y-3">
            {teams.map(team => (
              <li key={team.id} className="flex items-center justify-between bg-white/90 rounded-xl shadow p-4 hover:bg-blue-50 transition cursor-pointer">
                <div className="flex flex-col flex-1">
                  <span onClick={() => navigate(`/team/${team.id}`)} className="font-semibold text-lg text-blue-700 hover:underline">{team.name}</span>
                  <span className="text-xs text-gray-500">Team Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{team.join_code || 'N/A'}</span></span>
                </div>
                <button onClick={() => handleDeleteTeam(team.id)} className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              </li>
            ))}
            {teams.length === 0 && <li className="text-gray-500 text-center">No teams yet. Add your first team!</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
