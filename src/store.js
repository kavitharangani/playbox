// Player, settings and score storage. Everything is kept in this browser's localStorage.
import { useSyncExternalStore } from 'react';
import { games, getGame } from './games/index.js';

const KEY = 'playbox.v1';
const BOT_NAMES = ['Bot Rookie', 'Bot Regular', 'Bot Expert', 'Bot Legend'];
const listeners = new Set();
let version = 0;
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.scores) return saved;
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return { player: null, scores: {} };
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* storage blocked: scores last for this visit only */ }
  version++;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Re-renders a component whenever the player, settings or scores change.
export function useStore() {
  return useSyncExternalStore(subscribe, () => version);
}

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();
const scoresFor = (id) => state.scores[id] || [];

export function hasPlayer() { return !!state.player; }
export function getPlayer() { return state.player || 'Player'; }

export function setPlayer(name) {
  state.player = name.trim().slice(0, 16) || 'Player';
  save();
}

export function getPref(key, fallback) {
  const prefs = state.prefs || {};
  return key in prefs ? prefs[key] : fallback;
}

export function setPref(key, value) {
  (state.prefs = state.prefs || {})[key] = value;
  save();
}

// Every play and bot score, best first. Equal scores share a place.
export function leaderboard(id) {
  const bots = getGame(id).bots.map((score, i) => ({ name: BOT_NAMES[i], score, bot: true, at: 0 }));
  const rows = bots.concat(scoresFor(id)).sort((a, b) => b.score - a.score || a.at - b.at);
  let place = 0;
  return rows.map((row, i) => {
    if (i === 0 || rows[i - 1].score !== row.score) place = i + 1;
    return { ...row, place, mine: !row.bot && sameName(row.name, getPlayer()) };
  });
}

export function addScore(id, score) {
  const previous = stats(id);
  const entry = { name: getPlayer(), score, at: Date.now() };
  (state.scores[id] = state.scores[id] || []).push(entry);
  const rows = leaderboard(id);
  entry.place = rows.find((r) => r.at === entry.at && r.name === entry.name).place;
  entry.total = rows.length;
  save();
  return {
    entry,
    place: entry.place,
    total: entry.total,
    isBest: score > 0 && (!previous || score > previous.best),
  };
}

// The current player's numbers for one game, or null if they have not played it.
export function stats(id) {
  const rows = leaderboard(id);
  const mine = rows.filter((r) => r.mine);
  if (!mine.length) return null;
  return { plays: mine.length, best: mine[0].score, bestPlace: mine[0].place, total: rows.length };
}

// What it takes to climb above a score: the place to reach and the points needed. Null when already 1st.
export function nextPlace(id, score) {
  const above = leaderboard(id).filter((r) => r.score > score).pop();
  return above ? { place: above.place, points: above.score - score + 1 } : null;
}

// The current player's latest plays across all games, newest first.
export function recent(limit) {
  const plays = [];
  games.forEach((game) => scoresFor(game.id).forEach((s) => {
    if (sameName(s.name, getPlayer())) plays.push({ game, ...s });
  }));
  return plays.sort((a, b) => b.at - a.at).slice(0, limit);
}
