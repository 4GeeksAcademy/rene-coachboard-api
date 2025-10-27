import { saveAs } from 'file-saver';

/**
 * ExportCSV: Button to export box score data as CSV.
 * Props:
 *   - members: array of team members [{user_id, profiles: {full_name, email}}]
 *   - playerStats: object keyed by user_id with stat values
 */
export default function ExportCSV({ members, playerStats }) {
  const handleExport = () => {
    const headers = ['Player','PTS','FGM','FGA','AST','REB','STL','BLK','TOV','FOUL'];
    const rows = members.map(m => [
      m.profiles?.full_name || m.profiles?.email || m.user_id,
      playerStats[m.user_id]?.points || 0,
      playerStats[m.user_id]?.fgm || 0,
      playerStats[m.user_id]?.fga || 0,
      playerStats[m.user_id]?.ast || 0,
      playerStats[m.user_id]?.reb || 0,
      playerStats[m.user_id]?.stl || 0,
      playerStats[m.user_id]?.blk || 0,
      playerStats[m.user_id]?.tov || 0,
      playerStats[m.user_id]?.foul || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'box_score.csv');
  };
  return (
    <button className="mt-2 bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800" onClick={handleExport}>
      Export CSV
    </button>
  );
}
