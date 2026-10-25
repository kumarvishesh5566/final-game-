import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWord, getRandomWords, parseCustomWords } from './words.js';
import { Room } from './Room.js';
import { Game } from './Game.js';
import { Player } from './Player.js';

test('normalizeWord correctly cleans accents, punctuation, and casing', () => {
  assert.equal(normalizeWord('  Café!  '), 'cafe');
  assert.equal(normalizeWord('Flamingo 123'), 'flamingo 123');
  assert.equal(normalizeWord('HÉLÈNE...'), 'helene');
  assert.equal(normalizeWord('pizza   pie'), 'pizza pie');
});

test('checkIsClose detects typos at Levenshtein distance 1', () => {
  const dummyRoom = { broadcast: () => {}, getAllPlayers: () => [] };
  const game = new Game(dummyRoom);

  // Exact 1 char typo
  assert.equal(game.checkIsClose('pizaa', 'pizza'), true);
  assert.equal(game.checkIsClose('elefant', 'elephant'), true);
  // 2 or more typos away
  assert.equal(game.checkIsClose('apple', 'banana'), false);
  // Short words (<3 letters)
  assert.equal(game.checkIsClose('ox', 'ox'), false);
});

test('getMaskedWord formats hidden mode and normal letter reveals correctly', () => {
  const dummyRoom = { broadcast: () => {}, getAllPlayers: () => [] };
  
  // Normal mode
  const game = new Game(dummyRoom, { wordMode: 'normal' });
  game.currentWord = 'cat';
  assert.equal(game.getMaskedWord(), '_ _ _');
  game.revealedIndices.add(1);
  assert.equal(game.getMaskedWord(), '_ a _');

  // Multi-word phrase with space
  game.currentWord = 'ice cream';
  game.revealedIndices.clear();
  assert.equal(game.getMaskedWord(), '_ _ _   _ _ _ _ _');

  // Hidden mode
  const hiddenGame = new Game(dummyRoom, { wordMode: 'hidden' });
  hiddenGame.currentWord = 'ice cream';
  assert.equal(hiddenGame.getMaskedWord(), '? ? ?   ? ? ? ? ?');
});

test('getRandomWords handles combination mode and customWordsOnly flag', () => {
  // Combination mode generates adjective + noun
  const combos = getRandomWords(3, 'animals', [], 'en', 'combination');
  assert.equal(combos.length, 3);
  combos.forEach(c => {
    assert.match(c, /^[a-z]+ [a-z]+/);
  });

  // Custom words only
  const custom = ['space station', 'laser gun'];
  const res = getRandomWords(2, 'all', custom, 'en', 'normal', true);
  assert.equal(res.length, 2);
  assert.ok(custom.includes(res[0]));
  assert.ok(custom.includes(res[1]));
});

test('parseCustomWords filters and normalizes input', () => {
  const parsed = parseCustomWords(' apple,  Banana! , , c ');
  assert.deepEqual(parsed, ['apple', 'banana']);
});

test('Room handles player addition, host direct kick, vote kick, and ban list', () => {
  const room = new Room('TEST01', 'Alice');
  const dummySocket1 = { id: 's1', join: () => {}, emit: () => {} };
  const dummySocket2 = { id: 's2', join: () => {}, emit: () => {} };
  const dummySocket3 = { id: 's3', join: () => {}, emit: () => {} };

  const p1 = new Player('s1', 'Alice');
  const p2 = new Player('s2', 'Bob');
  const p3 = new Player('s3', 'Charlie');

  room.addPlayer(dummySocket1, p1);
  assert.equal(p1.isHost, true);

  room.addPlayer(dummySocket2, p2);
  room.addPlayer(dummySocket3, p3);
  assert.equal(room.players.size, 3);

  // Host can kick directly
  const kickRes = room.voteKick('s1', 's2');
  assert.equal(kickRes.kicked, true);

  // Ban target
  const banRes = room.banPlayer('s1', 's3');
  assert.equal(banRes.success, true);
  assert.ok(room.bannedNames.has('charlie'));

  // Attempting to rejoin with banned name throws
  assert.throws(() => {
    room.addPlayer({ id: 's4', join: () => {} }, new Player('s4', 'Charlie'));
  }, /banned/);
});

test('Room reports are properly stored', () => {
  const room = new Room('TEST02', 'HostPlayer');
  room.addPlayer({ id: 's1', join: () => {} }, new Player('s1', 'HostPlayer'));
  room.addPlayer({ id: 's2', join: () => {} }, new Player('s2', 'Spammer'));

  const report = room.reportPlayer('s1', 's2', 'Spamming chat');
  assert.equal(report.success, true);
  assert.equal(room.reports.length, 1);
  assert.equal(room.reports[0].reason, 'Spamming chat');
});
