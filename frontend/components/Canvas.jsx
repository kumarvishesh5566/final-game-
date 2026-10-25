import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Paintbrush, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  PaintBucket,
  Eye
} from 'lucide-react';
import { playPop } from '../services/sounds.js';

export const COLOR_PALETTE = [
  '#000000', '#4a4a4a', '#8a8a8a', '#ffffff',
  '#b91c1c', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#0284c7', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#ec4899', '#78350f',
  '#b45309', '#fde047'
];

export const BRUSH_SIZES = [
  { size: 3, label: 'Fine' },
  { size: 7, label: 'Medium' },
  { size: 14, label: 'Thick' },
  { size: 28, label: 'Jumbo' }
];

export default function Canvas({ isDrawer, socket, drawingHistory = [], disabled = false }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  const [activeTool, setActiveTool] = useState('brush'); // 'brush', 'eraser', 'fill'
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(7);
  const [strokesList, setStrokesList] = useState([]);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use internal standard resolution 800x550
    canvas.width = 800;
    canvas.height = 550;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    // Initial white background
    clearCanvasVisual();
    // Render existing drawing history
    renderFullHistory(drawingHistory);
  }, []);

  // Listen to remote socket events
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDrawStart = (data) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      const x = data.x * canvas.width;
      const y = data.y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
      ctx.lineWidth = data.size;
    };

    const handleRemoteDrawMove = (data) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      const x = data.x * canvas.width;
      const y = data.y * canvas.height;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handleRemoteDrawEnd = () => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.closePath();
    };

    const handleRemoteFill = (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      floodFill(Math.round(data.x * canvas.width), Math.round(data.y * canvas.height), data.color);
    };

    const handleRemoteClear = () => {
      clearCanvasVisual();
      setStrokesList([]);
    };

    const handleRemoteSyncHistory = (data) => {
      if (data && Array.isArray(data.drawingHistory)) {
        renderFullHistory(data.drawingHistory);
      }
    };

    socket.on('draw_start', handleRemoteDrawStart);
    socket.on('draw_move', handleRemoteDrawMove);
    socket.on('draw_end', handleRemoteDrawEnd);
    socket.on('fill_bucket', handleRemoteFill);
    socket.on('canvas_clear', handleRemoteClear);
    socket.on('canvas_sync_history', handleRemoteSyncHistory);

    return () => {
      socket.off('draw_start', handleRemoteDrawStart);
      socket.off('draw_move', handleRemoteDrawMove);
      socket.off('draw_end', handleRemoteDrawEnd);
      socket.off('fill_bucket', handleRemoteFill);
      socket.off('canvas_clear', handleRemoteClear);
      socket.off('canvas_sync_history', handleRemoteSyncHistory);
    };
  }, [socket]);

  // Sync when history updates from prop
  useEffect(() => {
    if (drawingHistory) {
      renderFullHistory(drawingHistory);
    }
  }, [drawingHistory]);

  const clearCanvasVisual = () => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const renderFullHistory = useCallback((history) => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    clearCanvasVisual();

    if (!Array.isArray(history)) return;

    for (const item of history) {
      if (item.type === 'stroke' && item.points && item.points.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = item.tool === 'eraser' ? '#ffffff' : item.color;
        ctx.lineWidth = item.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const p0 = item.points[0];
        ctx.moveTo(p0.x * canvas.width, p0.y * canvas.height);

        for (let i = 1; i < item.points.length; i++) {
          const pt = item.points[i];
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
        ctx.stroke();
        ctx.closePath();
      } else if (item.type === 'fill') {
        floodFill(Math.round(item.x * canvas.width), Math.round(item.y * canvas.height), item.color);
      }
    }
  }, []);

  // Normalization helper
  const getNormalizedCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  // Drawing event handlers
  const handlePointerDown = (e) => {
    if (!isDrawer || disabled) return;
    e.preventDefault();

    const { x, y } = getNormalizedCoords(e);
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    if (activeTool === 'fill') {
      const px = Math.round(x * canvas.width);
      const py = Math.round(y * canvas.height);
      floodFill(px, py, activeColor);
      socket?.emit('fill_bucket', { x, y, color: activeColor });
      return;
    }

    isDrawingRef.current = true;
    const strokeColor = activeTool === 'eraser' ? '#ffffff' : activeColor;
    
    ctx.beginPath();
    ctx.moveTo(x * canvas.width, y * canvas.height);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = brushSize;

    currentStrokeRef.current = {
      type: 'stroke',
      color: strokeColor,
      size: brushSize,
      tool: activeTool,
      points: [{ x, y }]
    };

    socket?.emit('draw_start', {
      x,
      y,
      color: strokeColor,
      size: brushSize,
      tool: activeTool
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawer || disabled || !isDrawingRef.current) return;
    e.preventDefault();

    const { x, y } = getNormalizedCoords(e);
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.stroke();

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push({ x, y });
    }

    socket?.emit('draw_move', { x, y });
  };

  const handlePointerUp = (e) => {
    if (!isDrawer || disabled || !isDrawingRef.current) return;
    e.preventDefault();

    isDrawingRef.current = false;
    const ctx = contextRef.current;
    if (ctx) ctx.closePath();

    if (currentStrokeRef.current) {
      setStrokesList(prev => [...prev, currentStrokeRef.current]);
      currentStrokeRef.current = null;
    }

    socket?.emit('draw_end');
  };

  // Flood fill algorithm for bucket tool
  const floodFill = (startX, startY, fillHex) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Convert hex to rgb
    const r = parseInt(fillHex.slice(1, 3), 16);
    const g = parseInt(fillHex.slice(3, 5), 16);
    const b = parseInt(fillHex.slice(5, 7), 16);
    const a = 255;

    const startIndex = (startY * canvas.width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Already target color
    if (targetR === r && targetG === g && targetB === b && targetA === a) return;

    const matchColor = (idx) => {
      const dr = Math.abs(data[idx] - targetR);
      const dg = Math.abs(data[idx + 1] - targetG);
      const db = Math.abs(data[idx + 2] - targetB);
      return (dr + dg + db) < 30; // Color tolerance
    };

    const pixelStack = [[startX, startY]];
    const width = canvas.width;
    const height = canvas.height;

    while (pixelStack.length > 0) {
      const [curX, curY] = pixelStack.pop();
      let y1 = curY;
      let idx = (y1 * width + curX) * 4;

      while (y1 >= 0 && matchColor(idx)) {
        y1--;
        idx -= width * 4;
      }
      y1++;
      idx += width * 4;

      let reachLeft = false;
      let reachRight = false;

      while (y1 < height && matchColor(idx)) {
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;

        if (curX > 0) {
          if (matchColor(idx - 4)) {
            if (!reachLeft) {
              pixelStack.push([curX - 1, y1]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (curX < width - 1) {
          if (matchColor(idx + 4)) {
            if (!reachRight) {
              pixelStack.push([curX + 1, y1]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        y1++;
        idx += width * 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const handleClear = () => {
    if (!isDrawer || disabled) return;
    playPop();
    clearCanvasVisual();
    setStrokesList([]);
    socket?.emit('canvas_clear');
  };

  const handleUndo = () => {
    if (!isDrawer || disabled) return;
    playPop();
    socket?.emit('draw_undo');
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-800 rounded-2xl comic-border comic-shadow overflow-hidden select-none">
      {/* Canvas container */}
      <div className="relative flex-1 bg-white flex items-center justify-center overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain touch-none"
        />

        {/* Spectator / Guesser watermarked overlay when not drawing */}
        {!isDrawer && (
          <div className="absolute top-3 right-3 pointer-events-none bg-slate-900/60 backdrop-blur-xs text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Guesser View</span>
          </div>
        )}
      </div>

      {/* Drawer Toolbar (Only displayed / enabled for active Drawer) */}
      {isDrawer && !disabled && (
        <div className="bg-slate-900 border-t-2 border-slate-700/80 p-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => { playPop(); setActiveTool('brush'); }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                activeTool === 'brush' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Brush / Pen"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            <button
              type="button"
              onClick={() => { playPop(); setActiveTool('fill'); }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                activeTool === 'fill' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Fill Bucket"
            >
              <PaintBucket className="w-4 h-4" />
              <span className="hidden sm:inline">Fill</span>
            </button>

            <button
              type="button"
              onClick={() => { playPop(); setActiveTool('eraser'); }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                activeTool === 'eraser' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:bg-slate-700'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Eraser</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            {BRUSH_SIZES.map(b => (
              <button
                key={b.size}
                type="button"
                onClick={() => { playPop(); setBrushSize(b.size); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  brushSize === b.size ? 'bg-amber-500 ring-2 ring-white' : 'hover:bg-slate-700'
                }`}
                title={`${b.label} (${b.size}px)`}
              >
                <div
                  className="rounded-full bg-white"
                  style={{
                    width: Math.max(3, Math.min(18, b.size * 0.8)),
                    height: Math.max(3, Math.min(18, b.size * 0.8)),
                    backgroundColor: brushSize === b.size ? '#0f172a' : '#ffffff'
                  }}
                />
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1 max-w-[280px] sm:max-w-none flex-wrap">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  playPop();
                  setActiveColor(c);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-md border transition-transform ${
                  activeColor === c && activeTool !== 'eraser'
                    ? 'border-white scale-115 ring-2 ring-amber-400 z-10'
                    : 'border-slate-800 hover:scale-110'
                }`}
              />
            ))}
            
            {/* Native color picker */}
            <label className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer border border-slate-600 hover:scale-110 transition-transform bg-linear-to-tr from-rose-500 via-amber-400 to-blue-500 flex items-center justify-center">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => {
                  setActiveColor(e.target.value);
                  if (activeTool === 'eraser') setActiveTool('brush');
                }}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Actions: Undo and Clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1 text-xs font-bold active:scale-95 transition"
              title="Undo Last Stroke"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="p-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl border border-rose-800/80 flex items-center gap-1 text-xs font-bold active:scale-95 transition"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
