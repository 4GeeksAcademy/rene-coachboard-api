import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'injured', label: 'Injured' },
  { value: 'absent', label: 'Absent' },
  { value: 'questionable', label: 'Questionable' },
];

export default function AvailabilityManager({ teamId, user, profile, isCoach }) {
  const [avail, setAvail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('available');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchAvail = async (filterDateVal) => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('availability')
  .select('*, profiles:user_id (full_name)')
      .eq('team_id', teamId)
      .eq('date', filterDateVal || filterDate);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setAvail(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (teamId) fetchAvail();
    // eslint-disable-next-line
  }, [teamId, filterDate]);

  const handleSubmit = async e => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    const { error } = await supabase.from('availability').upsert({
      user_id: user.id,
      team_id: teamId,
      date,
      status,
      note,
    });
    if (error) setError(error.message);
    setFormLoading(false);
    fetchAvail(date);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Availability</h3>
      {isCoach ? (
        <div className="mb-2 flex flex-col md:flex-row gap-2 items-center">
          <label>Date: <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded px-2 py-1 ml-1" /></label>
          <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => fetchAvail(filterDate)} disabled={loading}>Filter</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-2">
          <div className="flex flex-col md:flex-row gap-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-2 py-1" required />
            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1">
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 w-full md:w-auto" disabled={formLoading}>Save</button>
        </form>
      )}
      {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
        <ul className="space-y-1">
          {avail.map(a => (
            <li key={a.user_id + a.date} className="p-2 bg-gray-100 rounded flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-semibold">{a.profiles?.full_name || a.profiles?.email || a.user_id}</span>
                <span className="ml-2 text-sm text-gray-500">{a.status}</span>
                {a.note && <span className="ml-2 text-xs text-gray-400">({a.note})</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!avail.length && !loading && <div className="mt-2 text-gray-500">No availability records found.</div>}
    </div>
  );
}