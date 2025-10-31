import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import DeleteAccount from './DeleteAccount';
import { useNavigate } from 'react-router-dom';

export default function PlayerTeamsManager() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch teams list
  const fetchTeams = () => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('team_members')
      .select('team_id, teams!team_id(*)')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        const joinedTeams = (data || []).map(tm => tm.teams);
        setTeams(joinedTeams);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line
  }, [user, location.pathname]);

  // Join team by code
  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError(null);
    if (!joinCode.trim()) {
      setJoinError("Please enter a team code.");
      setJoinLoading(false);
      return;
    }
    // Find team by code
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('join_code', joinCode.trim())
      .single();
    if (teamError || !team) {
      setJoinError("Team not found. Please check the code.");
      setJoinLoading(false);
      return;
    }
    // Check if already a member
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id)
      .eq('user_id', user.id)
      .single();
    if (member) {
      setJoinError("You are already a member of this team.");
      setJoinLoading(false);
      return;
    }
    // Add to team_members
    const { error: joinErr } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: user.id });
    if (joinErr) {
      setJoinError("Failed to join team: " + joinErr.message);
      setJoinLoading(false);
      return;
    }
    // Refresh teams list
    supabase
      .from('team_members')
      .select('team_id, teams!team_id(*)')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        const joinedTeams = (data || []).map(tm => tm.teams);
        setTeams(joinedTeams);
        setLoading(false);
      });
    setJoinCode("");
    setJoinLoading(false);
    setJoinError(null);
  };

  if (!user) return null;



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
      {/* Navbar removed, now rendered globally in App.jsx */}
      <div className="flex flex-1 flex-col items-center justify-start p-8">

        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">My Teams</h1>
          <div className="flex gap-2">
            {/* Sign Out button removed, handled by Navbar */}
            <button
              className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 transition w-40"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  supabase.from('team_members').delete().eq('user_id', user.id);
                  supabase.from('profiles').delete().eq('id', user.id);
                  supabase.auth.admin.deleteUser(user.id);
                  supabase.auth.signOut();
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {/* Prominent Join Team UI */}
        <div className="w-full max-w-lg mb-8 p-4 bg-white rounded-xl shadow flex flex-col items-center">
          <h2 className="text-xl font-bold text-blue-700 mb-2">Join a Team</h2>
          <form onSubmit={handleJoinTeam} className="w-full flex gap-2 items-center">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Enter team code to join"
              className="px-4 py-2 rounded border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
              disabled={joinLoading}
            >
              {joinLoading ? "Joining..." : "Join Team"}
            </button>
          </form>
          {joinError && <div className="text-red-500 mt-2">{joinError}</div>}
        </div>
        {loading ? (
          <div>Loading teams...</div>
        ) : (
          <ul className="w-full max-w-lg space-y-3">
            {teams.map(team => (
              team && team.name ? (
                <li key={team.id} className="flex items-center justify-between bg-white/90 rounded-xl shadow p-4 hover:bg-blue-50 transition cursor-pointer">
                  <span onClick={() => navigate(`/team/${team.id}`)} className="font-semibold text-lg text-blue-700 hover:underline">{team.name}</span>
                  <span className="ml-4 text-sm text-gray-500">{team.sport}</span>
                </li>
              ) : null
            ))}
            {teams.length === 0 && <li className="text-gray-500 text-center">You are not a member of any teams.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
