import React, { useEffect } from 'react';
import { Clock, Volume2, VolumeX, Copy, Check, Sparkles, Paintbrush } from 'lucide-react';
import { playTick, getSoundMuted, setSoundMuted } from '../services/sounds.js';

export default function GameHeader({
  round,
  totalRounds,
  timeLeft,
  totalTime,
  isDrawer,
  word,
  maskedWord,
  wordLength,
  drawerName,
  roomId,
  phase
}) {
  const [copied, setCopied] = React.useState(false);
  const [muted, setMutedState] = React.useState(getSoundMuted());

  // Trigger tick sound when timer < 10 seconds
  useEffect(() => {
    if (phase === 'DRAWING' && timeLeft <= 10 && timeLeft > 0) {
      playTick();
    }
  }, [timeLeft, phase]);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const nextState = !muted;
    setSoundMuted(nextState);
    setMutedState(nextState);
  };

  const timeRatio = Math.max(0, Math.min(1, timeLeft / (totalTime || 1)));
  const timerColor = timeLeft <= 10 ? 'text-rose-400 border-rose-500 animate-pulse' : timeLeft <= 25 ? 'text-amber-400 border-amber-500' : 'text-emerald-400 border-emerald-500';

  return (
    <header className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 comic-border comic-shadow flex items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Left: Round & Timer */}
      <div className="flex items-center gap-3">
        {/* Animated Timer Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border-2 ${timerColor} font-black text-lg min-w-[76px] justify-center shadow-inner`}>
          <Clock className="w-5 h-5 shrink-0" />
          <span>{timeLeft}s</span>
        </div>

        {/* Round Badge */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Round</span>
          <span className="text-sm font-black text-white">{round} / {totalRounds}</span>
        </div>
      </div>

      {/* Middle: Word Display or Hints */}
      <div className="flex flex-col items-center justify-center text-center px-2 flex-1 max-w-md">
        {isDrawer ? (
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Paintbrush className="w-3.5 h-3.5" />
              Draw This Word
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase drop-shadow">
              {word || '...'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-300">
                <span className="text-amber-400 font-bold">{drawerName || 'Player'}</span> is drawing
              </span>
              {wordLength > 0 && (
                <span className="bg-slate-700/80 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {wordLength} letters
                </span>
              )}
            </div>
            {/* Masked Hints */}
            <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-[0.25em] font-mono select-all">
              {maskedWord || '_ '.repeat(wordLength || 4)}
            </div>
          </div>
        )}
      </div>

      {/* Right: Controls & Room Code */}
      <div className="flex items-center gap-2">
        {/* Sound toggle */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 transition comic-btn"
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Room invite button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow transition comic-btn"
          title="Copy room link to invite friends"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="font-mono tracking-wider">{roomId}</span>
        </button>
      </div>
    </header>
  );
}
