import React, { useState } from 'react';
import { Trophy, Clock, CheckCircle2, PlaySquare } from 'lucide-react';
import { AvatarDisplay } from './AvatarCustomizer.jsx';
import ReplayViewer from './ReplayViewer.jsx';

export default function RoundEndModal({
  word,
  reason,
  scores = [],
  timeLeft = 8,
  drawingHistory = []
}) {
  const [showReplay, setShowReplay] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
        <div className="bg-slate-900 border-4 border-indigo-500 p-6 rounded-3xl max-w-md w-full comic-shadow text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Round Ended
          </span>

          {/* Revealed word */}
          <div className="my-3">
            <p className="text-xs text-slate-400 mb-1">The word was:</p>
            <div className="text-3xl font-black text-amber-400 tracking-wider uppercase drop-shadow-md">
              {word || 'Word'}
            </div>
          </div>

          {reason && (
            <p className="text-xs text-slate-300 mb-3 bg-slate-800/80 py-1 px-3 rounded-full inline-block border border-slate-700">
              {reason}
            </p>
          )}

          {/* Watch Replay Button */}
          {drawingHistory && drawingHistory.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowReplay(true)}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl comic-btn shadow flex items-center justify-center gap-1.5 mx-auto"
              >
                <PlaySquare className="w-4 h-4 fill-current" />
                <span>Watch Drawing Replay</span>
              </button>
            </div>
          )}

          {/* Round Scores Recap */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 mb-5 max-h-44 overflow-y-auto space-y-1.5 text-left">
            {scores.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700/40 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AvatarDisplay avatar={player.avatar} size={28} />
                  <span className="font-bold text-white truncate max-w-[150px]">{player.name}</span>
                  {player.hasGuessed && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono">
                  {player.roundScore > 0 ? (
                    <span className="text-emerald-400 font-black">+{player.roundScore}</span>
                  ) : (
                    <span className="text-slate-500 font-bold">+0</span>
                  )}
                  <span className="text-slate-400 text-[10px]">({player.score} total)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Next round timer */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Next turn in {timeLeft}s...</span>
          </div>
        </div>
      </div>

      {showReplay && (
        <ReplayViewer
          drawingHistory={drawingHistory}
          word={word}
          onClose={() => setShowReplay(false)}
        />
      )}
    </>
  );
}
