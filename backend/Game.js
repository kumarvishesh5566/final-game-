/**
 * OOP Game state and mechanics manager for skribbl.io
 */
import { getRandomWords, normalizeWord } from './words.js';
import { recordCompletedMatch } from './db.js';

export const GAME_PHASES = {
  LOBBY: 'LOBBY',
  CHOOSING_WORD: 'CHOOSING_WORD',
  DRAWING: 'DRAWING',
  ROUND_END: 'ROUND_END',
  GAME_OVER: 'GAME_OVER'
};

export class Game {
  constructor(room, settings = {}) {
    this.room = room;
    this.phase = GAME_PHASES.LOBBY;
    
    // Configurable settings
    this.settings = {
      maxPlayers: Number(settings.maxPlayers) || 8,
      rounds: Number(settings.rounds) || 3,
      drawTime: Number(settings.drawTime) || 80,
      wordCount: Number(settings.wordCount) || 3,
      hintCount: Number(settings.hintCount) ?? 2,
      category: settings.category || 'all',
      language: settings.language || 'en',
      customWords: Array.isArray(settings.customWords) ? settings.customWords : [],
      customWordsOnly: Boolean(settings.customWordsOnly),
      wordMode: settings.wordMode || 'normal' // 'normal', 'hidden', 'combination'
    };

    this.currentRound = 1;
    this.drawerIndex = 0;
    this.drawerOrder = [];
    this.currentDrawerId = null;
    
    this.currentWord = '';
    this.wordChoices = [];
    this.revealedIndices = new Set();
    
    this.timeLeft = 0;
    this.totalTime = this.settings.drawTime;
    this.timerInterval = null;
    
    this.drawingHistory = [];
    this.lastRoundReplay = [];
    this.guessCount = 0;
  }

  updateSettings(newSettings) {
    if (this.phase !== GAME_PHASES.LOBBY) return false;
    this.settings = {
      ...this.settings,
      ...newSettings,
      maxPlayers: Math.min(20, Math.max(2, Number(newSettings.maxPlayers || this.settings.maxPlayers))),
      rounds: Math.min(10, Math.max(2, Number(newSettings.rounds || this.settings.rounds))),
      drawTime: Math.min(240, Math.max(15, Number(newSettings.drawTime || this.settings.drawTime))),
      wordCount: Math.min(5, Math.max(1, Number(newSettings.wordCount || this.settings.wordCount))),
      hintCount: Math.min(5, Math.max(0, Number(newSettings.hintCount ?? this.settings.hintCount))),
      language: newSettings.language || this.settings.language,
      customWordsOnly: Boolean(newSettings.customWordsOnly ?? this.settings.customWordsOnly),
      wordMode: newSettings.wordMode || this.settings.wordMode
    };
    return true;
  }

  start() {
    const eligiblePlayers = this.room.getEligiblePlayers();
    if (eligiblePlayers.length < 2) {
      return { success: false, message: 'Need at least 2 players to start!' };
    }

    this.currentRound = 1;
    this.drawerIndex = 0;
    // Put host first, followed by remaining players
    const hostPlayer = eligiblePlayers.find(p => p.isHost) || eligiblePlayers[0];
    const otherPlayers = eligiblePlayers.filter(p => p.id !== hostPlayer.id);
    this.drawerOrder = [hostPlayer.id, ...otherPlayers.map(p => p.id)];
    
    // Reset all player scores
    this.room.getAllPlayers().forEach(p => {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
    });

    this.startDrawerTurn();
    return { success: true };
  }

