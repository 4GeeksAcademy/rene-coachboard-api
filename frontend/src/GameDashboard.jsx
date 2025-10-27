import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import StatEventButtons from './StatEventButtons';
import BoxScore from './BoxScore';
import BoxScoreChart from './BoxScoreChart';

/**
 * GameDashboard: Live game control panel with presence and play call broadcast.
 * Props:
 *   - gameId: the current game id
 *   - teamId: the team id
 *   - user: current user object
 *   - isCoach: boolean (if current user is a coach)
 */
export default function GameDashboard({ gameId, teamId, user, isCoach }) {
  // Substitution and time-on-court state
  const [members, setMembers] = useState([]); // [{user_id, profiles: {full_name, email}}]
  const [lineup, setLineup] = useState([]); // user_ids of starters
  const [subs, setSubs] = useState([]); // substitution events
  const [onCourt, setOnCourt] = useState([]); // user_ids currently on court
  const [gameClock, setGameClock] = useState(0); // ms
  const [clockRunning, setClockRunning] = useState(false);
  const [clockInterval, setClockInterval] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [plays, setPlays] = useState([]);
  const [currentPlay, setCurrentPlay] = useState(null);
  const [broadcastedPlay, setBroadcastedPlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // Load plays for this team
  // Load team members
  useEffect(() => {
    if (!teamId) return;
    supabase
      .from('team_members')
      .select('user_id, profiles(full_name,email)')
      .eq('team_id', teamId)
      .then(({ data }) => setMembers(data || []));
  }, [teamId]);

  // Load starters (lineup)
  useEffect(() => {
    if (!gameId) return;
    supabase
      .from('game_lineups')
      .select('*')
      .eq('game_id', gameId)
      .then(({ data }) => setLineup((data || []).filter(l => l.starter).map(l => l.user_id)));
  }, [gameId]);

  // Load substitutions
  useEffect(() => {
    if (!gameId) return;
    supabase
      .from('substitutions')
      .select('*')
      .eq('game_id', gameId)
      .order('timestamp_ms', { ascending: true })
      .then(({ data }) => setSubs(data || []));
  }, [gameId, clockRunning]);

  // Calculate on-court players
  useEffect(() => {
    // Start with starters
    let current = [...lineup];
    // Apply subs in order
    for (const sub of subs) {
      // Remove out_user_id, add in_user_id
      current = current.filter(u => u !== sub.out_user_id);
      if (!current.includes(sub.in_user_id)) current.push(sub.in_user_id);
    }
    setOnCourt(current);
  }, [lineup, subs]);

  // Game clock logic
  useEffect(() => {
    if (clockRunning) {
      const interval = setInterval(() => setGameClock(c => c + 1000), 1000);
      setClockInterval(interval);
      return () => clearInterval(interval);
    } else if (clockInterval) {
      clearInterval(clockInterval);
      setClockInterval(null);
    }
  }, [clockRunning]);

  // Substitution handler
  const handleSub = async (out_user_id, in_user_id) => {
    await supabase.from('substitutions').insert({
      game_id: gameId,
      out_user_id,
      in_user_id,
      timestamp_ms: gameClock,
      period: 1,
    });
    // Reload subs
    supabase
      .from('substitutions')
      .select('*')
      .eq('game_id', gameId)
      .order('timestamp_ms', { ascending: true })
      .then(({ data }) => setSubs(data || []));
  };

  // Calculate time-on-court for each player
  const getTimeOnCourt = user_id => {
    let total = 0;
    let on = lineup.includes(user_id) ? 0 : null;
    for (const sub of subs) {
      if (sub.in_user_id === user_id) on = sub.timestamp_ms;
      if (sub.out_user_id === user_id && on !== null) {
        total += sub.timestamp_ms - on;
        on = null;
      }
    }
    // If still on court, add time until now
    if (on !== null) total += gameClock - on;
    return Math.floor(total / 1000 / 60); // minutes
  };
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from('plays')
      .select('*')
      .eq('team_id', teamId)
      .then(({ data }) => {
        setPlays(data || []);
        setLoading(false);
      });
  }, [teamId]);

  // Setup Realtime channel for presence and play calls
  useEffect(() => {
    if (!gameId || !user) return;
    const channel = supabase.channel(`game:${gameId}`, {
      config: { presence: { key: user.id } }
    });
    channelRef.current = channel;

    // Subscribe and only set up listeners after joined
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Channel is SUBSCRIBED. Presence and broadcast events will now be tracked.');
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users = Object.values(state).flat().map(u => u.user_email || u.user_id || 'Unknown');
          setOnlineUsers(users);
        });
        channel.track({ user_id: user.id, user_email: user.email });
        channel.on('broadcast', { event: 'play_call' }, payload => {
          setBroadcastedPlay(payload.payload);
        });
      } else {
        console.log('[Realtime] Channel status:', status, '- waiting for SUBSCRIBED before tracking presence/events.');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, user]);

  // Coach: broadcast play call
  const handleCallPlay = () => {
    if (!currentPlay) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'play_call',
      payload: {
        play: currentPlay,
        called_by: user.email,
        ts: Date.now(),
      },
    });
    setBroadcastedPlay({ play: currentPlay, called_by: user.email, ts: Date.now() });
  };

  return (
    <div className="mt-4 p-4 bg-white rounded shadow">
      <h3 className="text-lg font-bold mb-2">Live Game Dashboard</h3>
      <div className="mb-2">
        <span className="font-semibold">Online:</span> {onlineUsers.length ? onlineUsers.join(', ') : 'No one online'}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Game Clock:</span> {Math.floor(gameClock/60000).toString().padStart(2,'0')}:{Math.floor((gameClock%60000)/1000).toString().padStart(2,'0')}
        <button className={`ml-2 px-2 py-1 rounded ${clockRunning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`} onClick={() => setClockRunning(r => !r)}>
          {clockRunning ? 'Pause' : 'Start'}
        </button>
        <button className="ml-2 px-2 py-1 rounded bg-gray-300" onClick={() => { setGameClock(0); setClockRunning(false); }}>Reset</button>
      </div>
      <div className="mb-4">
        <span className="font-semibold">Current Play Call:</span>{' '}
        {broadcastedPlay ? (
          <span className="text-blue-700 font-semibold">{broadcastedPlay.play.title} (by {broadcastedPlay.called_by})</span>
        ) : (
          <span className="text-gray-500">No play called</span>
        )}
      </div>
      {isCoach && (
        <div className="mb-2">
          <select
            className="border rounded px-2 py-1 mr-2"
            value={currentPlay?.id || ''}
            onChange={e => {
              const play = plays.find(p => p.id === Number(e.target.value));
              setCurrentPlay(play);
            }}
          >
            <option value="">Select play to call...</option>
            {plays.map(play => (
              <option key={play.id} value={play.id}>{play.title}</option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={handleCallPlay}
            disabled={!currentPlay}
          >
            Call Play
          </button>
        </div>
      )}
  <BoxScore gameId={gameId} teamId={teamId} />
  <BoxScoreChart gameId={gameId} teamId={teamId} />
  <div className="mt-4">
        <h4 className="font-semibold mb-2">On-Court Players</h4>
        <ul className="space-y-2">
          {onCourt.map(uid => {
            const m = members.find(m => m.user_id === uid);
            return (
              <li key={uid} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m?.profiles?.full_name || m?.profiles?.email || uid}</span>
                  <span className="text-xs text-gray-500">({getTimeOnCourt(uid)} min)</span>
                </div>
                {isCoach && (
                  <StatEventButtons gameId={gameId} userId={uid} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {isCoach && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Log Substitution</h4>
          <form
            className="flex flex-col md:flex-row gap-2 items-center"
            onSubmit={e => {
              e.preventDefault();
              const out = e.target.out_user_id.value;
              const inn = e.target.in_user_id.value;
              if (out && inn && out !== inn) handleSub(out, inn);
            }}
          >
            <select name="out_user_id" className="border rounded px-2 py-1" required>
              <option value="">Out (on court)</option>
              {onCourt.map(uid => {
                const m = members.find(m => m.user_id === uid);
                return <option key={uid} value={uid}>{m?.profiles?.full_name || m?.profiles?.email || uid}</option>;
              })}
            </select>
            <select name="in_user_id" className="border rounded px-2 py-1" required>
              <option value="">In (bench)</option>
              {members.filter(m => !onCourt.includes(m.user_id)).map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email || m.user_id}</option>
              ))}
            </select>
            <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Log Sub</button>
          </form>
        </div>
      )}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Substitution Log</h4>
        <ul className="space-y-1">
          {subs.map((sub, i) => {
            const outM = members.find(m => m.user_id === sub.out_user_id);
            const inM = members.find(m => m.user_id === sub.in_user_id);
            return (
              <li key={i} className="text-sm text-gray-700">
                {Math.floor(sub.timestamp_ms/60000).toString().padStart(2,'0')}:{Math.floor((sub.timestamp_ms%60000)/1000).toString().padStart(2,'0')} - 
                Out: <span className="font-semibold">{outM?.profiles?.full_name || outM?.profiles?.email || sub.out_user_id}</span> → In: <span className="font-semibold">{inM?.profiles?.full_name || inM?.profiles?.email || sub.in_user_id}</span>
              </li>
            );
          })}
          {!subs.length && <li className="text-gray-400">No substitutions yet.</li>}
        </ul>
      </div>
    </div>
  );
}
