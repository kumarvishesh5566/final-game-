/**
 * OOP Room container for players, chat, and game state
 */
import { Game } from './Game.js';

export class Room {
  constructor(id, hostName, settings = {}, isPrivate = false) {
    this.id = id;
    this.name = `${hostName}'s Room`;
    this.isPrivate = Boolean(isPrivate);
    this.createdAt = Date.now();
    
    this.players = new Map(); // socketId -> Player
    this.sockets = new Map(); // socketId -> Socket
    this.kickVotes = new Map(); // targetPlayerId -> Set of voterIds
    this.bannedNames = new Set(); // lowercase names of banned players
    this.reports = []; // array of player reports
    this.chatHistory = [];
    
    this.game = new Game(this, settings);
  }

  addPlayer(socket, player) {
    if (this.bannedNames.has(player.name.toLowerCase())) {
      throw new Error('You have been banned from this room by the host.');
    }

    this.players.set(socket.id, player);
    this.sockets.set(socket.id, socket);

    // If first player, make host
    if (this.players.size === 1) {
      player.isHost = true;
    }

    socket.join(this.id);
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    const wasHost = player.isHost;
    const wasDrawer = (player.id === this.game.currentDrawerId);

    this.players.delete(socketId);
    this.sockets.delete(socketId);

    // Clean up kick votes for or by this player
    this.kickVotes.delete(socketId);
    for (const [, voters] of this.kickVotes) {
      voters.delete(socketId);
    }

    // Assign new host if previous host left
    if (wasHost && this.players.size > 0) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        nextHost.isHost = true;
        this.broadcast('chat_system', { text: `${nextHost.name} is now the host!` });
      }
    }

    // If current drawer left during active drawing, advance turn
    if (wasDrawer && (this.game.phase === 'DRAWING' || this.game.phase === 'CHOOSING_WORD')) {
      this.broadcast('chat_system', { text: `${player.name} left the game. Skipping to next round!` });
      this.game.endRound('Drawer left the game');
    }

    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getSocket(socketId) {
    return this.sockets.get(socketId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getEligiblePlayers() {
    return this.getAllPlayers().filter(p => !p.isSpectator && p.connected);
  }

  broadcast(event, payload) {
    for (const socket of this.sockets.values()) {
      socket.emit(event, payload);
    }
  }

  broadcastToOthers(senderId, event, payload) {
    for (const [id, socket] of this.sockets.entries()) {
      if (id !== senderId) {
        socket.emit(event, payload);
      }
    }
  }

  addChatMessage(message) {
    this.chatHistory.push(message);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }
  }

  voteKick(voterId, targetId) {
    const voter = this.players.get(voterId);
    const target = this.players.get(targetId);

    if (!voter || !target || voterId === targetId) {
      return { success: false, message: 'Invalid vote' };
    }

    // Host can kick directly
    if (voter.isHost) {
      return { success: true, kicked: true, targetName: target.name };
    }

    // Normal player vote kick
    if (!this.kickVotes.has(targetId)) {
      this.kickVotes.set(targetId, new Set());
    }
    const voters = this.kickVotes.get(targetId);
    voters.add(voterId);

    const neededVotes = Math.ceil((this.players.size + 1) / 2);
    if (voters.size >= neededVotes) {
      this.kickVotes.delete(targetId);
      return { success: true, kicked: true, targetName: target.name };
    }

    return {
      success: true,
      kicked: false,
      votes: voters.size,
      needed: neededVotes,
      targetName: target.name
    };
  }

  banPlayer(hostId, targetId) {
    const host = this.players.get(hostId);
    const target = this.players.get(targetId);

    if (!host || !host.isHost || !target || hostId === targetId) {
      return { success: false, message: 'Only host can ban players.' };
    }

    this.bannedNames.add(target.name.toLowerCase());
    return { success: true, targetName: target.name };
  }

  reportPlayer(reporterId, targetId, reason = 'Inappropriate behavior') {
    const reporter = this.players.get(reporterId);
    const target = this.players.get(targetId);

    if (!reporter || !target || reporterId === targetId) {
      return { success: false, message: 'Invalid report' };
    }

    const reportObj = {
      reporterId,
      reporterName: reporter.name,
      targetId,
      targetName: target.name,
      reason,
      timestamp: Date.now()
    };
    this.reports.push(reportObj);

    return {
      success: true,
      reporterName: reporter.name,
      targetName: target.name,
      reason
    };
  }

  toPublicSummary() {
    return {
      id: this.id,
      name: this.name,
      isPrivate: this.isPrivate,
      playerCount: this.players.size,
      maxPlayers: this.game.settings.maxPlayers,
      phase: this.game.phase,
      currentRound: this.game.currentRound,
      totalRounds: this.game.settings.rounds
    };
  }

  toFullJSON(requestingPlayerId = null) {
    return {
      room: {
        id: this.id,
        name: this.name,
        isPrivate: this.isPrivate,
        createdAt: this.createdAt
      },
      players: this.getAllPlayers().map(p => p.toJSON()),
      gameState: this.game.toPublicJSON(requestingPlayerId)
    };
  }
}
