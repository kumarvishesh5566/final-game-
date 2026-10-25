import React, { useState } from 'react';
import { Crown, Paintbrush, Check, UserMinus, ShieldAlert, Eye, Ban, Flag, UserCheck } from 'lucide-react';
import { AvatarDisplay } from './AvatarCustomizer.jsx';

export default function Scoreboard({
  players = [],
  currentDrawerId,
  currentUserId,
  isHost,
  socket,
  phase
}) {
  const [modTarget, setModTarget] = useState(null);
  const [modAction, setModAction] = useState('menu'); // 'menu', 'kick', 'ban', 'report'
  const [reportReason, setReportReason] = useState('Inappropriate drawing');

  // Sort players by score descending (spectators listed after active players)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isSpectator && !b.isSpectator) return 1;
    if (!a.isSpectator && b.isSpectator) return -1;
    return b.score - a.score;
  });

  const currentPlayer = players.find(p => p.id === currentUserId);

  const handleVoteKick = (playerId) => {
    if (!socket) return;
    socket.emit('vote_kick', { targetPlayerId: playerId });
    closeModModal();
  };

  const handleBan = (playerId) => {
    if (!socket) return;
    socket.emit('ban_player', { targetPlayerId: playerId });
    closeModModal();
  };

  const handleReport = (playerId) => {
    if (!socket) return;
    socket.emit('report_player', { targetPlayerId: playerId, reason: reportReason });
    closeModModal();
  };

  const handleToggleSpectator = () => {
    if (!socket) return;
    socket.emit('toggle_spectator');
  };

  const closeModModal = () => {
    setModTarget(null);
    setModAction('menu');
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-2xl comic-border comic-shadow overflow-hidden select-none">
      {/* Title */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b-2 border-slate-700/80 flex items-center justify-between">
        <span className="font-black text-xs uppercase tracking-wider text-slate-300">
          Leaderboard ({players.length})
        </span>
        <span className="text-[10px] text-slate-400 font-bold">
          Points
        </span>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sortedPlayers.map((player, index) => {
          const isDrawer = player.id === currentDrawerId && phase === 'DRAWING';
          const isCurrent = player.id === currentUserId;
          const rank = index + 1;

          let rankBadge = `${rank}`;
          let rankColor = 'text-slate-400';
          if (rank === 1 && !player.isSpectator) rankColor = 'text-amber-400 font-black';
          else if (rank === 2 && !player.isSpectator) rankColor = 'text-slate-200 font-bold';
          else if (rank === 3 && !player.isSpectator) rankColor = 'text-amber-600 font-bold';

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50'
                  : player.hasGuessed
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : player.isSpectator
                  ? 'bg-slate-900/40 border-slate-800 opacity-75'
                  : 'bg-slate-900/60 border-slate-700/60'
              }`}
            >
              {/* Rank */}
              <div className={`w-5 text-center text-xs ${rankColor}`}>
                {player.isSpectator ? <Eye className="w-3.5 h-3.5 text-slate-500 mx-auto" /> : rankBadge}
              </div>

              {/* Avatar */}
              <div className="relative">
                <AvatarDisplay avatar={player.avatar} size={36} />
                {player.isHost && (
                  <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1 drop-shadow" />
                )}
              </div>

              {/* Player details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-300' : 'text-slate-100'}`}>
                    {player.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1 rounded font-bold">
                      You
                    </span>
                  )}
                  {player.isSpectator && (
                    <span className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded font-medium">
                      Spectating
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono font-bold text-amber-300">{player.score} pts</span>
                  {player.roundScore > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">+{player.roundScore}</span>
                  )}
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1 shrink-0">
                {isDrawer && (
                  <div className="p-1 bg-amber-400/20 text-amber-400 rounded-lg animate-pulse" title="Drawing now">
                    <Paintbrush className="w-3.5 h-3.5" />
                  </div>
                )}

                {player.hasGuessed && phase === 'DRAWING' && (
                  <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg" title="Guessed the word!">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Moderation Option (Can't moderate yourself) */}
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      setModTarget(player);
                      setModAction('menu');
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition opacity-60 hover:opacity-100"
                    title="Player options (Kick/Ban/Report)"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Spectate / Play Toggle */}
      {currentPlayer && (
        <div className="p-2 border-t border-slate-700/80 bg-slate-900/50">
          <button
            type="button"
            onClick={handleToggleSpectator}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              currentPlayer.isSpectator
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {currentPlayer.isSpectator ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Switch to Player Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Spectate (Watch Only)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Moderation Modal (Kick / Ban / Report) */}
      {modTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-800 border-2 border-slate-700 p-5 rounded-2xl max-w-xs w-full comic-shadow text-center">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            
            <h3 className="text-base font-bold text-white mb-1">
              Player Moderation
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Action for <span className="font-bold text-amber-400">{modTarget.name}</span>
            </p>

            {modAction === 'menu' && (
              <div className="space-y-2">
                {isHost ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setModAction('kick')}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-rose-300 flex items-center justify-center gap-2"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Kick from Room</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModAction('ban')}
                      className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-200 flex items-center justify-center gap-2"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Permanently Ban from Room</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setModAction('kick')}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-center gap-2"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Vote to Kick</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModAction('report')}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Report Player</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={closeModModal}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-400 mt-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {modAction === 'kick' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Are you sure you want to {isHost ? 'kick' : 'vote to kick'} {modTarget.name}?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModAction('menu')}
                    className="flex-1 py-2 bg-slate-700 text-xs font-bold text-slate-200 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoteKick(modTarget.id)}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl"
                  >
                    Confirm Kick
                  </button>
                </div>
              </div>
            )}

            {modAction === 'ban' && (
              <div className="space-y-3">
                <p className="text-xs text-rose-300">
                  This will remove {modTarget.name} and permanently prevent them from rejoining this room.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModAction('menu')}
                    className="flex-1 py-2 bg-slate-700 text-xs font-bold text-slate-200 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBan(modTarget.id)}
                    className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white rounded-xl"
                  >
                    Confirm Ban
                  </button>
                </div>
              </div>
            )}

            {modAction === 'report' && (
              <div className="space-y-3 text-left">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Select Reason:
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs p-2 rounded-xl border border-slate-700"
                >
                  <option value="Inappropriate drawing">Inappropriate drawing</option>
                  <option value="Offensive chat or hate speech">Offensive chat or hate speech</option>
                  <option value="Spamming or griefing">Spamming or griefing</option>
                  <option value="AFK / intentional delay">AFK / intentional delay</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModAction('menu')}
                    className="flex-1 py-2 bg-slate-700 text-xs font-bold text-slate-200 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReport(modTarget.id)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 rounded-xl"
                  >
                    Send Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
