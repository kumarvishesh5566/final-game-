import React from 'react';

export const AVATAR_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#64748b'  // Slate
];

export const EYE_TYPES = ['normal', 'happy', 'wink', 'sunglasses', 'shocked', 'sleep'];
export const MOUTH_TYPES = ['smile', 'grin', 'tongue', 'mustache', 'surprised'];

export function AvatarDisplay({ avatar, size = 48, className = '' }) {
  const color = avatar?.color || '#3b82f6';
  const eyes = avatar?.eyes || 'normal';
  const mouth = avatar?.mouth || 'smile';

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md shrink-0 select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ backgroundColor: color }}
      >
        {/* Shading highlight */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />

        {/* Eyes */}
        {eyes === 'normal' && (
          <g fill="#0f172a">
            <ellipse cx="34" cy="42" rx="6" ry="8" />
            <ellipse cx="66" cy="42" rx="6" ry="8" />
            <circle cx="36" cy="40" r="2.5" fill="#ffffff" />
            <circle cx="68" cy="40" r="2.5" fill="#ffffff" />
          </g>
        )}

        {eyes === 'happy' && (
          <g fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round">
            <path d="M 28 44 Q 34 34 40 44" />
            <path d="M 60 44 Q 66 34 72 44" />
          </g>
        )}

        {eyes === 'wink' && (
          <g stroke="#0f172a" strokeLinecap="round">
            <ellipse cx="34" cy="42" rx="6" ry="8" fill="#0f172a" strokeWidth="0" />
            <circle cx="36" cy="40" r="2.5" fill="#ffffff" />
            <path d="M 59 43 Q 66 35 73 43" fill="none" strokeWidth="5" />
          </g>
        )}

        {eyes === 'sunglasses' && (
          <g fill="#0f172a">
            <polygon points="22,35 46,35 42,50 26,50" />
            <polygon points="54,35 78,35 74,50 58,50" />
            <rect x="44" y="38" width="12" height="4" rx="2" />
            {/* Gloss reflection */}
            <line x1="26" y1="38" x2="38" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="38" x2="70" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {eyes === 'shocked' && (
          <g fill="#ffffff" stroke="#0f172a" strokeWidth="4">
            <circle cx="34" cy="42" r="9" />
            <circle cx="66" cy="42" r="9" />
            <circle cx="34" cy="42" r="3" fill="#0f172a" />
            <circle cx="66" cy="42" r="3" fill="#0f172a" />
          </g>
        )}

        {eyes === 'sleep' && (
          <g fill="none" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round">
            <line x1="26" y1="44" x2="42" y2="44" />
            <line x1="58" y1="44" x2="74" y2="44" />
          </g>
        )}

        {/* Blush cheeks */}
        <circle cx="22" cy="52" r="6" fill="rgba(255, 100, 100, 0.35)" />
        <circle cx="78" cy="52" r="6" fill="rgba(255, 100, 100, 0.35)" />

        {/* Mouths */}
        {mouth === 'smile' && (
          <path
            d="M 35 60 Q 50 74 65 60"
            fill="none"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}

        {mouth === 'grin' && (
          <g>
            <path
              d="M 34 60 Q 50 82 66 60 Z"
              fill="#991b1b"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* White teeth */}
            <path d="M 38 60 Q 50 68 62 60" fill="#ffffff" />
          </g>
        )}

        {mouth === 'tongue' && (
          <g>
            <path
              d="M 36 60 Q 50 70 64 60"
              fill="none"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 46 64 C 46 76, 56 76, 56 64 Z"
              fill="#f43f5e"
              stroke="#0f172a"
              strokeWidth="3"
            />
          </g>
        )}

        {mouth === 'mustache' && (
          <g fill="#0f172a">
            <path d="M 50 60 C 44 54, 32 58, 30 66 C 36 66, 44 64, 50 63 C 56 64, 64 66, 70 66 C 68 58, 56 54, 50 60 Z" />
            <circle cx="50" cy="70" r="3" fill="#0f172a" />
          </g>
        )}

        {mouth === 'surprised' && (
          <ellipse
            cx="50"
            cy="66"
            rx="7"
            ry="9"
            fill="#0f172a"
          />
        )}
      </svg>
    </div>
  );
}

export default function AvatarCustomizer({ avatar, onChange }) {
  const handleRandomize = () => {
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const randomEyes = EYE_TYPES[Math.floor(Math.random() * EYE_TYPES.length)];
    const randomMouth = MOUTH_TYPES[Math.floor(Math.random() * MOUTH_TYPES.length)];
    onChange({
      color: randomColor,
      eyes: randomEyes,
      mouth: randomMouth,
      accessory: 'none'
    });
  };

  const cycleEyes = (dir = 1) => {
    const currentIdx = EYE_TYPES.indexOf(avatar.eyes || 'normal');
    const nextIdx = (currentIdx + dir + EYE_TYPES.length) % EYE_TYPES.length;
    onChange({ ...avatar, eyes: EYE_TYPES[nextIdx] });
  };

  const cycleMouth = (dir = 1) => {
    const currentIdx = MOUTH_TYPES.indexOf(avatar.mouth || 'smile');
    const nextIdx = (currentIdx + dir + MOUTH_TYPES.length) % MOUTH_TYPES.length;
    onChange({ ...avatar, mouth: MOUTH_TYPES[nextIdx] });
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-800/80 p-5 rounded-2xl border-2 border-slate-700/80 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Previous Eyes */}
        <button
          type="button"
          onClick={() => cycleEyes(-1)}
          className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center font-bold text-sm shadow"
          title="Previous Eyes"
        >
          ‹
        </button>

        {/* Avatar Display */}
        <div className="relative group cursor-pointer" onClick={handleRandomize} title="Click to randomize!">
          <AvatarDisplay avatar={avatar} size={84} />
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md border-2 border-slate-900">
            🎲
          </div>
        </div>

        {/* Next Eyes */}
        <button
          type="button"
          onClick={() => cycleEyes(1)}
          className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center font-bold text-sm shadow"
          title="Next Eyes"
        >
          ›
        </button>
      </div>

      {/* Mouth control buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => cycleMouth(-1)}
          className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-semibold"
        >
          ‹ Mouth
        </button>
        <span className="text-xs text-slate-400 capitalize min-w-[70px] text-center">
          {avatar.mouth || 'smile'}
        </span>
        <button
          type="button"
          onClick={() => cycleMouth(1)}
          className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-semibold"
        >
          Mouth ›
        </button>
      </div>

      {/* Color Palette Selection */}
      <div className="grid grid-cols-6 gap-2 pt-1">
        {AVATAR_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...avatar, color: c })}
            style={{ backgroundColor: c }}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              avatar.color === c ? 'border-white scale-110 shadow-md ring-2 ring-amber-400' : 'border-slate-900/60 hover:scale-105'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
