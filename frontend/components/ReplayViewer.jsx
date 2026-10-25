import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, X, FastForward } from 'lucide-react';

export default function ReplayViewer({ drawingHistory = [], word = '', onClose }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(2); // 1x, 2x, 4x
  const [currentIdx, setCurrentIdx] = useState(0);

  // Flatten strokes into fine-grained point steps
  const steps = [];
  drawingHistory.forEach((stroke) => {
    if (stroke.type === 'fill') {
      steps.push({ type: 'fill', stroke });
    } else if (stroke.type === 'stroke' && stroke.points) {
      for (let i = 0; i < stroke.points.length; i++) {
        steps.push({
          type: 'point',
          color: stroke.tool === 'eraser' ? '#ffffff' : stroke.color,
          size: stroke.size,
          point: stroke.points[i],
          isStart: i === 0,
          prevPoint: i > 0 ? stroke.points[i - 1] : null
        });
      }
    }
  });

  const totalSteps = steps.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawUpTo = (targetIdx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < targetIdx; i++) {
      const step = steps[i];
      if (!step) continue;
      if (step.type === 'point') {
        ctx.beginPath();
        ctx.strokeStyle = step.color;
        ctx.lineWidth = step.size * (600 / 800);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (step.isStart) {
          ctx.arc(step.point.x * 600, step.point.y * 420, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = step.color;
          ctx.fill();
        } else if (step.prevPoint) {
          ctx.moveTo(step.prevPoint.x * 600, step.prevPoint.y * 420);
          ctx.lineTo(step.point.x * 600, step.point.y * 420);
          ctx.stroke();
        }
      }
    }
  };

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let idx = currentIdx;
    const interval = setInterval(() => {
      idx += speed;
      if (idx >= totalSteps) {
        idx = totalSteps;
        setIsPlaying(false);
      }
      setCurrentIdx(idx);
      drawUpTo(idx);
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, speed, totalSteps]);

  const handleRestart = () => {
    setCurrentIdx(0);
    drawUpTo(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border-4 border-amber-400 p-5 rounded-3xl max-w-lg w-full comic-shadow flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Round Drawing Replay
            </span>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {word ? `"${word}"` : 'Drawing Replay'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Replay Canvas */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-white flex items-center justify-center shadow-inner">
          <canvas ref={canvasRef} className="w-full h-auto object-contain" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Play/Pause & Restart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black flex items-center justify-center transition comic-btn"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center justify-center transition border border-slate-700"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex-1 mx-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-amber-400 h-full transition-all duration-75"
                style={{ width: `${totalSteps > 0 ? (currentIdx / totalSteps) * 100 : 0}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 text-center mt-1 font-mono">
              {Math.round(totalSteps > 0 ? (currentIdx / totalSteps) * 100 : 0)}%
            </div>
          </div>

          {/* Speed selector (1x, 2x, 4x) */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs font-black rounded-lg transition ${
                  speed === s ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
