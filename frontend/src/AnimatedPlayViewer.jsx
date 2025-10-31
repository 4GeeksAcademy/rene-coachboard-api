import React, { useEffect, useState, useRef } from "react";
import { Stage, Layer, Rect, Circle, Line, Shape } from "react-konva";

export default function AnimatedPlayViewer({ play, actions: propActions, onClose, showControls, animationPlaying, resetAnimation, setAnimationPlaying, setShowNaming, savingRecording, setRecordedActions, setIsRecording }) {
  // Accept actions directly for local animation, fallback to diagram_json
  let actions = [];
  if (propActions && Array.isArray(propActions)) {
    actions = propActions;
  } else if (play && play.diagram_json) {
    try {
      actions = JSON.parse(play.diagram_json);
    } catch (e) {
      actions = [];
    }
  }

  const initialPlayers = [
    { id: 1, x: 100, y: 40, color: "blue" },
    { id: 2, x: 200, y: 40, color: "red" },
    { id: 3, x: 300, y: 40, color: "green" },
    { id: 4, x: 400, y: 40, color: "orange" },
    { id: 5, x: 500, y: 40, color: "purple" },
  ];
  const [animationStep, setAnimationStep] = useState(0);
  const [localAnimationPlaying, localSetAnimationPlaying] = useState(false);
  const effectiveAnimationPlaying = typeof animationPlaying !== 'undefined' ? animationPlaying : localAnimationPlaying;
  const effectiveSetAnimationPlaying = typeof setAnimationPlaying === 'function' ? setAnimationPlaying : localSetAnimationPlaying;
  const [animationPlayers, setAnimationPlayers] = useState([...initialPlayers]);
  const [animationLines, setAnimationLines] = useState([]);
  const [animationCurrentLine, setAnimationCurrentLine] = useState([]);
  const [dragAnimating, setDragAnimating] = useState(false);
  const [dragPath, setDragPath] = useState([]);
  const [dragPlayerId, setDragPlayerId] = useState(null);
  const [dragIndex, setDragIndex] = useState(0);

  // Ensure animation auto-starts for saved plays when modal opens
  useEffect(() => {
    if (!showControls && actions && actions.length > 0 && !effectiveAnimationPlaying) {
      effectiveSetAnimationPlaying(true);
      setAnimationStep(0);
    }
  }, [showControls, actions, effectiveAnimationPlaying]);

  // Auto-start animation for saved plays (when showControls is false)
  useEffect(() => {
    if (!showControls && actions && actions.length > 0) {
      effectiveSetAnimationPlaying(true);
    }
  }, [showControls, actions]);

  // Debug: log actions and animation state when modal opens
  useEffect(() => {
    console.log('[AnimatedPlayViewer] actions:', actions);
    console.log('[AnimatedPlayViewer] animationPlaying:', effectiveAnimationPlaying);
    // No auto-start. Animation only starts when Play Animation button is pressed.
  }, [showControls, actions, effectiveAnimationPlaying]);

  // Use setTimeout loop for animation steps
  const timeoutRef = useRef();
  useEffect(() => {
    let cancelled = false;
    if (!effectiveAnimationPlaying) return;
    if (!actions || actions.length === 0) {
      effectiveSetAnimationPlaying(false);
      return;
    }
    if (animationStep >= actions.length) {
      effectiveSetAnimationPlaying(false);
      return;
    }
    const action = actions[animationStep];
    let timeout = 400;
    if (dragAnimating) {
      if (dragIndex < dragPath.length && dragPlayerId !== null) {
        const pt = dragPath[dragIndex];
        if (pt && typeof pt.x === "number" && typeof pt.y === "number") {
          setAnimationPlayers(players => players.map(p => p.id === dragPlayerId ? { ...p, x: pt.x, y: pt.y } : p));
        }
        timeoutRef.current = setTimeout(() => {
          if (!cancelled && effectiveAnimationPlaying) setDragIndex(idx => idx + 1);
        }, 40);
        return;
      } else {
        setDragAnimating(false);
        setDragPath([]);
        setDragPlayerId(null);
        setDragIndex(0);
        // Skip redundant playerMove after drag path
        setTimeout(() => {
          if (!cancelled && effectiveAnimationPlaying) {
            let nextStep = animationStep + 1;
            const nextAction = actions[nextStep];
            if (nextAction && nextAction.type === "playerMove" && nextAction.id === dragPlayerId) {
              nextStep += 1;
            }
            setAnimationStep(nextStep);
          }
        }, 10);
        return;
      }
    }
    if (action.type === "drawStart") {
      setAnimationCurrentLine([action.pointer]);
      timeout = 200;
    } else if (action.type === "drawMove") {
      setAnimationCurrentLine(line => [...line, action.pointer]);
      timeout = 40;
    } else if (action.type === "drawEnd") {
      setAnimationLines(lines => [...lines, animationCurrentLine]);
      setAnimationCurrentLine([]);
      timeout = 200;
    } else if (action.type === "playerDragPath" && Array.isArray(action.path) && action.path.length > 1) {
      setDragAnimating(true);
      setDragPath(action.path);
      setDragPlayerId(action.id);
      setDragIndex(0);
      return;
    } else if (action.type === "playerDragPath") {
      setTimeout(() => {
        if (!cancelled && effectiveAnimationPlaying) setAnimationStep(step => step + 1);
      }, 10);
      return;
    } else if (action.type === "playerMove") {
      setAnimationPlayers(players => players.map(p => p.id === action.id ? { ...p, x: action.x, y: action.y } : p));
      timeout = 300;
    } else if (action.type === "erase") {
      setAnimationLines(lines => lines.filter(line => !line.some(pt => Math.hypot(action.pointer.x - pt.x, action.pointer.y - pt.y) < 20)));
      timeout = 200;
    } else if (action.type === "clear") {
      setAnimationLines([]);
      timeout = 200;
    }
    timeoutRef.current = setTimeout(() => {
      if (!cancelled && effectiveAnimationPlaying) setAnimationStep(step => step + 1);
    }, timeout);
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [effectiveAnimationPlaying, animationStep, dragAnimating, dragIndex]);

  // Reset animation state
  const localResetAnimation = () => {
    setAnimationStep(0);
    setAnimationPlayers([...initialPlayers]);
    setAnimationLines([]);
    setAnimationCurrentLine([]);
    setDragAnimating(false);
    setDragPath([]);
    setDragPlayerId(null);
    setDragIndex(0);
    effectiveSetAnimationPlaying(false);
  };
  const effectiveResetAnimation = typeof resetAnimation === 'function' ? resetAnimation : localResetAnimation;

  useEffect(() => {
    effectiveResetAnimation();
  }, [play.id]);

  return (
    <div>
      <Stage width={600} height={400} className="border rounded bg-white">
        <Layer>
          {/* Baseline */}
          <Rect x={0} y={380} width={600} height={4} fill="#bbb" />
          {/* Sidelines */}
          <Rect x={0} y={0} width={4} height={400} fill="#bbb" />
          <Rect x={596} y={0} width={4} height={400} fill="#bbb" />
          {/* Free throw line */}
          <Rect x={180} y={240} width={240} height={4} fill="#bbb" />
          {/* Key/Paint box */}
          <Rect x={180} y={240} width={240} height={144} fill="#f7e9d4" stroke="#000" strokeWidth={3} />
          {/* Hoop (rim) */}
          <Circle x={300} y={360} radius={20} stroke="#d32f2f" strokeWidth={4} fill="#fff" />
          {/* Backboard */}
          <Rect x={260} y={380} width={80} height={6} fill="#333" />
          {/* 3-point arc */}
          <Shape
            sceneFunc={(context, shape) => {
              context.beginPath();
              context.arc(300, 340, 220, Math.PI, 2*Math.PI, false);
              context.moveTo(80, 340);
              context.lineTo(80, 528);
              context.moveTo(520, 340);
              context.lineTo(520, 528);
              context.strokeStyle = '#000';
              context.lineWidth = 3;
              context.stroke();
            }}
          />
          {/* Lane markers */}
          {[0,1,2].map(i => (
            <Rect key={'left-dash-'+i} x={180-10} y={260 + i*36} width={20} height={4} fill="#bbb" stroke="#000" strokeWidth={2} />
          ))}
          {[0,1,2].map(i => (
            <Rect key={'right-dash-'+i} x={180+240-10} y={260 + i*36} width={20} height={4} fill="#bbb" stroke="#000" strokeWidth={2} />
          ))}
          {/* Animated marker lines */}
          {animationLines.map((line, idx) => (
            <Line
              key={"anim-line-" + idx}
              points={line.flatMap(pt => [pt.x, pt.y])}
              stroke="#1976d2"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {/* Animated current drawing line */}
          {animationCurrentLine.length > 1 && (
            <Line
              points={animationCurrentLine.flatMap(pt => [pt.x, pt.y])}
              stroke="#1976d2"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {/* Animated player drag path (dashed) only during dragAnimating */}
          {dragAnimating && dragPath.length > 1 && (
            <Line
              key={"anim-player-path-active"}
              points={dragPath.flatMap(pt => [pt.x, pt.y])}
              stroke={dragPath[0].color}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              dash={[8, 8]}
            />
          )}
          {/* Animated player positions */}
          {animationPlayers.map((p, idx) => (
            <Circle
              key={p.id}
              x={p.x}
              y={p.y}
              radius={20}
              fill={p.color}
            />
          ))}
        </Layer>
      </Stage>
      {showControls && (
        <div className="flex gap-2 mt-4 justify-end">
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            onClick={() => {
              effectiveResetAnimation();
              setAnimationStep(0);
              effectiveSetAnimationPlaying(true);
            }}
            disabled={effectiveAnimationPlaying}
          >
            {effectiveAnimationPlaying ? 'Playing...' : 'Play Animation'}
          </button>
          <button
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            onClick={() => setShowNaming(true)}
            disabled={savingRecording || effectiveAnimationPlaying}
          >
            Save & Name Play
          </button>
          <button
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            onClick={() => {
              setRecordedActions([]);
              setIsRecording(false);
              if (onClose) onClose();
            }}
            disabled={effectiveAnimationPlaying}
          >
            Delete
          </button>
          <button
            className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
            onClick={onClose}
            disabled={effectiveAnimationPlaying}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}