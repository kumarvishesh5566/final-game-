import React, { useState, useEffect } from 'react';
import { getSocket } from './services/socket.js';
import Lobby from './components/Lobby.jsx';
import Canvas from './components/Canvas.jsx';
import GameHeader from './components/GameHeader.jsx';
import ChatAndGuess from './components/ChatAndGuess.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import WordPickerModal from './components/WordPickerModal.jsx';
import RoundEndModal from './components/RoundEndModal.jsx';
import GameOverModal from './components/GameOverModal.jsx';
import { playPop, playBuzzer } from './services/sounds.js';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  // User Profile
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('skribbl_name') || `Doodler${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [avatar, setAvatar] = useState(() => {
    try {
      const saved = localStorage.getItem('skribbl_avatar');
      return saved ? JSON.parse(saved) : { color: '#3b82f6', eyes: 'normal', mouth: 'smile', accessory: 'none' };
    } catch {
      return { color: '#3b82f6', eyes: 'normal', mouth: 'smile', accessory: 'none' };
    }
  });

  // Room & Game state
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    phase: 'LOBBY',
    currentRound: 1,
    totalRounds: 3,
    currentDrawerId: null,
    word: null,
    maskedWord: '',
    wordLength: 0,
    timeLeft: 0,
    totalTime: 80,
    settings: {},
    drawingHistory: []
  });

  // Chat & Gameplay
  const [messages, setMessages] = useState([]);
  const [wordChoices, setWordChoices] = useState([]);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [kickedNotice, setKickedNotice] = useState(null);

  // URL query room code
  const [prefilledRoomCode, setPrefilledRoomCode] = useState('');

  // Persist name and avatar
  useEffect(() => {
    localStorage.setItem('skribbl_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
  }, [avatar]);

  // Check URL params for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setPrefilledRoomCode(roomParam.toUpperCase());
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      setSocketId(s.id);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    // Room events
    s.on('room_created', (data) => {
      if (data.success) {
        setRoomData(data.roomData);
        setPlayers(data.roomData.players || []);
        if (data.roomData.gameState) setGameState(data.roomData.gameState);
        // Update URL cleanly without reloading
        window.history.replaceState(null, '', `?room=${data.roomId}`);
      }
    });

    s.on('joined_room_success', (data) => {
      if (data.success) {
        setRoomData(data.roomData);
        setPlayers(data.roomData.players || []);
        if (data.roomData.gameState) setGameState(data.roomData.gameState);
        window.history.replaceState(null, '', `?room=${data.roomId}`);
      }
    });

    s.on('player_joined', (data) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('player_left', (data) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('player_updated', (data) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('scores_update', (data) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('player_kicked', (data) => {
      if (data.players) setPlayers(data.players);
    });

    s.on('kicked', (data) => {
      setRoomData(null);
      setKickedNotice(data?.reason || 'You were removed from the room.');
    });

    // Game state events
    s.on('game_state', (newGameState) => {
      setGameState(prev => ({
        ...prev,
        ...newGameState,
        word: newGameState.word || prev.word
      }));
    });

    s.on('settings_updated', (data) => {
      setGameState(prev => ({ ...prev, settings: data.settings }));
    });

    s.on('round_start', (data) => {
      setRoundEndData(null);
      setGameOverData(null);
      setGameState(prev => ({
        ...prev,
        phase: 'CHOOSING_WORD',
        currentRound: data.round,
        totalRounds: data.totalRounds,
        currentDrawerId: data.drawerId,
        timeLeft: data.chooseTime || 15,
        word: null,
        maskedWord: '',
        drawingHistory: []
      }));
    });

    s.on('word_options', (data) => {
      setWordChoices(data.words || []);
    });

    s.on('word_chosen_drawer', (data) => {
      setWordChoices([]);
      setGameState(prev => ({
        ...prev,
        phase: 'DRAWING',
        word: data.word,
        wordLength: data.word.length
      }));
    });

    s.on('word_chosen_guessers', (data) => {
      setGameState(prev => ({
        ...prev,
        phase: 'DRAWING',
        maskedWord: data.hint,
        wordLength: data.wordLength,
        word: null
      }));
    });

    s.on('hint_update', (data) => {
      setGameState(prev => ({
        ...prev,
        maskedWord: data.hint
      }));
    });

    s.on('time_update', (data) => {
      setGameState(prev => ({
        ...prev,
        timeLeft: data.timeLeft,
        totalTime: data.totalTime
      }));
    });

    s.on('round_end', (data) => {
      playBuzzer();
      setRoundEndData(data);
      setGameState(prev => ({
        ...prev,
        phase: 'ROUND_END',
        word: data.word
      }));
    });

    s.on('game_over', (data) => {
      setRoundEndData(null);
      setGameOverData(data);
      setGameState(prev => ({
        ...prev,
        phase: 'GAME_OVER'
      }));
    });

    // Chat events
    s.on('chat_message', (msg) => {
      setMessages(prev => [...prev.slice(-90), msg]);
    });

    return () => {
      s.off('room_created');
      s.off('joined_room_success');
      s.off('player_joined');
      s.off('player_left');
      s.off('player_updated');
      s.off('scores_update');
      s.off('player_kicked');
      s.off('kicked');
      s.off('game_state');
      s.off('settings_updated');
      s.off('round_start');
      s.off('word_options');
      s.off('word_chosen_drawer');
      s.off('word_chosen_guessers');
      s.off('hint_update');
      s.off('time_update');
      s.off('round_end');
      s.off('game_over');
      s.off('chat_message');
    };
  }, []);

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start_game');
  };

  const handleChooseWord = (word) => {
    if (!socket) return;
    socket.emit('word_chosen', { word });
    setWordChoices([]);
  };

  const handleLeaveRoom = () => {
    window.location.search = '';
    window.location.reload();
  };

  const handlePlayAgain = () => {
    if (!socket) return;
    setGameOverData(null);
    socket.emit('return_to_lobby');
  };

  const isDrawer = gameState.currentDrawerId === socketId;
  const currentPlayer = players.find(p => p.id === socketId);
  const isHost = currentPlayer?.isHost;
  const currentDrawerPlayer = players.find(p => p.id === gameState.currentDrawerId);

  // If in Lobby phase or room not created yet:
  if (!roomData || gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-6 px-3">
        <Lobby
          socket={socket}
          playerName={playerName}
          setPlayerName={setPlayerName}
          avatar={avatar}
          setAvatar={setAvatar}
          roomData={roomData}
          players={players}
          currentUserId={socketId}
          isHost={isHost}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          prefilledRoomCode={prefilledRoomCode}
        />

        {kickedNotice && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-rose-950 border border-rose-500 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
            {kickedNotice}
          </div>
        )}

        <footer className="text-center text-[11px] text-slate-500 font-bold mt-4">
          skribbl.io Multiplayer Clone • Pure JavaScript & Node.js
        </footer>
      </div>
    );
  }

  // Active Game Screen (CHOOSING_WORD, DRAWING, ROUND_END, GAME_OVER)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-2 sm:p-4 max-w-[1600px] mx-auto select-none">
      {/* Top Game Navigation / Status Header */}
      <div className="mb-2.5">
        <GameHeader
          round={gameState.currentRound}
          totalRounds={gameState.totalRounds}
          timeLeft={gameState.timeLeft}
          totalTime={gameState.totalTime}
          isDrawer={isDrawer}
          word={gameState.word}
          maskedWord={gameState.maskedWord}
          wordLength={gameState.wordLength}
          drawerName={currentDrawerPlayer?.name}
          roomId={roomData.room.id}
          phase={gameState.phase}
        />
      </div>

      {/* Main Game Arena: 3-column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[560px]">
        {/* Left Column: Player Leaderboard (2.5 cols) */}
        <div className="hidden lg:block lg:col-span-3 xl:col-span-2 h-full">
          <Scoreboard
            players={players}
            currentDrawerId={gameState.currentDrawerId}
            currentUserId={socketId}
            isHost={isHost}
            socket={socket}
            phase={gameState.phase}
          />
        </div>

        {/* Center Column: Collaborative Canvas (6.5 cols) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-[460px] sm:h-[540px] lg:h-full">
          <Canvas
            isDrawer={isDrawer}
            socket={socket}
            drawingHistory={gameState.drawingHistory}
            disabled={gameState.phase !== 'DRAWING'}
          />
        </div>

        {/* Right Column: Chat & Guesses (3 cols) */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-[320px] sm:h-[400px] lg:h-full">
          <ChatAndGuess
            socket={socket}
            messages={messages}
            isDrawer={isDrawer}
            hasGuessed={currentPlayer?.hasGuessed}
            phase={gameState.phase}
          />
        </div>
      </div>

      {/* Mobile/Tablet Leaderboard drawer below */}
      <div className="block lg:hidden mt-3 max-h-44">
        <Scoreboard
          players={players}
          currentDrawerId={gameState.currentDrawerId}
          currentUserId={socketId}
          isHost={isHost}
          socket={socket}
          phase={gameState.phase}
        />
      </div>

      {/* Modals & Overlays */}
      {/* 1. Word Picker for Drawer */}
      {gameState.phase === 'CHOOSING_WORD' && isDrawer && (
        <WordPickerModal
          words={wordChoices}
          timeLeft={gameState.timeLeft}
          onChooseWord={handleChooseWord}
        />
      )}

      {/* 2. Round Ended Summary */}
      {gameState.phase === 'ROUND_END' && roundEndData && (
        <RoundEndModal
          word={roundEndData.word}
          reason={roundEndData.reason}
          scores={roundEndData.scores}
          timeLeft={gameState.timeLeft}
          drawingHistory={roundEndData.drawingHistory || gameState.drawingHistory}
        />
      )}

      {/* 3. Game Over Podium */}
      {gameState.phase === 'GAME_OVER' && gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          leaderboard={gameOverData.leaderboard}
          drawingHistory={gameOverData.drawingHistory || gameState.drawingHistory}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
