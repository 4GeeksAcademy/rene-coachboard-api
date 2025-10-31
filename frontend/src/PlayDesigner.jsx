import { supabase } from './supabaseClient';
import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { Shape, Line } from 'react-konva';
import React from "react";
import AnimatedPlayViewer from './AnimatedPlayViewer';

export default function PlayDesigner({ teamId, sport, viewOnly = false, userRole }) {
  // Debug: log sport prop
  console.log('PlayDesigner sport prop:', sport, typeof sport);
  // State for sport fallback
  const [resolvedSport, setResolvedSport] = useState(sport || '');
  useEffect(() => {
    if ((!sport || sport === '') && teamId) {
      // Fallback: fetch sport from Supabase
      (async () => {
        try {
          const { data, error } = await supabase.from('teams').select('sport').eq('id', teamId).single();
          if (!error && data && data.sport) {
            setResolvedSport(data.sport);
            console.log('Fetched sport from DB:', data.sport);
          }
        } catch (err) {
          console.error('Error fetching sport for team:', err);
        }
      })();
    } else {
      setResolvedSport(sport);
    }
  }, [sport, teamId]);
  // Normalize sport string for comparison
  const normalizedSport = (resolvedSport || '').toLowerCase().trim();
  const [eraseMode, setEraseMode] = useState(false);
  // Toggle erase mode
  const handleToggleErase = () => {
    setEraseMode(e => !e);
  };

  // Erase all marker segments touched by the cursor (on click/drag in erase mode)
  const handleEraseAtPointer = (pointer) => {
    setMarkerLines(lines => {
      // Remove any segment where pointer is close to any point in the line
      return lines.filter(line => {
        return !line.some(pt => Math.hypot(pointer.x - pt.x, pointer.y - pt.y) < 20);
      });
    });
    // Record erase action if recording
    if (isRecording) {
      setRecordedActions(actions => [...actions, { type: 'erase', pointer }]);
    }
  };
  // Erase marker trails
  const handleClearMarkers = () => {
    setMarkerLines([]);
    setCurrentLine([]);
    // Record clear action if recording
    if (isRecording) {
      setRecordedActions(actions => [...actions, { type: 'clear' }]);
    }
  };
  const [players, setPlayers] = useState([
    { id: 1, x: 100, y: 40, color: 'blue' },
    { id: 2, x: 200, y: 40, color: 'red' },
    { id: 3, x: 300, y: 40, color: 'green' },
    { id: 4, x: 400, y: 40, color: 'orange' },
    { id: 5, x: 500, y: 40, color: 'purple' },
  ]);
  const [drawing, setDrawing] = useState(false);
  const [markerLines, setMarkerLines] = useState([]);
  const [recordedLines, setRecordedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState([]);
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [savingRecording, setSavingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  // --- Recording logic overhaul ---
  const [recordedActions, setRecordedActions] = useState([]);
  // Animation state for review modal
  const [animationLines, setAnimationLines] = useState([]);
  const [animationCurrentLine, setAnimationCurrentLine] = useState([]);
  const [animationPlayers, setAnimationPlayers] = useState(players);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [dragAnimating, setDragAnimating] = useState(false);
  const [dragPath, setDragPath] = useState([]);
  const [dragPlayerId, setDragPlayerId] = useState(null);
  const [dragIndex, setDragIndex] = useState(0);

  // --- Player drag path recording ---
  const [playerDragPaths, setPlayerDragPaths] = useState({});

  // Player drag start
  const handlePlayerDragStart = (idx, e) => {
    if (isRecording) {
      setPlayerDragPaths(paths => ({ ...paths, [players[idx].id]: [{ x: players[idx].x, y: players[idx].y, color: players[idx].color }] }));
    }
  };
  // Player drag move
  const handlePlayerDragMove = (idx, e) => {
    if (isRecording) {
      setPlayerDragPaths(paths => {
        const prev = paths[players[idx].id] || [];
        return { ...paths, [players[idx].id]: [...prev, { x: e.target.x(), y: e.target.y(), color: players[idx].color }] };
      });
    }
  };
  // Player drag end
  const handleDrag = (idx, e) => {
    const newPlayers = players.map((p, i) =>
      i === idx ? { ...p, x: e.target.x(), y: e.target.y() } : p
    );
    setPlayers(newPlayers);
    if (isRecording) {
      // Save drag path as a line
      setRecordedActions(actions => {
        const path = playerDragPaths[players[idx].id];
        if (path && path.length > 1) {
          return [...actions, { type: 'playerDragPath', id: players[idx].id, path }];
        }
        return actions;
      });
      setPlayerDragPaths(paths => ({ ...paths, [players[idx].id]: [] }));
      setRecordedActions(actions => [...actions, { type: 'playerMove', id: players[idx].id, x: e.target.x(), y: e.target.y(), color: players[idx].color }]);
    }
  };

  // Start recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordedActions([]);
  };
  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    setReviewOpen(true);
  };

  // Mouse/Touch events for drawing
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (eraseMode) {
      handleEraseAtPointer(pointer);
      setDrawing(false);
      return;
    }
    // Prevent drawing if clicking on a player circle (draggable)
    if (e.target.className === 'Circle') return;
    setDrawing(true);
    setCurrentLine([pointer]);
    // Record mouse down for drawing if recording
    if (isRecording) {
      setRecordedActions(actions => [...actions, { type: 'drawStart', pointer }]);
    }
  };

  // Fix drawing logic: only draw when mouse is down
  const handleMouseMove = (e) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (eraseMode) {
      handleEraseAtPointer(pointer);
      return;
    }
    setCurrentLine((line) => [...line, pointer]);
    // Record mouse move for drawing if recording
    if (isRecording && drawing) {
      setRecordedActions(actions => [...actions, { type: 'drawMove', pointer }]);
    }
  };

  const handleMouseUp = () => {
    if (eraseMode) return;
    if (drawing && currentLine.length > 1) {
      setMarkerLines((lines) => [...lines, currentLine]);
      if (isRecording) {
        setRecordedActions(actions => [...actions, { type: 'drawEnd', line: currentLine }]);
      }
    }
    setDrawing(false);
    setCurrentLine([]);
  };
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [plays, setPlays] = useState([]);
  const [loadingPlays, setLoadingPlays] = useState(true);
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const stageRef = useRef();

  // Load saved plays for this team
  useEffect(() => {
    if (!teamId) return;
    setLoadingPlays(true);
    supabase
      .from('plays')
      .select('*, play_tags(tag)')
      .eq('team_id', teamId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPlays(data || []);
        setLoadingPlays(false);
      });
  }, [teamId]);

  // Clear markerLines and recordedLines on initial mount to ensure no blue lines appear after refresh
  useEffect(() => {
    setMarkerLines([]);
    setRecordedLines([]);
  }, []);

  // Update handleSaveRecording to accept playName argument
  const handleSaveRecording = async (playName) => {
    setSavingRecording(true);
    setRecordingError(null);
    try {
      // Defensive: If no actions, do not save empty play
      if (!recordedActions || recordedActions.length === 0) {
        setRecordingError('No actions recorded. Please record a play before saving.');
        setSavingRecording(false);
        return;
      }
      // Save recordedActions as diagram_json for animation playback
      const diagram_json = JSON.stringify(recordedActions);
      // Capture preview image
      let preview_image = null;
      if (stageRef.current) {
        preview_image = stageRef.current.toDataURL();
      }
      // Get current user id
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const { data: playData, error: dbError } = await supabase.from('plays').insert({
        team_id: teamId,
        title: playName || `Recorded Play ${Date.now()}`,
        sport_type: 'basketball',
        diagram_json,
        visibility: 'team',
        preview_image,
        created_by: userId,
      }).select();
      if (dbError) throw dbError;
      setRecordedLines([]);
      setReviewOpen(false);
      setIsRecording(false);
      setShowNaming(false);
      setTitle("");
      setCustomTitle("");
      // Reload plays
      supabase
        .from('plays')
        .select('*, play_tags(tag)')
        .eq('team_id', teamId)
        .then(({ data }) => setPlays(data || []));
    } catch (err) {
      setRecordingError('Save failed: ' + (err.message || err));
    }
    setSavingRecording(false);
  };
  // Error state for play deletion
  const [deleteError, setDeleteError] = useState(null);
  // Delete play and update UI instantly
  const handleDelete = async (playId) => {
    setDeleteError(null);
    // Optimistically remove from UI
    setPlays(plays => plays.filter(play => play.id !== playId));
    // Debug: log user session
    const user = await supabase.auth.getUser();
    console.log('Delete playId:', playId, 'User:', user);
    const { data: deleteData, error } = await supabase.from('plays').delete().eq('id', playId);
    console.log('Delete result:', deleteData, error);
    if (error) {
      setDeleteError('Delete failed: ' + error.message);
    }
    // Always refetch plays to ensure DB state is correct
    const { data, error: fetchError } = await supabase
      .from('plays')
      .select('*, play_tags(tag)')
      .eq('team_id', teamId);
    if (fetchError) {
      setDeleteError('Fetch after delete failed: ' + fetchError.message);
    }
    setPlays(data || []);
  };

  // Function to handle saving a play
  const handleSavePlay = () => {
    // Capture a preview image
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      setPreviewData(dataURL);
      setShowPreview(true);
    }
  };

  // --- Animation state for viewing saved plays ---
  const [showAnimatedPlay, setShowAnimatedPlay] = useState(false);
  const [animatedPlay, setAnimatedPlay] = useState(null);
  const [savedPlayAnimationPlaying, setSavedPlayAnimationPlaying] = useState(false);

  // Animate review of recorded actions (local recording only)
  // Animation for saved plays is handled in AnimatedPlayViewer

  // Initial player positions (all 5 circles at the top of the 3-point line)
  const initialPlayers = [
    { id: 1, x: 100, y: 40, color: 'blue' },
    { id: 2, x: 200, y: 40, color: 'red' },
    { id: 3, x: 300, y: 40, color: 'green' },
    { id: 4, x: 400, y: 40, color: 'orange' },
    { id: 5, x: 500, y: 40, color: 'purple' },
  ];

  // Reset animation state when opening review or replaying
  const resetAnimation = () => {
    setAnimationStep(0);
    setAnimationPlaying(false);
    setAnimationPlayers([...initialPlayers]);
    setAnimationLines([]);
    setAnimationCurrentLine([]);
    setDragAnimating(false);
    setDragPath([]);
    setDragPlayerId(null);
    setDragIndex(0);
  };
  useEffect(() => {
    if (reviewOpen) {
      resetAnimation();
    }
  }, [reviewOpen]);

  // Reset player positions in main designer
  const handleResetPlayers = () => {
    setPlayers([...initialPlayers]);
  };

  // Add missing state for play naming UI
  const [showNaming, setShowNaming] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-2">Play Designer</h2>
      {!viewOnly && (
        <div className="mb-2 flex flex-col md:flex-row gap-2 items-center">
          {/* Play Recording & Erase Controls */}
          <div className="flex gap-2 items-center">
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-700"
              onClick={handleClearMarkers}
            >
              Clear All Lines
            </button>
            <button
              className="bg-purple-500 text-white px-4 py-1 rounded hover:bg-purple-700"
              onClick={handleResetPlayers}
            >
              Reset Player Positions
            </button>
            <button
              className={`px-4 py-1 rounded ${eraseMode ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-red-600`}
              onClick={handleToggleErase}
            >
              {eraseMode ? 'Erasing...' : 'Erase Mode'}
            </button>
            {!isRecording ? (
              <button
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                onClick={startRecording}
              >
                Start Recording
              </button>
            ) : (
              <>
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
                <button
                  className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                  onClick={() => setReviewOpen(true)}
                >
                  Review Recording
                </button>
                <button
                  className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
                  onClick={() => {
                    setRecordedActions([]);
                    setIsRecording(false);
                    setReviewOpen(false);
                  }}
                >
                  Discard Recording
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* Review Recording Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" style={{overflowY: 'auto'}}>
          <div className="bg-white rounded shadow-lg p-6 w-[640px] max-h-[90vh] overflow-y-auto relative">
            <h3 className="text-lg font-bold mb-2">Review Recording</h3>
            <div className="border rounded bg-gray-100 mb-4 flex flex-col items-center justify-center" style={{background: 'transparent'}}>
              {/* Use AnimatedPlayViewer for local review animation before saving, with controls */}
              <AnimatedPlayViewer
                actions={recordedActions}
                play={{}}
                onClose={() => setReviewOpen(false)}
                showControls={true}
                animationPlaying={animationPlaying}
                resetAnimation={resetAnimation}
                setAnimationPlaying={setAnimationPlaying}
                setShowNaming={setShowNaming}
                savingRecording={savingRecording}
                setRecordedActions={setRecordedActions}
                setIsRecording={setIsRecording}
              />
            </div>
            {/* Play naming/tagging UI appears only after Save Play is clicked */}
            {showNaming && (
              <div className="mt-4 p-4 border rounded bg-gray-50">
                <h4 className="font-semibold mb-2">Name Your Play</h4>
                <select
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="border rounded px-2 py-1 mb-2 w-full"
                >
                  <option value="">Select or enter play name...</option>
                  <option value="Pick and Roll">Pick and Roll</option>
                  <option value="Isolation">Isolation</option>
                  <option value="Zone Offense">Zone Offense</option>
                  <option value="Fast Break">Fast Break</option>
                  <option value="Custom">Custom (type below)</option>
                </select>
                {title === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Custom Play Name"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="border rounded px-2 py-1 mb-2 w-full"
                  />
                )}
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="border rounded px-2 py-1 mb-2 w-full"
                />
                <button
                  onClick={() => {
                    const playName = (title === 'Custom' && customTitle.trim()) ? customTitle.trim() : title.trim();
                    handleSaveRecording(playName);
                    setCustomTitle("");
                  }}
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  disabled={savingRecording || (title === 'Custom' && !customTitle)}
                >
                  {savingRecording ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Search and Filter */}
      <div className="mb-2 flex flex-col md:flex-row gap-2 items-center">
        <input
          type="text"
          placeholder="Search by title"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Filter by tag"
          value={searchTag}
          onChange={e => setSearchTag(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      {/* Main Canvas */}

      {!showAnimatedPlay && (
        <Stage
          width={560}
          height={400}
          className="border rounded bg-white"
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            {normalizedSport === 'football' ? (
              <>
                {/* American Football Field */}
                {/* Field background */}
                <Rect x={0} y={0} width={600} height={400} fill="#228B22" stroke="#fff" strokeWidth={2} />
                {/* Yard lines every 10 yards (every 40px) */}
                {[...Array(11)].map((_, i) => (
                  <Rect key={i} x={i*60} y={0} width={2} height={400} fill="#fff" />
                ))}
                {/* End zones */}
                <Rect x={0} y={0} width={60} height={400} fill="#1E90FF" opacity={0.3} />
                <Rect x={540} y={0} width={60} height={400} fill="#B22222" opacity={0.3} />
                {/* Hash marks */}
                {[...Array(10)].map((_, i) => (
                  <Rect key={'hash-top-'+i} x={i*60+30-5} y={80} width={10} height={4} fill="#fff" />
                ))}
                {[...Array(10)].map((_, i) => (
                  <Rect key={'hash-bottom-'+i} x={i*60+30-5} y={316} width={10} height={4} fill="#fff" />
                ))}
                {/* Marker lines */}
                {markerLines.map((line, idx) => (
                  <Line
                    key={"marker-" + idx}
                    points={line.flatMap(pt => [pt.x, pt.y])}
                    stroke="#FFD700"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}
                {/* Current drawing line */}
                {drawing && currentLine.length > 1 && (
                  <Line
                    points={currentLine.flatMap(pt => [pt.x, pt.y])}
                    stroke="#FFD700"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
                {/* Players */}
                {players.map((p, idx) => (
                  <Circle
                    key={p.id}
                    x={p.x}
                    y={p.y}
                    radius={20}
                    fill={p.color}
                    draggable
                    onDragStart={e => handlePlayerDragStart(idx, e)}
                    onDragMove={e => handlePlayerDragMove(idx, e)}
                    onDragEnd={e => handleDrag(idx, e)}
                  />
                ))}
              </>
            ) : (
              <>
                {/* Basketball Half Court (default) */}
                {/* Baseline */}
                <Rect x={0} y={380} width={560} height={4} fill="#bbb" />
                {/* Sidelines */}
                <Rect x={0} y={0} width={4} height={400} fill="#bbb" />
                <Rect x={556} y={0} width={4} height={400} fill="#bbb" />
                {/* Free throw line (more space above hoop) */}
                <Rect x={180} y={240} width={240} height={4} fill="#bbb" />
                {/* Key/Paint box: width matches free throw line, top at free throw line, bottom aligned with canvas */}
                <Rect x={180} y={240} width={240} height={144} fill="#f7e9d4" stroke="#000" strokeWidth={3} />
                {/* Hoop (rim) at bottom of box, overlapping, lower position */}
                <Circle x={300} y={360} radius={20} stroke="#d32f2f" strokeWidth={4} fill="#fff" />
                {/* Backboard directly below rim */}
                <Rect x={260} y={380} width={80} height={6} fill="#333" />
                {/* 3-point arc: move further up for more space from box */}
                <Shape
                  sceneFunc={(context, shape) => {
                    context.beginPath();
                    // Arc
                    context.arc(300, 340, 220, Math.PI, 2*Math.PI, false);
                    // Left side line: ends exactly at bottom border (y=384+144=528)
                    context.moveTo(80, 340);
                    context.lineTo(80, 528);
                    // Right side line: ends exactly at bottom border (y=528)
                    context.moveTo(520, 340);
                    context.lineTo(520, 528);
                    context.strokeStyle = '#000';
                    context.lineWidth = 3;
                    context.stroke();
                  }}
                />
                {/* Lane markers: 3 evenly spaced dashes on each side of the box, black border */}
                {[0,1,2].map(i => (
                  <Rect key={'left-dash-'+i} x={180-10} y={260 + i*36} width={20} height={4} fill="#bbb" stroke="#000" strokeWidth={2} />
                ))}
                {[0,1,2].map(i => (
                  <Rect key={'right-dash-'+i} x={180+240-10} y={260 + i*36} width={20} height={4} fill="#bbb" stroke="#000" strokeWidth={2} />
                ))}
                {/* Marker lines */}
                {markerLines.map((line, idx) => (
                  <Line
                    key={"marker-" + idx}
                    points={line.flatMap(pt => [pt.x, pt.y])}
                    stroke="#1976d2"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                ))}
                {/* Current drawing line */}
                {drawing && currentLine.length > 1 && (
                  <Line
                    points={currentLine.flatMap(pt => [pt.x, pt.y])}
                    stroke="#1976d2"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
                {/* Players */}
                {players.map((p, idx) => (
                  <Circle
                    key={p.id}
                    x={p.x}
                    y={p.y}
                    radius={20}
                    fill={p.color}
                    draggable
                    onDragStart={e => handlePlayerDragStart(idx, e)}
                    onDragMove={e => handlePlayerDragMove(idx, e)}
                    onDragEnd={e => handleDrag(idx, e)}
                  />
                ))}
              </>
            )}
          </Layer>
        </Stage>
      )}
      {/* Saved Plays List */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Saved Plays</h3>
        {loadingPlays ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-1">
            {plays
              .filter(play =>
                (!search || play.title.toLowerCase().includes(search.toLowerCase())) &&
                (!searchTag || (play.play_tags && play.play_tags.some(t => t.tag.toLowerCase().includes(searchTag.toLowerCase()))))
              )
              .map(play => (
                <li key={play.id} className="p-2 bg-gray-100 rounded flex items-center gap-4">
                  {/* Play preview image if available */}
                  {play.preview_image && (
                    <img src={play.preview_image} alt="Play Preview" className="w-16 h-16 object-contain rounded border" />
                  )}
                  <div>
                    <span className="font-semibold">{play.title}</span>
                    <span className="ml-2 text-xs text-gray-500">{play.sport_type}</span>
                    {play.play_tags && play.play_tags.length > 0 && (
                      <span className="ml-2 text-xs text-green-700">Tags: {play.play_tags.map(t => t.tag).join(', ')}</span>
                    )}
                  </div>
                  <button
                    className="ml-auto bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700"
                    onClick={() => {
                      setAnimatedPlay(play);
                      setShowAnimatedPlay(true);
                    }}
                  >
                    View & Animate
                  </button>
                  <button
                    className="ml-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                    onClick={() => handleDelete(play.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            {(!plays.length || !plays.filter(play =>
              (!search || play.title.toLowerCase().includes(search.toLowerCase())) &&
              (!searchTag || (play.play_tags && play.play_tags.some(t => t.tag.toLowerCase().includes(searchTag.toLowerCase()))))
            ).length) && <div className="text-gray-500">No plays found.</div>}
            {deleteError && <div className="text-red-500 mt-2">{deleteError}</div>}
          </ul>
        )}
      </div>
      {/* Animated Play Modal */}
      {showAnimatedPlay && animatedPlay && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{ position: "relative", background: "#fff", padding: 24, borderRadius: 8, minWidth: 640, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
            <button
              style={{ position: "absolute", top: 16, right: 16, zIndex: 10001 }}
              className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
              onClick={() => {
                setShowAnimatedPlay(false);
                setAnimatedPlay(null);
                setSavedPlayAnimationPlaying(false);
              }}
            >
              Close
            </button>
            <h2 className="text-lg font-bold mb-2">{animatedPlay.title} Animation</h2>
            <div className="flex gap-2 mb-4 justify-end">
              {!savedPlayAnimationPlaying ? (
                <button
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  onClick={() => setSavedPlayAnimationPlaying(true)}
                >
                  Play Animation
                </button>
              ) : (
                <button
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  onClick={() => {
                    setSavedPlayAnimationPlaying(false);
                  }}
                >
                  Stop Animation
                </button>
              )}
            </div>
            <AnimatedPlayViewer
              play={animatedPlay}
              onClose={() => {
                setShowAnimatedPlay(false);
                setAnimatedPlay(null);
                setSavedPlayAnimationPlaying(false);
              }}
              animationPlaying={savedPlayAnimationPlaying}
              setAnimationPlaying={setSavedPlayAnimationPlaying}
            />
          </div>
        </div>
      )}
    </div>
  );
}