  startDrawerTurn() {
    this.clearInterval();
    this.drawingHistory = [];
    this.revealedIndices.clear();
    this.guessCount = 0;

    const eligiblePlayers = this.room.getEligiblePlayers();
    if (eligiblePlayers.length < 2) {
      this.phase = GAME_PHASES.LOBBY;
      this.room.broadcast('game_state', this.toPublicJSON());
      this.room.broadcast('chat_system', { text: 'Not enough players to continue game. Returned to lobby.' });
      return;
    }

    // Check if round finished
    if (this.drawerIndex >= this.drawerOrder.length) {
      this.drawerIndex = 0;
      this.currentRound += 1;
      
      if (this.currentRound > this.settings.rounds) {
        this.endGame();
        return;
      }
    }

    // Refresh drawer order with current connected players if needed
    const nextDrawerId = this.drawerOrder[this.drawerIndex];
    const drawerPlayer = this.room.getPlayer(nextDrawerId);

    if (!drawerPlayer || !drawerPlayer.connected || drawerPlayer.isSpectator) {
      // Skip disconnected drawer
      this.drawerIndex += 1;
      this.startDrawerTurn();
      return;
    }

    // Setup new round turn
    this.currentDrawerId = drawerPlayer.id;
    this.room.getAllPlayers().forEach(p => {
      p.resetForNewRound();
      p.isDrawer = (p.id === this.currentDrawerId);
    });

    // Generate word choices for drawer
    this.wordChoices = getRandomWords(
      this.settings.wordCount,
      this.settings.category,
      this.settings.customWords,
      this.settings.language,
      this.settings.wordMode,
      this.settings.customWordsOnly
    );

    this.phase = GAME_PHASES.CHOOSING_WORD;
    this.timeLeft = 15; // 15 seconds to choose a word
    this.totalTime = 15;

    // Send round_start to everyone, wordOptions only to drawer
    this.room.broadcast('round_start', {
      drawerId: this.currentDrawerId,
      drawerName: drawerPlayer.name,
      round: this.currentRound,
      totalRounds: this.settings.rounds,
      chooseTime: this.timeLeft
    });

    const drawerSocket = this.room.getSocket(this.currentDrawerId);
    if (drawerSocket) {
      drawerSocket.emit('word_options', { words: this.wordChoices });
    }

    // Start countdown for choosing word
    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;
      this.room.broadcast('time_update', { timeLeft: this.timeLeft, totalTime: this.totalTime });

      if (this.timeLeft <= 0) {
        this.clearInterval();
        // If drawer didn't choose, pick first word automatically
        const autoWord = this.wordChoices[0] || 'apple';
        this.chooseWord(autoWord, this.currentDrawerId);
      }
    }, 1000);
  }

  chooseWord(word, playerId) {
    if (this.phase !== GAME_PHASES.CHOOSING_WORD || this.currentDrawerId !== playerId) {
      return false;
    }

    this.clearInterval();
    this.currentWord = word.trim().toLowerCase();
    this.phase = GAME_PHASES.DRAWING;
    this.totalTime = this.settings.drawTime;
    this.timeLeft = this.settings.drawTime;
    this.revealedIndices.clear();
    this.guessCount = 0;

    // Calculate when hints will reveal
    // e.g. If hintCount = 2, reveal at 60% and 30% time remaining
    const hintTimes = [];
    const maxHints = Math.min(this.settings.hintCount, Math.max(1, Math.floor(this.currentWord.length / 2)));
    for (let i = 1; i <= maxHints; i++) {
      hintTimes.push(Math.round(this.totalTime * (1 - i / (maxHints + 1))));
    }

    // Notify drawer with actual word
    const drawerSocket = this.room.getSocket(this.currentDrawerId);
    if (drawerSocket) {
      drawerSocket.emit('word_chosen_drawer', { word: this.currentWord });
    }

    // Notify others with word hints
    this.room.broadcastToOthers(this.currentDrawerId, 'word_chosen_guessers', {
      hint: this.getMaskedWord(),
      wordLength: this.currentWord.length
    });

    this.broadcastGameState();

    // Start drawing timer
    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;
      this.room.broadcast('time_update', { timeLeft: this.timeLeft, totalTime: this.totalTime });

      // Check if it's time to reveal a hint
      if (hintTimes.includes(this.timeLeft) && this.settings.wordMode !== 'hidden') {
        this.revealRandomLetter();
      }

      if (this.timeLeft <= 0) {
        this.endRound('Time ran out!');
      }
    }, 1000);

    return true;
  }

  revealRandomLetter() {
    const unrevealed = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length > 1) { // Leave at least 1 letter hidden
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.revealedIndices.add(randomIndex);
      
      this.room.broadcastToOthers(this.currentDrawerId, 'hint_update', {
        hint: this.getMaskedWord()
      });
    }
  }

  getMaskedWord() {
    if (this.settings.wordMode === 'hidden') {
      let masked = '';
      for (let i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i] === ' ') {
          masked += '  ';
        } else {
          masked += '? ';
        }
      }
      return masked.trim();
    }

    let masked = '';
    for (let i = 0; i < this.currentWord.length; i++) {
      const char = this.currentWord[i];
      if (char === ' ') {
        masked += '  ';
      } else if (this.revealedIndices.has(i)) {
        masked += char + ' ';
      } else {
        masked += '_ ';
      }
    }
    return masked.trim();
  }

  handleGuess(player, text) {
    if (this.phase !== GAME_PHASES.DRAWING) return { isGuess: false };
    if (player.id === this.currentDrawerId) return { isGuess: false }; // Drawer cannot guess
    if (player.isSpectator) return { isGuess: false, isSpectator: true }; // Spectator cannot guess
    if (player.hasGuessed) return { isGuess: false, alreadyGuessed: true }; // Already guessed

    const cleanGuess = normalizeWord(text);
    const targetWord = normalizeWord(this.currentWord);

    // Check exact match
    if (cleanGuess === targetWord) {
      player.hasGuessed = true;
      player.guessTime = Date.now();
      this.guessCount += 1;

      // Calculate score based on time remaining and rank
      const timeFraction = Math.max(0.1, this.timeLeft / this.totalTime);
      let points = Math.round(400 * timeFraction);
      if (this.guessCount === 1) points += 100; // 1st guesser bonus
      else if (this.guessCount === 2) points += 50;  // 2nd guesser bonus

      player.addScore(points);

      // Award points to drawer as well
      const drawer = this.room.getPlayer(this.currentDrawerId);
      if (drawer) {
        drawer.addScore(Math.round(60 * timeFraction) + 20);
      }

      this.room.broadcast('guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
        guessCount: this.guessCount
      });

      // Check if all guessers have guessed
      const activeGuessers = this.room.getEligiblePlayers().filter(p => p.id !== this.currentDrawerId);
      const allGuessed = activeGuessers.every(p => p.hasGuessed);

      if (allGuessed && activeGuessers.length > 0) {
        this.endRound('Everyone guessed the word!');
      }

      return { isGuess: true, correct: true, points };
    }

    // Check close guess using Levenshtein distance (1 typo away)
    const isClose = this.checkIsClose(cleanGuess, targetWord);
    return {
      isGuess: true,
      correct: false,
      isClose
    };
  }

  checkIsClose(guess, word) {
    if (!guess || !word || guess.length < 3) return false;
    // Standard Levenshtein Distance Matrix
    const matrix = Array(word.length + 1).fill(null).map(() =>
      Array(guess.length + 1).fill(null));

    for (let i = 0; i <= word.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= guess.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= word.length; i++) {
      for (let j = 1; j <= guess.length; j++) {
        const cost = word[i - 1] === guess[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,       // deletion
          matrix[i][j - 1] + 1,       // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    const dist = matrix[word.length][guess.length];
    if (dist === 1) return true;
    if (dist === 2 && word.length >= 7 && guess.length >= 6) return true;
    return false;
  }

  endRound(reason = '') {
    this.clearInterval();
    this.phase = GAME_PHASES.ROUND_END;
    this.timeLeft = 8;
    this.totalTime = 8;
    this.lastRoundReplay = [...this.drawingHistory];

    const scores = this.room.getAllPlayers().map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      roundScore: p.roundScore,
      hasGuessed: p.hasGuessed
    })).sort((a, b) => b.score - a.score);

    this.room.broadcast('round_end', {
      word: this.currentWord,
      reason,
      scores,
      drawingHistory: this.lastRoundReplay,
      nextDrawerIndex: this.drawerIndex + 1
    });

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;
      this.room.broadcast('time_update', { timeLeft: this.timeLeft, totalTime: this.totalTime });

      if (this.timeLeft <= 0) {
        this.clearInterval();
        this.drawerIndex += 1;
        this.startDrawerTurn();
      }
    }, 1000);
  }

  endGame() {
    this.clearInterval();
    this.phase = GAME_PHASES.GAME_OVER;
    
    const leaderboard = this.room.getAllPlayers()
      .map(p => p.toJSON())
      .sort((a, b) => b.score - a.score);

    const winner = leaderboard[0] || null;

    this.room.broadcast('game_over', {
      winner,
      leaderboard,
      drawingHistory: this.drawingHistory
    });

    // Automatically persist completed match and stats to MongoDB
    recordCompletedMatch({
      roomId: this.room.id,
      winner,
      leaderboard,
      rounds: this.settings.rounds,
      category: this.settings.category
    }).catch(err => console.error('[MongoDB] Auto-save error:', err.message));
  }

  resetToLobby() {
    this.clearInterval();
    this.phase = GAME_PHASES.LOBBY;
    this.drawingHistory = [];
    this.currentWord = '';
    this.room.getAllPlayers().forEach(p => {
      p.resetForNewRound();
      p.score = 0;
      p.isReady = false;
    });
    this.room.broadcast('game_state', this.toPublicJSON());
  }

  clearInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  addStroke(stroke) {
    this.drawingHistory.push(stroke);
  }

  undoStroke() {
    if (this.drawingHistory.length > 0) {
      return this.drawingHistory.pop();
    }
    return null;
  }

  clearCanvas() {
    this.drawingHistory = [];
  }

  toPublicJSON(forPlayerId = null) {
    const isDrawer = forPlayerId === this.currentDrawerId;
    return {
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds,
      currentDrawerId: this.currentDrawerId,
      word: (isDrawer || this.phase === GAME_PHASES.ROUND_END || this.phase === GAME_PHASES.GAME_OVER) 
        ? this.currentWord 
        : null,
      maskedWord: this.getMaskedWord(),
      wordLength: this.currentWord.length,
      timeLeft: this.timeLeft,
      totalTime: this.totalTime,
      settings: this.settings,
      drawingHistory: this.drawingHistory
    };
  }

  broadcastGameState() {
    for (const [id, socket] of this.room.sockets.entries()) {
      socket.emit('game_state', this.toPublicJSON(id));
    }
  }
}
