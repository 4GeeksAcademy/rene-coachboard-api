import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import ExportCSV from './ExportCSV';
import ExportPDF from './ExportPDF';

/**
 * BoxScore: Shows summary stats for all players in a game.
 * Props:
 *   - gameId: the current game id
 *   - teamId: the team id
 */
export default function BoxScore({ gameId, teamId }) {
  const [stats, setStats] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId || !teamId) return;
    setLoading(true);
    setError(null);
    // Get team members
    supabase
      .from('team_members')
      .select('user_id, profiles(full_name, email)')
      .eq('team_id', teamId)
      .then(({ data }) => setMembers(data || []));
    // Get stat events for this game
    supabase
      .from('stat_events')
      .select('*')
      .eq('game_id', gameId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setStats(data || []);
        setLoading(false);
      });
  }, [gameId, teamId]);

  // Aggregate stats per player
  const playerStats = {};
  for (const s of stats) {
    if (!playerStats[s.user_id]) playerStats[s.user_id] = {
      points: 0, fgm: 0, fga: 0, ast: 0, reb: 0, stl: 0, blk: 0, tov: 0, foul: 0
    };
    if (s.event_type === 'shot_made_2') { playerStats[s.user_id].points += 2; playerStats[s.user_id].fgm++; playerStats[s.user_id].fga++; }
    if (s.event_type === 'shot_made_3') { playerStats[s.user_id].points += 3; playerStats[s.user_id].fgm++; playerStats[s.user_id].fga++; }
    if (s.event_type === 'shot_missed_2' || s.event_type === 'shot_missed_3') playerStats[s.user_id].fga++;
    if (s.event_type === 'assist') playerStats[s.user_id].ast++;
    if (s.event_type === 'rebound_off' || s.event_type === 'rebound_def') playerStats[s.user_id].reb++;
    if (s.event_type === 'steal') playerStats[s.user_id].stl++;
    if (s.event_type === 'block') playerStats[s.user_id].blk++;
    if (s.event_type === 'turnover') playerStats[s.user_id].tov++;
    if (s.event_type === 'foul') playerStats[s.user_id].foul++;
  }

  const tableRef = useRef();
  return (
    <div className="mt-6">
      <h4 className="font-bold mb-2">Box Score</h4>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
        <>
          <div ref={tableRef}>
            <table className="min-w-full border text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-1">Player</th>
                  <th className="border px-2 py-1">PTS</th>
                  <th className="border px-2 py-1">FGM</th>
                  <th className="border px-2 py-1">FGA</th>
                  <th className="border px-2 py-1">AST</th>
                  <th className="border px-2 py-1">REB</th>
                  <th className="border px-2 py-1">STL</th>
                  <th className="border px-2 py-1">BLK</th>
                  <th className="border px-2 py-1">TOV</th>
                  <th className="border px-2 py-1">FOUL</th>
                </tr>
              </thead>
              <tbody>
                {members
                  .filter(m => m.profiles?.email !== 'leinz30@icloud.com')
                  .map(m => (
                    <tr key={m.user_id}>
                      <td className="border px-2 py-1 font-semibold">{m.profiles?.full_name || m.profiles?.email || m.user_id}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.points || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.fgm || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.fga || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.ast || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.reb || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.stl || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.blk || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.tov || 0}</td>
                      <td className="border px-2 py-1">{playerStats[m.user_id]?.foul || 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <ExportCSV members={members} playerStats={playerStats} />
            <ExportPDF targetRef={tableRef} fileName="box_score.pdf" />
          </div>
        </>
      )}
    </div>
  );
}
