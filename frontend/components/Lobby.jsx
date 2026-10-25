import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Play, 
  Copy, 
  Check, 
  Globe, 
  Lock, 
  Sparkles, 
  Dice5, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Eye, 
  Sliders, 
  CheckCircle2,
  Database,
  Trophy,
  Flame
} from 'lucide-react';
import AvatarCustomizer, { AvatarDisplay } from './AvatarCustomizer.jsx';
import { playPop, setSoundMuted, getSoundMuted } from '../services/sounds.js';
import { getApiUrl } from '../services/socket.js';

export default function Lobby({
  socket,
  playerName,
  setPlayerName,
  avatar,
  setAvatar,
  roomData,
  players = [],
  currentUserId,
  isHost,
  onStartGame,
  onLeaveRoom,
  prefilledRoomCode = ''
}) {
  const [tab, setTab] = useState(prefilledRoomCode ? 'join' : 'create'); // 'create', 'join', 'public', 'halloffame'
  const [joinCode, setJoinCode] = useState(prefilledRoomCode);
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [muted, setMutedState] = useState(getSoundMuted());

  // MongoDB persistent data state
  const [dbStatus, setDbStatus] = useState({ connected: false, database: 'activityservice_db' });
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Room host settings
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hintCount: 2,
    language: 'en',
    category: 'all',
    customWords: '',
    customWordsOnly: false,
    wordMode: 'normal'
  });

  // Fetch public rooms
  useEffect(() => {
    if (!socket || roomData) return;

    fetchPublicRooms();
    const interval = setInterval(fetchPublicRooms, 5000);

    socket.on('public_rooms_list', (roomsList) => {
      setPublicRooms(roomsList || []);
      setIsLoadingRooms(false);
    });

    socket.on('join_error', (data) => {
      setErrorMsg(data?.message || 'Failed to join room');
    });

    socket.on('action_error', (data) => {
      setErrorMsg(data?.message || 'Error performing action');
    });

    return () => {
      clearInterval(interval);
      socket.off('public_rooms_list');
      socket.off('join_error');
      socket.off('action_error');
    };
  }, [socket, roomData]);

  const fetchPublicRooms = () => {
    if (!socket) return;
    setIsLoadingRooms(true);
    socket.emit('get_public_rooms');
  };

  // Fetch MongoDB status and persistent leaderboard
  useEffect(() => {
    fetch(getApiUrl('/api/db/status'))
      .then(res => res.json())
      .then(data => setDbStatus(data))
      .catch(() => {});
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = () => {
    setIsLoadingStats(true);
    Promise.all([
      fetch(getApiUrl('/api/leaderboard')).then(r => r.json()).catch(() => []),
      fetch(getApiUrl('/api/matches')).then(r => r.json()).catch(() => [])
    ]).then(([lb, matches]) => {
      setGlobalLeaderboard(Array.isArray(lb) ? lb : []);
      setRecentMatches(Array.isArray(matches) ? matches : []);
      setIsLoadingStats(false);
    }).catch(() => {
      setIsLoadingStats(false);
    });
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Please enter your player nickname');
      return;
    }
    setErrorMsg('');
    playPop();
    socket.emit('create_room', {
      hostName: playerName.trim(),
      settings,
      isPrivate,
      avatar
    });
  };

  const handleJoinRoom = (codeToJoin = joinCode) => {
    if (!playerName.trim()) {
      setErrorMsg('Please enter your player nickname');
      return;
    }
    const cleanCode = (codeToJoin || '').trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a valid 6-character room code');
      return;
    }
    setErrorMsg('');
    playPop();
    socket.emit('join_room', {
      roomId: cleanCode,
      playerName: playerName.trim(),
      avatar,
      asSpectator: joinAsSpectator
    });
  };

  const handleToggleReady = () => {
    playPop();
    socket.emit('toggle_ready');
  };

  const handleCopyLink = () => {
    if (!roomData?.room?.id) return;
    const url = `${window.location.origin}?room=${roomData.room.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleSound = () => {
    const next = !muted;
    setSoundMuted(next);
    setMutedState(next);
  };

  const currentPlayer = players.find(p => p.id === currentUserId);
  const eligiblePlayers = players.filter(p => !p.isSpectator);

  // ----------------------------------------------------
  // CASE 1: Inside Room Lobby (waiting for host to start)
  // ----------------------------------------------------
  if (roomData) {
    return (
      <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-5 select-none">
        {/* Lobby Top Bar */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-4 comic-border comic-shadow flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                Lobby
              </span>
              {roomData.room.isPrivate ? (
                <span className="bg-slate-700/80 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> Private
                </span>
              ) : (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}

            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {roomData.room.name || 'Skribbl Room'}
            </h1>
          </div>

          {/* Room Code & Invite button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl comic-btn text-xs sm:text-sm shadow"
              title="Copy invite link to share with friends"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>Code: <strong className="font-mono tracking-wider text-amber-300">{roomData.room.id}</strong></span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 transition"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Main Lobby Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Player Roster (Left 2 columns) */}
          <div className="md:col-span-2 bg-slate-800/90 rounded-2xl p-4 comic-border comic-shadow flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-200">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Players in Room ({players.length}/{roomData.gameState?.settings?.maxPlayers || 8})</span>
              </div>
              <span className="text-xs text-slate-400">
                Need min 2 players to play
              </span>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto max-h-96 p-1">
              {players.map((p) => {
                const isMe = p.id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center relative transition ${
                      isMe
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-400'
                        : p.isReady
                        ? 'bg-emerald-950/50 border-emerald-500/80'
                        : 'bg-slate-900/60 border-slate-700'
                    }`}
                  >
                    {/* Host crown */}
                    {p.isHost && (
                      <span className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                        HOST
                      </span>
                    )}

                    <AvatarDisplay avatar={p.avatar} size={54} className="mb-2" />
                    
                    <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px]">
                      {p.name} {isMe && '(You)'}
                    </span>

                    {/* Ready badge or Spectator badge */}
                    <div className="mt-2">
                      {p.isSpectator ? (
                        <span className="bg-slate-800 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-700">
                          <Eye className="w-3 h-3 text-amber-400" /> Spectating
                        </span>
                      ) : p.isReady ? (
                        <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                          Waiting...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-700 mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition comic-btn border border-slate-700"
              >
                Leave Room
              </button>

              <div className="flex items-center gap-2">
                {/* Spectator toggle button */}
                <button
                  type="button"
                  onClick={() => socket?.emit('toggle_spectator')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                  title="Toggle between playing and spectating"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentPlayer?.isSpectator ? 'Join Playing' : 'Spectate'}</span>
                </button>

                {/* Ready toggle for player */}
                {!currentPlayer?.isSpectator && (
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    className={`py-2.5 px-4 font-black text-xs sm:text-sm rounded-xl comic-btn transition ${
                      currentPlayer?.isReady
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {currentPlayer?.isReady ? '✓ You Are Ready' : 'Ready Up'}
                  </button>
                )}

                {/* Host Start Button */}
                {isHost && (
                  <button
                    type="button"
                    onClick={onStartGame}
                    disabled={eligiblePlayers.length < 2}
                    className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl comic-btn flex items-center gap-2 shadow-lg transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Game</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Room Settings View */}
          <div className="bg-slate-800/90 rounded-2xl p-4 comic-border comic-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-sm text-slate-200 pb-3 border-b border-slate-700 mb-4">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Match Rules</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Total Rounds:</span>
                  <span className="font-bold text-white">{roomData.gameState?.settings?.rounds || 3}</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Draw Time:</span>
                  <span className="font-bold text-white">{roomData.gameState?.settings?.drawTime || 80}s</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Word Choices:</span>
                  <span className="font-bold text-white">{roomData.gameState?.settings?.wordCount || 3} words</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Max Hints:</span>
                  <span className="font-bold text-white">{roomData.gameState?.settings?.hintCount ?? 2}</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-amber-400 uppercase">{roomData.gameState?.settings?.category || 'all'}</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Language:</span>
                  <span className="font-bold text-white uppercase">{roomData.gameState?.settings?.language || 'en'}</span>
                </div>

                <div className="flex justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700">
                  <span className="text-slate-400">Word Mode:</span>
                  <span className="font-bold text-white capitalize">{roomData.gameState?.settings?.wordMode || 'normal'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 mt-4 text-[11px] text-slate-400">
              💡 <strong>Tip:</strong> Share the room link with friends to draw together in real time!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: Welcome Screen (Create / Join / Browse Rooms)
  // ----------------------------------------------------
  return (
    <div className="max-w-xl mx-auto w-full p-4 flex flex-col gap-5 select-none my-auto">
      {/* Brand Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 border-2 border-amber-400 text-amber-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Real-time Pictionary Game
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wider drop-shadow-md">
          skribbl<span className="text-amber-400">.io</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Draw, Guess, and Win with friends in multiplayer rooms!
        </p>

      </div>

      {errorMsg && (
        <div className="bg-rose-950/80 border-2 border-rose-500 text-rose-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-center animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Profile & Avatar Configurator */}
      <div className="bg-slate-800/90 rounded-3xl p-5 comic-border comic-shadow flex flex-col gap-4">
        {/* Nickname input */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
            Your Nickname
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
            placeholder="Enter nickname (e.g., Picasso)"
            className="w-full bg-slate-900 text-white font-bold text-base px-4 py-3 rounded-2xl border-2 border-slate-700 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Avatar Customizer */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
            Customize Avatar
          </label>
          <AvatarCustomizer avatar={avatar} onChange={setAvatar} />
        </div>
      </div>

      {/* Tabs: Create Room / Join Room / Public Rooms / Hall of Fame */}
      <div className="bg-slate-800/90 rounded-3xl p-5 comic-border comic-shadow flex flex-col">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-slate-900 p-1 mb-5 border border-slate-700">
          <button
            type="button"
            onClick={() => { playPop(); setTab('create'); }}
            className={`py-2 text-xs font-black rounded-xl transition ${
              tab === 'create' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => { playPop(); setTab('join'); }}
            className={`py-2 text-xs font-black rounded-xl transition ${
              tab === 'join' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Join Code
          </button>
          <button
            type="button"
            onClick={() => { playPop(); setTab('public'); }}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 ${
              tab === 'public' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public</span>
          </button>
          <button
            type="button"
            onClick={() => { playPop(); setTab('halloffame'); fetchGlobalStats(); }}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 ${
              tab === 'halloffame' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Hall of Fame</span>
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {tab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Max Players */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Max Players</label>
                <select
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  {[2, 3, 4, 6, 8, 10, 12, 16, 20].map(n => (
                    <option key={n} value={n}>{n} Players</option>
                  ))}
                </select>
              </div>

              {/* Rounds */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Rounds</label>
                <select
                  value={settings.rounds}
                  onChange={(e) => setSettings({ ...settings, rounds: Number(e.target.value) })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  {[2, 3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} Rounds</option>
                  ))}
                </select>
              </div>

              {/* Draw Time */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Draw Time</label>
                <select
                  value={settings.drawTime}
                  onChange={(e) => setSettings({ ...settings, drawTime: Number(e.target.value) })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  {[30, 45, 60, 80, 100, 120, 180].map(n => (
                    <option key={n} value={n}>{n} Seconds</option>
                  ))}
                </select>
              </div>

              {/* Word Count to choose */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Word Choices</label>
                <select
                  value={settings.wordCount}
                  onChange={(e) => setSettings({ ...settings, wordCount: Number(e.target.value) })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} choices</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="en">English 🇬🇧</option>
                  <option value="es">Español 🇪🇸</option>
                  <option value="fr">Français 🇫🇷</option>
                  <option value="de">Deutsch 🇩🇪</option>
                  <option value="hi">हिन्दी 🇮🇳</option>
                </select>
              </div>

              {/* Word Mode */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Word Mode</label>
                <select
                  value={settings.wordMode}
                  onChange={(e) => setSettings({ ...settings, wordMode: e.target.value })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="normal">Normal (Letters & Hints)</option>
                  <option value="hidden">Hidden (No letter clues)</option>
                  <option value="combination">Combination (Dual words)</option>
                </select>
              </div>

              {/* Word Category */}
              <div className="col-span-2">
                <label className="block font-bold text-slate-300 mb-1">Word Category</label>
                <select
                  value={settings.category}
                  onChange={(e) => setSettings({ ...settings, category: e.target.value })}
                  className="w-full bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">🌟 All Categories Mixed</option>
                  <option value="animals">🐾 Animals & Nature</option>
                  <option value="food">🍕 Food & Treats</option>
                  <option value="objects">🎒 Everyday Objects</option>
                  <option value="actions">🏄 Actions & Verbs</option>
                  <option value="places">🏰 Places & Landmarks</option>
                  <option value="fantasy">🧙 Gaming & Fantasy</option>
                </select>
              </div>

              {/* Custom words */}
              <div className="col-span-2">
                <label className="block font-bold text-slate-300 mb-1">
                  Custom Words <span className="text-slate-500 font-normal">(Optional, comma separated)</span>
                </label>
                <textarea
                  value={settings.customWords}
                  onChange={(e) => setSettings({ ...settings, customWords: e.target.value })}
                  placeholder="e.g. coffee, airplane, sunset, matrix"
                  rows={2}
                  className="w-full bg-slate-900 text-white text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                />
                {settings.customWords && (
                  <label className="flex items-center gap-2 text-[11px] font-bold text-amber-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={settings.customWordsOnly}
                      onChange={(e) => setSettings({ ...settings, customWordsOnly: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <span>Use custom words exclusively (don't mix with regular dictionary)</span>
                  </label>
                )}
              </div>
            </div>

            {/* Private Room Checkbox */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Private Room (invite-only via link or code)</span>
            </label>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl comic-btn shadow-lg transition"
            >
              Create Room
            </button>
          </form>
        )}

        {/* Tab 2: Join via Code */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={8}
                className="w-full bg-slate-900 text-white font-mono font-black text-xl px-4 py-3 rounded-2xl border-2 border-slate-700 text-center tracking-widest focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={joinAsSpectator}
                onChange={(e) => setJoinAsSpectator(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Join as Spectator (watch without drawing)
              </span>
            </label>

            <button
              type="button"
              onClick={() => handleJoinRoom()}
              disabled={!joinCode.trim()}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl comic-btn shadow-lg transition"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Tab 3: Public Rooms */}
        {tab === 'public' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Open Public Rooms</span>
              <button
                type="button"
                onClick={fetchPublicRooms}
                className="flex items-center gap-1 text-amber-400 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 text-center text-xs text-slate-400">
                <p>No active public rooms right now.</p>
                <p className="mt-1">Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {publicRooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{r.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({r.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{r.playerCount} / {r.maxPlayers} players</span>
                        <span>•</span>
                        <span className="capitalize">{r.phase.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleJoinRoom(r.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl comic-btn"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Hall of Fame (MongoDB Persistent Data) */}
        {tab === 'halloffame' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>All-Time Top Players</span>
              </div>
              <button
                type="button"
                onClick={fetchGlobalStats}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStats ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Global Players List */}
            {globalLeaderboard.length === 0 ? (
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 text-center text-xs text-slate-400">
                <Trophy className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                <p className="font-bold text-slate-300">No matches recorded in MongoDB yet!</p>
                <p className="mt-1 text-[11px]">Play a match to get your name on the persistent Hall of Fame.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {globalLeaderboard.map((player, idx) => (
                  <div
                    key={player._id || player.playerName}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-4 font-black ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        #{idx + 1}
                      </span>
                      <AvatarDisplay avatar={player.lastAvatar} size={32} />
                      <div>
                        <div className="font-bold text-white">{player.playerName}</div>
                        <div className="text-[10px] text-slate-400">
                          {player.gamesWon} wins • {player.gamesPlayed} games
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-amber-400">{player.totalScore} pts</div>
                      <div className="text-[10px] text-slate-500">High: {player.highestScore}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Matches from MongoDB */}
            {recentMatches.length > 0 && (
              <div className="pt-2 border-t border-slate-700/70">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Recent Match Records ({recentMatches.length})
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {recentMatches.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 text-[11px] text-slate-300 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{m.roomId}</span>
                        <span>•</span>
                        <span>Winner: <strong>{m.winner?.name || 'Tie'}</strong></span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
