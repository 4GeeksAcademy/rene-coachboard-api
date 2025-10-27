
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export default function TeamsDashboard({ user, profile }) {
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
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/teams'}
        >
          &larr; Back to Teams
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4">{team.name} <span className="text-sm text-gray-500">({team.sport})</span></h2>
      <TeamMembersManager teamId={team.id} isCoach={profile.role === 'coach'} />
      <AvailabilityManager teamId={team.id} user={user} profile={profile} isCoach={profile.role === 'coach'} />
      <ErrorBoundary>
        <AnnouncementsManager teamId={team.id} isCoach={profile.role === 'coach'} user={user} />
      </ErrorBoundary>
      <TeamChat teamId={team.id} user={user} />
      {profile.role === 'coach' && <PlayDesigner teamId={team.id} sport={team.sport} />}
      {profile.role === 'coach' && <GamesManager teamId={team.id} isCoach={true} user={user} />}
      {/* Delete Account button for all users */}
      {user && (
        <div className="flex justify-center mt-8">
          <DeleteAccount userId={user.id} onDeleted={() => supabase.auth.signOut()} />
        </div>
      )}
    </div>
  );
}