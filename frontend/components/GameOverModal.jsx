import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, Home, PlaySquare } from 'lucide-react';
import { AvatarDisplay } from './AvatarCustomizer.jsx';
import { playVictory } from '../services/sounds.js';
import ReplayViewer from './ReplayViewer.jsx';

export default function GameOverModal({
  winner,
  leaderboard = [],
  drawingHistory = [],
  isHost,
  onPlayAgain,
  onLeaveRoom
}) {
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    // Play celebratory sound
    playVictory();

    // Trigger confetti cannon
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 border-4 border-amber-400 p-6 rounded-3xl max-w-lg w-full comic-shadow text-center">
          {/* Crown & Title */}
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-amber-400/20 text-amber-400 rounded-full border-2 border-amber-400 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-wide uppercase drop-shadow mb-1">
            Game Over!
          </h2>
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-5">
            Congratulations to the winners
          </p>

          {/* 3-Tier Podium */}
          <div className="flex items-end justify-center gap-3 mb-5 px-2">
            {/* 2nd Place */}
            {second && (
              <div className="flex flex-col items-center flex-1">
                <AvatarDisplay avatar={second.avatar} size={48} className="mb-1" />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                  {second.name}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold mb-1">
                  {second.score} pts
                </span>
                <div className="w-full h-20 bg-slate-700/80 rounded-t-xl border-t-2 border-slate-500 flex flex-col items-center justify-center">
                  <Medal className="w-6 h-6 text-slate-300" />
                  <span className="text-sm font-black text-slate-300">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {first && (
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  <AvatarDisplay avatar={first.avatar} size={64} className="mb-1 ring-4 ring-amber-400 shadow-lg" />
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full text-xs font-black shadow border border-slate-900">
                    👑
                  </div>
                </div>
                <span className="text-sm font-black text-amber-300 truncate max-w-[100px]">
                  {first.name}
                </span>
                <span className="text-xs font-mono text-amber-400 font-black mb-1">
                  {first.score} pts
                </span>
                <div className="w-full h-28 bg-linear-to-t from-amber-600 to-amber-500 rounded-t-xl border-t-2 border-amber-300 flex flex-col items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-amber-200" />
                  <span className="text-base font-black text-slate-950">1st</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="flex flex-col items-center flex-1">
                <AvatarDisplay avatar={third.avatar} size={44} className="mb-1" />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                  {third.name}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold mb-1">
                  {third.score} pts
                </span>
                <div className="w-full h-14 bg-amber-900/60 rounded-t-xl border-t-2 border-amber-700 flex flex-col items-center justify-center">
                  <Medal className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black text-amber-500">3rd</span>
                </div>
              </div>
            )}
          </div>

          {/* Watch Replay Button */}
          {drawingHistory && drawingHistory.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowReplay(true)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs rounded-xl comic-btn shadow flex items-center justify-center gap-1.5 mx-auto"
              >
                <PlaySquare className="w-4 h-4 text-amber-400" />
                <span>Watch Final Round Replay</span>
              </button>
            </div>
          )}

          {/* Full Leaderboard List */}
          <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700 mb-5 max-h-32 overflow-y-auto space-y-1 text-left">
            {leaderboard.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-1.5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 font-bold text-slate-400">{idx + 1}.</span>
                  <span className="font-bold text-slate-200">{player.name}</span>
                </div>
                <span className="font-mono font-bold text-amber-400">{player.score} pts</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 comic-btn transition text-xs sm:text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Leave Room</span>
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl border-2 border-amber-400 flex items-center justify-center gap-2 comic-btn transition text-xs sm:text-sm shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            ) : (
              <div className="flex-1 py-3 px-4 bg-slate-800/60 text-slate-400 text-xs italic font-medium rounded-2xl border border-slate-700">
                Waiting for host...
              </div>
            )}
          </div>
        </div>
      </div>

      {showReplay && (
        <ReplayViewer
          drawingHistory={drawingHistory}
          word="Final Round"
          onClose={() => setShowReplay(false)}
        />
      )}
    </>
  );
}
