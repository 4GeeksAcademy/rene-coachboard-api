
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import TeamMembersManager from './TeamMembersManager';
import InviteUser from './InviteUser';
import AvailabilityManager from './AvailabilityManager';
import PlayDesigner from './PlayDesigner';
import GamesManager from './GamesManager';
import AnnouncementsManager from './AnnouncementsManager';
import ErrorBoundary from './ErrorBoundary';
import TeamChat from './TeamChat';
import DeleteAccount from './DeleteAccount';
import LineupManager from './LineupManager';

export default function TeamsDashboard({ user, profile }) {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !profile || !teamId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setTeam(data || null);
        setLoading(false);
      });
  }, [user, profile, teamId]);

  if (loading) return <div>Loading team...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!team) return <div className="text-gray-500">Team not found.</div>;

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      {/* Navbar for all roles */}
      <div className="mb-4">
        {/* Navbar is rendered in parent layout, so no sign-out button here */}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            if (profile.role === 'player') {
              navigate('/player-teams');
            } else {
              navigate('/teams');
            }
          }}
        >
          &larr; Back to Teams
        </button>
      </div>
      <div className="mb-2 flex flex-col items-start">
        <h2 className="text-2xl font-bold">{team.name} <span className="text-sm text-gray-500">({team.sport})</span></h2>
        <span className="mt-1 text-sm text-gray-700">Team Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{team.join_code || 'N/A'}</span></span>
      </div>

      {/* Feature sections with spacing and borders */}
      <div className="space-y-6">
        <div className="p-4 border-2 border-blue-600 rounded bg-white shadow-sm">
          <TeamMembersManager teamId={team.id} isCoach={profile.role === 'coach'} />
        </div>
        <div className="p-4 border-2 border-red-600 rounded bg-white shadow-sm">
          <AvailabilityManager teamId={team.id} user={user} profile={profile} isCoach={profile.role === 'coach'} />
        </div>
        <div className="p-4 border-2 border-blue-600 rounded bg-white shadow-sm">
          <ErrorBoundary>
            <AnnouncementsManager teamId={team.id} isCoach={profile.role === 'coach'} user={user} />
          </ErrorBoundary>
        </div>
        <div className="p-4 border-2 border-red-600 rounded bg-white shadow-sm">
          <TeamChat teamId={team.id} user={user} />
        </div>
        <div className="p-4 border-2 border-blue-600 rounded bg-white shadow-sm">
          <PlayDesigner teamId={team.id} sport={team.sport} viewOnly={profile.role === 'player'} />
        </div>
        <div className="p-4 border-2 border-red-600 rounded bg-white shadow-sm">
          <GamesManager teamId={team.id} isCoach={profile.role === 'coach'} user={user} profile={profile} />
        </div>
        <div className="p-4 border-2 border-blue-600 rounded bg-white shadow-sm">
          <LineupManager gameId={null} teamId={team.id} isCoach={profile.role === 'coach'} />
        </div>
      </div>

      {/* Delete Account button for all users */}
      {user && (
        <div className="flex justify-center mt-8">
          <DeleteAccount userId={user.id} onDeleted={() => supabase.auth.signOut()} />
        </div>
      )}
    </div>
  );
}