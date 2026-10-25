import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { playPop } from '../services/sounds.js';

export default function WordPickerModal({
  words = [],
  timeLeft = 15,
  onChooseWord
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border-4 border-amber-400 p-6 rounded-3xl max-w-md w-full comic-shadow text-center">
        <div className="flex items-center justify-center gap-2 mb-2 text-amber-400">
          <Sparkles className="w-6 h-6 animate-spin-slow" />
          <h2 className="text-2xl font-black text-white tracking-wide">
            Your Turn to Draw!
          </h2>
          <Sparkles className="w-6 h-6 animate-spin-slow" />
        </div>

        <p className="text-slate-300 text-sm mb-4">
          Choose a word to draw for everyone:
        </p>

        {/* Word Options */}
        <div className="flex flex-col gap-3 mb-6">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => {
                playPop();
                onChooseWord(word);
              }}
              className="py-3.5 px-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-black text-lg rounded-2xl border-2 border-slate-700 hover:border-amber-400 comic-btn transition-all uppercase tracking-wider flex items-center justify-center gap-2 group shadow-md"
            >
              <span>{word}</span>
            </button>
          ))}
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Auto-picking first word in {timeLeft}s</span>
        </div>
      </div>
    </div>
  );
}
