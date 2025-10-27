import { useEffect, useRef, useState } from 'react';
import { requestNotificationPermission, notify } from './main';
import { supabase } from './supabaseClient';

/**
 * TeamChat: Realtime chat for team members using Supabase Realtime.
 * Props:
 *   - teamId: the team id
 *   - user: current user object
 */
export default function TeamChat({ teamId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const bottomRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load initial messages
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from('messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        console.log('[TeamChat] Fetched messages:', data, 'error:', error, 'teamId:', teamId);
        if (error) setError(error.message);
        else setMessages(data || []);
        setLoading(false);
      });
  }, [teamId]);

  // Realtime channel for new messages
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase.channel(`team:${teamId}:chat`);
    channelRef.current = channel;
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` }, payload => {
      setMessages(msgs => {
        // Prevent duplicate messages
        if (msgs.some(m => m.id === payload.new.id)) return msgs;
        return [...msgs, payload.new];
      });
      if (payload.new.sender_id !== user.id) {
        notify('New Team Chat Message', {
          body: payload.new.content,
        });
      }
    });
    // Realtime update for edited messages
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` }, payload => {
      setMessages(msgs => msgs.map(m => m.id === payload.new.id ? payload.new : m));
    });
    // Realtime update for deleted messages
    channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` }, payload => {
      setMessages(msgs => msgs.filter(m => m.id !== payload.old.id));
    });
    channel.subscribe();
    return () => channel.unsubscribe();
  }, [teamId, user.id]);

  // Scroll to bottom on new message
  // Remove all auto-scroll logic

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    const { error } = await supabase.from('messages').insert({
      team_id: teamId,
      sender_id: user.id,
      content: input,
    });
    console.log('[TeamChat] Sent message:', { team_id: teamId, sender_id: user.id, content: input }, 'error:', error);
    if (error) setError(error.message);
    setInput('');
  };

  return (
    <div className="mt-6 border rounded p-4 bg-white">
      <h4 className="font-bold mb-2">Team Chat</h4>
      <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded mb-2">
        {loading ? <div>Loading...</div> : (
          <ul className="space-y-1">
            {messages.map(m => (
              <li key={m.id} className={m.sender_id === user.id ? 'text-right' : 'text-left'}>
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-gray-800 max-w-xs break-words">
                  {m.content}
                </span>
                <span className="ml-2 text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</span>
                {/* Edit/Delete buttons for sender */}
                {m.sender_id === user.id && (
                  <span className="ml-2">
                    <button
                      className="text-xs text-blue-600 hover:underline mr-1"
                      onClick={e => {
                        e.preventDefault();
                        (async () => {
                          const newContent = prompt('Edit your message:', m.content);
                          if (newContent && newContent !== m.content) {
                            const { error } = await supabase.from('messages').update({ content: newContent }).eq('id', m.id);
                            if (error) alert('Failed to edit message: ' + error.message);
                          }
                        })();
                      }}
                    >Edit</button>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={async e => {
                        e.preventDefault();
                        if (window.confirm('Delete this message?')) {
                          const { error } = await supabase.from('messages').delete().eq('id', m.id);
                          if (error) {
                            alert('Failed to delete message: ' + error.message);
                          } else {
                            // Re-fetch messages after delete
                            const { data, error: fetchError } = await supabase
                              .from('messages')
                              .select('*')
                              .eq('team_id', teamId)
                              .order('created_at', { ascending: true });
                            if (fetchError) setError(fetchError.message);
                            else setMessages(data || []);
                          }
                        }
                      }}
                    >Delete</button>
                  </span>
                )}
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" type="submit">Send</button>
      </form>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
