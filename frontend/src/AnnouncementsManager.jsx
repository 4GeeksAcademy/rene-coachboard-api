import { useState, useEffect, useRef } from 'react';
import { requestNotificationPermission, notify } from './main';
import { supabase, restUrl } from './supabaseClient';

/**
 * AnnouncementsManager: CRUD for team announcements (coach only).
 * Props:
 *   - teamId: the team id
 *   - isCoach: boolean
 *   - user: current user object
 */
export default function AnnouncementsManager({ teamId, isCoach, user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [formLoading, setFormLoading] = useState(false);
  // Only allow coaches to post
  const canPost = isCoach && user && user.id;

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    console.log('Fetching announcements for teamId:', teamId, 'Type:', typeof teamId);
    const response = await supabase
      .from('announcements')
      .select('*')
      .eq('team_id', Number(teamId))
      .order('created_at', { ascending: false });
    console.log('Supabase response:', response);
    const { data, error } = response;
    if (error) setError(error.message);
    else {
      setAnnouncements(data || []);
      console.log('Fetched announcements:', data);
    }
    setLoading(false);
  };

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Initial load only
  useEffect(() => { if (teamId) fetchAnnouncements(); }, [teamId]);

  // Remove any auto-refresh on app focus/visibility. Add a manual refresh button below.

  // Realtime channel for new announcements (for non-coach)
  const lastAnnounceId = useRef(null);
  useEffect(() => {
    if (!teamId || isCoach) return;
    const channel = supabase.channel(`team:${teamId}:announcements`);
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements', filter: `team_id=eq.${teamId}` }, payload => {
      // Avoid duplicate notification on initial load
      if (lastAnnounceId.current && payload.new.id !== lastAnnounceId.current) {
        notify('New Announcement', {
          body: payload.new.title + ': ' + payload.new.content,
        });
      }
      fetchAnnouncements();
      lastAnnounceId.current = payload.new.id;
    });
    channel.subscribe();
    return () => channel.unsubscribe();
  }, [teamId, isCoach]);

  const handleFormChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    if (!form.title || !form.content) {
      setError('Title and content required.');
      setFormLoading(false);
      return;
    }
    // Use Supabase JS client for insert to propagate session for RLS
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        team_id: teamId,
        title: form.title,
        content: form.content,
        created_by: user ? user.id : null,
      })
      .select();
    if (error) {
      setError(error.message);
    } else {
      setForm({ title: '', content: '' });
      await fetchAnnouncements();
    }
    setFormLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this announcement?')) return;
    setFormLoading(true);
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) setError(error.message);
    setFormLoading(false);
    fetchAnnouncements();
  };

  return (
    <div className="mt-6">
      <h4 className="font-bold mb-2">Announcements</h4>
      {canPost ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 mb-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded"
            required
          />
          <textarea
            name="content"
            placeholder="Announcement content"
            value={form.content}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            disabled={formLoading}
          >
            Post Announcement
          </button>
        </form>
      ) : (
        <div className="mb-4 text-gray-500">Only coaches can post announcements.</div>
      )}
      {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
        <ul className="space-y-2">
          {announcements.map(a => (
            <li key={a.id} className="p-2 bg-gray-100 rounded flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-semibold">{a.title}</span>
                <span className="ml-2 text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</span>
                <div className="text-sm mt-1">{a.content}</div>
              </div>
              {isCoach && (
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 mt-2 md:mt-0"
                  onClick={() => handleDelete(a.id)}
                  disabled={formLoading}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
          {!announcements.length && <li className="text-gray-400">No announcements yet.</li>}
        </ul>
      )}
    </div>
  );
}
