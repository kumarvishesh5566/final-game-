/**
 * Socket.IO event handler implementing skribbl.io assignment specifications
 */
import { Room } from './Room.js';
import { Player } from './Player.js';
import { parseCustomWords } from './words.js';

// Global memory registry of active rooms
const rooms = new Map(); // roomId -> Room

// Helper to generate readable 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoomId = null;

    // Send available public rooms list
    socket.on('get_public_rooms', (callback) => {
      const publicRooms = Array.from(rooms.values())
        .filter(r => !r.isPrivate)
        .map(r => r.toPublicSummary());
      if (typeof callback === 'function') callback(publicRooms);
      else socket.emit('public_rooms_list', publicRooms);
    });

    // 1. Create Room
    socket.on('create_room', ({ hostName, settings = {}, isPrivate = false, avatar = null }, callback) => {
      try {
        const roomId = generateRoomCode();
        
        // Parse custom words if provided
        if (settings.customWords && typeof settings.customWords === 'string') {
          settings.customWords = parseCustomWords(settings.customWords);
        }

        const room = new Room(roomId, hostName, settings, isPrivate);
        const hostPlayer = new Player(socket.id, hostName, avatar, true, false);
        
        rooms.set(roomId, room);
        room.addPlayer(socket, hostPlayer);
        currentRoomId = roomId;

        const responsePayload = {
          success: true,
          roomId,
          player: hostPlayer.toJSON(),
          roomData: room.toFullJSON(socket.id)
        };

        if (typeof callback === 'function') callback(responsePayload);
        socket.emit('room_created', responsePayload);
        broadcastPublicRooms(io);
      } catch (err) {
        console.error('Error creating room:', err);
        if (typeof callback === 'function') callback({ success: false, message: 'Failed to create room' });
      }
    });

    // 2. Join Room
    socket.on('join_room', ({ roomId, playerName, avatar = null, asSpectator = false }, callback) => {
      try {
        const cleanRoomId = (roomId || '').trim().toUpperCase();
        const room = rooms.get(cleanRoomId);

        if (!room) {
          const errRes = { success: false, message: 'Room not found. Check code or create a new room.' };
          if (typeof callback === 'function') callback(errRes);
          socket.emit('join_error', errRes);
          return;
        }

        if (room.players.size >= room.game.settings.maxPlayers && !asSpectator) {
          const errRes = { success: false, message: 'Room is currently full!' };
          if (typeof callback === 'function') callback(errRes);
          socket.emit('join_error', errRes);
          return;
        }

        const player = new Player(socket.id, playerName, avatar, false, asSpectator);
        room.addPlayer(socket, player);
        currentRoomId = cleanRoomId;

        const resData = {
          success: true,
          roomId: cleanRoomId,
          player: player.toJSON(),
          roomData: room.toFullJSON(socket.id)
        };

        if (typeof callback === 'function') callback(resData);
        socket.emit('joined_room_success', resData);

        // Broadcast to other players in room
        room.broadcastToOthers(socket.id, 'player_joined', {
          player: player.toJSON(),
          players: room.getAllPlayers().map(p => p.toJSON())
        });

        // Broadcast join system message
        room.broadcast('chat_message', {
          id: `sys-${Date.now()}-${Math.random()}`,
          system: true,
          type: 'join',
          text: `${player.name} joined the room!`
        });

        broadcastPublicRooms(io);
      } catch (err) {
        console.error('Error joining room:', err);
        const errMsg = err?.message || 'Failed to join room';
        if (typeof callback === 'function') callback({ success: false, message: errMsg });
        socket.emit('join_error', { success: false, message: errMsg });
      }
    });

    // 3. Toggle Ready
    socket.on('toggle_ready', () => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      const player = room.getPlayer(socket.id);
      if (!player) return;

      player.isReady = !player.isReady;
      room.broadcast('player_updated', {
        player: player.toJSON(),
        players: room.getAllPlayers().map(p => p.toJSON())
      });
    });

    // 4. Update Settings (Host only)
    socket.on('update_settings', (newSettings) => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      const player = room.getPlayer(socket.id);
      if (!player || !player.isHost) return;

      if (newSettings.customWords && typeof newSettings.customWords === 'string') {
        newSettings.customWords = parseCustomWords(newSettings.customWords);
      }

      room.game.updateSettings(newSettings);
      room.broadcast('settings_updated', { settings: room.game.settings });
    });

    // 5. Start Game (Host only)
    socket.on('start_game', () => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      const player = room.getPlayer(socket.id);
      if (!player || !player.isHost) return;

      const result = room.game.start();
      if (!result.success) {
        socket.emit('action_error', { message: result.message });
        return;
      }

      broadcastPublicRooms(io);
    });

    // 6. Drawer Chooses Word
    socket.on('word_chosen', ({ word }) => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      room.game.chooseWord(word, socket.id);
    });

    // 7. Drawing Events (Real-time synchronization)
    socket.on('draw_start', (data) => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;

      const stroke = {
        type: 'stroke',
        color: data.color || '#000000',
        size: data.size || 4,
        tool: data.tool || 'brush', // 'brush', 'eraser'
        points: [{ x: data.x, y: data.y }]
      };

      room.game.addStroke(stroke);
      room.broadcastToOthers(socket.id, 'draw_start', data);
    });

    socket.on('draw_move', (data) => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;

      const lastStroke = room.game.drawingHistory[room.game.drawingHistory.length - 1];
      if (lastStroke && lastStroke.points) {
        lastStroke.points.push({ x: data.x, y: data.y });
      }

      room.broadcastToOthers(socket.id, 'draw_move', data);
    });

    socket.on('draw_end', () => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;
      room.broadcastToOthers(socket.id, 'draw_end');
    });

    socket.on('fill_bucket', (data) => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;

      const fillAction = {
        type: 'fill',
        x: data.x,
        y: data.y,
        color: data.color
      };
      room.game.addStroke(fillAction);
      room.broadcastToOthers(socket.id, 'fill_bucket', data);
    });

    socket.on('canvas_clear', () => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;

      room.game.clearCanvas();
      room.broadcast('canvas_clear');
    });

    socket.on('draw_undo', () => {
      const room = getRoom(currentRoomId);
      if (!room || room.game.currentDrawerId !== socket.id) return;

      room.game.undoStroke();
      room.broadcast('canvas_sync_history', {
        drawingHistory: room.game.drawingHistory
      });
    });

    // 8. Chat & Guessing System
    socket.on('guess', ({ text }) => {
      const room = getRoom(currentRoomId);
      if (!room || !text || typeof text !== 'string') return;
      const player = room.getPlayer(socket.id);
      if (!player) return;

      const cleanText = text.trim();
      // Prevent drawer from giving away the secret word
      if (player.isDrawer && room.game.phase === 'DRAWING') {
        const lowerText = cleanText.toLowerCase();
        const lowerWord = (room.game.currentWord || '').toLowerCase();
        if (lowerWord && lowerText.includes(lowerWord)) {
          socket.emit('chat_message', {
            id: `warn-${Date.now()}`,
            system: true,
            type: 'close_guess',
            text: '⚠️ You cannot type the secret word in chat!'
          });
          return;
        }
      }

      // Check if this counts as a game guess
      if (room.game.phase === 'DRAWING' && !player.isDrawer && !player.hasGuessed) {
        const guessResult = room.game.handleGuess(player, cleanText);

        if (guessResult.correct) {
          // Play celebration & sound on clients
          room.broadcast('chat_message', {
            id: `guess-${Date.now()}-${Math.random()}`,
            system: true,
            type: 'correct_guess',
            playerId: player.id,
            playerName: player.name,
            points: guessResult.points,
            text: `${player.name} guessed the word!`
          });

          // Update player list with new scores
          room.broadcast('scores_update', {
            players: room.getAllPlayers().map(p => p.toJSON())
          });
          return;
        }

        if (guessResult.isClose) {
          // Private feedback to the guesser that they are very close!
          socket.emit('chat_message', {
            id: `close-${Date.now()}`,
            system: true,
            type: 'close_guess',
            text: `'${cleanText}' is very close!`
          });
        }
      }

      // Normal chat or post-guess chat
      // If player already guessed, don't spoil for those who haven't guessed yet
      const messageObj = {
        id: `chat-${Date.now()}-${Math.random()}`,
        playerId: player.id,
        playerName: player.name,
        avatar: player.avatar,
        text: cleanText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        alreadyGuessed: player.hasGuessed
      };

      if (player.hasGuessed && room.game.phase === 'DRAWING') {
        // Send only to drawer and players who also guessed
        for (const p of room.getAllPlayers()) {
          if (p.hasGuessed || p.isDrawer) {
            const s = room.getSocket(p.id);
            if (s) s.emit('chat_message', messageObj);
          }
        }
      } else {
        // Send to everyone
        room.broadcast('chat_message', messageObj);
      }
    });

    // 9. Moderation / Vote Kick
    socket.on('vote_kick', ({ targetPlayerId }) => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      
      const kickResult = room.voteKick(socket.id, targetPlayerId);
      if (!kickResult.success) return;

      if (kickResult.kicked) {
        const targetSocket = room.getSocket(targetPlayerId);
        if (targetSocket) {
          targetSocket.emit('kicked', { reason: 'You were kicked from the room.' });
          targetSocket.leave(room.id);
        }
        room.removePlayer(targetPlayerId);
        room.broadcast('player_kicked', {
          targetId: targetPlayerId,
          targetName: kickResult.targetName,
          players: room.getAllPlayers().map(p => p.toJSON())
        });
        room.broadcast('chat_system', { text: `${kickResult.targetName} was kicked from the room.` });
      } else {
        room.broadcast('chat_system', {
          text: `Vote kick for ${kickResult.targetName}: (${kickResult.votes}/${kickResult.needed} votes)`
        });
      }
    });

    // 9b. Host Ban Player
    socket.on('ban_player', ({ targetPlayerId }) => {
      const room = getRoom(currentRoomId);
      if (!room) return;

      const banResult = room.banPlayer(socket.id, targetPlayerId);
      if (!banResult.success) return;

      const targetSocket = room.getSocket(targetPlayerId);
      if (targetSocket) {
        targetSocket.emit('kicked', { reason: 'You were banned from this room by the host.' });
        targetSocket.leave(room.id);
      }
      room.removePlayer(targetPlayerId);
      room.broadcast('player_kicked', {
        targetId: targetPlayerId,
        targetName: banResult.targetName,
        players: room.getAllPlayers().map(p => p.toJSON())
      });
      room.broadcast('chat_system', { text: `🚨 ${banResult.targetName} was banned from the room by the host.` });
      broadcastPublicRooms(io);
    });

    // 9c. Report Player
    socket.on('report_player', ({ targetPlayerId, reason }) => {
      const room = getRoom(currentRoomId);
      if (!room) return;

      const reportResult = room.reportPlayer(socket.id, targetPlayerId, reason);
      if (!reportResult.success) return;

      socket.emit('chat_message', {
        id: `report-${Date.now()}`,
        system: true,
        type: 'close_guess',
        text: `Your report against ${reportResult.targetName} for "${reportResult.reason}" has been filed.`
      });

      room.broadcast('chat_system', {
        text: `A moderation report was submitted against ${reportResult.targetName}.`
      });
    });

    // 9d. Toggle Spectator Mode
    socket.on('toggle_spectator', () => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      const player = room.getPlayer(socket.id);
      if (!player) return;

      player.isSpectator = !player.isSpectator;
      room.broadcast('player_updated', {
        player: player.toJSON(),
        players: room.getAllPlayers().map(p => p.toJSON())
      });
      room.broadcast('chat_system', {
        text: `${player.name} is now ${player.isSpectator ? 'spectating 👁️' : 'an active player 🎮'}.`
      });
    });

    // 10. Return to Lobby
    socket.on('return_to_lobby', () => {
      const room = getRoom(currentRoomId);
      if (!room) return;
      const player = room.getPlayer(socket.id);
      if (!player || !player.isHost) return;

      room.game.resetToLobby();
      broadcastPublicRooms(io);
    });

    // 11. Disconnect Handler
    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const removedPlayer = room.removePlayer(socket.id);
      if (removedPlayer) {
        room.broadcastToOthers(socket.id, 'player_left', {
          playerId: socket.id,
          playerName: removedPlayer.name,
          players: room.getAllPlayers().map(p => p.toJSON())
        });

        room.broadcast('chat_message', {
          id: `leave-${Date.now()}-${Math.random()}`,
          system: true,
          type: 'leave',
          text: `${removedPlayer.name} left the room.`
        });
      }

      // If room is now empty, delete room
      if (room.players.size === 0) {
        room.game.clearInterval();
        rooms.delete(currentRoomId);
      }

      broadcastPublicRooms(io);
    });

    function getRoom(id) {
      if (!id) return null;
      return rooms.get(id);
    }
  });
}

function broadcastPublicRooms(io) {
  const publicRooms = Array.from(rooms.values())
    .filter(r => !r.isPrivate)
    .map(r => r.toPublicSummary());
  io.emit('public_rooms_list', publicRooms);
}
