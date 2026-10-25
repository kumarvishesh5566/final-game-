/**
 * OOP Player model for skribbl.io game
 */
export class Player {
  constructor(id, name, avatar = null, isHost = false, isSpectator = false) {
    this.id = id;
    this.name = (name || 'Anonymous').trim().slice(0, 16);
    this.avatar = avatar || {
      color: '#3b82f6',
      eyes: 'normal',
      mouth: 'smile',
      accessory: 'none'
    };
    this.score = 0;
    this.roundScore = 0;
    this.hasGuessed = false;
    this.guessTime = null;
    this.isHost = isHost;
    this.isDrawer = false;
    this.isReady = false;
    this.isSpectator = isSpectator;
    this.connected = true;
    this.joinedAt = Date.now();
  }

  resetForNewRound() {
    this.hasGuessed = false;
    this.roundScore = 0;
    this.guessTime = null;
    this.isDrawer = false;
  }

  addScore(points) {
    this.roundScore += points;
    this.score += points;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      hasGuessed: this.hasGuessed,
      isHost: this.isHost,
      isDrawer: this.isDrawer,
      isReady: this.isReady,
      isSpectator: this.isSpectator,
      connected: this.connected
    };
  }
}
