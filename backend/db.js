/**
 * MongoDB connection and schemas using Mongoose
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

// 1. Match History Schema
const MatchHistorySchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  winner: {
    name: { type: String, default: 'Anonymous' },
    score: { type: Number, default: 0 },
    avatar: { type: Object, default: {} }
  },
  players: [{
    id: String,
    name: String,
    score: Number,
    avatar: Object
  }],
  rounds: { type: Number, default: 3 },
  category: { type: String, default: 'all' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 2. Global Player Stats Schema
const PlayerStatsSchema = new mongoose.Schema({
  playerName: { type: String, required: true, unique: true, index: true },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  lastAvatar: { type: Object, default: {} },
  lastPlayed: { type: Date, default: Date.now }
}, { timestamps: true });

export const MatchHistory = mongoose.models.MatchHistory || mongoose.model('MatchHistory', MatchHistorySchema);
export const PlayerStats = mongoose.models.PlayerStats || mongoose.model('PlayerStats', PlayerStatsSchema);

let isConnected = false;

export async function connectDB() {
  if (isConnected) return true;
  if (!MONGODB_URI) {
    console.log('[MongoDB] No MONGODB_URI set in environment. Running with in-memory state.');
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return true;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    isConnected = false;
    return false;
  }
}

export function getDBStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    database: mongoose.connection.name || 'activityservice_db'
  };
}

/**
 * Record a completed match into MongoDB and update global player stats
 */
export async function recordCompletedMatch({ roomId, winner, leaderboard, rounds, category }) {
  try {
    if (!isConnected && mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('[MongoDB] Cannot record match: Database not connected.');
      return null;
    }

    // 1. Save match record
    const match = await MatchHistory.create({
      roomId,
      winner: winner ? {
        name: winner.name,
        score: winner.score,
        avatar: winner.avatar
      } : null,
      players: (leaderboard || []).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        avatar: p.avatar
      })),
      rounds: rounds || 3,
      category: category || 'all'
    });

    // 2. Update each player's global stats
    for (const player of (leaderboard || [])) {
      if (!player.name) continue;
      const isWinner = winner && (player.id === winner.id || player.name === winner.name);

      await PlayerStats.findOneAndUpdate(
        { playerName: player.name },
        {
          $inc: {
            gamesPlayed: 1,
            gamesWon: isWinner ? 1 : 0,
            totalScore: player.score || 0
          },
          $max: { highestScore: player.score || 0 },
          $set: {
            lastAvatar: player.avatar || {},
            lastPlayed: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log(`[MongoDB] Successfully persisted match ${match._id} for room ${roomId}`);
    return match;
  } catch (err) {
    console.error('[MongoDB] Error recording match:', err.message);
    return null;
  }
}

/**
 * Get top players all-time leaderboard from MongoDB
 */
export async function getGlobalLeaderboard(limit = 10) {
  try {
    if (mongoose.connection.readyState !== 1) await connectDB();
    if (mongoose.connection.readyState !== 1) return [];

    return await PlayerStats.find({})
      .sort({ totalScore: -1, gamesWon: -1 })
      .limit(limit)
      .lean();
  } catch (err) {
    console.error('[MongoDB] Error fetching global leaderboard:', err.message);
    return [];
  }
}

/**
 * Get recent matches list from MongoDB
 */
export async function getRecentMatches(limit = 10) {
  try {
    if (mongoose.connection.readyState !== 1) await connectDB();
    if (mongoose.connection.readyState !== 1) return [];

    return await MatchHistory.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (err) {
    console.error('[MongoDB] Error fetching recent matches:', err.message);
    return [];
  }
}
