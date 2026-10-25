import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Smile } from 'lucide-react';
import { playCorrect, playClose } from '../services/sounds.js';

export default function ChatAndGuess({
  socket,
  messages = [],
  isDrawer,
  hasGuessed,
  phase
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio trigger on message types
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest.type === 'correct_guess') {
      playCorrect();
    } else if (latest.type === 'close_guess') {
      playClose();
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !socket) return;

    socket.emit('guess', { text });
    setInputText('');
  };

  const sendQuickEmoji = (emoji) => {
    if (!socket) return;
    socket.emit('guess', { text: emoji });
  };

  const getPlaceholder = () => {
    if (phase !== 'DRAWING') return 'Type a message...';
    if (isDrawer) return "You're drawing! Chat with guessers...";
    if (hasGuessed) return "You guessed it! Chat safely here...";
    return 'Type your guess here...';
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-2xl comic-border comic-shadow overflow-hidden select-none">
      {/* Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b-2 border-slate-700/80 flex items-center justify-between">
        <span className="font-black text-xs uppercase tracking-wider text-slate-300">
          Chat & Guesses
        </span>
        {hasGuessed && phase === 'DRAWING' && (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Guessed!
          </span>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.map((msg) => {
          if (msg.system) {
            if (msg.type === 'correct_guess') {
              return (
                <div
                  key={msg.id}
                  className="bg-emerald-950/70 border-2 border-emerald-500/70 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-bounce-short"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                  {msg.points && (
                    <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-md font-black text-[11px]">
                      +{msg.points} pts
                    </span>
                  )}
                </div>
              );
            }

            if (msg.type === 'close_guess') {
              return (
                <div
                  key={msg.id}
                  className="bg-amber-950/60 border border-amber-500/60 text-amber-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            // General system message (join/leave)
            return (
              <div
                key={msg.id}
                className="text-center text-[11px] text-slate-400 py-0.5 italic"
              >
                {msg.text}
              </div>
            );
          }

          // User message
          const isGuessedUser = msg.alreadyGuessed;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 px-2.5 py-1 rounded-xl text-xs break-words ${
                isGuessedUser
                  ? 'bg-emerald-900/25 border border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/60 text-slate-200'
              }`}
            >
              <span className="font-bold text-slate-100 shrink-0">
                {msg.playerName}:
              </span>
              <span className={`flex-1 ${isGuessedUser ? 'text-emerald-300 font-medium' : 'text-slate-200'}`}>
                {msg.text}
              </span>
              {msg.time && (
                <span className="text-[10px] text-slate-500 shrink-0 self-center">
                  {msg.time}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick reaction emojis */}
      <div className="bg-slate-900/60 px-3 py-1 flex items-center gap-1.5 border-t border-slate-700/60 overflow-x-auto">
        {['👍', '😂', '🔥', '🎨', '👏', '🤔', '❤️'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform text-sm p-1 rounded hover:bg-slate-800"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-900 border-t-2 border-slate-700/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={getPlaceholder()}
          maxLength={60}
          className="flex-1 bg-slate-800 text-white placeholder-slate-400 px-3 py-2 rounded-xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl comic-btn flex items-center justify-center transition"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
