import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * BoxScoreChart: Bar chart for player points in a game.
 * Props:
 *   - gameId: the current game id
 *   - teamId: the team id
 */
export default function BoxScoreChart({ gameId, teamId }) {
  const [stats, setStats] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || !teamId) return;
    setLoading(true);
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
      .then(({ data }) => {
        setStats(data || []);
        setLoading(false);
      });
  }, [gameId, teamId]);

  // Aggregate points per player
  const playerPoints = {};
  for (const s of stats) {
    if (!playerPoints[s.user_id]) playerPoints[s.user_id] = 0;
    if (s.event_type === 'shot_made_2') playerPoints[s.user_id] += 2;
    if (s.event_type === 'shot_made_3') playerPoints[s.user_id] += 3;
  }

  const filteredMembers = members.filter(m => m.profiles?.email !== 'leinz30@icloud.com');
  const labels = filteredMembers.map(m => m.profiles?.full_name || m.profiles?.email || m.user_id);
  const data = {
    labels,
    datasets: [
      {
        label: 'Points',
        data: filteredMembers.map(m => playerPoints[m.user_id] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };

  return (
    <div className="mt-6">
      <h4 className="font-bold mb-2">Points by Player</h4>
      {loading ? <div>Loading chart...</div> : (
        <Bar data={data} options={{
          responsive: true,
          plugins: { legend: { display: false }, title: { display: false } },
          scales: { y: { beginAtZero: true } },
        }} />
      )}
    </div>
  );
}
