import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function TeamMembersManager({ teamId, isCoach }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ email: '', role_on_team: 'player', jersey_number: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('team_members')
      .select('user_id, jersey_number, profiles(full_name,email)')
      .eq('team_id', teamId);
    if (error) setError(error.message);
    else setMembers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (teamId) fetchMembers();
    // eslint-disable-next-line
  }, [teamId]);

  const handleFormChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAdd = async e => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    // Try to find user by email
    let userId = null;
    let userFetchError = null;
    try {
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email)
        .maybeSingle();
      userId = users?.id;
      userFetchError = userError;
    } catch (err) {
      // Supabase throws on 406, treat as not found
      userId = null;
    }
    if (!userId) {
      // If not found, send invite and create profile
  const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, role: form.role_on_team }),
      });
      const result = await res.json();
      if (result.error) {
        setError(result.error);
        setFormLoading(false);
        return;
      }
      // Fetch new user id from profiles
      try {
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', form.email)
          .single();
        userId = newProfile?.id;
      } catch (err) {
        userId = null;
      }
    }
    // Add to team_members
    const { error: addError } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role_on_team: form.role_on_team,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
    });
    if (addError) setError(addError.message);
    else {
      setForm({ email: '', role_on_team: 'player', jersey_number: '' });
      fetchMembers();
    }
    setFormLoading(false);
  };

  const handleRemove = async (user_id) => {
    if (!window.confirm('Remove this member from the team?')) return;
    setFormLoading(true);
    const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', user_id);
    if (error) setError(error.message);
    setFormLoading(false);
    fetchMembers();
  };

  const handleEdit = async (user_id, field, value) => {
    setFormLoading(true);
    const { error } = await supabase.from('team_members').update({ [field]: value }).eq('team_id', teamId).eq('user_id', user_id);
    if (error) setError(error.message);
    setFormLoading(false);
    fetchMembers();
  };

  if (loading) return <div>Loading members...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Team Members</h3>
      {isCoach && (
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            name="email"
            placeholder="User Email"
            value={form.email}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded"
            required
          />
          <select
            name="role_on_team"
            value={form.role_on_team}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded"
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="assistant">Assistant</option>
          </select>
          <input
            name="jersey_number"
            placeholder="Jersey #"
            value={form.jersey_number}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded"
            type="number"
            min="0"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            disabled={formLoading}
          >
            Add
          </button>
        </form>
      )}
      <ul className="space-y-2">
        {members.map(m => (
          <li key={m.user_id} className="p-2 bg-gray-100 rounded flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-semibold">
                {m.profiles?.full_name ? m.profiles.full_name : (m.profiles?.email ? m.profiles.email : m.user_id)}
              </span>
              <span className="ml-2 text-sm text-gray-500">Role: {isCoach ? (
                <select
                  value={m.role_on_team}
                  onChange={e => handleEdit(m.user_id, 'role_on_team', e.target.value)}
                  className="border px-1 py-0.5 rounded ml-1"
                  disabled={formLoading}
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="assistant">Assistant</option>
                </select>
              ) : m.role_on_team}</span>
              <span className="ml-2 text-sm text-gray-500">Jersey: {isCoach ? (
                <input
                  type="number"
                  value={m.jersey_number || ''}
                  onChange={e => handleEdit(m.user_id, 'jersey_number', e.target.value)}
                  className="border px-1 py-0.5 rounded ml-1 w-16"
                  disabled={formLoading}
                />
              ) : m.jersey_number}</span>
            </div>
            {isCoach && (
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 mt-2 md:mt-0"
                onClick={() => handleRemove(m.user_id)}
                disabled={formLoading}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!members.length && <div className="mt-2 text-gray-500">No members found.</div>}
    </div>
  );
}