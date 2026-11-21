// La Vallée des Graines — main game: state, world loop, input, UI, farming, shop, crafting, battles.
import { W, H, SOLID, TALL, buildWorld, zoneAt, plotPos, START, NPCS, WILD, PADDOCK } from './world.js';
import {
  CROPS, PRODUCTS, ITEMS, RECIPES, BUILDINGS, TOOLS, WATER_FRAC, PLOT_BUYS, HATS, titleFor, MAX_LVL, xpNeed, GATE_LVL,
  GATES, CREATURES, CREATURE_ORDER, CHESTS, CUSTOMERS, OBJECTIVES, BADGES, ANIMALS, BARN_BUYS, OLD_OBJECTIVE_ORDER,
} from './data.js';
import { gridSVG, gridKey } from './geo.js';
import { makeProblem, checkAnswer, renderQ, fmt, CATS, MEASURE_CATS, OP_NAMES, NEW_CONCEPTS, LESSONS, FR_SKILLS, FR_GROUPS } from './math.js';
import * as A from './art.js';
import { syncState, formatCode, cleanCode, createCode, fetchCode, adoptCode, stopSync, pushSave, flushSave, pullRemote, markSynced, saveOnlineNow } from './sync.js';

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => Date.now();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const itemName = (id) => (ITEMS[id] ? ITEMS[id].name : id);
const plural = (word, n) => (n < 2 || /[sxz]$/.test(word) ? word : word.endsWith('al') ? word.slice(0, -2) + 'aux' : word + 's');
const qtyName = (id, n) => `${n} ${plural(itemName(id).toLowerCase(), n)}`;
function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m} min ${String(r).padStart(2, '0')} s` : `${m} min`;
}

// ============================================================ State
const SAVE_KEY = 'vallee-graines-v1';
function newState() {
  return {
    v: 1, name: 'Thibault', coins: 25, xp: 0, lvl: 1, lvlV: 4,
    inv: { 'graine:radis': 4 },
    plots: Array.from({ length: 18 }, (_, i) => ({ u: i < 4, crop: null, at: 0, grow: 0, skip: 0, fert: false, wet: 0 })),
    plotBuys: 0,
    tools: { arrosoir: 0, bottes: false, hache: false, pioche: false, panier: false, epouvantail: false, arroseur: false, canne: false },
    hat: 'rouge', hats: ['rouge'],
    built: {}, flags: {}, chests: {}, res: {},
    orders: [], creatures: {}, badges: {},
    stats: { correct: 0, wrong: 0, planted: 0, watered: 0, harvests: 0, sold: 0, bought: 0, orders: 0, bois: 0, pierre: 0, cristal: 0, fish: 0, measureOK: 0, maxStreak: 0, made: {}, harvested: {}, battles: 0, caught: 0, fed: 0, collected: 0, perfectReviews: 0 },
    streak: 0, mastery: {}, objDone: {}, daily: {},
    animals: [], barnSlots: 4, found: {}, stars: {}, defis: {}, ease: {}, easeRun: {}, skills: {}, concepts: {}, lessons: {},
    pos: { ...START },
    settings: { sound: true, music: true, grade: 8, diff: 0, cats: {}, pin: '' },
  };
}
function migrate(s) {
  const d = newState();
  if (s.skills && (s.skillsV || 0) < 2) { for (const sk of Object.values(s.skills)) { sk.lv = 1; sk.r = []; sk.acq = 0; } }
  if (s.skills && (s.skillsV || 0) < 3) { for (const sk of Object.values(s.skills)) { sk.sc = 0; sk.nl = 0; } }
  if (s.skills && (s.skillsV || 0) < 4) { for (const k of ['calc:add', 'calc:sub']) if (s.skills[k]) Object.assign(s.skills[k], { lv: 1, r: [], acq: 0, sc: 0, nl: 0 }); }
  s.skillsV = 4;
  if ((s.lvlV || 1) < 4) {
    // the 50-level progression: every game made before it starts over at level 1, keeping the name and the settings
    const fresh = newState();
    fresh.name = s.name || fresh.name;
    fresh.settings = { ...fresh.settings, ...(s.settings || {}) };
    s = fresh;
  }
  s.lvlV = 4;
  // First version kept the objective as an index: turn it into the list of finished ones.
  if (typeof s.obj === 'number' && !s.objDone) { s.objDone = {}; OLD_OBJECTIVE_ORDER.slice(0, s.obj).forEach((id) => (s.objDone[id] = 1)); delete s.obj; }
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  for (const grp of ['stats', 'tools', 'settings']) for (const k of Object.keys(d[grp])) if (s[grp][k] === undefined) s[grp][k] = d[grp][k];
  return s;
}
function loadSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch { /* no storage */ } return null; }
let S = newState(); // placeholder until a game starts (the title screen draws the world with it)
let started = false;
let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
// Only real progress (not walking around) counts as a change worth sending to the online save.
const progressSig = (s) => { const { pos, updatedAt, ...rest } = s; return JSON.stringify(rest); };
let lastSig = '';
// The online save costs a paid storage operation per send, so not every watering or harvest is sent: a milestone
// (level, objective, badge, building, tool, hat, creature, plot) goes at once, other progress at most every 10 min
// while playing, and whatever is left when the game is hidden or closed. The device itself saves everything at once.
const milestoneSig = (s) => JSON.stringify([s.lvl, Object.keys(s.objDone || {}).length, Object.keys(s.badges || {}).length, Object.keys(s.built || {}).length, s.tools, (s.hats || []).length, Object.keys(s.creatures || {}).length, s.plotBuys]);
const ONLINE_EVERY = 10 * 60 * 1000;
let lastMilestone = '', lastSent = 0;
function sendOnline(force) {
  const m = milestoneSig(S);
  if (!force && m === lastMilestone && Date.now() - lastSent < ONLINE_EVERY) return;
  lastMilestone = m; lastSent = Date.now();
  pushSave(S, onRemote, force);
}
function saveNow() {
  if (!started) return;
  S.pos = { x: pl.x, y: pl.y, dir: pl.dir };
  const sig = progressSig(S);
  const changed = sig !== lastSig;
  if (changed) { lastSig = sig; S.updatedAt = now(); }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch { /* private mode */ }
  if (changed) {
    sendOnline(false);
    // The game left open without playing (tablet on the sofa, then the laptop): after 2 min with no progress,
    // what the online save lacks goes up, so the other device finds it. Steady play never waits that long.
    clearTimeout(idleSend);
    idleSend = setTimeout(() => { if (started && unsynced()) sendOnline(true); }, IDLE_SEND);
  }
}
const IDLE_SEND = 2 * 60 * 1000;
let idleSend = 0;
/** The « Sauvegarder » menu entry: saved on this device at once, and online when there is a code. */
async function saveMenu() {
  saveNow();
  if (!syncState()) return say('Ta partie est sauvegardée sur cet appareil. Pour la continuer sur un autre appareil, crée un code dans Options.');
  lastMilestone = milestoneSig(S); lastSent = Date.now();
  clearTimeout(idleSend);
  const r = await saveOnlineNow(S, onRemote);
  if (r === 'ok') return say('Ta partie est sauvegardée, sur cet appareil et en ligne.');
  if (r === 'conflict') return say('Un autre appareil avait joué entre-temps : la partie qui va le plus loin est gardée.');
  return say('Pas de connexion pour l’instant. Ta partie est sauvegardée sur cet appareil et partira en ligne dès que possible.');
}
// Leaving the page or hiding it: what the online save does not have yet is sent at once.
function sendLeft() { saveNow(); if (unsynced()) sendOnline(true); else flushSave(); }
addEventListener('pagehide', sendLeft);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sendLeft();
  else if (started) pullRemote().then(onRemote);
});

// ---- Several devices on one code
/** Progress of a game: all the XP earned (levels passed + XP of the current level). */
function progressOf(s) { let t = (s && s.xp) || 0; for (let l = 1; l < ((s && s.lvl) || 1); l++) t += xpNeed(l); return t; }
/** This device has changes the online save does not have yet. */
const unsynced = () => { const st = syncState(); return !!st && (S.updatedAt || 0) !== st.at; };
/**
 * The online save changed since this device last synced (another device played). If this device has nothing new,
 * take it. If both played, keep the game with the most progress: the other device's one, or this one (sent again).
 */
function onRemote(online) {
  const st = syncState();
  if (!online || !online.save || !st || online.updatedAt === st.at) return;
  if (!unsynced() || progressOf(online.save) > progressOf(S)) { adoptRemote(online.save, online.updatedAt); return; }
  markSynced(online.updatedAt); // this game goes further: it replaces the online one
  pushSave(S, onRemote, true);
}
// A game from another device replaces this one (as soon as no window is open).
let pendingRemote = null;
function adoptRemote(remote, at) {
  if (!remote || remote.v !== 1) return;
  pendingRemote = { save: remote, at: at ?? remote.updatedAt };
  applyPendingRemote();
}
function applyPendingRemote() {
  if (!pendingRemote || layers.length || busy || pl.moving) return;
  const { save: remote, at } = pendingRemote;
  pendingRemote = null;
  S = migrate(remote);
  S.updatedAt = at;
  markSynced(at);
  lastSig = progressSig(S);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch { /* private mode */ }
  pl.x = S.pos.x; pl.y = S.pos.y; pl.dir = S.pos.dir || 'down'; pl.px = pl.x * 16; pl.py = pl.y * 16;
  applyWorldFlags(); farmEnts = []; syncFarm(); ensureOrders(); updateHud(); updateObjective();
  toast('Partie mise à jour depuis un autre appareil', 'blue');
}

// ============================================================ Sound
let AC = null;
function tone(f, d = 0.08, type = 'square', v = 0.04, when = 0, slide = 0) {
  if (!S || !S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t0 = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.02);
  } catch { /* audio blocked */ }
}
const sfx = {
  blip: () => tone(700, 0.025, 'square', 0.012),
  sel: () => tone(880, 0.05, 'square', 0.03),
  ok: () => { tone(784, 0.08); tone(1047, 0.14, 'square', 0.04, 0.08); },
  bad: () => { tone(240, 0.14, 'sawtooth', 0.025); tone(180, 0.2, 'sawtooth', 0.025, 0.12); },
  coin: () => { tone(988, 0.06, 'square', 0.03); tone(1319, 0.12, 'square', 0.03, 0.06); },
  level: () => fanfare(),
  bump: () => tone(90, 0.06, 'triangle', 0.06),
  hit: () => { tone(420, 0.12, 'sawtooth', 0.05, 0, -300); tone(140, 0.1, 'square', 0.04, 0.08); },
  water: () => { for (let i = 0; i < 5; i++) tone(1400 - i * 160, 0.05, 'sine', 0.03, i * 0.04); },
  // something moves in the tall grass… then a creature jumps out
  enc: () => { rustle(0, 0.5); chime(['E5', 'G#5', 'B5', 'E6'], 0.07, { delay: 0.55, type: 'triangle', v: 0.06 }); },
  harvest: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.07, 'triangle', 0.05, i * 0.06)),
  friend: () => chime(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], 0.1, { type: 'triangle', d: 0.4, v: 0.07 }),
  discover: () => chime(['G5', 'B5', 'D6', 'G6', 'B6', 'D7'], 0.06, { d: 0.6, v: 0.05 }),
  treasure: () => { chime(['A5', 'C#6', 'E6', 'A6'], 0.08, { d: 0.5, v: 0.06 }); chime(['E6', 'A6'], 0.12, { delay: 0.4, d: 0.7, v: 0.05 }); },
  fanfare: () => fanfare(),
};

// ---- Softer voices for the music and the discovery sounds (plain Web Audio, no files)
function ac() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function voice(f, t0, d, { type = 'triangle', v = 0.05, dest = null, attack = 0.01 } = {}) {
  const o = AC.createOscillator(), g = AC.createGain();
  if (type.startsWith('pulse')) o.setPeriodicWave(pulseWave(Number(type.slice(5)) / 100)); else o.type = type;
  o.frequency.setValueAtTime(f, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(d, attack + 0.02));
  o.connect(g).connect(dest || AC.destination); o.start(t0); o.stop(t0 + d + 0.05);
}
/** "C#5" → 554 Hz */
function NOTE(n) {
  const [, l, acc, oct] = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[l] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
  return 440 * 2 ** ((semi + (Number(oct) + 1) * 12 - 69) / 12);
}
/** A bell-like little tune: each note with a soft octave above. */
function chime(notes, step = 0.08, o = {}) {
  if (!S || !S.settings.sound) return;
  try {
    const a = ac(), d = o.d || 0.35, v = o.v || 0.06;
    notes.forEach((n, i) => {
      const t = a.currentTime + (o.delay || 0) + i * step, f = NOTE(n);
      voice(f, t, d, { type: o.type || 'sine', v });
      voice(f * 2, t, d * 0.6, { type: 'sine', v: v * 0.3 });
    });
  } catch { /* audio blocked */ }
}
function fanfare() {
  if (!S || !S.settings.sound) return;
  try {
    const a = ac(), t = a.currentTime;
    [['C5', 0], ['C5', 0.12], ['C5', 0.24], ['E5', 0.36], ['G5', 0.6], ['E5', 0.84], ['G5', 0.96], ['C6', 1.08]].forEach(([n, w], i) => {
      voice(NOTE(n), t + w, i === 7 ? 0.8 : 0.22, { type: 'triangle', v: 0.07 });
      voice(NOTE(n) / 2, t + w, i === 7 ? 0.8 : 0.22, { type: 'sine', v: 0.04 });
    });
  } catch { /* audio blocked */ }
}
let noiseBuf = null;
function noise(t0, d, v, freq, dest, kind = 'bandpass') {
  if (!noiseBuf) {
    noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.6), AC.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; f.type = kind; f.frequency.value = freq; f.Q.value = 0.9;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(f).connect(g).connect(dest || AC.destination); src.start(t0); src.stop(t0 + d + 0.05);
}
/** Leaves rustling: a few soft bursts of noise. */
function rustle(when = 0, d = 0.5) {
  if (!S || !S.settings.sound) return;
  try { const a = ac(); for (let k = 0; k < 4; k++) noise(a.currentTime + when + k * (d / 4) + Math.random() * 0.03, d / 3, 0.09, 1800 + Math.random() * 1500); } catch { /* audio blocked */ }
}

// ---- Background music: chiptune tunes played live (lead, bouncing bass, arpeggios, drums),
// one per part of the valley, quieter during a problem.
const PULSES = {};
/** The classic console "pulse" sound: a square wave with a narrow duty (12.5 %, 25 %). */
function pulseWave(duty) {
  if (PULSES[duty]) return PULSES[duty];
  const N = 40, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) { re[n] = (2 / (n * Math.PI)) * Math.sin(2 * Math.PI * n * duty); im[n] = (2 / (n * Math.PI)) * (1 - Math.cos(2 * Math.PI * n * duty)); }
  return (PULSES[duty] = AC.createPeriodicWave(re, im));
}
function kick(t, dest, v = 0.22) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(dest); o.start(t); o.stop(t + 0.2);
}
const snare = (t, dest, v = 0.06) => { noise(t, 0.12, v, 1900, dest); voice(190, t, 0.06, { type: 'triangle', v: v * 0.8, dest }); };
const hat = (t, dest, v = 0.016) => noise(t, 0.035, v, 8000, dest, 'highpass');
/** "E5:4 G5:2 …" in sixteenths ("." is a rest) → [[step, note, length]] */
function seq(str) {
  const ev = []; let t = 0;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [n, l] = tok.split(':'), len = Number(l || 1);
    if (n !== '.') ev.push([t, n, len]);
    t += len;
  }
  return { ev, len: t };
}
/**
 * A tune: bpm, the lead (in sixteenths), one chord per bar ([bass root, ...arpeggio notes]),
 * and drum steps inside a bar of 16 (kick, snare, hat).
 */
const TRACKS = {
  // village and fields: bright and bouncy, C major
  valley: { bpm: 112, lead: 'pulse25', lv: 0.032, echo: false,
    mel: seq('E5:4 G5:2 C6:2 G5:4 E5:4 | D5:4 G5:2 B5:2 D6:6 B5:2 | C6:4 B5:2 A5:2 E5:4 A5:4 | F5:2 G5:2 A5:2 C6:2 A5:4 F5:4 | E5:4 G5:2 C6:2 E6:4 D6:2 C6:2 | B5:4 D6:2 B5:2 G5:8 | A5:2 G5:2 F5:2 A5:2 C6:4 A5:4 | G5:2 A5:2 B5:2 G5:2 D6:8'),
    chords: [['C3', 'C5', 'E5', 'G5'], ['G2', 'B4', 'D5', 'G5'], ['A2', 'A4', 'C5', 'E5'], ['F2', 'A4', 'C5', 'F5'], ['C3', 'C5', 'E5', 'G5'], ['G2', 'B4', 'D5', 'G5'], ['F2', 'A4', 'C5', 'F5'], ['G2', 'B4', 'D5', 'G5']],
    kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  // forest: adventurous and a bit mysterious, A minor, with an echo on the lead
  forest: { bpm: 100, lead: 'pulse12', lv: 0.03, echo: true,
    mel: seq('A4:4 C5:2 E5:2 A5:4 G5:2 E5:2 | F5:4 E5:2 C5:2 A4:8 | G4:2 B4:2 D5:2 G5:2 F5:4 D5:4 | E5:6 D5:2 B4:4 G#4:4 | A4:4 C5:2 E5:2 A5:4 B5:2 C6:2 | D6:4 C6:2 A5:2 F5:8 | G5:2 F5:2 D5:2 B4:2 G5:4 F5:4 | E5:8 .:4 E4:4'),
    chords: [['A2', 'A4', 'C5', 'E5'], ['F2', 'A4', 'C5', 'F5'], ['G2', 'G4', 'B4', 'D5'], ['E2', 'G#4', 'B4', 'E5'], ['A2', 'A4', 'C5', 'E5'], ['F2', 'A4', 'C5', 'F5'], ['G2', 'G4', 'B4', 'D5'], ['E2', 'G#4', 'B4', 'E5']],
    kick: [0, 8], snare: [12], hat: [2, 6, 10, 14] },
  // creature battle: fast and punchy
  battle: { bpm: 152, lead: 'pulse25', lv: 0.03, echo: false,
    mel: seq('D5:2 F5:2 A5:2 F5:2 D5:2 F5:2 A5:2 D6:2 | Bb4:2 D5:2 F5:2 D5:2 Bb4:2 D5:2 F5:2 Bb5:2 | C5:2 E5:2 G5:2 E5:2 C5:2 E5:2 G5:2 C6:2 | A4:2 C#5:2 E5:2 A5:2 E5:4 C#5:4'),
    chords: [['D3', 'D5', 'F5', 'A5'], ['Bb2', 'Bb4', 'D5', 'F5'], ['C3', 'C5', 'E5', 'G5'], ['A2', 'A4', 'C#5', 'E5']],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15] },
};
// the lake: the village tune higher up; the mountain: the forest tune lower down
const ZONE_MUSIC = { ferme: ['valley', 0], foret: ['forest', 0], lac: ['valley', 5], montagne: ['forest', -3] };
const music = { key: null, name: null, tr: 0, pos: 0, next: 0, gain: null, fadeUntil: 0 };
let inBattle = false;
function musicWanted() {
  if (!S || !S.settings.music) return null;
  if (inBattle) return ['battle', 0];
  if (mode !== 'world') return ['valley', 0];
  return ZONE_MUSIC[zoneAt(pl.x, pl.y)] || ['valley', 0];
}
function musicTick() {
  if (!AC || AC.state !== 'running') return;
  try {
    if (!music.gain) { music.gain = AC.createGain(); music.gain.gain.value = 0; music.gain.connect(AC.destination); }
    const want = musicWanted(), key = want ? want.join(':') : null, now_ = AC.currentTime;
    if (key !== music.key) {
      // fade out, then start the new tune from its beginning
      music.gain.gain.cancelScheduledValues(now_);
      music.gain.gain.setTargetAtTime(0, now_, 0.12);
      music.key = key; music.pos = 0; music.next = now_ + 0.6; music.fadeUntil = now_ + 0.55;
      if (want) [music.name, music.tr] = want;
      return;
    }
    if (!want) return;
    if (now_ > music.fadeUntil) music.gain.gain.setTargetAtTime(document.querySelector('.mathbox') ? 0.35 : 0.85, now_, 0.4);
    const T = TRACKS[music.name], step = 60 / T.bpm / 4, k = 2 ** (music.tr / 12), out = music.gain;
    if (music.next < now_) music.next = now_ + 0.05; // after a pause, do not play the missed notes all at once
    while (music.next < now_ + 0.25) {
      const t = music.next, p = music.pos % T.mel.len, inBar = p % 16, chord = T.chords[Math.floor(p / 16) % T.chords.length];
      // lead (with a soft echo three steps later in the forest)
      for (const [s, n, len] of T.mel.ev) if (s === p) {
        const f = NOTE(n) * k, d = Math.min(len * step * 0.92, 0.9);
        voice(f, t, d, { type: T.lead, v: T.lv, dest: out, attack: 0.005 });
        if (T.echo) voice(f, t + step * 3, d, { type: T.lead, v: T.lv * 0.3, dest: out, attack: 0.005 });
      }
      // bass: bouncing between the root and its octave, every eighth
      if (inBar % 2 === 0) voice(NOTE(chord[0]) * k * (inBar % 4 === 2 ? 2 : 1), t, step * 1.7, { type: 'triangle', v: 0.11, dest: out, attack: 0.005 });
      // quick arpeggio of the chord, quiet
      voice(NOTE(chord[1 + [0, 1, 2, 1][inBar % 4]]) * k * 2, t, step * 0.8, { type: 'pulse12', v: 0.009, dest: out, attack: 0.003 });
      // drums
      if (T.kick.includes(inBar)) kick(t, out);
      if (T.snare.includes(inBar)) snare(t, out);
      if (T.hat.includes(inBar)) hat(t, out);
      music.next += step; music.pos++;
    }
  } catch { /* audio blocked */ }
}
setInterval(musicTick, 60);
// browsers only allow sound after a tap or a key: start the audio on the first one
const unlockAudio = () => { if (S && (S.settings.music || S.settings.sound)) { try { ac(); } catch { /* audio blocked */ } } };
addEventListener('pointerdown', unlockAudio, true);
addEventListener('keydown', unlockAudio, true);
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend(); else if (started || mode === 'title') AC.resume(); });

// ============================================================ Canvas
// Touch devices (phones, tablets, touch laptops) get the on-screen pad, even with a mouse or keyboard attached.
const root = document.documentElement;
const markTouch = () => root.classList.add('is-touch');
if (navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches) markTouch();
addEventListener('touchstart', markTouch, { once: true, passive: true });
const isTouch = () => root.classList.contains('is-touch');

const cv = document.getElementById('world');
const ctx = cv.getContext('2d');
const ui = document.getElementById('ui');

// The pixel font draws 5 like an S and 2 like a Z: every number in the interface is shown in the reading font.
// A watcher wraps digits as they appear (dialogs retype their text a few letters at a time).
const NUM_RE = /(\d+(?:[,  ]\d+)*)/;
function numsIn(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!/\d/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      for (let p = n.parentElement; p; p = p.parentElement) {
        if (p.classList.contains('num') || p.classList.contains('mathbox') || p.namespaceURI === 'http://www.w3.org/2000/svg' || /^(INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p === ui) break;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const found = [];
  while (walker.nextNode()) found.push(walker.currentNode);
  for (const n of found) {
    const parts = n.nodeValue.split(NUM_RE);
    if (parts.length < 2) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((s, i) => { if (!s) return; frag.append(i % 2 ? h('span', { class: 'num' }, s) : document.createTextNode(s)); });
    n.replaceWith(frag);
  }
}
new MutationObserver((muts) => {
  const roots = new Set();
  for (const mu of muts) roots.add(mu.type === 'characterData' ? mu.target.parentElement : mu.target);
  for (const r of roots) if (r && r.isConnected) numsIn(r);
}).observe(ui, { childList: true, subtree: true, characterData: true });
let SCALE = 3, VW = 320, VH = 240, DPR = 1;
function resize() {
  const dpr = (DPR = Math.min(window.devicePixelRatio || 1, 3));
  const w = innerWidth, h = innerHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const portrait = h > w * 1.1;
  const cols = portrait ? 11 : 16, rows = portrait ? 15 : h < 500 ? 8 : 10;
  SCALE = Math.max(1, Math.floor(Math.min(cv.width / (16 * cols), cv.height / (16 * rows))));
  VW = cv.width / SCALE; VH = cv.height / SCALE;
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
resize();

// ============================================================ World
const world = buildWorld();
const tiles = world.tiles;
const objs = world.objs;
const objById = Object.fromEntries(objs.map((o) => [o.id, o]));
let objAt = new Map();
function applyWorldFlags() {
  objById.bigrock.gone = !!S.flags.rock;
  objById.brokenbridge.gone = !!S.flags.bridge;
  Object.assign(objById.guardian, S.flags.guardian ? { x: 45, y: 11 } : { x: 44, y: 12 });
  objAt = new Map();
  for (const o of objs) {
    if (o.gone) continue;
    for (let dy = 0; dy < o.h; dy++) for (let dx = 0; dx < o.w; dx++) objAt.set(o.x + dx + (o.y + dy) * W, o);
  }
}
const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 't' : tiles[x + y * W]);
function walkable(x, y, self) {
  if (SOLID.has(tileAt(x, y))) return false;
  const o = objAt.get(x + y * W);
  if (o && o.solid) return false;
  return !entAt(x, y, self);
}

// ============================================================ Animals (wild ones to tame, farm ones in the paddock)
const ART = { poule: 'une poule', vache: 'une vache', chevre: 'une chèvre', mouton: 'un mouton', abeilles: 'un essaim d’abeilles', cochon: 'un cochon' };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const makeEnt = (id, kind, x, y, extra) => ({ id, kind, x, y, px: x * 16, py: y * 16, fx: x, fy: y, tx: x, ty: y, moving: false, t: 0, flip: false, frame: 0, next: now() + R(500, 3000), ...extra });
const wildEnts = WILD.map((w) => makeEnt(w.id, w.kind, w.x, w.y, { wild: true, home: { x: w.x, y: w.y }, still: !!w.still }));
let farmEnts = [];
const hiveSpots = [[27, 36], [27, 37], [27, 38], [27, 39], [27, 40], [27, 41], [27, 42], [26, 42], [25, 42], [24, 42]];
const entShown = (e) => !(e.wild && S.res[e.id] && S.res[e.id] > now());
function entAt(x, y, self) {
  for (const list of [wildEnts, farmEnts]) for (const e of list) {
    if (e === self || !entShown(e)) continue;
    if ((e.x === x && e.y === y) || (e.moving && e.tx === x && e.ty === y)) return e;
  }
  return null;
}
function syncFarm() {
  const keep = [];
  let hive = 0;
  for (const a of S.animals || []) {
    let e = farmEnts.find((f) => f.animal === a.id);
    if (!e) {
      if (a.kind === 'abeilles') { const [x, y] = hiveSpots[hive % hiveSpots.length]; e = makeEnt('farm:' + a.id, a.kind, x, y, { animal: a.id, still: true }); }
      else {
        let x = PADDOCK.x0, y = PADDOCK.y0;
        for (let i = 0; i < 40; i++) { x = R(PADDOCK.x0, PADDOCK.x1 - 1); y = R(PADDOCK.y0 + 1, PADDOCK.y1); if (walkable(x, y)) break; }
        e = makeEnt('farm:' + a.id, a.kind, x, y, { animal: a.id });
      }
    }
    if (a.kind === 'abeilles') hive++;
    keep.push(e);
  }
  farmEnts = keep;
}
function updateEnts(dt) {
  for (const e of [...wildEnts, ...farmEnts]) {
    if (e.still || !entShown(e)) continue;
    if (e.moving) {
      e.t += (dt * 1000) / 420;
      if (e.t >= 1) { e.t = 1; e.moving = false; e.x = e.tx; e.y = e.ty; }
      e.px = Math.round((e.fx + (e.tx - e.fx) * e.t) * 16); e.py = Math.round((e.fy + (e.ty - e.fy) * e.t) * 16);
      e.frame = e.moving ? Math.floor(e.t * 4) % 2 : 0;
      continue;
    }
    if (now() < e.next) continue;
    e.next = now() + R(900, 3500);
    if (Math.random() < 0.3) continue;
    const [dx, dy] = pick(Object.values(DIRS));
    const nx = e.x + dx, ny = e.y + dy;
    const inside = e.wild ? Math.abs(nx - e.home.x) <= 3 && Math.abs(ny - e.home.y) <= 3
      : nx >= PADDOCK.x0 && nx <= PADDOCK.x1 && ny >= PADDOCK.y0 && ny <= PADDOCK.y1;
    const onPlayer = (nx === pl.x && ny === pl.y) || (pl.moving && nx === pl.tx && ny === pl.ty);
    if (dx) e.flip = dx < 0;
    if (inside && !onPlayer && walkable(nx, ny, e)) {
      e.moving = true; e.t = 0; e.fx = e.x; e.fy = e.y; e.tx = nx; e.ty = ny;
    }
  }
}
function animalURL(kind, scale = 5) {
  const c = A.canvas(16 * scale, 16 * scale), g = c.getContext('2d');
  const base = A.canvas(16, 18); A.drawAnimal(base.getContext('2d'), 0, 2, kind, false, 0, 0);
  g.imageSmoothingEnabled = false; g.drawImage(base, 0, -2 * scale, 16 * scale, 18 * scale);
  return c.toDataURL();
}
// farm animal state
const animalOf = (e) => (S.animals || []).find((a) => a.id === e.animal);
function aProgress(a) { return a.fedAt ? Math.min(1, ((now() - a.fedAt) * speedMult() + a.skip) / a.prod) : 0; }
function aRemaining(a) { return Math.max(0, a.prod - ((now() - a.fedAt) * speedMult() + a.skip)) / speedMult(); }
const aStatus = (a) => (!a.fedAt ? 'faim' : aProgress(a) >= 1 ? 'pret' : 'occupe');
const mealText = (meal) => Object.entries(meal).map(([k, v]) => qtyName(k, v)).join(' + ');
const foodsText = (kind) => ANIMALS[kind].foods.map(mealText).join(' ou ');
const mealFor = (a) => ANIMALS[a.kind].foods.find((meal) => Object.entries(meal).every(([k, v]) => has(k, v)));
function feedAnimal(a, meal) {
  for (const [k, v] of Object.entries(meal)) addItem(k, -v);
  Object.assign(a, { fedAt: now(), prod: ANIMALS[a.kind].prod * 1000, skip: 0 });
  S.stats.fed++;
  sfx.harvest();
}
function collectAnimal(a) {
  const d = ANIMALS[a.kind], q = R(d.qty[0], d.qty[1]);
  addItem(d.out, q);
  a.fedAt = 0; a.skip = 0;
  S.stats.collected++;
  addXP(d.xp);
  sfx.coin();
  return q;
}
const respawning = (o) => S.res[o.id] && S.res[o.id] > now();

// ============================================================ Player
const pl = { x: START.x, y: START.y, px: START.x * 16, py: START.y * 16, dir: 'down', moving: false, fx: 0, fy: 0, tx: 0, ty: 0, t: 0, frame: 0, anim: 0, steps: 0 };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const held = [];
let mode = 'title'; // title | world
const layers = [];
let activeMath = null; // the problem being answered (A answers it)
const npcDir = {};

function playerLook() {
  return { hat: HATS[S.hat]?.color || '#e03c3c', hair: '#6a3a1a', shirt: '#3870d8', pants: '#384868', pack: '#e0a030' };
}

function updatePlayer(dt) {
  if (pl.moving) {
    const stepMs = S.tools.bottes ? 120 : 180;
    pl.t += (dt * 1000) / stepMs;
    pl.anim += dt;
    if (pl.t >= 1) {
      pl.t = 1; pl.moving = false; pl.x = pl.tx; pl.y = pl.ty;
      pl.steps++;
      onStep();
    }
    pl.px = Math.round((pl.fx + (pl.tx - pl.fx) * pl.t) * 16);
    pl.py = Math.round((pl.fy + (pl.ty - pl.fy) * pl.t) * 16);
    pl.frame = pl.moving ? (Math.floor(pl.anim * (S.tools.bottes ? 9 : 6)) % 2) + 1 : 0;
  }
  if (!pl.moving && !layers.length && mode === 'world' && !busy) {
    const d = held[held.length - 1];
    if (d) {
      pl.dir = d;
      const [dx, dy] = DIRS[d];
      const nx = pl.x + dx, ny = pl.y + dy;
      if (walkable(nx, ny)) {
        pl.moving = true; pl.t = 0; pl.fx = pl.x; pl.fy = pl.y; pl.tx = nx; pl.ty = ny;
      } else if (!pl.bumpT || now() - pl.bumpT > 400) { pl.bumpT = now(); sfx.bump(); }
    } else pl.frame = 0;
  }
}
let stepsSinceEnc = 0;
function onStep() {
  save();
  stepsSinceEnc++;
  if (TALL.has(tileAt(pl.x, pl.y)) && stepsSinceEnc >= 4 && Math.random() < 0.13) {
    stepsSinceEnc = 0;
    held.length = 0;
    startBattle(zoneAt(pl.x, pl.y));
  }
}

// ============================================================ Systems
const has = (id, n = 1) => (S.inv[id] || 0) >= n;
function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
function addCoins(n) { if (!n) return; S.coins += n; if (n > 0) { floatHud('+' + n, 'coin'); sfx.coin(); } updateHud(); }
/** Reward step: the old levels were about twice as short, so rewards follow half the level. */
const tier = () => Math.ceil(S.lvl / 2);
function addXP(n) {
  if (!n) return;
  S.xp += n;
  floatHud(`+${n} XP`, 'xp');
  while (S.lvl < MAX_LVL && S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; levelUp(S.lvl); }
  updateHud();
}
function afterChange() { checkObjectives(); checkBadges(); updateHud(); save(); }

function speedMult() {
  let m = 1;
  if (S.tools.epouvantail) m *= 1.2;
  if (S.tools.arroseur) m *= 1.3;
  if (S.built.serre) m *= 1.5;
  return m;
}
function effElapsed(p) { return (now() - p.at) * speedMult() + p.skip; }
function progress(p) { return p.crop ? Math.min(1, effElapsed(p) / p.grow) : 0; }
function remaining(p) { return Math.max(0, p.grow - effElapsed(p)) / speedMult(); }

// Maths difficulty never depends on the game level: each skill climbs its own ladder (see « Skills » below).
// DIFF_STEPS: the overall difficulty set by the parents, which moves the ceilings.
const DIFF_STEPS = [[-2, 'Très facile'], [-1, 'Facile'], [0, 'Normal'], [1, 'Difficile'], [2, 'Très difficile']];
const mKey = (cat) => (cat === 'add' || cat === 'mul' ? 'calc' : cat);
/** Level fixed by the parents for this theme (1-5), or null when the game adapts by itself. */
function fixedLevel(cat) {
  const c = (S.settings.cats || {})[mKey(cat)];
  return c && typeof c.lvl === 'number' ? c.lvl : null;
}
// French modules (fr:…) are off until the parents switch them on; the other themes are on until switched off.
const isFr = (k) => typeof k === 'string' && k.startsWith('fr:');
const themeOn = (cat) => { const c = (S.settings.cats || {})[mKey(cat)] || {}; return isFr(cat) ? !!c.on : !c.off; };
const frOn = () => FR_SKILLS.filter((k) => themeOn(k));
/** How often French comes up in the game: 2 one question in 3 · 1 one in 6 · 0 only in Léa's workshop. */
/** Share of French in normal play, set by the parents: 0 only at Léa's, then 1 in 6, 1 in 4 (default), 1 in 2, 2 in 3. */
const FR_SHARE = [['Seulement chez Léa', 'seulement chez Léa'], ['Un peu (1 sur 6)', '1 question sur 6'], ['Équilibré (1 sur 4)', '1 question sur 4'],
  ['Moitié-moitié (1 sur 2)', '1 question sur 2'], ['Surtout du français (2 sur 3)', '2 questions sur 3']];
const frMix = () => S.settings.frShare ?? 2;
const inRotation = (k) => !isFr(k) || frMix() > 0;
/** A French module, the ones still being learned more often. */
const frPick = (list = frOn()) => wpick(list, (k) => (isAcquis(k) ? 1 : 3));
/** The theme to ask: the requested one, or another switched-on theme if the parents turned it off. */
function themeFor(cat) {
  if (!cat || themeOn(cat)) return cat;
  const on = liveCats().filter(inRotation);
  if (!on.length) return cat;
  return on.includes('calc') && Math.random() < 0.5 ? 'calc' : pick(on);
}
// ---- Skills: each operation ("calc:sub") and each theme climbs its own ladder of levels, up to a ceiling.
// 4 right answers out of the last 5 at the working level: one level up. At the ceiling, the skill is mastered:
// it then comes back less often (skills still being learned and the new 8H notions take its place).
// 3 misses out of the last 4: one level down. The ceiling is higher in « Dur » mode and moves with the overall difficulty.
const CALC_OPS = ['add', 'sub', 'mul', 'div', 'mental'];
const NEW_ORDER = Object.keys(NEW_CONCEPTS);
const BASE_SKILLS = [...CALC_OPS.map((o) => 'calc:' + o), 'frac', 'conv', 'masse', 'contenance', 'longueur', 'duree', 'recette', 'argent', 'geo', 'coord', 'sym', 'angles', 'figures', 'animaux', 'enigme', ...FR_SKILLS];
// Ceiling [Normal, Dur]: e.g. subtractions stop at 3-digit numbers with borrowing in Normal mode. Themes not listed: [3, 4].
// Additions and subtractions have 7 small steps, everything else 5.
const MIN_LV = -1; // below level 1: easier problems (or level 1 with the hint shown) so a child who struggles does not give up
const lvTxt = (lv) => (lv < 0 ? '−' + -lv : String(lv));
const maxLv = (key) => (key === 'calc:add' || key === 'calc:sub' ? 7 : 5);
const CAPS = { 'calc:add': [6, 7], 'calc:sub': [6, 7], 'calc:mul': [3, 4], 'calc:div': [4, 5], 'calc:mental': [3, 4], enigme: [4, 5] };
for (const k of FR_SKILLS) CAPS[k] = [4, 5]; // French: 4 = long sentences of 7H, 5 = the 8H cases
const isCalc = (cat) => !cat || cat === 'calc' || cat === 'add' || cat === 'mul';
const keyOf = (cat, op) => (op ? 'calc:' + op : mKey(cat));
const catOf = (key) => (key.startsWith('calc:') ? 'calc' : key);
const opOf = (key) => (key.startsWith('calc:') ? key.slice(5) : null);
const isNew = (key) => NEW_ORDER.includes(key);
const skillTitle = (key) => (opOf(key) ? OP_NAMES[opOf(key)].replace(/^./, (c) => c.toUpperCase()) : CATS[key] || key);
function capFor(key) {
  const diff = S.settings.diff || 0;
  if (isNew(key)) return clamp(3 + Math.min(0, diff), 1, 3);
  const c = CAPS[key] || [3, 4];
  return clamp(c[S.settings.grade === 8 ? 1 : 0] + diff, 1, maxLv(key));
}
// Every skill starts at its easiest level and climbs from there.
const startLv = () => 1;
function skillOf(key) {
  S.skills = S.skills || {};
  if (!S.skills[key]) S.skills[key] = { lv: startLv(key), r: [], n: 0, ok: 0, acq: 0 };
  return S.skills[key];
}
/** Level shown in the panels, without creating the skill. */
const shownLv = (key) => Math.min(((S.skills || {})[key] || { lv: startLv(key) }).lv, capFor(key));
const isAcquis = (key) => { const s = (S.skills || {})[key]; return !!(s && s.acq && s.lv >= capFor(key)); };
/** Working level of a skill (harder actions ask more problems, never harder ones). */
function levelFor(key) {
  const fx = fixedLevel(catOf(key));
  if (fx) return fx;
  return clamp(Math.min(skillOf(key).lv, capFor(key)), MIN_LV, maxLv(key));
}
const unlockedConcepts = () => NEW_ORDER.filter((k) => (S.concepts || {})[k]);
/** Skills that can be asked now: the basics and the 8H notions already unlocked, unless the parents switched them off. */
const liveSkills = () => [...BASE_SKILLS, ...unlockedConcepts()].filter((k) => themeOn(catOf(k)));
const liveCats = () => [...new Set(liveSkills().map(catOf))];
function wpick(list, w) {
  const ws = list.map(w);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r < 0) return list[i]; }
  return list[list.length - 1];
}
/**
 * What to ask for a requested theme. A calculation picks its operation (the ones still being learned come more often).
 * Unless noSwap, a mastered skill often gives way to one still being learned, and a new 8H notion gets introduced.
 */
const GEO_SKILLS = ['coord', 'sym', 'angles', 'figures'];
const recentSkills = []; // the last skills asked in this session
function pickSkill(reqCat, op, noSwap) {
  const cat = themeFor(reqCat || 'calc');
  if (isCalc(cat)) {
    const ops = cat === 'add' ? ['add', 'sub'] : cat === 'mul' ? ['mul', 'div'] : CALC_OPS;
    op = op && ops.includes(op) ? op : wpick(ops, (o) => (isAcquis('calc:' + o) ? 1 : 3));
  } else op = null;
  let key = keyOf(cat, op);
  if (!noSwap) {
    const fresh = unlockedConcepts().filter((k) => themeOn(k) && skillOf(k).n < 5);
    // themes hardly tried yet (fewer than 3 questions) come up now and then, so the child meets them all early
    const untried = BASE_SKILLS.filter((k) => themeOn(catOf(k)) && inRotation(k) && (((S.skills || {})[k] || {}).n || 0) < 3);
    if (fresh.length && Math.random() < 0.3) key = pick(fresh);
    else if (untried.length && Math.random() < 0.15) key = pick(untried);
    // French switched on: no French in the last 5 / 3 / 1 questions (1 in 6, 1 in 4, 1 in 2) → this one is French;
    // « surtout du français »: French unless the last 2 already were (2 in 3)
    const fr = frOn(), mix = frMix(), gap = [0, 5, 3, 1, 0][mix] ?? 3;
    const frTurn = mix >= 4 ? !(recentSkills.length >= 2 && recentSkills.slice(-2).every(isFr)) : recentSkills.length >= gap && !recentSkills.slice(-gap).some(isFr);
    // no geometry in the last 5 questions: this one is, from the geometry theme practised least
    const geo = GEO_SKILLS.filter((k) => themeOn(k));
    if (fr.length && mix > 0 && !isFr(key) && frTurn) key = frPick(fr);
    else if (geo.length && !geo.includes(key) && recentSkills.length >= 5 && !recentSkills.slice(-5).some((k) => GEO_SKILLS.includes(k))) {
      const n = (k) => ((S.skills || {})[k] || {}).n || 0, least = Math.min(...geo.map(n));
      key = pick(geo.filter((k) => n(k) === least));
    }
    else if (isAcquis(key) && Math.random() < 0.7) {
      const alt = liveSkills().filter((k) => !isAcquis(k) && inRotation(k));
      if (alt.length) key = wpick(alt, (k) => (isNew(k) ? 3 : 1));
    }
  }
  return { key, cat: catOf(key), op: opOf(key) };
}
/** The next 8H notion unlocks when enough skills are mastered and the previous notion has been practised. */
function checkConcepts() {
  S.concepts = S.concepts || {};
  const got = unlockedConcepts();
  if (got.length >= NEW_ORDER.length) return;
  const prev = got[got.length - 1];
  if (prev && themeOn(prev) && skillOf(prev).n < 8) return;
  const acq = [...BASE_SKILLS.filter((k) => !isFr(k)), ...got].filter(isAcquis).length; // French does not open the 8H maths
  if (acq < (S.settings.grade === 8 ? 3 : 4) + got.length) return;
  const k = NEW_ORDER.find((c) => !S.concepts[c]);
  S.concepts[k] = now();
  toast(`Nouvelle notion de 8H : ${CATS[k]} ! Elle arrive bientôt dans tes problèmes.`, 'gold');
}
// A level goes up after at least 8 questions at it and a score of 6: about 8 quick right answers,
// 12 slow ones, or 10 with 2 mistakes. It goes down when the score falls to −2.5 (mostly wrong answers).
const LEVEL_MIN_Q = 8, LEVEL_UP = 6, LEVEL_DOWN = -2.5;
/** Time after which a right answer counts as slow: short for a calculation, longer for a problem to read. */
function slowMs(key, lv) {
  lv = Math.max(1, lv);
  if (key === 'calc:mental') return (8 + 3 * lv) * 1000;
  if (key === 'fr:relire') return (18 + 5 * lv) * 1000; // a long sentence to read word by word
  if (isFr(key)) return (12 + 4 * lv) * 1000;
  if (opOf(key)) return (12 + 5 * lv) * 1000;
  if (key === 'frac' || key === 'conv' || key === 'arrondi' || key === 'priorites' || key === 'decimaux' || key === 'fracplus') return (18 + 6 * lv) * 1000;
  return (30 + 10 * lv) * 1000; // word problems
}
function record(p, ok, ms = 0, helped = false) {
  const key = p.key || keyOf(p.cat, p.op);
  const s = skillOf(key), cap = capFor(key);
  s.n++; if (ok) s.ok++;
  const k = mKey(p.cat);
  const m = (S.mastery[k] = S.mastery[k] || { ok: 0, n: 0, r: [] });
  m.n++; if (ok) m.ok++;
  m.r.push(ok ? 1 : 0); if (m.r.length > 8) m.r.shift();
  if (s.lv > cap) s.lv = cap;
  // only problems at the working level move the ladder (not a level fixed by the parents, nor a défi above it)
  if (!fixedLevel(catOf(key)) && p.d === s.lv) {
    // right and quick: +1 · right but slow (or with a bought hint): +0.5 · wrong at the first try: −1
    const fast = ok && !helped && ms <= slowMs(key, s.lv);
    s.sc = (s.sc || 0) + (ok ? (fast ? 1 : 0.5) : -1);
    s.nl = (s.nl || 0) + 1;
    s.r.push(ok ? 1 : 0); if (s.r.length > 8) s.r.shift();
    if (s.nl >= LEVEL_MIN_Q && s.sc >= LEVEL_UP) {
      s.sc = 0; s.nl = 0; s.r = [];
      if (s.lv < cap) s.lv++;
      else if (!s.acq) { s.acq = now(); toast(`${skillTitle(key)} : maîtrisé ! Place à d’autres défis.`, 'gold'); }
    } else if (s.nl >= 3 && s.sc <= LEVEL_DOWN) {
      // a level back down, starting half-way so it does not bounce straight back up
      s.sc = LEVEL_UP / 2; s.nl = 0; s.r = []; s.acq = 0;
      if (s.lv > MIN_LV) s.lv--; else s.sc = 0;
    }
  }
  checkConcepts();
}

/** A lesson card: the notion, how to do it, a worked example. intro: shown before the first problem of a new notion. */
function showLesson(key, intro) {
  const les = LESSONS[key];
  return new Promise((resolve) => {
    if (!les) { resolve(); return; }
    const card = h('div', { class: 'lesson win' },
      h('div', { class: 'les-tag' }, intro ? `${isFr(key) ? 'Français' : 'Nouvelle notion'} · ${CATS[key] || ''}` : isFr(key) ? 'Leçon de Léa' : 'Leçon de Maître Hibou'),
      h('h2', null, les.title),
      h('div', { class: 'les-lines' }, les.lines.map((l) => h('p', { html: renderQ(l) }))),
      h('div', { class: 'les-ex' }, h('b', null, 'Exemple'), les.ex.map((l) => h('p', { html: renderQ(l) }))),
      h('button', { class: 'btn big', onclick: () => fin() }, intro ? 'J’ai compris, à moi !' : 'J’ai compris'));
    const wrap = h('div', { class: 'layer modal top' }, card);
    wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) fin(); });
    let closed = false;
    const fin = () => { if (closed) return; closed = true; popLayer(L); resolve(); };
    const L = pushLayer(wrap, { onA: fin, onB: fin, onKey: (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { fin(); return true; } return false; } });
  });
}

function unlocksAt(L) {
  const out = [];
  for (const [id, c] of Object.entries(CROPS)) if (!c.rare && c.lvl === L) out.push({ icon: A.iconURL('graine:' + id), text: `Nouvelles graines : ${c.name}` });
  for (const [id, b] of Object.entries(BUILDINGS)) if (b.lvl === L) out.push({ icon: null, text: `Tu peux construire : ${b.name}` });
  for (const [bid, list] of Object.entries(RECIPES)) for (const r of list) if (r.lvl === L && r.lvl !== BUILDINGS[bid].lvl) out.push({ icon: A.iconURL(r.out), text: `Nouvelle recette : ${itemName(r.out)} (${BUILDINGS[bid].name})` });
  for (const tl of TOOLS) if (tl.lvl === L) out.push({ icon: null, text: `À la boutique : ${tl.name}` });
  for (const [k, an] of Object.entries(ANIMALS)) if (an.lvl === L) out.push({ icon: A.iconURL(an.out), text: `Animal à apprivoiser : ${an.name} (donne : ${itemName(an.out).toLowerCase()})` });
  for (const g of GATES) if (g.lvl === L) out.push({ icon: null, text: g.text });
  for (const hh of Object.values(HATS)) if (hh.lvl === L && hh.price) out.push({ icon: null, text: `Nouveau style : ${hh.name}` });
  return out;
}
function nextUnlock(L) {
  for (let l = L + 1; l <= MAX_LVL; l++) { const u = unlocksAt(l); if (u.length) return `Niveau ${l} : ${u[0].text}`; }
  return null;
}
function levelUp(L) {
  sfx.level();
  const u = unlocksAt(L);
  const lines = u.map((x) => x.text);
  const prevTitle = titleFor(L - 1), t = titleFor(L);
  if (t !== prevTitle) lines.unshift(`Nouveau titre : ${t} !`);
  const nx = nextUnlock(L);
  const icons = u.map((x) => x.icon).filter(Boolean);
  const gift = 10 + 5 * L;
  S.coins += gift;
  lines.push(`Cadeau : ${gift} pièces`);
  icons.push(A.coinURL());
  if (!u.length) {
    // a level with nothing new to open: seeds of the best crop so far (and fertilizer every 5 levels)
    const seeds = Object.keys(CROPS).filter((k) => !CROPS[k].rare && CROPS[k].lvl <= L);
    const seed = seeds[seeds.length - 1], q = 2 + (L % 3);
    addItem('graine:' + seed, q);
    lines.push(`${q} ${CROPS[seed].seedName.toLowerCase()}`);
    icons.push(A.iconURL('graine:' + seed));
    if (L % 5 === 0) { addItem('engrais', 2); lines.push('2 engrais'); icons.push(A.iconURL('engrais')); }
  }
  celebrate({ title: `Niveau ${L} !`, lines, icons, foot: nx ? `Prochain : ${nx}` : null, kind: 'level' });
}
const curObj = () => OBJECTIVES.find((o) => !S.objDone[o.id]) || OBJECTIVES[OBJECTIVES.length - 1];
function checkObjectives() {
  let guard = 0;
  for (let o = curObj(); o.id !== 'legend' && o.c(S) && guard++ < 40; o = curObj()) {
    S.objDone[o.id] = 1;
    if (o.r.coins || o.r.xp) {
      toast(`Objectif réussi ! +${o.r.coins} pièces`, 'gold');
      S.coins += o.r.coins; addXP(o.r.xp);
      sfx.coin();
    }
  }
  updateObjective();
}
function checkBadges() {
  BADGES.forEach((b, i) => {
    if (!S.badges[b.id] && b.c(S)) {
      S.badges[b.id] = now();
      S.coins += 50;
      celebrate({ sound: 'fanfare', title: 'Nouveau badge !', lines: [b.name, b.desc, '+50 pièces'], iconsBig: [A.badgeURL(i, b.color, true)], kind: 'badge' });
    }
  });
}

// ============================================================ UI helpers
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(3)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const icon = (id, cls = 'ic') => h('img', { class: cls, src: A.iconURL(id), alt: '' });
const coinImg = (cls = 'coin') => h('img', { class: cls, src: A.coinURL(), alt: '' });
let busy = false;
function pushLayer(el, handlers = {}) {
  held.length = 0;
  ui.append(el);
  const L = { el, ...handlers };
  layers.push(L);
  syncTouchButtons();
  return L;
}
function popLayer(L) { L.el.remove(); const i = layers.indexOf(L); if (i >= 0) layers.splice(i, 1); syncTouchButtons(); }
// A and B sit above the popups (dialogs, menus, celebrations, lessons). Over a question or a panel they would
// cover its keypad or buttons on a narrow screen, so there they hide (the child taps directly, ✕ closes a panel).
function syncTouchButtons() {
  const top = layers[layers.length - 1];
  const covers = !!activeMath || !!(top && top.el.querySelector(':scope > .panel'));
  document.documentElement.classList.toggle('ab-covers', covers);
}

// ---- HUD
const hud = h('div', { class: 'hud' });
const objBar = h('div', { class: 'objective' });
const menuBtn = h('button', { class: 'menu-btn', onclick: () => pressB(), 'aria-label': 'Menu' }, 'MENU');
function updateHud() {
  if (!S) return;
  const need = xpNeed(S.lvl);
  hud.innerHTML = '';
  hud.append(
    h('div', { class: 'hud-box win' },
      h('div', { class: 'hud-lvl' }, h('span', { class: 'lv' }, 'Niv. ', h('b', null, S.lvl)), h('span', { class: 'ttl' }, titleFor(S.lvl))),
      h('div', { class: 'xpbar' }, h('i', { style: `width:${S.lvl >= MAX_LVL ? 100 : Math.round((S.xp / need) * 100)}%` })),
      h('div', { class: 'hud-row' }, coinImg(), h('b', { class: 'coins' }, fmt(S.coins)),
        S.streak >= 2 ? h('span', { class: 'streak' }, `Série ×${S.streak}`) : null),
    ),
  );
}
function updateObjective() {
  if (!S) return;
  const o = curObj();
  objBar.innerHTML = '';
  objBar.append(h('span', { class: 'obj-tag' }, 'Objectif'), h('span', null, o.t));
}
function floatHud(text, kind) {
  const el = h('div', { class: 'float ' + kind }, text);
  ui.append(el);
  setTimeout(() => el.remove(), 1400);
}
let toastY = 0;
function toast(text, kind = '', icons = []) {
  const el = h('div', { class: 'toast win ' + kind, style: `--off:${toastY}px` }, icons.map((i) => h('img', { class: 'ic', src: i })), h('span', null, text));
  toastY += 54;
  ui.append(el);
  setTimeout(() => { el.classList.add('out'); }, 2600);
  setTimeout(() => { el.remove(); toastY = Math.max(0, toastY - 54); }, 3000);
}

// ---- Dialog box (typewriter)
function say(lines, who) {
  if (!Array.isArray(lines)) lines = [lines];
  return new Promise((resolve) => {
    const name = h('div', { class: 'dlg-name' });
    const text = h('div', { class: 'dlg-text' });
    const more = h('div', { class: 'dlg-more' }, '▼');
    const box = h('div', { class: 'dialog win' }, name, text, more);
    const wrap = h('div', { class: 'layer dlg-layer' }, box);
    let i = 0, typing = false, full = '', shown = 0, timer = 0;
    function show() {
      const ln = lines[i];
      const w = typeof ln === 'object' ? ln.who : who;
      full = typeof ln === 'object' ? ln.text : ln;
      name.textContent = w || ''; name.style.display = w ? '' : 'none';
      shown = 0; typing = true; more.style.visibility = 'hidden';
      clearInterval(timer);
      timer = setInterval(() => {
        shown += 2;
        text.textContent = full.slice(0, shown);
        if (shown % 4 === 0) sfx.blip();
        if (shown >= full.length) { clearInterval(timer); typing = false; more.style.visibility = 'visible'; }
      }, 28);
    }
    function adv() {
      if (typing) { clearInterval(timer); text.textContent = full; typing = false; more.style.visibility = 'visible'; return; }
      i++;
      if (i >= lines.length) { clearInterval(timer); popLayer(L); resolve(); } else show();
    }
    const L = pushLayer(wrap, { onA: adv, onB: adv, onKey: (e) => { if ([' ', 'Enter', 'e', 'E', 'Escape'].includes(e.key)) { adv(); return true; } return false; } });
    wrap.addEventListener('pointerdown', (e) => { e.preventDefault(); adv(); });
    show();
  });
}
function choose(question, options, who) {
  return new Promise((resolve) => {
    let sel = 0;
    const name = h('div', { class: 'dlg-name', style: who ? '' : 'display:none' }, who || '');
    const text = h('div', { class: 'dlg-text' }, question);
    const list = h('div', { class: 'choices win' });
    const btns = options.map((o, i) => h('button', { class: 'choice', onclick: () => done(i) }, o));
    list.append(...btns);
    const box = h('div', { class: 'dialog win' }, name, text);
    const wrap = h('div', { class: 'layer dlg-layer' }, list, box);
    function paint() { btns.forEach((b, i) => b.classList.toggle('sel', i === sel)); }
    function done(i) { sfx.sel(); popLayer(L); resolve(i); }
    const L = pushLayer(wrap, {
      onA: () => done(sel), onB: () => done(options.length - 1),
      onKey: (e) => {
        if (e.key === 'ArrowDown' || e.key === 's') { sel = (sel + 1) % options.length; paint(); sfx.blip(); return true; }
        if (e.key === 'ArrowUp' || e.key === 'w') { sel = (sel + options.length - 1) % options.length; paint(); sfx.blip(); return true; }
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') { done(sel); return true; }
        if (e.key === 'Escape') { done(options.length - 1); return true; }
        const n = Number(e.key); if (n >= 1 && n <= options.length) { done(n - 1); return true; }
        return false;
      },
    });
    btns.forEach((b, i) => b.addEventListener('pointerenter', () => { sel = i; paint(); }));
    paint();
  });
}
async function confirm(question, yes = 'Oui', no = 'Non', who) { return (await choose(question, [yes, no], who)) === 0; }

// ---- Panels (windows)
function panel(title, build, opts = {}) {
  let resolveDone;
  const done = new Promise((r) => (resolveDone = r));
  const body = h('div', { class: 'pbody' });
  const tabsEl = h('div', { class: 'ptabs' });
  const close = () => { popLayer(L); resolveDone(); };
  const win = h('div', { class: 'panel win' + (opts.cls ? ' ' + opts.cls : '') },
    h('div', { class: 'phead' }, h('h2', null, title), h('button', { class: 'x', onclick: close, 'aria-label': 'Fermer' }, '✕')),
    tabsEl, body);
  const wrap = h('div', { class: 'layer modal' }, win);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
  const L = pushLayer(wrap, { onB: close, onKey: (e) => { if (e.key === 'Escape') { close(); return true; } return false; } });
  let tab = opts.tab || (opts.tabs ? opts.tabs[0][0] : null);
  const api = {
    body, close, done,
    refresh() {
      body.innerHTML = '';
      if (opts.tabs) {
        tabsEl.innerHTML = '';
        for (const [k, label] of opts.tabs) tabsEl.append(h('button', { class: 'ptab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; sfx.sel(); api.refresh(); } }, label));
      }
      build(body, api, tab);
      updateHud();
    },
  };
  api.refresh();
  return api;
}

// ---- Celebration popups (queued)
let popChain = Promise.resolve();
function celebrate(o) {
  popChain = popChain.then(() => new Promise((resolve) => {
    const conf = h('div', { class: 'confetti' });
    for (let i = 0; i < 26; i++) conf.append(h('i', { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.6}s;background:${pick(['#f8d030', '#f05060', '#58c048', '#5898f8', '#ffffff'])}` }));
    const card = h('div', { class: 'celebrate win ' + (o.kind || '') },
      h('div', { class: 'cel-title' }, o.title),
      o.iconsBig ? h('div', { class: 'cel-icons big' }, o.iconsBig.map((s) => h('img', { src: s }))) : null,
      o.icons && o.icons.length ? h('div', { class: 'cel-icons' }, o.icons.map((s) => h('img', { src: s }))) : null,
      h('div', { class: 'cel-lines' }, (o.lines || []).map((l) => h('p', null, l))),
      o.foot ? h('div', { class: 'cel-foot' }, o.foot) : null,
      h('button', { class: 'btn big', onclick: () => fin() }, o.btn || 'Super !'));
    const wrap = h('div', { class: 'layer modal top' }, conf, card);
    let closed = false;
    const fin = () => { if (closed) return; closed = true; popLayer(L); resolve(); };
    const L = pushLayer(wrap, { onA: fin, onB: fin, onKey: (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { fin(); return true; } return false; } });
    if (o.sound && sfx[o.sound]) sfx[o.sound]();
  }));
  return popChain;
}

// ============================================================ Math UI
const PRAISE = ['Bravo !', 'Super !', 'Génial !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Trop fort !', 'Champion !'];
/**
 * Ask one problem. Returns { ok, first, quit }.
 * opts: cat, d, title, problem, mount (element for battles), noQuit
 */
async function askMath(opts) {
  let o = opts;
  if (!o.problem) {
    const sk = pickSkill(o.cat, o.op, o.noSwap);
    o = { ...o, cat: sk.cat, op: sk.op, key: sk.key };
    recentSkills.push(sk.key); if (recentSkills.length > 12) recentSkills.shift();
    // the first time a new 8H notion (or a French module) comes up, its lesson comes first
    if ((isNew(sk.key) || isFr(sk.key)) && !(S.lessons || {})[sk.key]) {
      S.lessons = S.lessons || {};
      S.lessons[sk.key] = now(); save();
      await showLesson(sk.key, true);
    }
  }
  for (;;) {
    const r = await askOnce(o);
    if (!r.easier) return r;
    if (o.d) o = { ...o, d: Math.max(MIN_LV, r.d - 1) }; // a défi: one step below the problem that was too hard
  }
}
function askOnce(opts) {
  return new Promise((resolve) => {
    const p0 = opts.problem;
    const cat = p0 ? p0.cat : opts.cat;
    const skKey = p0 ? keyOf(p0.cat, p0.op) : opts.key;
    const dUsed = p0 ? p0.d || 1 : fixedLevel(cat) || (opts.d ? Math.min(opts.d, capFor(skKey), levelFor(skKey) + 1) : levelFor(skKey));
    const p = p0 || makeProblem(cat, dUsed, {}, opts.op);
    if (!p0) { p.d = dUsed; p.key = skKey; }
    let paused = false; // a lesson is open over the problem
    window.__lastP = p; // read by the test helpers in the console
    let tries = 0, input = '', locked = false, helped = false;
    const t0 = performance.now();
    let pausedMs = 0;
    const hintCost = 5 + 5 * Math.max(1, dUsed);
    const tip = h('div', { class: 'm-tip' });
    const hintBtn = h('button', { class: 'm-hint', onclick: () => {
      if (locked || hintBtn.disabled) return;
      if (S.coins < hintCost) { sfx.bad(); toast(`Il te faut ${hintCost} pièces pour un indice.`, 'red'); return; }
      S.coins -= hintCost; updateHud(); sfx.coin();
      helped = true;
      const step = firstStep(p);
      tip.innerHTML = '';
      tip.append(h('b', null, 'Indice : '), h('span', null, p.hint));
      if (step) tip.append(h('div', { class: 'm-step' }, 'Pour commencer : ' + step));
      hintBtn.disabled = true; hintBtn.textContent = 'Indice acheté';
    } }, 'Indice · ', coinImg('coin sm'), ` ${hintCost}`);
    if (!p0 && p.aid != null) {
      tip.append(h('b', null, 'Indice : '), h('span', null, p.hint));
      const step = p.aid <= -1 ? firstStep(p) : null;
      if (step) tip.append(h('div', { class: 'm-step' }, 'Pour commencer : ' + step));
      hintBtn.disabled = true; hintBtn.textContent = 'Indice offert';
      if (!p.op) helped = true; // a word problem with its help shown counts like a slow answer
    }
    // "Trop dur" lowers this theme (or this operation) a step and asks an easier problem instead
    const easier = !p0 && !fixedLevel(cat);
    const hardBtn = easier ? h('button', { class: 'm-hard', onclick: () => {
      if (locked || tries > 0) return;
      const s = skillOf(skKey);
      if (s.lv > MIN_LV) s.lv--;
      s.r = []; s.acq = 0; s.sc = 0; s.nl = 0;
      toast(`D’accord ! « ${skillTitle(skKey)} » : un peu plus facile.`, 'blue');
      save();
      finish({ easier: true });
    } }, 'Trop dur ?') : null;
    // « Comprendre »: the lesson of this notion, free, at any moment
    const lesKey = LESSONS[p.lesson] ? p.lesson : LESSONS[skKey] ? skKey : LESSONS[mKey(cat)] ? mKey(cat) : null;
    const learnBtn = lesKey ? h('button', { class: 'm-learn', onclick: async () => {
      if (paused) return;
      paused = true; const tl = performance.now(); await showLesson(lesKey, false); pausedMs += performance.now() - tl; paused = false;
    } }, 'Comprendre') : null;
    const qEl = h('div', { class: 'm-q', html: renderQ(p.q) });
    const ansVal = h('span', { class: 'm-val' });
    const gridOn = !!(p.grid && p.grid.mode !== 'none'); // the answer is given by tapping the grid
    if (p.fig || (p.grid && !gridOn)) qEl.append(h('div', { class: 'm-fig', html: p.fig || gridSVG(p.grid) }));
    // the values to pick from: the choices, or the words of the sentence (their index) when a misspelled word is to be tapped
    const choiceVals = p.choices || (p.words ? p.words.map((_, i) => String(i)) : null);
    const ansRow = choiceVals || gridOn ? null : h('div', { class: 'm-ans' }, ansVal, p.u ? h('span', { class: 'm-unit' }, p.u) : null);
    const fb = h('div', { class: 'm-fb' });
    const longChoice = !!(p.choices && p.choices.some((c) => String(c).length > 12));
    const pad = h('div', { class: p.words ? 'm-choices m-words' : p.choices ? 'm-choices' + (longChoice ? ' m-long' : '') : gridOn ? 'm-gridpad' : 'm-pad' });
    let gsel = new Set(), gbad = new Set(), gsol = new Set();
    const gridWrap = gridOn ? h('div', { class: 'm-grid' }) : null;
    const paintGrid = () => { if (gridWrap) gridWrap.innerHTML = gridSVG(p.grid, { sel: gsel, bad: gbad, sol: gsol }); };
    const submitGrid = () => {
      if (locked) return;
      if (!gsel.size) { toast(p.grid.mode === 'one' ? 'Touche d’abord une case de la grille.' : 'Colorie d’abord des cases.', 'blue'); return; }
      submit(gridKey(gsel));
    };
    if (gridOn) {
      gridWrap.addEventListener('click', (e) => {
        const el = e.target.closest('[data-k]');
        if (!el || locked) return;
        const k = el.dataset.k;
        if (p.grid.mode === 'one') gsel = new Set([k]);
        else if (gsel.has(k) || gbad.has(k)) { gsel.delete(k); gbad.delete(k); }
        else gsel.add(k);
        sfx.blip(); paintGrid();
      });
    }
    const head = h('div', { class: 'm-head' },
      h('span', { class: 'm-cat' }, CATS[p.cat] || 'Calcul'),
      h('span', { class: 'm-title' }, opts.title || ''),
      S.streak >= 2 ? h('span', { class: 'm-streak' }, `Série ×${S.streak}`) : null);
    const box = h('div', { class: 'mathbox win' + (opts.mount ? ' inline' : '') }, head, qEl, h('div', { class: 'm-hintrow' }, learnBtn, hardBtn, hintBtn), tip, ansRow, fb, pad);
    function paint() { ansVal.textContent = input || '?'; ansVal.classList.toggle('empty', !input); }
    function key(k) {
      if (locked) return;
      if (k === '⌫') input = input.slice(0, -1);
      else if (k === ',') { if (!input.includes(',')) input += input ? ',' : '0,'; }
      else if (input.length < 9) input += k;
      sfx.blip(); paint();
    }
    function finish(res) {
      if (activeMath === mathA) { activeMath = null; syncTouchButtons(); }
      document.removeEventListener('keydown', onDocKey, true);
      if (L) popLayer(L); else box.remove();
      resolve({ ...res, d: dUsed });
    }
    function submit(val) {
      if (locked) return;
      if (!choiceVals && !gridOn && !input) return;
      const ok = checkAnswer(p, choiceVals || gridOn ? val : input);
      tries++;
      if (tries === 1) record(p, ok, performance.now() - t0 - pausedMs, helped);
      if (ok) {
        locked = true;
        S.stats.correct++;
        if (tries === 1) { S.streak++; S.stats.maxStreak = Math.max(S.stats.maxStreak, S.streak); }
        if (MEASURE_CATS.includes(p.cat)) S.stats.measureOK++;
        sfx.ok();
        box.classList.add('good');
        const bonus = tries === 1 ? 3 + (S.streak >= 5 ? 2 : 0) : 1;
        fb.innerHTML = '';
        fb.append(h('b', { class: 'ok' }, pick(PRAISE)));
        if (tries === 1 && S.streak >= 3) fb.append(h('span', { class: 'm-streakmsg' }, ` Série de ${S.streak} !`));
        addXP(bonus);
        setTimeout(() => finish({ ok: true, first: tries === 1 }), opts.mount ? 900 : 1000);
      } else if (tries === 1) {
        S.stats.wrong++; S.streak = 0; updateHud();
        sfx.bad();
        box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        fb.innerHTML = '';
        fb.append(h('b', { class: 'no' }, 'Presque ! '), h('span', null, 'Indice : ' + p.hint));
        input = ''; paint();
        if (choiceVals) { [...pad.children].forEach((b) => { if (b.dataset.v === val) { b.disabled = true; b.classList.add('wrong'); } }); moveSel(1); }
        if (gridOn) {
          // the squares that should not be there turn red; the good ones stay
          const target = new Set(String(p.a).split(' '));
          gbad = new Set([...gsel].filter((k) => !target.has(k)));
          gsel = new Set([...gsel].filter((k) => target.has(k)));
          paintGrid();
        }
      } else {
        locked = true;
        sfx.bad();
        fb.innerHTML = '';
        const shown = p.words ? `« ${p.words[Number(p.a)]} »` : p.choices ? p.a : `${fmt(p.a)}${p.u ? ' ' + p.u : ''}`;
        fb.append(h('div', { class: 'sol' }, h('b', null, gridOn ? 'Voici la réponse, en vert.' : p.words ? (p.sol || `Le mot mal écrit était ${shown}.`) : `La réponse était ${shown}.`), h('div', null, p.ex)));
        const understood = h('button', { class: 'btn big', onclick: () => finish({ ok: false, first: false }) }, 'J’ai compris');
        if (p.words) {
          // the sentence stays, the misspelled word in green
          [...pad.querySelectorAll('.m-word')].forEach((b) => { b.disabled = true; b.classList.remove('sel'); b.classList.toggle('right', (p.ok || [p.a]).includes(b.dataset.v)); if (b.dataset.v === val) b.classList.add('wrong'); });
          pad.append(understood);
        } else if (gridOn) {
          // the answer in green, the child's wrong squares in red
          gsol = new Set(String(p.a).split(' '));
          gbad = new Set([...gsel, ...gbad].filter((k) => !gsol.has(k))); gsel = new Set(); paintGrid();
          pad.querySelector('.g-ok')?.remove();
          pad.append(understood);
        } else {
          pad.innerHTML = '';
          pad.className = 'm-choices';
          pad.append(understood);
        }
        box.style.touchAction = ''; // the solution can make the box taller than the screen: let it scroll
        save();
      }
      save();
    }
    let csel = 0;
    const paintSel = () => [...pad.querySelectorAll('.m-choice')].forEach((b, i) => b.classList.toggle('sel', i === csel));
    const moveSel = (step) => {
      const bs = [...pad.querySelectorAll('.m-choice')];
      for (let k = 0; k < bs.length; k++) { csel = (csel + step + bs.length) % bs.length; if (!bs[csel].disabled) break; }
      paintSel();
    };
    if (gridOn) {
      pad.append(gridWrap, h('button', { class: 'btn big g-ok', onclick: submitGrid }, 'Valider'));
      paintGrid();
    } else if (p.words) {
      p.words.forEach((w, i) => pad.append(h('button', { class: 'm-choice m-word', 'data-v': String(i), onclick: () => submit(String(i)) }, w)));
      paintSel();
    } else if (p.choices) {
      p.choices.forEach((c, i) => pad.append(h('button', { class: 'm-choice', 'data-v': c, onclick: () => submit(c) }, h('small', null, i + 1), c)));
      paintSel();
    } else {
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']) pad.append(h('button', { class: 'k' + (k === '⌫' ? ' del' : ''), onclick: () => key(k) }, k));
      pad.append(h('button', { class: 'k ok', onclick: () => submit() }, 'OK'));
    }
    if (!opts.noQuit) box.append(h('button', { class: 'm-quit', onclick: () => { if (!locked) finish({ ok: false, quit: true }); } }, 'Plus tard'));
    function onDocKey(e) {
      if (paused) return;
      if (locked && e.key === 'Enter' && pad.querySelector('.btn')) { pad.querySelector('.btn').click(); e.preventDefault(); e.stopPropagation(); return; }
      if (choiceVals) {
        if (['ArrowRight', 'ArrowDown'].includes(e.key)) { moveSel(1); e.preventDefault(); e.stopPropagation(); return; }
        if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { moveSel(-1); e.preventDefault(); e.stopPropagation(); return; }
        if (e.key === 'Enter' || e.key === ' ') { const b = pad.querySelectorAll('.m-choice')[csel]; if (b && !b.disabled) submit(choiceVals[csel]); e.preventDefault(); e.stopPropagation(); return; }
        const n = Number(e.key);
        if (p.choices && n >= 1 && n <= p.choices.length) { const b = pad.children[n - 1]; if (!b.disabled) submit(p.choices[n - 1]); e.preventDefault(); e.stopPropagation(); }
        return;
      }
      if (gridOn) { if (e.key === 'Enter') { submitGrid(); e.preventDefault(); e.stopPropagation(); } return; }
      if (/^[0-9]$/.test(e.key)) key(e.key);
      else if (e.key === ',' || e.key === '.') key(',');
      else if (e.key === 'Backspace') key('⌫');
      else if (e.key === 'Enter') submit();
      else return;
      e.preventDefault(); e.stopPropagation();
    }
    document.addEventListener('keydown', onDocKey, true);
    // A (touch button) = OK, or "J’ai compris" once the solution is shown
    const mathA = { a() {
      const done = pad.querySelector('.btn');
      if (locked && done) { done.click(); return; }
      if (gridOn) { submitGrid(); return; }
      if (!choiceVals) { submit(); return; }
      const b = pad.querySelectorAll('.m-choice')[csel];
      if (b && !b.disabled) submit(choiceVals[csel]);
    } };
    activeMath = mathA;
    syncTouchButtons();
    let L = null;
    if (opts.mount) { opts.mount.innerHTML = ''; opts.mount.append(box); }
    else L = pushLayer(h('div', { class: 'layer modal math-layer' }, box), { onKey: () => true, math: true });
    paint();
    if (choiceVals) requestAnimationFrame(() => { if (box.scrollHeight <= box.clientHeight + 2) box.style.touchAction = 'none'; });
  });
}

/** The first step of the worked solution, as long as it does not give the answer away. */
function firstStep(p) {
  if (p.choices || p.grid || p.words || !p.ex) return null;
  const parts = p.ex.split(/(?<=\d|[a-zé²])\. |, puis | ; |\. Pour /);
  let s = parts[0];
  if (parts.length < 2) { const eq = p.ex.split(' = '); if (eq.length < 3) return null; s = eq.slice(0, 2).join(' = '); }
  const ans = fmt(p.a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^\\d,])' + ans + '([^\\d,]|$)').test(s) ? null : s;
}
/**
 * Several problems in a row for one action. steps: list of categories (or { cat, d }).
 * needAll: stop at the first miss. Returns { ok, n, firsts, quit, all }.
 */
async function askSeries(steps, title, needAll = true, off = 0) {
  let ok = 0, firsts = 0;
  for (let i = 0; i < steps.length; i++) {
    const st = typeof steps[i] === 'string' ? { cat: steps[i] } : steps[i];
    const r = await askMath({ cat: st.cat, off: st.off ?? off, title: steps.length > 1 ? `${title} · ${i + 1}/${steps.length}` : title });
    if (r.quit) return { ok, n: steps.length, firsts, quit: true, all: false };
    if (r.ok) { ok++; if (r.first) firsts++; } else if (needAll) return { ok, n: steps.length, firsts, quit: false, all: false };
  }
  return { ok, n: steps.length, firsts, quit: false, all: ok === steps.length };
}
const maybeEnigme = (other, chance = 0.5) => (Math.random() < chance ? 'enigme' : other);

// ============================================================ Interactions
async function interact() {
  const [dx, dy] = DIRS[pl.dir];
  const tx = pl.x + dx, ty = pl.y + dy;
  const ent = entAt(tx, ty);
  if (ent) {
    busy = true;
    try { await (ent.wild ? onWild(ent) : onFarmAnimal(ent)); } finally { busy = false; afterChange(); }
    return;
  }
  let o = objAt.get(tx + ty * W);
  if (!o) { const here = objAt.get(pl.x + pl.y * W); if (here && here.type === 'plot') o = here; }
  if (!o) return;
  busy = true;
  try { await handle(o); } finally { busy = false; afterChange(); }
}
async function handle(o) {
  switch (o.type) {
    case 'plot': return onPlot(o.plot);
    case 'house': return say(['Ta maison. Tout est sauvegardé automatiquement.', `Tu as ${Object.keys(S.creatures).length} amis créatures et ${Object.keys(S.badges).length} badges.`]);
    case 'caisse': return sellPanel('Caisse de vente');
    case 'mailbox': return onMailbox();
    case 'npc': return onNpc(o);
    case 'chest': return onChest(o);
    case 'sign': return say(o.text.split('\n'));
    case 'shop': return shopPanel();
    case 'bld': return onBuilding(o.bld);
    case 'board': return ordersPanel();
    case 'fountain': return onFountain();
    case 'owl': return onOwl();
    case 'bigrock': return onBigRock();
    case 'brokenbridge': return onBridge();
    case 'guardian': return onGuardian();
    case 'ancient': return onAncient();
    case 'tree': return onTree(o);
    case 'rock': return onRock(o);
    case 'crystal': return onCrystal(o);
    case 'forage': return onForage(o);
    case 'fishspot': return onFish();
    default: return null;
  }
}

// ---- Garden
async function onPlot(i) {
  const p = S.plots[i];
  if (!p.u) return say('Cette parcelle est en friche. Tu peux l’acheter à la Boutique du village (onglet Outils).');
  if (!p.crop) return plantMenu(i);
  if (progress(p) >= 1) return harvestAll();
  return waterMenu(i);
}
function seedList() { return Object.keys(S.inv).filter((k) => k.startsWith('graine:') && S.inv[k] > 0); }
async function plantMenu(i) {
  const seeds = seedList();
  if (!seeds.length) return say(['Tu n’as plus de graines !', 'Va en acheter à la Boutique, en haut du village. Tu peux aussi en trouver dans les coffres et en battant des créatures.']);
  let chosen = null, fert = false;
  const P = panel('Que veux-tu planter ?', (body) => {
    if (has('engrais')) {
      body.append(h('label', { class: 'fert' }, h('input', { type: 'checkbox', checked: fert, onchange: (e) => (fert = e.target.checked) }), icon('engrais'), ` Ajouter de l’engrais (récolte ×2) — tu en as ${S.inv.engrais}`));
    }
    const list = h('div', { class: 'list' });
    seeds.sort((a, b) => (CROPS[a.slice(7)].grow - CROPS[b.slice(7)].grow)).forEach((sid) => {
      const c = CROPS[sid.slice(7)];
      list.append(h('button', { class: 'row', onclick: () => { chosen = sid.slice(7); P.close(); } },
        icon(sid), h('div', { class: 'row-main' }, h('b', null, c.seedName), h('small', null, `Pousse en ${fmtTime(c.grow * 1000 / speedMult())} · récolte ${c.yield[0]}-${c.yield[1]} ${c.name.toLowerCase()} · ${c.sell} pièces chacun`)),
        h('span', { class: 'qty' }, '×' + S.inv[sid])));
    });
    body.append(list);
  });
  await P.done;
  if (!chosen) return;
  plant(i, chosen, fert);
  const empties = S.plots.map((pp, j) => (pp.u && !pp.crop ? j : -1)).filter((j) => j >= 0);
  const left = S.inv['graine:' + chosen] || 0;
  if (empties.length && left) {
    const n = Math.min(empties.length, left);
    if (await confirm(`Il te reste ${left} × ${CROPS[chosen].seedName.toLowerCase()}. En planter dans ${n} autre${n > 1 ? 's' : ''} parcelle${n > 1 ? 's' : ''} vide${n > 1 ? 's' : ''} ?`, 'Oui, planter', 'Non')) {
      for (const j of empties.slice(0, n)) plant(j, chosen, false);
    }
  }
  sfx.harvest();
  if (S.stats.planted <= 4) await say('C’est planté ! Pour faire pousser plus vite, parle à ta plante et arrose-la en réussissant un calcul.');
}
function plant(i, crop, fert) {
  const p = S.plots[i];
  Object.assign(p, { crop, at: now(), grow: CROPS[crop].grow * 1000, skip: 0, fert: !!fert, wet: 0 });
  addItem('graine:' + crop, -1);
  if (fert) addItem('engrais', -1);
  S.stats.planted++;
}
function waterCat() {
  const r = Math.random();
  if (r >= 0.75) return pick(['coord', 'sym', 'angles', 'figures']); // a garden map, a symmetrical flower bed, shapes…
  if (S.lvl >= 9 && r < 0.2) return 'conv';
  if (S.lvl >= 5 && r < 0.4) return 'frac';
  return 'calc';
}
function water(i, frac) {
  const p = S.plots[i];
  if (!p.crop) return 0;
  const rem = Math.max(0, p.grow - effElapsed(p));
  p.skip += rem * frac;
  p.wet = now();
  return rem * frac / speedMult();
}
async function waterMenu(i) {
  const p = S.plots[i], c = CROPS[p.crop];
  const growing = S.plots.filter((pp) => pp.crop && progress(pp) < 1).length;
  const opts = ['Arroser cette plante', growing > 1 ? `Arroser tout le potager (${growing} plantes, 2 problèmes)` : null, 'Plus tard'].filter(Boolean);
  const k = await choose(`${c.name} : prêt dans ${fmtTime(remaining(p))}. Arroser ? Il faut réussir 2 problèmes !`, opts);
  const frac = WATER_FRAC[S.tools.arrosoir];
  if (opts[k] === 'Arroser cette plante') {
    for (;;) {
      const r = await askSeries([waterCat(), maybeEnigme(waterCat(), 0.35)], `Arroser : ${c.name}`, false);
      if (r.ok) {
        let gained = 0;
        for (let j = 0; j < r.ok; j++) gained += water(i, j < r.firsts ? frac * 0.6 : frac * 0.35);
        S.stats.watered++;
        sfx.water();
        toast(`Ça pousse ! −${fmtTime(gained)}`, 'blue');
        afterChange();
      }
      if (r.quit) return;
      if (progress(p) >= 1) { await say(`${c.name} : c’est prêt à récolter ! Parle encore à la plante pour la cueillir.`); return; }
      if (!(await confirm(`Encore ${fmtTime(remaining(p))}. Arroser encore ?`, 'Oui, encore', 'Non merci'))) return;
    }
  } else if (opts[k] && opts[k].startsWith('Arroser tout')) {
    const r = await askSeries([{ cat: 'calc', off: 1 }, maybeEnigme(waterCat(), 0.35)], 'Arroser tout le potager', false);
    if (r.ok >= 1) {
      let n = 0;
      S.plots.forEach((pp, j) => { if (pp.crop && progress(pp) < 1) { water(j, frac * (r.ok === 2 ? 0.75 : 0.4)); n++; } });
      S.stats.watered++;
      sfx.water();
      toast(`${n} plantes arrosées !`, 'blue');
    }
  }
}
async function harvestAll() {
  const got = {};
  let xp = 0, n = 0;
  S.plots.forEach((p) => {
    if (!p.crop || progress(p) < 1) return;
    const c = CROPS[p.crop];
    let q = R(c.yield[0], c.yield[1]) + (S.tools.panier && c.basket ? 1 : 0);
    if (p.fert) q *= 2;
    got[p.crop] = (got[p.crop] || 0) + q;
    S.stats.harvested[p.crop] = (S.stats.harvested[p.crop] || 0) + q;
    if (Math.random() < (c.rare ? 0.2 : 0.15)) got['graine:' + p.crop] = (got['graine:' + p.crop] || 0) + 1; // now and then a seed back, not one harvest in three
    xp += c.xp; n++;
    Object.assign(p, { crop: null, at: 0, grow: 0, skip: 0, fert: false, wet: 0 });
  });
  if (!n) return;
  for (const [id, q] of Object.entries(got)) addItem(id, q);
  S.stats.harvests += n;
  sfx.harvest();
  addXP(xp);
  const parts = Object.entries(got).map(([id, q]) => `${q} ${itemName(id)}`);
  toast(`Récolte : ${parts.join(', ')}`, 'green', Object.keys(got).map((id) => A.iconURL(id)));
  if (got.doree) await celebrate({ sound: 'discover', title: 'Fruit d’or !', lines: ['Tu as récolté le fruit le plus rare de la vallée !', 'Il vaut 1200 pièces.'], iconsBig: [A.iconURL('doree', 5)] });
  if (S.stats.harvests === n) await say(['Ta première récolte ! Bravo !', 'Vends tes légumes dans la caisse en bois devant ta maison.'], 'Mamie Rose');
}

// ---- Selling
// Economy notes. Prices come from a model of play: about 2 minutes per level at the start, 30 near level 50; half of
// the time spent farming, about 35 s of the player's time per garden plot (plant, water with a question, harvest).
// Coins per minute ≈ 0.86 × the profit of one harvest of the best crop, so each crop's seed price keeps that profit
// on a gentle curve (about 10 coins a minute at level 1, 140 at level 45). Shop items cost about 1 to 2 levels of
// coins at the level they open (hats less, the Serre more), so from start to finish the coins earned stay close to
// what there is to buy, with a small surplus only at the very end.
function sellPrice(id) {
  const base = ITEMS[id].sell || 0;
  return featured() === id ? base * 2 : base;
}
function featured() {
  const pool = Object.keys(CROPS).filter((k) => !CROPS[k].rare && CROPS[k].lvl <= S.lvl);
  const d = today();
  let hsh = 0; for (const ch of d) hsh = (hsh * 31 + ch.charCodeAt(0)) | 0;
  return pool[Math.abs(hsh) % pool.length];
}
function sellBody(body, P) {
  const f = featured();
  body.append(h('div', { class: 'note' }, icon(f), ` Article du jour : `, h('b', null, itemName(f)), ' — prix ×2 !'));
  const ids = Object.keys(S.inv).filter((id) => ITEMS[id] && ITEMS[id].kind !== 'seed' && ITEMS[id].sell > 0 && S.inv[id] > 0);
  if (!ids.length) { body.append(h('p', { class: 'empty' }, 'Tu n’as rien à vendre pour l’instant. Récolte des légumes ou fabrique des produits !')); return; }
  const list = h('div', { class: 'list' });
  const order = { crop: 0, product: 1, resource: 2 };
  ids.sort((a, b) => order[ITEMS[a].kind] - order[ITEMS[b].kind] || ITEMS[b].sell - ITEMS[a].sell);
  for (const id of ids) {
    const q = S.inv[id], pr = sellPrice(id);
    const keep = (id === 'bois' || id === 'pierre' || id === 'cristal') ? h('small', { class: 'warn' }, ' (utile pour construire)') : null;
    list.append(h('div', { class: 'row' }, icon(id),
      h('div', { class: 'row-main' }, h('b', null, itemName(id), keep), h('small', null, `${pr} pièces chacun${id === f ? ' (×2 aujourd’hui)' : ''}`)),
      h('span', { class: 'qty' }, '×' + q),
      h('button', { class: 'btn sm', onclick: () => { doSell(id, 1); P.refresh(); } }, 'Vendre 1'),
      q > 1 ? h('button', { class: 'btn sm alt', onclick: () => { doSell(id, q); P.refresh(); } }, `Tout (${fmt(pr * q)})`) : null));
  }
  body.append(list);
}
function doSell(id, q) {
  const pr = sellPrice(id);
  addItem(id, -q);
  addCoins(pr * q);
  S.stats.sold += q;
  afterChange();
}
async function sellPanel(title) { await panel(title, (b, P) => sellBody(b, P)).done; }

// ---- Shop
const toolOwned = (t) => (t.id === 'arrosoir' ? S.tools.arrosoir >= t.tier : !!S.tools[t.id]);
function buy(price) {
  if (S.coins < price) { sfx.bad(); toast('Pas assez de pièces…', 'red'); return false; }
  S.coins -= price; sfx.coin(); return true;
}
async function shopPanel() {
  const P = panel('Boutique de Bourgeon', (body, api, tab) => {
    if (tab === 'graines') {
      const list = h('div', { class: 'list' });
      Object.entries(CROPS).filter(([, c]) => !c.rare).forEach(([id, c]) => {
        const locked = c.lvl > S.lvl;
        list.append(h('div', { class: 'row' + (locked ? ' locked' : '') }, icon('graine:' + id),
          h('div', { class: 'row-main' }, h('b', null, c.seedName), h('small', null, locked ? `Débloqué au niveau ${c.lvl}` : `Pousse en ${fmtTime(c.grow * 1000)} · se vend ${c.sell} pièces · tu en as ${S.inv['graine:' + id] || 0}`)),
          locked ? h('span', { class: 'lock' }, `Niv. ${c.lvl}`) : [
            h('button', { class: 'btn sm', onclick: () => { if (buy(c.price)) { addItem('graine:' + id, 1); S.stats.bought++; afterChange(); api.refresh(); } } }, coinImg('coin sm'), ` ${c.price}`),
            h('button', { class: 'btn sm alt', onclick: () => { if (buy(c.price * 5)) { addItem('graine:' + id, 5); S.stats.bought += 5; afterChange(); api.refresh(); } } }, `×5 · ${c.price * 5}`),
          ]));
      });
      body.append(list);
    } else if (tab === 'outils') {
      const list = h('div', { class: 'list' });
      const nb = PLOT_BUYS[S.plotBuys];
      if (nb) {
        const locked = nb.lvl > S.lvl;
        list.append(h('div', { class: 'row' + (locked ? ' locked' : '') }, icon('tool:plots'),
          h('div', { class: 'row-main' }, h('b', null, '2 parcelles de plus'), h('small', null, `Tu as ${4 + S.plotBuys * 2} parcelles sur 18.`)),
          locked ? h('span', { class: 'lock' }, `Niv. ${nb.lvl}`) : h('button', { class: 'btn sm', onclick: () => {
            if (buy(nb.price)) { S.plotBuys++; for (let i = 0; i < 4 + S.plotBuys * 2; i++) S.plots[i].u = true; toast('Nouvelles parcelles dans le potager !', 'green'); afterChange(); api.refresh(); }
          } }, coinImg('coin sm'), ` ${nb.price}`)));
      }
      const bb = BARN_BUYS[(S.barnSlots - 4) / 2];
      if (S.built.etable && bb) {
        const locked = bb.lvl > S.lvl;
        list.append(h('div', { class: 'row' + (locked ? ' locked' : '') }, icon('tool:etable'),
          h('div', { class: 'row-main' }, h('b', null, 'Agrandir l’Étable'), h('small', null, `2 places de plus pour tes animaux. Tu as ${S.barnSlots} places.`)),
          locked ? h('span', { class: 'lock' }, `Niv. ${bb.lvl}`) : h('button', { class: 'btn sm', onclick: () => {
            if (buy(bb.price)) { S.barnSlots += 2; toast('L’Étable est plus grande !', 'green'); afterChange(); api.refresh(); }
          } }, coinImg('coin sm'), ` ${bb.price}`)));
      }
      const eLocked = S.lvl < 10;
      // fertilizer doubles a harvest: it costs about 60 % of one harvest of the best crop open, so it stays a small bonus
      const best = Math.max(...Object.values(CROPS).filter((c) => !c.rare && c.lvl <= S.lvl).map((c) => (c.yield[0] + c.yield[1]) / 2 * c.sell));
      const ePrice = Math.max(30, Math.round(best * 0.6 / 5) * 5);
      list.append(h('div', { class: 'row' + (eLocked ? ' locked' : '') }, icon('engrais'),
        h('div', { class: 'row-main' }, h('b', null, 'Engrais'), h('small', null, `Double la récolte d’une plante. Tu en as ${S.inv.engrais || 0}.`)),
        eLocked ? h('span', { class: 'lock' }, 'Niv. 10') : h('button', { class: 'btn sm', onclick: () => { if (buy(ePrice)) { addItem('engrais', 1); afterChange(); api.refresh(); } } }, coinImg('coin sm'), ` ${ePrice}`)));
      for (const t of TOOLS) {
        const owned = toolOwned(t);
        const needPrev = t.id === 'arrosoir' && S.tools.arrosoir < t.tier - 1;
        const locked = t.lvl > S.lvl;
        list.append(h('div', { class: 'row' + (locked ? ' locked' : '') + (owned ? ' owned' : '') }, icon('tool:' + t.id + (t.tier || '')),
          h('div', { class: 'row-main' }, h('b', null, t.name), h('small', null, t.desc)),
          owned ? h('span', { class: 'tick' }, 'Acheté') : locked ? h('span', { class: 'lock' }, `Niv. ${t.lvl}`) : needPrev ? h('span', { class: 'lock' }, 'Arrosoir d’avant') :
            h('button', { class: 'btn sm', onclick: () => {
              if (buy(t.price)) {
                if (t.id === 'arrosoir') S.tools.arrosoir = t.tier; else S.tools[t.id] = true;
                celebrate({ title: t.name, lines: [t.desc] });
                afterChange(); api.refresh();
              }
            } }, coinImg('coin sm'), ` ${fmt(t.price)}`)));
      }
      body.append(list);
    } else if (tab === 'style') {
      const list = h('div', { class: 'list grid2' });
      for (const [id, hh] of Object.entries(HATS)) {
        const own = S.hats.includes(id), locked = hh.lvl > S.lvl;
        const sw = A.canvas(16, 19), g = sw.getContext('2d'); A.drawPerson(g, 0, 3, 'down', 0, { ...playerLook(), hat: hh.color });
        const prev = A.canvas(48, 57), pg = prev.getContext('2d'); pg.imageSmoothingEnabled = false; pg.drawImage(sw, 0, 0, 48, 57);
        list.append(h('div', { class: 'hat' + (S.hat === id ? ' on' : '') + (locked ? ' locked' : '') }, h('img', { src: prev.toDataURL(), class: 'hatimg' }), h('b', null, hh.name),
          S.hat === id ? h('span', { class: 'tick' }, 'Portée') : own ? h('button', { class: 'btn sm', onclick: () => { S.hat = id; sfx.sel(); save(); api.refresh(); } }, 'Mettre') :
            locked ? h('span', { class: 'lock' }, `Niv. ${hh.lvl}`) : h('button', { class: 'btn sm', onclick: () => { if (buy(hh.price)) { S.hats.push(id); S.hat = id; afterChange(); api.refresh(); } } }, coinImg('coin sm'), ` ${fmt(hh.price)}`)));
      }
      body.append(list);
    } else sellBody(body, api);
  }, { tabs: [['graines', 'Graines'], ['outils', 'Outils'], ['style', 'Style'], ['vendre', 'Vendre']] });
  await P.done;
}

// ---- Buildings & crafting
const MASC = new Set(['moulin', 'pressoir']);
const theName = (id) => (id === 'etable' ? 'l’Étable' : `${MASC.has(id) ? 'le' : 'la'} ${BUILDINGS[id].name}`);
async function onBuilding(id) {
  const B = BUILDINGS[id];
  if (!S.built[id]) {
    if (S.lvl < B.lvl) return say([`Un chantier : ici, on pourra construire ${theName(id)}.`, `${B.desc} Il faut être niveau ${B.lvl}.`]);
    const cost = Object.entries(B.cost).map(([k, v]) => (k === 'coins' ? `${fmt(v)} pièces` : qtyName(k, v))).join(', ');
    if (!(await confirm(`Construire : ${B.name} ? Il faut ${cost}.`, 'Construire', 'Plus tard'))) return;
    const missing = Object.entries(B.cost).filter(([k, v]) => (k === 'coins' ? S.coins < v : !has(k, v)))
      .map(([k, v]) => (k === 'coins' ? `${fmt(v - S.coins)} pièces` : qtyName(k, v - (S.inv[k] || 0))));
    if (missing.length) return say([`Il te manque encore : ${missing.join(', ')}.`, id === 'serre' ? 'Les cristaux se trouvent dans la montagne.' : 'Le bois et les pierres se trouvent dans la forêt, à l’ouest de la ferme.']);
    await say('Le chef de chantier vérifie le plan avec toi. Réussis ces 2 problèmes pour lancer la construction !');
    const r = await askSeries(['geo', pick(['figures', 'angles', 'enigme'])], `Construire : ${B.name}`);
    if (!r.all) return say('Le chef de chantier dit : pas grave, on réessaie quand tu veux !');
    for (const [k, v] of Object.entries(B.cost)) { if (k === 'coins') S.coins -= v; else addItem(k, -v); }
    S.built[id] = true;
    addXP(30);
    await celebrate({ title: `${B.name} construit${MASC.has(id) ? '' : 'e'} !`, lines: [B.desc, id === 'etable' ? 'Maintenant, attrape des animaux dans la vallée : une poule se promène à l’est de la ferme !' : null].filter(Boolean) });
    if (id === 'etable') syncFarm();
    return;
  }
  if (id === 'etable') return barnPanel();
  if (id === 'serre') return say(['La Serre magique fait pousser toutes tes plantes 50 % plus vite.', 'Même quand tu n’es pas là !']);
  return craftPanel(id);
}
async function craftPanel(id) {
  const B = BUILDINGS[id];
  let job = null, invent = false;
  const secrets = RECIPES[id].filter((r) => r.secret);
  const P = panel(B.name, (body) => {
    body.append(h('p', { class: 'note' }, 'Chaque fabrication demande 2 problèmes. Si tu te trompes, tu gardes tes ingrédients.'));
    if (secrets.length) {
      const nf = secrets.filter((r) => S.found[r.out]).length;
      body.append(h('div', { class: 'invent' }, h('span', null, `Recettes secrètes : ${nf}/${secrets.length}`),
        nf < secrets.length ? h('button', { class: 'btn sm alt', onclick: () => { invent = true; P.close(); } }, 'Inventer une recette') : h('span', { class: 'tick' }, 'Toutes trouvées !')));
    }
    const list = h('div', { class: 'list' });
    for (const r of RECIPES[id]) {
      if (r.secret && !S.found[r.out]) {
        list.append(h('div', { class: 'row recipe mystery' }, h('span', { class: 'ic qmark' }, '?'),
          h('div', { class: 'row-main' }, h('b', null, 'Recette mystère'), h('small', null, 'Indice : ' + r.hint))));
        continue;
      }
      const locked = r.lvl > S.lvl;
      const ok = !locked && Object.entries(r.in).every(([k, v]) => has(k, v));
      list.append(h('div', { class: 'row recipe' + (locked ? ' locked' : '') },
        h('div', { class: 'ingr' }, Object.entries(r.in).map(([k, v]) => h('span', { class: 'ing' + (has(k, v) ? '' : ' miss') }, icon(k), `${S.inv[k] || 0}/${v}`))),
        h('span', { class: 'arrow' }, '→'), icon(r.out),
        h('div', { class: 'row-main' }, h('b', null, itemName(r.out)), h('small', null, `Se vend ${ITEMS[r.out].sell} pièces · tu en as ${S.inv[r.out] || 0}`)),
        locked ? h('span', { class: 'lock' }, `Niv. ${r.lvl}`) : h('button', { class: 'btn sm', disabled: !ok, onclick: () => { job = r; P.close(); } }, 'Fabriquer')));
    }
    body.append(list);
  });
  await P.done;
  if (invent) { await inventPanel(id); return craftPanel(id); }
  if (!job) return;
  const r = await askSeries([maybeEnigme(job.theme, 0.25)], `${B.name} : ${itemName(job.out)}`);
  if (r.all) {
    for (const [k, v] of Object.entries(job.in)) addItem(k, -v);
    addItem(job.out, 1);
    S.stats.made[job.out] = (S.stats.made[job.out] || 0) + 1;
    addXP(6 + Math.round(ITEMS[job.out].sell / 25));
    sfx.harvest();
    toast(`+1 ${itemName(job.out)}`, 'green', [A.iconURL(job.out)]);
    afterChange();
  }
  if (!r.quit) return craftPanel(id);
}

// ---- Animals
async function onWild(e) {
  const d = ANIMALS[e.kind], art = ART[e.kind];
  if (S.lvl < d.lvl) return say([`${cap(art)} !`, `Il est encore trop farouche… Reviens au niveau ${d.lvl} pour l’apprivoiser.`]);
  if (!S.built.etable) return say([`${cap(art)} ! Tu pourrais l’adopter…`, 'Mais il te faut d’abord une Étable : elle se construit sous ta maison, à côté de l’enclos (niveau 3).']);
  if (S.animals.length >= S.barnSlots) return say('Ton Étable est pleine ! Agrandis-la à la Boutique (onglet Outils).');
  if (!(await confirm(`${cap(art)} ! Veux-tu l’apprivoiser ? Réussis 2 problèmes pour gagner sa confiance.`, 'Essayer', 'Plus tard'))) return;
  const tame = await askSeries(['animaux', pick(['enigme', 'calc', 'recette'])], `Apprivoiser : ${d.name}`);
  if (!tame.all) return say(tame.quit ? 'Tu reviendras plus tard.' : 'Oups, il a eu peur et s’éloigne un peu… Réessaie !');
  const used = new Set(S.animals.map((a) => a.name));
  const name = d.names.find((n) => !used.has(n)) || `${pick(d.names)} ${S.animals.length + 1}`;
  S.animals.push({ id: 'a' + now().toString(36) + R(10, 99), kind: e.kind, name, fedAt: 0, prod: 0, skip: 0 });
  S.stats.caught++;
  S.res[e.id] = now() + 240000;
  Object.assign(e, { x: e.home.x, y: e.home.y, px: e.home.x * 16, py: e.home.y * 16, moving: false });
  syncFarm();
  addXP(15 + d.lvl * 2);
  sfx.level();
  await celebrate({ sound: 'friend', title: `${name} rejoint ta ferme !`, iconsBig: [animalURL(e.kind)], lines: [`Mange : ${foodsText(e.kind)}`, `Donne : ${itemName(d.out).toLowerCase()}`, 'Va la voir dans l’enclos, à côté de ta maison.'] });
}
async function onFarmAnimal(e) {
  const a = animalOf(e);
  if (!a) return;
  const d = ANIMALS[a.kind];
  const st = aStatus(a);
  if (st === 'pret') {
    const q = collectAnimal(a);
    toast(`${a.name} : +${qtyName(d.out, q)}`, 'green', [A.iconURL(d.out)]);
    afterChange();
    const meal = mealFor(a);
    if (meal && (await confirm(`Redonner à manger à ${a.name} (${mealText(meal)}) ?`, 'Oui', 'Non'))) feedAnimal(a, meal);
    return;
  }
  if (st === 'faim') {
    const meal = mealFor(a);
    if (!meal) return say([`${a.name} a faim !`, `Son repas : ${foodsText(a.kind)}. Tu n’en as pas : plante-en au potager !`]);
    if (await confirm(`${a.name} a faim ! Lui donner ${mealText(meal)} ?`, 'Donner', 'Plus tard')) {
      feedAnimal(a, meal);
      toast(`${a.name} se régale ! ${cap(itemName(d.out).toLowerCase())} dans ${fmtTime(aRemaining(a))}.`, 'green');
    }
    return;
  }
  return brushLoop(a);
}
async function brushLoop(a) {
  const d = ANIMALS[a.kind];
  const verb = a.kind === 'abeilles' ? 'Aider les abeilles' : `Brosser ${a.name}`;
  if (!(await confirm(`${a.name} prépare : ${itemName(d.out).toLowerCase()}. Encore ${fmtTime(aRemaining(a))}. ${verb} pour aller plus vite ? (un calcul)`, 'Oui', 'Plus tard'))) return;
  for (;;) {
    const r = await askMath({ cat: Math.random() < 0.5 ? 'animaux' : maybeEnigme('calc'), title: verb });
    if (r.quit) return;
    if (r.ok) {
      const rem = Math.max(0, a.prod - ((now() - a.fedAt) * speedMult() + a.skip));
      a.skip += rem * (r.first ? 0.5 : 0.3);
      sfx.water();
      afterChange();
    }
    if (aProgress(a) >= 1) { await say(`${a.name} a fini ! Va ramasser : ${itemName(d.out).toLowerCase()}.`); return; }
    if (!(await confirm(`Encore ${fmtTime(aRemaining(a))}. Continuer ?`, 'Oui, encore', 'Non merci'))) return;
  }
}
async function barnPanel() {
  let brush = null;
  const P = panel('Étable', (body, api) => {
    const n = S.animals.length;
    body.append(h('p', { class: 'note' }, `${n}/${S.barnSlots} places. Nourris tes animaux avec tes récoltes : ils te donnent des œufs, du lait, de la laine…`));
    if (!n) {
      body.append(h('p', { class: 'empty' }, 'L’Étable est vide. Attrape des animaux dans la vallée :'));
      body.append(h('div', { class: 'list' }, Object.entries(ANIMALS).map(([k, d]) => h('div', { class: 'row' + (d.lvl > S.lvl ? ' locked' : '') },
        h('img', { class: 'ic', src: animalURL(k, 3) }), h('div', { class: 'row-main' }, h('b', null, d.name), h('small', null, `Niveau ${d.lvl} · mange ${foodsText(k)} · donne ${itemName(d.out).toLowerCase()}`))))));
      return;
    }
    const ready = S.animals.filter((a) => aStatus(a) === 'pret'), hungry = S.animals.filter((a) => aStatus(a) === 'faim' && mealFor(a));
    body.append(h('div', { class: 'sync-acts' },
      h('button', { class: 'btn sm', disabled: !ready.length, onclick: () => {
        const got = {};
        for (const a of ready) { const d = ANIMALS[a.kind]; got[d.out] = (got[d.out] || 0) + collectAnimal(a); }
        toast(Object.entries(got).map(([k, q]) => '+' + qtyName(k, q)).join(', '), 'green', Object.keys(got).map((k) => A.iconURL(k)));
        afterChange(); api.refresh();
      } }, `Tout ramasser (${ready.length})`),
      h('button', { class: 'btn sm alt', disabled: !hungry.length, onclick: () => {
        let fed = 0;
        for (const a of S.animals) { const meal = aStatus(a) === 'faim' && mealFor(a); if (meal) { feedAnimal(a, meal); fed++; } }
        toast(`${fed} animal${fed > 1 ? 'aux' : ''} nourri${fed > 1 ? 's' : ''} !`, 'green');
        afterChange(); api.refresh();
      } }, 'Tout nourrir')));
    const list = h('div', { class: 'list' });
    for (const a of S.animals) {
      const d = ANIMALS[a.kind], st = aStatus(a), meal = mealFor(a);
      const status = st === 'pret' ? `Prêt : ${itemName(d.out).toLowerCase()} à ramasser !` : st === 'faim' ? `A faim · mange ${foodsText(a.kind)}` : `Prépare ${itemName(d.out).toLowerCase()} · encore ${fmtTime(aRemaining(a))}`;
      list.append(h('div', { class: 'row' },
        h('img', { class: 'ic', src: animalURL(a.kind, 3) }),
        h('div', { class: 'row-main' }, h('b', null, `${a.name} `, h('small', null, d.name)), h('small', null, status),
          st === 'occupe' ? h('span', { class: 'mbar' }, h('i', { style: `width:${Math.round(aProgress(a) * 100)}%` })) : null),
        st === 'pret' ? h('button', { class: 'btn sm', onclick: () => { const q = collectAnimal(a); toast(`+${qtyName(d.out, q)}`, 'green', [A.iconURL(d.out)]); afterChange(); api.refresh(); } }, 'Ramasser')
          : st === 'faim' ? h('button', { class: 'btn sm alt', disabled: !meal, onclick: () => { feedAnimal(a, meal); afterChange(); api.refresh(); } }, 'Nourrir')
            : h('button', { class: 'btn sm ghost', onclick: () => { brush = a; P.close(); } }, a.kind === 'abeilles' ? 'Aider' : 'Brosser')));
    }
    body.append(list);
  });
  const timer = setInterval(() => P.refresh(), 2000);
  await P.done;
  clearInterval(timer);
  if (brush) { await brushLoop(brush); return barnPanel(); }
}
async function inventPanel(id) {
  const B = BUILDINGS[id];
  const sel = new Set();
  let result = null;
  const P = panel(`Inventer : ${B.name}`, (body, api) => {
    const left = RECIPES[id].filter((r) => r.secret && !S.found[r.out]);
    body.append(h('p', { class: 'note' }, 'Choisis 1 à 3 ingrédients de ton sac, puis essaie ! Les indices des recettes mystères t’aident.'));
    body.append(h('div', { class: 'hints' }, left.map((r) => h('p', null, '• ' + r.hint))));
    const ids = Object.keys(S.inv).filter((k) => S.inv[k] > 0 && ITEMS[k] && (ITEMS[k].kind === 'crop' || ITEMS[k].kind === 'product'));
    if (!ids.length) { body.append(h('p', { class: 'empty' }, 'Ton sac est vide. Récolte et fabrique des choses d’abord !')); return; }
    body.append(h('div', { class: 'chips' }, ids.map((k) => h('button', { class: 'chip' + (sel.has(k) ? ' on' : ''), onclick: () => {
      if (sel.has(k)) sel.delete(k); else if (sel.size < 3) sel.add(k);
      sfx.blip(); result = null; api.refresh();
    } }, icon(k), itemName(k)))));
    body.append(h('div', { class: 'sync-acts' }, h('button', { class: 'btn', disabled: !sel.size, onclick: () => {
      const key = [...sel].sort().join('+');
      const r = RECIPES[id].find((x) => Object.keys(x.in).sort().join('+') === key);
      if (r && r.secret && !S.found[r.out]) {
        S.found[r.out] = now();
        addXP(25); sfx.level();
        celebrate({ sound: 'discover', title: 'Recette découverte !', iconsBig: [A.iconURL(r.out, 5)], lines: [itemName(r.out), Object.entries(r.in).map(([k, v]) => qtyName(k, v)).join(' + '), `Se vend ${ITEMS[r.out].sell} pièces. Fabrique-la à : ${B.name}.`] });
        afterChange(); P.close(); return;
      }
      result = r ? `Tu connais déjà cette recette : ${itemName(r.out)} !` : 'Hmm… ça ne donne rien de bon. Relis les indices et essaie autre chose !';
      sfx.bad(); api.refresh();
    } }, 'Essayer !'), sel.size ? h('button', { class: 'btn ghost', onclick: () => { sel.clear(); result = null; api.refresh(); } }, 'Vider') : null));
    if (result) body.append(h('p', { class: 'invent-msg' }, result));
  });
  await P.done;
}

// ---- Orders board
function orderPool() {
  const pool = [];
  for (const [id, c] of Object.entries(CROPS)) if (!c.rare && c.lvl <= S.lvl) pool.push([id, 2, 6]);
  for (const [bid, list] of Object.entries(RECIPES)) if (S.built[bid]) for (const r of list) if (r.lvl <= S.lvl && (!r.secret || S.found[r.out])) pool.push([r.out, 1, 2]);
  for (const k of new Set((S.animals || []).map((a) => a.kind))) pool.push([ANIMALS[k].out, 2, 4]);
  return pool;
}
function newOrder() {
  const pool = orderPool();
  const n = pool.length > 2 && Math.random() < 0.45 ? 2 : 1;
  const items = {};
  for (let i = 0; i < n; i++) { const [id, a, b] = pick(pool); items[id] = (items[id] || 0) + R(a, b); }
  const value = Object.entries(items).reduce((s, [id, q]) => s + ITEMS[id].sell * q, 0);
  return { who: pick(CUSTOMERS), items, coins: Math.round(value * 1.4 + 10), xp: Math.round(10 + value / 5), at: 0 };
}
function ensureOrders() {
  if (!S.orders || S.orders.length !== 3) S.orders = [newOrder(), newOrder(), null];
  S.orders = S.orders.map((o) => (o === null || (o && o.wait && o.wait <= now()) ? newOrder() : o));
}
async function ordersPanel() {
  ensureOrders();
  const P = panel('Tableau des commandes', (body, api) => {
    ensureOrders();
    body.append(h('p', { class: 'note' }, 'Les habitants de la vallée commandent tes récoltes. Livre-les pour gagner beaucoup de pièces !'));
    const list = h('div', { class: 'orders' });
    S.orders.forEach((o, i) => {
      if (o.wait) { list.append(h('div', { class: 'order wait win' }, h('b', null, 'Nouvelle commande…'), h('small', null, `dans ${fmtTime(o.wait - now())}`))); return; }
      const can = Object.entries(o.items).every(([k, v]) => has(k, v));
      list.append(h('div', { class: 'order win' },
        h('div', { class: 'who' }, o.who),
        h('div', { class: 'need' }, Object.entries(o.items).map(([k, v]) => h('span', { class: 'ing' + (has(k, v) ? '' : ' miss') }, icon(k), `${Math.min(S.inv[k] || 0, v)}/${v} ${itemName(k)}`))),
        h('div', { class: 'reward' }, coinImg('coin sm'), ` ${o.coins}  ·  ${o.xp} XP`),
        h('div', { class: 'acts' },
          h('button', { class: 'btn sm', disabled: !can, onclick: async () => {
            const lines = Object.entries(o.items).map(([k, v]) => ({ k, v, p: ITEMS[k].sell }));
            const total = lines.reduce((t, l) => t + l.v * l.p, 0);
            const bill = {
              cat: 'argent', u: 'pièces', a: total,
              q: `${o.who} te demande la facture : ${lines.map((l) => `${qtyName(l.k, l.v)} à ${l.p} pièces`).join(', ')}. Combien ça fait en tout ?`,
              ex: lines.map((l) => `${l.v} × ${l.p} = ${l.v * l.p}`).join(' ; ') + (lines.length > 1 ? `. Total : ${total} pièces` : ''),
              hint: 'Multiplie la quantité par le prix pour chaque produit, puis additionne.',
            };
            const r = await askMath({ problem: bill, title: 'Facture de la commande' });
            if (!r.ok) { if (!r.quit) toast('Vérifie ta facture et réessaie !', 'red'); return; }
            if (!S.orders[i] || S.orders[i] !== o) return;
            for (const [k, v] of Object.entries(o.items)) addItem(k, -v);
            S.coins += o.coins; sfx.coin(); addXP(o.xp);
            S.stats.orders++;
            S.orders[i] = { wait: now() + 45000 };
            toast(`Merci ! ${o.who} te donne ${o.coins} pièces.`, 'gold');
            afterChange(); api.refresh();
          } }, 'Livrer'),
          h('button', { class: 'btn sm ghost', onclick: () => { S.orders[i] = { wait: now() + 30000 }; save(); api.refresh(); } }, 'Changer'))));
    });
    body.append(list);
  });
  const timer = setInterval(() => { if (S.orders.some((o) => o && o.wait)) P.refresh(); }, 1000);
  await P.done;
  clearInterval(timer);
}

// ---- Village people & places
const TIPS = {
  lea: ['Les créatures des hautes herbes adorent les calculs ! Bats-les pour devenir leur ami.', 'Le tableau des commandes paie beaucoup plus que la caisse de vente.', 'Maître Hibou, près de la fontaine, t’aide à réviser ce que tu veux.', 'Chaque jour, regarde ta boîte aux lettres : il y a souvent un cadeau !'],
  tim: ['Le Moulin transforme le blé en farine. Avec la farine, on fait du pain !', 'Une série de bonnes réponses te donne plus d’XP. Ne lâche rien !', 'Plus une graine est rare, plus elle rapporte. Les graines dorées valent une fortune…', 'Les bottes de course de la boutique, c’est génial pour explorer.'],
  garde: ['Les arbres repoussent après quelques minutes. Coupe-les en réussissant des additions.', 'Les pierres se cassent avec des multiplications et des divisions.', 'On raconte qu’un Vieil Arbre dort au nord de la forêt…', 'Il y a des coffres cachés dans les clairières. Ils s’ouvrent avec des fractions !'],
  sage: ['Le Cristallon est la créature la plus rare. Il vit ici, dans les hautes herbes enneigées.', 'Les cristaux servent à construire la Serre magique, et le Vieil Arbre les adore.', 'Plus tu montes, plus les problèmes sont durs… et plus les trésors sont beaux.'],
};
const tipIdx = {};
async function onNpc(o) {
  const n = NPCS[o.npc];
  const toward = { up: 'down', down: 'up', left: 'right', right: 'left' }[pl.dir];
  npcDir[o.id] = toward;
  if (o.npc === 'mamie') return onMamie();
  if (o.npc === 'lea' && frOn().length) return onLea();
  if (o.npc === 'pecheur') {
    if (!S.tools.canne) {
      S.tools.canne = true;
      await say(['Salut ! Tu veux pêcher ? Tiens, prends ma vieille canne à pêche.', 'Va au bout du ponton et lance ta ligne. Les poissons aiment les conversions : kg, g, L, cL…'], n.name);
      await celebrate({ title: 'Canne à pêche', lines: ['Tu peux pêcher au bout du ponton !'] });
      return;
    }
    return say([pick(['Les gros poissons mordent quand tu réponds juste du premier coup !', 'La carpe dorée est très rare. Elle vaut une fortune !', 'Le brochet et la truite se vendent bien au village.'])], n.name);
  }
  const list = TIPS[o.npc] || ['Bonjour !'];
  tipIdx[o.npc] = ((tipIdx[o.npc] ?? -1) + 1) % list.length;
  await say(list[tipIdx[o.npc]], n.name);
}
// Léa writes letters to the whole village, with mistakes: the child corrects them (French modules switched on by the parents).
async function onLea() {
  const who = NPCS.lea.name;
  const mods = frOn();
  const daily = S.daily.lea !== today();
  const letters = mods.some((m) => ['fr:gn', 'fr:sv', 'fr:eer', 'fr:homo', 'fr:relire'].includes(m));
  const opts = [`${letters ? 'Corriger les lettres de Léa' : 'Les exercices de Léa'} (5 questions${daily ? ', cadeau du jour' : ''})`, 'Leçons de français', 'Au revoir'];
  const k = await choose(letters ? 'Coucou ! J’écris des lettres à tout le village, mais je fais des fautes… Tu m’aides à les corriger ?' : 'Coucou ! On fait un peu de français ensemble ? J’ai un cadeau pour toi.', opts, who);
  if (k === 1) return lessonsPanel(true);
  if (k !== 0) return;
  const r = await series(mods, 5, 0, letters ? 'Lettres de Léa' : 'Exercices de Léa', false);
  if (!r) return;
  const { score, won } = r;
  const lines = [`${score}/5 du premier coup`, `+${won} pièces gagnées pendant les lettres`];
  const icons = [A.coinURL()];
  const xp = score * 6;
  addXP(xp); lines.push(`+${xp} XP`);
  if (score >= 3) {
    const pool = Object.keys(CROPS).filter((c) => !CROPS[c].rare && CROPS[c].lvl <= S.lvl);
    const seed = pick(pool.slice(-4)), q = R(2, 3);
    addItem('graine:' + seed, q);
    lines.push(`Merci ! ${q} × ${CROPS[seed].seedName.toLowerCase()}`);
    icons.push(A.iconURL('graine:' + seed));
  }
  if (score >= 3 && daily) {
    // the first good letter round of the day: a bigger thank-you
    S.daily.lea = today();
    const c = 40 + tier() * 8;
    S.coins += c; addItem('engrais', 1);
    lines.push(`Cadeau du jour : +${c} pièces et 1 engrais`);
    icons.push(A.iconURL('engrais'));
  }
  if (score === 5) { const c = 30 + tier() * 5; S.coins += c; lines.push(`Sans faute ! +${c} pièces`); }
  sfx.coin();
  await celebrate({ sound: score >= 4 ? 'fanfare' : null, title: score >= 4 ? 'Lettres parfaites !' : 'Lettres corrigées', lines, icons });
  if (score < 3) await say('Merci quand même ! Relis bien chaque mot : le verbe avec son sujet, le nom avec son déterminant.', who);
}
const MAMIE_HELP = {
  plant: 'Va dans le potager derrière la barrière, mets-toi devant une parcelle et appuie sur A pour planter.',
  water: 'Parle à une plante qui pousse pour l’arroser. Un calcul juste = elle pousse plus vite !',
  harvest: 'Quand la plante est mûre, elle brille. Appuie sur A devant elle pour récolter.',
  sell: 'La caisse en bois devant la maison achète tes légumes.',
  buy: 'La Boutique est tout en haut du village, au nord. Suis le chemin !',
  order: 'Le tableau des commandes est au milieu du village, près de la fontaine.',
  rock: 'Le gros rocher est à l’ouest de la ferme. Gagne de l’XP pour atteindre le niveau 3 : récolte, arrose, livre des commandes !',
  forest: 'Dans la forêt, mets-toi devant un petit arbre ou une pierre grise et appuie sur A.',
  etable: 'L’Étable se construit juste sous ta maison, à côté de l’enclos. Il faut du bois et des pierres de la forêt.',
  catch: 'Une poule se promène à l’est de la ferme. Mets-toi devant elle et appuie sur A !',
  feed: 'Parle à ta poule dans l’enclos, ou ouvre l’Étable, et donne-lui du blé. Plante du blé s’il t’en manque !',
  collect: 'Quand un animal a fini, une bulle apparaît au-dessus de lui. Va ramasser ce qu’il a fait !',
  creature: 'Marche dans les hautes herbes : une créature finira par apparaître !',
  secret: 'À la Boulangerie, appuie sur « Inventer une recette » et essaie des ingrédients. Les indices t’aident !',
};
async function onMamie() {
  const who = 'Mamie Rose';
  if (!S.flags.intro) {
    await say([
      `Bonjour ${S.name} ! Bienvenue dans ta nouvelle ferme, dans la Vallée des Graines.`,
      'Je te donne 4 graines de radis pour commencer. Plante-les dans le potager, juste derrière la barrière.',
      'Le secret de la vallée : les plantes poussent beaucoup plus vite quand on les arrose en réussissant des calculs !',
      'Récolte, vends, achète de meilleures graines… Un jour, tu feras de la farine, du pain, et peut-être même des Fruits d’or !',
      isTouch() ? 'Pour marcher, pose ton doigt n’importe où sur l’écran et fais-le glisser. Appuie sur A pour parler et agir. Le bouton MENU ouvre ton sac et ton carnet.'
        : 'Utilise les flèches pour marcher et A (ou Espace) pour parler et agir. Le bouton MENU ouvre ton sac et ton carnet.',
    ], who);
    S.flags.intro = true;
    afterChange();
    return;
  }
  const tip = MAMIE_HELP[curObj().id];
  await say([tip ? `Ton objectif : ${curObj().t}. ${tip}` : pick(['Tu deviens un vrai fermier ! Je suis fière de toi.', 'N’oublie pas : une série de bonnes réponses rapporte plus d’XP.', 'As-tu exploré le lac et la montagne ? Il paraît qu’il y a des trésors !'])], who);
}
async function onMailbox() {
  if (S.daily.mail === today()) return say('La boîte aux lettres est vide. Reviens demain pour un nouveau cadeau !');
  await say('Il y a un colis dans la boîte aux lettres ! Il est fermé par un cadenas à calcul.');
  const res = await askSeries(['enigme', pick(['calc', 'frac', 'conv', 'masse', 'argent', 'geo', 'duree', 'coord', 'figures'])], 'Cadeau du jour', false);
  if (res.quit) return;
  const r = { ok: res.ok >= 1 };
  S.daily.mail = today();
  const seedPool = Object.keys(CROPS).filter((k) => !CROPS[k].rare && CROPS[k].lvl <= S.lvl);
  const seed = pick(seedPool.slice(-3));
  const coins = (r.ok ? 30 : 15) + tier() * (r.ok ? 8 : 4);
  const q = r.ok ? 4 : 2;
  addItem('graine:' + seed, q);
  S.coins += coins;
  if (r.ok && S.lvl >= 10) addItem('engrais', 1);
  sfx.coin();
  await celebrate({ title: 'Cadeau du jour', lines: [`${coins} pièces`, `${q} ${CROPS[seed].seedName.toLowerCase()}`, r.ok && S.lvl >= 10 ? '1 engrais' : null].filter(Boolean), icons: [A.coinURL(), A.iconURL('graine:' + seed)] });
}
async function onFountain() {
  if (S.daily.wish === today()) return say('L’eau de la fontaine scintille. Reviens demain faire un vœu !');
  S.daily.wish = today();
  const c = R(5, 15) + tier() * 2;
  S.coins += c; sfx.coin();
  return say(`Tu fais un vœu… et tu trouves ${c} pièces au fond de la fontaine !`);
}
async function onOwl() {
  const who = 'Maître Hibou';
  const nStars = Object.values(S.defis).reduce((t, v) => t + v, 0);
  const opts = [`Défis de l’Hibou (${nStars}/${DEFIS.length * 3} étoiles)`, 'Réviser un thème (gagne des récompenses)', 'Leçons : Maître Hibou explique', S.daily.hibou !== today() ? 'Défi du jour (5 questions)' : null, 'Mes progrès', 'Au revoir'].filter(Boolean);
  const k = await choose('Hou hou ! Que veux-tu faire, jeune calculateur ?', opts, who);
  const o = opts[k];
  if (o && o.startsWith('Défis de')) return defiLadder();
  if (o && o.startsWith('Leçons')) return lessonsPanel();
  if (o && o.startsWith('Réviser')) {
    let cat = null;
    const P = panel('Réviser avec Maître Hibou', (body) => {
      body.append(h('div', { class: 'note owl-rewards' },
        h('b', null, '5 questions sur le thème de ton choix, autant de fois que tu veux :'),
        h('span', null, '• chaque bonne réponse : des pièces (plus c’est dur, plus ça rapporte)'),
        h('span', null, '• 3 bonnes réponses : un sachet de graines surprise'),
        h('span', null, '• 5 sur 5 : gros bonus + engrais'),
        h('span', null, '• premier 5 sur 5 d’un thème : une étoile d’or et 100 pièces')));
      const nStars = Object.keys(S.stars).length;
      body.append(h('p', { class: 'small' }, `Étoiles d’or : ${nStars} / ${liveCats().length}`));
      const grid = h('div', { class: 'cats' });
      for (const k2 of liveCats()) {
        const label = CATS[k2];
        grid.append(h('button', { class: 'catbtn' + (S.stars[k2] ? ' star' : '') + (isNew(k2) ? ' new' : ''), onclick: () => { cat = k2; P.close(); } },
          h('b', null, label, S.stars[k2] ? h('span', { class: 'gold' }, ' ★') : null),
          h('small', null, catLevelTxt(k2))));
      }
      body.append(grid);
    });
    await P.done;
    if (cat) await series(cat, 5, 0, `Révision : ${CATS[cat]}`, false);
  } else if (o && o.startsWith('Défi')) {
    await say('Le défi du jour : 5 problèmes un peu plus durs. Réussis-en au moins 4 pour une belle récompense !', who);
    const score = await series(null, 5, 1, 'Défi du jour', true);
    if (score !== null) S.daily.hibou = today();
    if (score >= 4) {
      const c = 80 + tier() * 10;
      S.coins += c; addItem('engrais', 2); addXP(50);
      await celebrate({ sound: 'fanfare', title: 'Défi réussi !', lines: [`${score}/5 bonnes réponses`, `+${c} pièces, +2 engrais, +50 XP`], icons: [A.coinURL(), A.iconURL('engrais')] });
    } else if (score !== null) await say(`${score}/5. Pas mal ! Tu pourras retenter demain. Continue à t’entraîner !`, who);
  } else if (o === 'Mes progrès') return carnetPanel('progres');
}
/** "Niveau 2/3", "Maîtrisé", or for calculations how many operations are mastered. */
function catLevelTxt(cat) {
  if (cat === 'calc') { const n = CALC_OPS.filter((o) => isAcquis('calc:' + o)).length; return `${n}/${CALC_OPS.length} opérations maîtrisées`; }
  if (isAcquis(cat)) return 'Maîtrisé';
  return (S.skills || {})[cat] ? `Niveau ${lvTxt(shownLv(cat))}/${capFor(cat)}` : isNew(cat) ? 'Nouvelle notion' : 'Pas encore essayé';
}
async function lessonsPanel(frOnly) {
  let chosen = null;
  const P = panel(frOnly ? 'Leçons de français' : 'Leçons de Maître Hibou', (body) => {
    body.append(h('p', { class: 'small' }, frOnly ? 'Choisis une leçon : Léa t’explique, avec un exemple. Pendant une question, le bouton « Comprendre » ouvre aussi la leçon.' : 'Choisis une leçon : Maître Hibou t’explique, avec un exemple. Pendant un problème, le bouton « Comprendre » ouvre aussi la leçon.'));
    const grid = h('div', { class: 'cats' });
    for (const k of liveSkills()) {
      if (!LESSONS[k] || (frOnly && !isFr(k))) continue;
      grid.append(h('button', { class: 'catbtn' + (isNew(k) ? ' new' : ''), onclick: () => { chosen = k; P.close(); } },
        h('b', null, LESSONS[k].title), h('small', null, isNew(k) ? 'Notion de 8H' : skillTitle(k))));
    }
    body.append(grid);
    const left = NEW_ORDER.length - unlockedConcepts().length;
    if (left && !frOnly) body.append(h('p', { class: 'small' }, `Encore ${left} notion${left > 1 ? 's' : ''} de 8H à découvrir : elles arrivent quand tu maîtrises tes compétences.`));
  });
  await P.done;
  if (chosen) { await showLesson(chosen, false); return lessonsPanel(frOnly); }
}
// ---- Challenge ladder: 30 challenges of 5 problems, each a bit harder, with 1 to 3 stars.
const DEFI_PACKS = [
  ['Le potager', ['calc', 'calc', 'frac']], ['Le marché', ['argent', 'recette', 'calc']], ['Le moulin', ['masse', 'conv', 'calc']],
  ['La boulangerie', ['duree', 'recette', 'enigme']], ['Le pressoir', ['contenance', 'conv']], ['La ferme', ['animaux', 'enigme']],
  ['Le chantier', ['geo', 'figures', 'angles', 'longueur']], ['Les énigmes', ['enigme']], ['Les fractions', ['frac', 'frac', 'calc']],
  ['Le grand mélange', ['calc', 'frac', 'conv', 'masse', 'contenance', 'duree', 'argent', 'geo', 'coord', 'sym', 'angles', 'figures', 'animaux', 'enigme']],
];
const DEFIS = Array.from({ length: 30 }, (_, i) => ({ n: i + 1, name: DEFI_PACKS[i % DEFI_PACKS.length][0], cats: DEFI_PACKS[i % DEFI_PACKS.length][1], level: 1 + Math.floor(i / 6) }));
const defiD = (df) => clamp(Math.round(df.level + (S.settings.grade === 8 ? 0.5 : 0) + (S.settings.diff || 0)), 1, 5);
const starsTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
async function defiLadder() {
  let chosen = null;
  const P = panel('Défis de l’Hibou', (body) => {
    body.append(h('div', { class: 'note owl-rewards' },
      h('b', null, '30 défis de 5 problèmes, de plus en plus durs.'),
      h('span', null, '• 3 bonnes réponses = 1 étoile et le défi suivant s’ouvre'),
      h('span', null, '• 4 = 2 étoiles · 5 = 3 étoiles'),
      h('span', null, '• chaque nouvelle étoile rapporte des pièces, 3 étoiles = un cadeau'),
      h('span', null, '• tu peux rejouer un défi pour gagner plus d’étoiles')));
    const grid = h('div', { class: 'defis' });
    for (const df of DEFIS) {
      const st = S.defis[df.n] || 0, open = df.n === 1 || (S.defis[df.n - 1] || 0) >= 1;
      grid.append(h('button', { class: 'defi' + (open ? '' : ' locked') + (st === 3 ? ' gold' : ''), disabled: !open, onclick: () => { chosen = df; P.close(); } },
        h('b', null, `Défi ${df.n}`), h('small', null, df.name), h('span', { class: 'dstars' }, open ? starsTxt(st) : 'Fermé')));
    }
    body.append(grid);
  });
  await P.done;
  if (!chosen) return;
  const df = chosen, d = defiD(df);
  let score = 0, won = 0;
  for (let i = 0; i < 5; i++) {
    const mix = df.name === 'Le grand mélange' ? [...df.cats, ...unlockedConcepts()] : null;
    const base = mix ? pick(mix) : df.cats[i % df.cats.length];
    const cat = base === 'enigme' || Math.random() < 0.15 ? (Math.random() < 0.5 ? 'enigme' : base) : base;
    const r = await askMath({ cat, d, noSwap: true, title: `Défi ${df.n} · ${df.name} · ${i + 1}/5` });
    if (r.quit) { if (i === 0) return defiLadder(); break; }
    if (r.ok && r.first) { score++; const g = 4 + 2 * d; won += g; addCoins(g); }
    else if (r.ok) { won += 1; addCoins(1); }
  }
  const stars = score >= 5 ? 3 : score === 4 ? 2 : score === 3 ? 1 : 0;
  const before = S.defis[df.n] || 0;
  const lines = [`${score}/5 bonnes réponses · ${starsTxt(stars)}`, `+${won} pièces pendant le défi`];
  const icons = [A.coinURL()];
  addXP(score * 5);
  if (stars > before) {
    S.defis[df.n] = stars;
    const bonus = (stars - before) * (20 + 5 * df.n);
    S.coins += bonus;
    lines.push(`${stars - before} nouvelle${stars - before > 1 ? 's' : ''} étoile${stars - before > 1 ? 's' : ''} : +${bonus} pièces`);
    if (stars === 3) {
      const pool = Object.keys(CROPS).filter((k) => !CROPS[k].rare && CROPS[k].lvl <= S.lvl);
      const seed = pick(pool.slice(-3));
      addItem('graine:' + seed, 3); addItem('engrais', 1);
      lines.push(`Cadeau 3 étoiles : 3 ${CROPS[seed].seedName.toLowerCase()} et 1 engrais`);
      icons.push(A.iconURL('graine:' + seed), A.iconURL('engrais'));
    }
    if (before === 0 && stars >= 1 && df.n < DEFIS.length) lines.push(`Le défi ${df.n + 1} est ouvert !`);
  } else if (stars === 0) lines.push('Il faut 3 bonnes réponses pour gagner une étoile. Réessaie !');
  sfx.coin();
  afterChange();
  await celebrate({ title: stars ? `Défi ${df.n} : ${starsTxt(stars)}` : `Défi ${df.n}`, lines, icons });
  return defiLadder();
}

async function series(cat, n, off, title, mixed) {
  let score = 0, won = 0;
  const pool = ['calc', 'frac', 'conv', 'masse', 'contenance', 'longueur', 'duree', 'recette', 'argent', 'geo', 'coord', 'sym', 'angles', 'figures', 'animaux', 'enigme', 'enigme', ...unlockedConcepts()];
  for (let i = 0; i < n; i++) {
    const c = Array.isArray(cat) ? frPick(cat) : mixed ? pick(pool) : cat;
    // a revision stays on the chosen theme; the daily challenge mixes everything
    const r = await askMath({ cat: c, off, noSwap: !mixed, title: `${title} · ${i + 1}/${n}` });
    if (r.quit) return i === 0 ? null : Array.isArray(cat) ? { score, won } : score;
    const gain = r.ok ? (r.first ? 5 + 3 * Math.max(1, r.d) : 2) : 0;
    if (r.ok && r.first) score++;
    if (gain) { won += gain; addCoins(gain); }
    updateHud();
  }
  if (!mixed && !Array.isArray(cat)) await reviewRewards(cat, score, n, won);
  return Array.isArray(cat) ? { score, won } : score;
}
// What a revision with Maître Hibou brings: coins for each right answer, a surprise seed bag from 3/5,
// a big bonus for 5/5, and a gold star the first time a theme is done perfectly.
async function reviewRewards(cat, score, n, won) {
  const lines = [`+${won} pièces gagnées pendant la révision`];
  const icons = [A.coinURL()];
  const xp = score * 5;
  addXP(xp);
  lines.push(`+${xp} XP`);
  if (score >= 3) {
    const pool = Object.keys(CROPS).filter((k) => !CROPS[k].rare && CROPS[k].lvl <= S.lvl);
    let seed = pick(pool.slice(-4)), q = R(2, 3);
    if (score === n && S.lvl >= 20 && Math.random() < 0.15) { seed = pick(['melon', 'lune']); q = 1; }
    addItem('graine:' + seed, q);
    lines.push(`Sachet surprise : ${q} × ${CROPS[seed].seedName.toLowerCase()}`);
    icons.push(A.iconURL('graine:' + seed));
  }
  if (score === n) {
    const bonus = 40 + tier() * 8;
    S.coins += bonus; addItem('engrais', 1);
    S.stats.perfectReviews = (S.stats.perfectReviews || 0) + 1;
    lines.push(`Sans faute ! Bonus : +${bonus} pièces et 1 engrais`);
    icons.push(A.iconURL('engrais'));
    if (!S.stars[cat]) {
      S.stars[cat] = now();
      S.coins += 100;
      lines.push(`Nouvelle étoile d’or en ${CATS[cat]} ! +100 pièces`);
    }
  }
  sfx.coin();
  afterChange();
  await celebrate({
    title: score === n ? 'Parfait ! 5/5' : `${score}/${n}`,
    lines: [score === n ? 'Tu maîtrises ce thème !' : score >= 3 ? 'Très bien ! Encore un peu d’entraînement.' : 'Courage ! Chaque erreur t’aide à apprendre.', ...lines],
    icons,
    foot: score < n ? 'Réussis 5/5 pour gagner le gros bonus et une étoile d’or.' : null,
  });
}

// ---- Gates
async function onBigRock() {
  if (S.lvl < GATE_LVL.rock) return say(['Un énorme rocher bloque le chemin de la forêt.', `Reviens au niveau ${GATE_LVL.rock} : tu seras assez fort pour le casser ! (Tu es niveau ${S.lvl}.)`]);
  if (!(await confirm('Un énorme rocher… Tu es assez fort pour le casser ! Il faut réussir 3 problèmes de suite.', 'Casser le rocher', 'Plus tard'))) return;
  const rk = await askSeries(['mul', 'mul', 'enigme'], 'Casser le rocher');
  if (!rk.all) return say('Le rocher tient bon. Réessaie, tu vas y arriver !');
  sfx.hit();
  S.flags.rock = true; applyWorldFlags();
  addXP(20);
  await celebrate({ sound: 'discover', title: 'Le chemin est ouvert !', lines: ['La Forêt des Murmures t’attend à l’ouest.', 'Tu y trouveras du bois, des pierres, des coffres… et des créatures !'] });
}
async function onBridge() {
  if (S.lvl < GATE_LVL.bridge) return say(['Le pont du lac est cassé.', `Au niveau ${GATE_LVL.bridge}, tu pourras le réparer avec 10 bois et 5 pierres. (Tu es niveau ${S.lvl}.)`]);
  if (!has('bois', 10) || !has('pierre', 5)) return say([`Pour réparer le pont, il faut 10 bois et 5 pierres.`, `Tu as ${S.inv.bois || 0} bois et ${S.inv.pierre || 0} pierres. La forêt en est pleine !`]);
  if (!(await confirm('Réparer le pont avec 10 bois et 5 pierres ? Il faut calculer les planches !', 'Réparer', 'Plus tard'))) return;
  const r = await askSeries(['longueur', 'enigme'], 'Réparer le pont');
  if (!r.all) return say('Les planches ne sont pas bien coupées… Réessaie !');
  addItem('bois', -10); addItem('pierre', -5);
  S.flags.bridge = true; applyWorldFlags();
  addXP(30);
  await celebrate({ sound: 'discover', title: 'Le pont est réparé !', lines: ['Le Lac Miroir est ouvert.', 'Tom le pêcheur t’attend près du ponton.'] });
}
async function onGuardian() {
  const who = 'Gardien du Mont';
  npcDir.guardian = 'left';
  if (S.flags.guardian) return say(pick(['Les cristaux brillent près des rochers. Bonne chance là-haut !', 'Les créatures de la montagne sont coriaces. Garde ta série !']), who);
  if (S.lvl < GATE_LVL.guardian) return say(['Halte ! Le Mont Givré est dangereux.', `Seuls les calculateurs de niveau ${GATE_LVL.guardian} peuvent passer. Tu es niveau ${S.lvl}. Reviens plus tard !`], who);
  if (!(await confirm('Tu veux passer ? Réussis 4 problèmes difficiles de suite !', 'J’accepte le défi', 'Plus tard', who))) return;
  const gd = await askSeries(['frac', 'conv', pick(['masse', 'contenance', 'duree', 'geo', 'angles']), 'enigme'], 'Défi du gardien', true, 1);
  if (!gd.all) return say('Pas encore… Entraîne-toi et reviens me voir !', who);
  S.flags.guardian = true; applyWorldFlags();
  addXP(60);
  await say('Impressionnant ! Tu peux passer. Le Mont Givré est à toi.', who);
}
async function onAncient() {
  const who = 'Vieil Arbre';
  if (S.lvl < GATE_LVL.arbre) return say(['Un arbre immense dort ici. Il ronfle doucement…', `Peut-être se réveillera-t-il quand tu seras niveau ${GATE_LVL.arbre}.`]);
  const first = !S.flags.arbre;
  const need = first ? 3 : 2;
  if (!first && S.daily.arbre === today()) return say('Hmmm… Je t’ai déjà donné une graine aujourd’hui. Reviens demain, petit jardinier.', who);
  if (!has('cristal', need)) return say([first ? 'Hmmm… Un jeune jardinier ! Apporte-moi 3 cristaux de la montagne…' : 'Apporte-moi 2 cristaux…', '…et je te donnerai une Graine dorée.'], who);
  if (!(await confirm(`Donner ${need} cristaux au Vieil Arbre ? Il te posera ${first ? 3 : 2} énigmes.`, 'Donner', 'Plus tard', who))) return;
  const steps = first ? ['enigme', pick(['frac', 'masse', 'contenance', 'duree', 'argent', 'geo', 'recette']), 'enigme'] : ['enigme', pick(['frac', 'argent', 'recette'])];
  const tr = await askSeries(steps, 'Énigme du Vieil Arbre', true, 1);
  if (!tr.all) return say('Hmmm… pas tout à fait. Garde tes cristaux et reviens quand tu veux.', who);
  addItem('cristal', -need);
  addItem('graine:doree', 1);
  S.flags.arbre = true; S.daily.arbre = today();
  await celebrate({ sound: 'discover', title: 'Graine dorée !', lines: ['Plante-la dans ton potager.', 'Elle donnera un Fruit d’or qui vaut 1200 pièces !'], iconsBig: [A.iconURL('graine:doree', 5)] });
}

// ---- Resources
async function onTree(o) {
  if (respawning(o)) return say(`Une souche. L’arbre repousse… (encore ${fmtTime(S.res[o.id] - now())})`);
  const r = await askSeries([maybeEnigme('add', 0.25)], 'Couper du bois', false);
  if (!r.ok) return;
  const n = 1 + (r.firsts ? 1 : 0) + (S.tools.hache ? 1 : 0); // right the first time: one more piece
  addItem('bois', n); S.stats.bois += n;
  S.res[o.id] = now() + 180000;
  sfx.hit(); addXP(3);
  toast(`+${n} bois`, 'green', [A.iconURL('bois')]);
}
async function onRock(o) {
  if (respawning(o)) return say('Il ne reste que des cailloux. Une nouvelle pierre apparaîtra bientôt.');
  const r = await askSeries([maybeEnigme('mul', 0.25)], 'Casser la pierre', false);
  if (!r.ok) return;
  const n = 1 + (r.firsts ? 1 : 0) + (S.tools.pioche ? 1 : 0);
  addItem('pierre', n); S.stats.pierre += n;
  S.res[o.id] = now() + 200000;
  sfx.hit(); addXP(3);
  toast(`+${n} pierres`, 'green', [A.iconURL('pierre')]);
}
async function onCrystal(o) {
  if (respawning(o)) return say(`Le cristal repousse lentement… (encore ${fmtTime(S.res[o.id] - now())})`);
  const cat = pick(['frac', 'conv', 'masse', 'contenance', 'geo']);
  const r = await askSeries([{ cat, off: 1 }, 'enigme'], 'Récolter un cristal');
  if (!r.all) return;
  addItem('cristal', 1); S.stats.cristal++;
  S.res[o.id] = now() + 360000;
  sfx.harvest(); addXP(10);
  toast('+1 cristal !', 'blue', [A.iconURL('cristal')]);
}
async function onForage(o) {
  if (respawning(o)) return say('Il n’y a plus rien ici. Reviens un peu plus tard.');
  const n = R(1, 2);
  addItem(o.kind, n);
  S.res[o.id] = now() + 150000;
  sfx.harvest();
  toast(`+${qtyName(o.kind, n)}`, 'green', [A.iconURL(o.kind)]);
}
async function onChest(o) {
  if (S.chests[o.chest]) return say('Le coffre est vide.');
  const lock = Math.random() < 0.6 ? 'coord' : 'frac';
  await say(`Un coffre ! Il a deux serrures : ${lock === 'coord' ? 'une carte au trésor' : 'une à fractions'} et une à énigme.`);
  const r = await askSeries([lock, 'enigme'], 'Ouvrir le coffre');
  if (!r.all) return say(r.quit ? 'Tu reviendras plus tard.' : 'La serrure ne s’ouvre pas… Réessaie !');
  const c = CHESTS[o.chest];
  S.chests[o.chest] = true;
  S.coins += c.coins;
  for (const [k, v] of Object.entries(c.items)) addItem(k, v);
  sfx.coin();
  await celebrate({ sound: 'treasure', title: 'Trésor !', lines: [`${c.coins} pièces`, ...Object.entries(c.items).map(([k, v]) => `${v} × ${itemName(k)}`)], icons: [A.coinURL(), ...Object.keys(c.items).map((k) => A.iconURL(k))] });
}
async function onFish() {
  if (!S.tools.canne) return say('Il te faudrait une canne à pêche. Tom le pêcheur en a peut-être une ?');
  const r = await askSeries([maybeEnigme('conv', 0.25)], 'Pêcher', false);
  if (r.quit) return;
  if (!r.ok) return say('Le poisson s’est échappé…');
  const big = r.firsts === 1; // right the first time: the big fish can bite
  const table = [['gardon', 40], ['perche', 30], ['truite', big && S.lvl >= 14 ? 18 : 0], ['brochet', big && S.lvl >= 18 ? 10 : 0], ['carpe', S.lvl >= 24 && big ? 4 : 0]];
  const tot = table.reduce((s, [, w]) => s + w, 0);
  let x = Math.random() * tot, fish = 'gardon';
  for (const [id, w] of table) { if ((x -= w) < 0) { fish = id; break; } }
  addItem(fish, 1); S.stats.fish++;
  addXP(5);
  const kg = (R(3, 25) / 10).toFixed(1).replace('.', ',');
  sfx.harvest();
  toast(`Tu as pêché : ${itemName(fish)} (${kg} kg) !`, 'blue', [A.iconURL(fish)]);
}

// ============================================================ Menu, bag, carnet, options
async function openMenu() {
  if (busy) return;
  busy = true;
  try {
    const k = await choose('Menu', ['Sac', 'Carnet', 'Sauvegarder', 'Options', 'Fermer']);
    if (k === 0) await bagPanel();
    else if (k === 1) await carnetPanel('badges');
    else if (k === 2) await saveMenu();
    else if (k === 3) await optionsPanel();
  } finally { busy = false; }
}
async function bagPanel() {
  await panel('Ton sac', (body) => {
    const groups = [['seed', 'Graines'], ['crop', 'Récoltes'], ['product', 'Produits'], ['resource', 'Ressources']];
    let any = false;
    for (const [kind, label] of groups) {
      const ids = Object.keys(S.inv).filter((id) => ITEMS[id] && ITEMS[id].kind === kind && S.inv[id] > 0);
      if (!ids.length) continue;
      any = true;
      body.append(h('h3', null, label));
      body.append(h('div', { class: 'bag' }, ids.map((id) => h('div', { class: 'slot', title: itemName(id) }, icon(id), h('span', { class: 'n' }, S.inv[id]), h('small', null, itemName(id))))));
    }
    if (!any) body.append(h('p', { class: 'empty' }, 'Ton sac est vide.'));
    const tools = [];
    if (S.tools.arrosoir) tools.push(TOOLS.find((t) => t.id === 'arrosoir' && t.tier === S.tools.arrosoir).name); else tools.push('Arrosoir simple');
    for (const t of TOOLS) if (t.id !== 'arrosoir' && S.tools[t.id]) tools.push(t.name);
    if (S.tools.canne) tools.push('Canne à pêche');
    body.append(h('h3', null, 'Outils'), h('p', { class: 'tools' }, tools.join(' · ')));
  }).done;
}
async function carnetPanel(tab) {
  await panel('Carnet du jardinier', (body, api, t) => {
    if (t === 'badges') {
      body.append(h('div', { class: 'badges' }, BADGES.map((b, i) => h('div', { class: 'badge' + (S.badges[b.id] ? ' on' : '') }, h('img', { src: A.badgeURL(i, b.color, !!S.badges[b.id]) }), h('b', null, b.name), h('small', null, b.desc)))));
    } else if (t === 'creatures') {
      body.append(h('p', { class: 'note' }, `${Object.keys(S.creatures).length} / ${CREATURE_ORDER.length} amis. On les rencontre dans les hautes herbes.`));
      const zones = { ferme: 'Ferme', foret: 'Forêt', lac: 'Lac', montagne: 'Montagne' };
      body.append(h('div', { class: 'dex' }, CREATURE_ORDER.map((id) => {
        const c = CREATURES[id], met = S.creatures[id];
        return h('div', { class: 'mon' + (met ? ' on' : '') }, h('img', { src: A.creatureURL(id, 2, !met) }), h('b', null, met ? c.name : '???'), h('small', null, met ? `${zones[c.zone]} · battu ${met}×` : zones[c.zone]));
      })));
    } else {
      const acc = S.stats.correct + S.stats.wrong ? Math.round((S.stats.correct / (S.stats.correct + S.stats.wrong)) * 100) : 0;
      const nx = nextUnlock(S.lvl);
      body.append(h('div', { class: 'stats' },
        h('div', null, h('b', null, S.stats.correct), h('small', null, 'bonnes réponses')),
        h('div', null, h('b', null, acc + ' %'), h('small', null, 'de réussite')),
        h('div', null, h('b', null, S.stats.maxStreak), h('small', null, 'meilleure série')),
        h('div', null, h('b', null, S.stats.harvests), h('small', null, 'récoltes'))));
      if (nx) body.append(h('p', { class: 'note' }, 'Prochain déblocage — ' + nx));
      body.append(h('h3', null, 'Mes compétences'));
      const tbl = h('div', { class: 'mastery' });
      for (const k of liveSkills()) {
        const s = (S.skills || {})[k], cap = capFor(k), acq = isAcquis(k);
        const lv = s ? Math.min(s.lv, cap) : 0;
        const pct = acq ? 100 : s ? Math.min(95, Math.max(0, Math.round(((lv - 1 + clamp((s.sc || 0) / LEVEL_UP, 0, 1)) / cap) * 100))) : 0;
        tbl.append(h('div', { class: 'mrow' + (acq ? ' acq' : '') }, h('span', { class: 'mlabel' }, skillTitle(k)), h('span', { class: 'mbar' }, h('i', { style: `width:${pct}%` })),
          h('span', { class: 'mpct' }, acq ? 'Maîtrisé' : s ? `Niveau ${lvTxt(lv)}/${cap}` : '—'), h('span', { class: 'stars' }, acq ? '★' : '')));
      }
      body.append(tbl);
      const left = NEW_ORDER.length - unlockedConcepts().length;
      if (left) body.append(h('p', { class: 'note' }, `Encore ${left} notion${left > 1 ? 's' : ''} de 8H à découvrir. Maîtrise d’autres compétences pour les débloquer !`));
      body.append(h('p', { class: 'small' }, `Mode de jeu : ${S.settings.grade === 8 ? 'Dur' : 'Normal'}. Une compétence monte d’un niveau quand tu as bien réussi plusieurs questions (au moins 8), surtout si tu réponds vite. Une erreur la fait redescendre un peu. Une fois maîtrisée, elle revient moins souvent, pour laisser la place à d’autres.`));
    }
  }, { tabs: [['badges', 'Badges'], ['creatures', 'Créatures'], ['progres', 'Progrès']], tab }).done;
}
async function optionsPanel() {
  await panel('Options', (body, api) => {
    body.append(
      h('div', { class: 'opt' }, h('b', null, 'Bruitages'), h('button', { class: 'btn sm' + (S.settings.sound ? '' : ' ghost'), onclick: () => { S.settings.sound = !S.settings.sound; save(); api.refresh(); } }, S.settings.sound ? 'Activés' : 'Coupés')),
      h('div', { class: 'opt' }, h('b', null, 'Musique'), h('button', { class: 'btn sm' + (S.settings.music ? '' : ' ghost'), onclick: () => { S.settings.music = !S.settings.music; save(); unlockAudio(); api.refresh(); } }, S.settings.music ? 'Activée' : 'Coupée')),
      h('div', { class: 'opt' }, h('b', null, 'Espace parents'), h('button', { class: 'btn sm', onclick: () => { parentPanel(); } }, 'Ouvrir')),
      h('div', { class: 'opt' }, h('b', null, 'Prénom'), h('input', { class: 'name', value: S.name, maxlength: 14, onchange: (e) => { S.name = e.target.value.trim() || 'Thibault'; save(); } })),
      syncSection(api),
      h('button', { class: 'btn ghost danger', onclick: async () => {
        if (await confirm('Effacer toute la partie et recommencer ? On ne peut pas revenir en arrière.', 'Oui, tout effacer', 'Non')) {
          // stop saving first: otherwise the page re-saves (or the save code pulls the game back) while reloading
          started = false; clearTimeout(saveTimer); stopSync();
          localStorage.removeItem(SAVE_KEY); location.reload();
        }
      } }, 'Recommencer une nouvelle partie'));
  }).done;
}

// ---- Parent space (4-digit code): class, overall difficulty, and a level or on/off per theme
async function askPin() {
  const creating = !S.settings.pin;
  return new Promise((resolve) => {
    let input, ok = false;
    const msg = h('p', { class: 'small codemsg' });
    const go = () => {
      const v = String(input.value).replace(/\D/g, '');
      if (v.length !== 4) { msg.textContent = 'Le code a 4 chiffres.'; return; }
      if (creating) { S.settings.pin = v; save(); ok = true; P.close(); resolve(true); return; }
      if (v === S.settings.pin) { ok = true; P.close(); resolve(true); return; }
      msg.textContent = 'Ce n’est pas le bon code.'; input.value = '';
    };
    const P = panel('Espace parents', (body) => {
      input = h('input', { class: 'codein', type: 'password', inputmode: 'numeric', maxlength: 4, autocomplete: 'off', placeholder: '••••', onkeydown: (e) => { if (e.key === 'Enter') go(); } });
      body.append(h('p', { class: 'small' }, creating ? 'Choisissez un code parent à 4 chiffres. Il protège les réglages de difficulté.' : 'Code parent (4 chiffres) :'),
        input, h('button', { class: 'btn big', onclick: go }, creating ? 'Créer le code' : 'Entrer'), msg);
      setTimeout(() => input.focus(), 50);
    });
    P.done.then(() => { if (!ok) resolve(false); });
  });
}
/** A problem shown to the parents: the question and its answer. */
function exampleHTML(p) {
  if (p.words) {
    const ok = p.ok || [p.a];
    const s = p.words.map((w, i) => (ok.includes(String(i)) ? '« ' + w + ' »' : w)).join(' ');
    return p.sol ? renderQ(p.q + ' ' + s) + ` <i>→ ${p.sol}</i>` : renderQ(s) + ` <i>→ le mot mal écrit est « ${p.words[Number(p.a)]} »</i>`;
  }
  return renderQ(p.q) + ` <i>→ ${p.choices ? p.a : p.grid ? 'sur la grille' : fmt(p.a) + ' ' + p.u}</i>` + (p.fig || (p.grid ? gridSVG(p.grid, { sol: new Set(String(p.a).split(' ')) }) : ''));
}
const FR_DESC = {
  'fr:gn': 'Déterminant, nom et adjectifs accordés (les petites poules rousses), puis l’attribut (Les poules de la fermière sont contentes) et les pluriels en -x.',
  'fr:sv': 'Le verbe accordé avec son sujet, même quand le sujet est long, éloigné du verbe (Les renards de la forêt mangent), ou placé après lui.',
  'fr:eer': 'Il va manger / il a mangé (le truc de « mordre »), puis -ez, -ait et le participe passé avec être (elles sont arrivées).',
  'fr:homo': 'a/à, et/est, son/sont, on/ont, ces/ses, ou/où, ce/se, leur/leurs.',
  'fr:relire': 'Une phrase de plus en plus longue avec une faute d’accord cachée : il touche le mot mal écrit. C’est là que les fautes arrivent en dictée.',
  'fr:conj': 'Présent, imparfait, futur, passé composé, conditionnel, impératif (7H), puis plus-que-parfait, futur antérieur, passé simple et subjonctif (8H). Aussi : trouver l’infinitif, le groupe, le temps d’un verbe.',
  'fr:nature': 'Il touche le nom, le verbe, le déterminant, l’adjectif, puis le pronom, l’adverbe, la préposition, la conjonction (et en 8H : « le » déterminant ou pronom ?).',
  'fr:fonc': 'Sujet, verbe conjugué, complément du verbe, complément de phrase, attribut du sujet, complément du nom ; types de phrases et phrase négative.',
  'fr:ortho': 'm devant m, b, p ; s / ss ; c / ç ; g / ge / gu ; é, è, ê ; -ail / -aille ; lettres muettes ; -é / -ée / -er ; consonnes doubles (apporter).',
  'fr:voc': 'Contraires, synonymes, mots génériques, ordre alphabétique, familles de mots, préfixes et suffixes, puis registres de langue et expressions.',
};
/** Parent space: switch the French modules on, choose how often they come up, a level or « Auto » for each. */
function frSection(api, examples) {
  const box = h('div', { class: 'frbox' }, h('h3', null, 'Français (modules à activer)'),
    h('p', { class: 'small' }, 'Cochez les modules à travailler (programme romand 7H-8H). Ils viennent dans les actions du jeu, avec une leçon la première fois, et Léa, au village, propose 5 questions avec un cadeau chaque jour.'));
  box.append(h('div', { class: 'opt optcol' }, h('b', null, 'Part du français dans le jeu'),
    h('div', { class: 'diffrow' }, FR_SHARE.map(([label], v) =>
      h('button', { class: 'btn sm' + (frMix() === v ? '' : ' ghost'), onclick: () => { S.settings.frShare = v; save(); api.refresh(); } }, label))),
    h('small', null, 'Le reste du temps, ce sont des maths. Léa propose aussi 5 questions de français par jour, avec un cadeau.')));
  const list = h('div', { class: 'pcats' });
  const head = Object.fromEntries(FR_GROUPS.map(([name, ks]) => [ks[0], name]));
  for (const k of FR_GROUPS.flatMap(([, ks]) => ks)) {
    if (head[k]) list.append(h('h4', { class: 'frgroup' }, head[k]));
    const c = S.settings.cats[k] || {}, mm = S.mastery[k];
    const sel = h('select', { class: 'psel', onchange: (e) => { S.settings.cats[k] = { ...c, lvl: e.target.value === 'auto' ? undefined : Number(e.target.value) }; delete examples[k]; save(); api.refresh(); } },
      h('option', { value: 'auto', selected: c.lvl == null }, 'Auto'),
      [1, 2, 3, 4, 5].map((v) => h('option', { value: v, selected: c.lvl === v }, `Niveau ${v}`)));
    list.append(h('div', { class: 'prow' + (c.on ? '' : ' off') },
      h('label', { class: 'pon' }, h('input', { type: 'checkbox', checked: !!c.on, onchange: (e) => { S.settings.cats[k] = { ...c, on: e.target.checked }; save(); api.refresh(); } }), h('b', null, CATS[k])),
      h('small', { class: 'pstat' }, FR_DESC[k] + ' ' + (c.on ? (fixedLevel(k) ? '' : `Niveau ${lvTxt(shownLv(k))}/${capFor(k)}${isAcquis(k) ? ' · maîtrisé' : ''} · `) + (mm ? `${Math.round((mm.ok / mm.n) * 100)} % réussi · ${mm.n} questions` : 'pas encore essayé') : 'désactivé')),
      sel,
      h('button', { class: 'btn sm ghost', onclick: () => { examples[k] = makeProblem(k, fixedLevel(k) || shownLv(k)); api.refresh(); } }, 'Exemple'),
      examples[k] ? h('div', { class: 'pex', html: exampleHTML(examples[k]) }) : null));
  }
  box.append(list);
  return box;
}
async function parentPanel() {
  if (!(await askPin())) return;
  S.settings.cats = S.settings.cats || {};
  const examples = {};
  await panel('Espace parents', (body, api) => {
    const on = frOn();
    body.append(
      h('p', { class: 'frsum' }, h('b', null, 'Français : '), on.length ? `${on.length} module${on.length > 1 ? 's' : ''} actif${on.length > 1 ? 's' : ''} · ${FR_SHARE[frMix()][1]}` : 'aucun module actif (voir plus bas)'),
      h('div', { class: 'opt' }, h('b', null, 'Mode de jeu'), h('div', null,
        h('button', { class: 'btn sm' + (S.settings.grade === 7 ? '' : ' ghost'), onclick: () => { S.settings.grade = 7; save(); api.refresh(); } }, 'Normal'), ' ',
        h('button', { class: 'btn sm' + (S.settings.grade === 8 ? '' : ' ghost'), onclick: () => { S.settings.grade = 8; save(); api.refresh(); } }, 'Dur'))),
      h('div', { class: 'opt optcol' }, h('b', null, 'Difficulté générale'),
        h('div', { class: 'diffrow' }, DIFF_STEPS.map(([v, label]) => h('button', { class: 'btn sm' + ((S.settings.diff || 0) === v ? '' : ' ghost'), onclick: () => { S.settings.diff = v; save(); api.refresh(); } }, label))),
        h('small', null, 'En « Auto », chaque compétence monte d’un niveau après au moins 8 questions bien réussies (une réponse juste et rapide compte plus qu’une réponse lente, une erreur fait reculer), jusqu’à un plafond (plus haut en mode Dur et avec une difficulté plus élevée). Une fois maîtrisée, elle revient moins souvent et les notions de 8H se débloquent une à une, avec une petite leçon.')),
      frSection(api, examples),
      h('h3', null, 'Par thème'),
      h('p', { class: 'small' }, 'Fixez un niveau de 1 (très facile) à 5 (très difficile), ou laissez « Auto ». Décochez un thème pas encore vu en classe : il ne sera plus demandé. Les notions de 8H peuvent être débloquées à la main.'));
    const list = h('div', { class: 'pcats' });
    for (const [k, label] of Object.entries(CATS)) {
      if (isFr(k)) continue;
      const c = S.settings.cats[k] || {};
      const mm = S.mastery[k];
      const locked = isNew(k) && !(S.concepts || {})[k];
      const max = isNew(k) ? 3 : 5;
      const auto = k === 'calc' ? CALC_OPS.map((o) => `${o === 'add' ? '+' : o === 'sub' ? '−' : o === 'mul' ? '×' : o === 'div' ? '÷' : 'tête'} ${lvTxt(shownLv('calc:' + o))}/${capFor('calc:' + o)}${isAcquis('calc:' + o) ? ' ✓' : ''}`).join(' · ') : `niveau ${lvTxt(shownLv(k))}/${capFor(k)}${isAcquis(k) ? ' · maîtrisé' : ''}`;
      const setLvl = (v) => { S.settings.cats[k] = { ...c, lvl: v === 'auto' ? undefined : Number(v) }; delete examples[k]; save(); api.refresh(); };
      const sel = h('select', { class: 'psel', onchange: (e) => setLvl(e.target.value) },
        h('option', { value: 'auto', selected: c.lvl == null }, 'Auto'),
        Array.from({ length: max }, (_, i) => i + 1).map((v) => h('option', { value: v, selected: c.lvl === v }, `Niveau ${v}`)));
      const exOp = k === 'calc' ? pick(CALC_OPS) : null;
      list.append(h('div', { class: 'prow' + (c.off ? ' off' : '') + (locked ? ' locked' : '') },
        h('label', { class: 'pon' }, h('input', { type: 'checkbox', checked: !c.off, onchange: (e) => { S.settings.cats[k] = { ...c, off: !e.target.checked }; save(); api.refresh(); } }), h('b', null, label, isNew(k) ? h('span', { class: 'p8h' }, ' 8H') : null)),
        h('small', { class: 'pstat' }, locked ? 'pas encore débloquée' : (fixedLevel(k) ? '' : auto + ' · ') + (mm ? `${Math.round((mm.ok / mm.n) * 100)} % réussi · ${mm.n} questions` : 'pas encore essayé')),
        locked ? h('button', { class: 'btn sm', onclick: () => { S.concepts = S.concepts || {}; S.concepts[k] = now(); save(); api.refresh(); } }, 'Débloquer') : sel,
        h('button', { class: 'btn sm ghost', onclick: () => { examples[k] = makeProblem(k, fixedLevel(k) || (exOp ? shownLv('calc:' + exOp) : shownLv(k)), {}, exOp); api.refresh(); } }, 'Exemple'),
        examples[k] ? h('div', { class: 'pex', html: exampleHTML(examples[k]) }) : null));
    }
    body.append(list,
      h('div', { class: 'sync-acts' },
        h('button', { class: 'btn sm ghost', onclick: () => { S.settings.cats = {}; save(); api.refresh(); } }, 'Tout remettre en Auto'),
        h('button', { class: 'btn sm ghost', onclick: () => { S.settings.pin = ''; save(); toast('Code parent effacé : un nouveau sera demandé la prochaine fois.', 'gold'); api.close(); } }, 'Changer le code parent')));
  }).done;
}

// ---- Online save (code), like Lecture Z
function syncSection(api) {
  const s = syncState();
  const box = h('div', { class: 'syncbox' }, h('h3', null, 'Sauvegarde transportable'));
  if (s) {
    box.append(
      h('p', { class: 'small' }, 'Sur un autre appareil, ouvre le jeu, choisis « J’ai un code » et tape :'),
      h('div', { class: 'synccode' }, formatCode(s.code)),
      h('p', { class: 'syncstat' + (s.error ? ' off' : '') }, s.error ? 'Hors ligne : la partie est gardée sur cet appareil et partira en ligne dès que possible.'
        : `Dernière sauvegarde en ligne : ${s.at ? new Date(s.at).toLocaleString('fr-CH', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}.${unsynced() ? ' Tes derniers progrès sont sur cet appareil : ils partent en ligne quand tu quittes le jeu (ou avec « Sauvegarder » dans le menu).' : ''}`),
      h('button', { class: 'btn sm ghost', onclick: async () => {
        if (await confirm('Ne plus synchroniser cet appareil ? La partie reste ici.', 'Oui', 'Non')) { stopSync(); api.refresh(); }
      } }, 'Ne plus synchroniser cet appareil'));
  } else {
    box.append(
      h('p', { class: 'small' }, 'Crée un code pour continuer ta partie sur une tablette, un téléphone ou un ordinateur.'),
      h('div', { class: 'sync-acts' },
        h('button', { class: 'btn sm', onclick: async (e) => {
          e.currentTarget.disabled = true;
          try {
            saveNow();
            const code = await createCode(S);
            await celebrate({ title: 'Ton code', lines: [formatCode(code), 'Note-le bien ! Sur l’autre appareil, choisis « J’ai un code » et tape-le.'], kind: 'code' });
          } catch { toast('Pas de connexion. Réessaie plus tard.', 'red'); }
          api.refresh();
        } }, 'Créer un code'),
        h('button', { class: 'btn sm ghost', onclick: async () => {
          const remote = await askCode(true);
          if (!remote) { api.refresh(); return; }
          api.close();
          adoptRemote(remote, remote.updatedAt);
        } }, 'J’ai déjà un code')));
  }
  return box;
}
/** Ask for a code and fetch its game. Returns the save, or null. */
function askCode(replacing) {
  return new Promise((resolve) => {
    let input, done = false;
    const msg = h('p', { class: 'small codemsg' });
    const go = async () => {
      const code = cleanCode(input.value);
      if (code.length !== 6) { msg.textContent = 'Le code a 6 lettres et chiffres, par exemple K7P-4QX.'; return; }
      msg.textContent = 'Recherche…';
      try {
        const remote = await fetchCode(code);
        if (!remote) { msg.textContent = 'Ce code n’existe pas. Vérifie les lettres.'; return; }
        if (replacing && !(await confirm(`Remplacer la partie de cet appareil (niveau ${S.lvl}) par celle du code (niveau ${remote.lvl}) ?`, 'Oui, remplacer', 'Non'))) return;
        adoptCode(code, remote.updatedAt);
        done = true; P.close(); resolve(remote);
      } catch { msg.textContent = 'Pas de connexion. Réessaie plus tard.'; }
    };
    const P = panel('J’ai un code', (body) => {
      input = h('input', { class: 'codein', maxlength: 8, placeholder: 'K7P-4QX', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', onkeydown: (e) => { if (e.key === 'Enter') go(); } });
      body.append(h('p', { class: 'small' }, 'Tape le code affiché dans les Options de ton autre appareil.'), input, h('button', { class: 'btn big', onclick: go }, 'Récupérer ma partie'), msg);
      setTimeout(() => input.focus(), 50);
    });
    P.done.then(() => { if (!done) resolve(null); });
  });
}

// ============================================================ Battles
const ZONE_BG = {
  ferme: ['#bfe8ff', '#8ed46e', '#5cb446'], foret: ['#a8d8a0', '#4a9a48', '#2e7a3a'],
  lac: ['#b8e0ff', '#7ac8e8', '#58a8d8'], montagne: ['#dfe8f8', '#f0f6ff', '#b8cce8'],
};
function encounterFor(zone) {
  let list = CREATURE_ORDER.filter((id) => CREATURES[id].zone === zone && !CREATURES[id].rare);
  if (zone === 'montagne' && S.lvl >= 28 && Math.random() < 0.08) return 'cristallon';
  if (!list.length) list = ['lapinou'];
  return pick(list);
}
function battleCats(zone) {
  return { ferme: ['calc', 'calc', 'mul'], foret: ['calc', 'frac', 'mul', 'add', 'coord'], lac: ['conv', 'contenance', 'longueur', 'masse', 'calc'], montagne: ['frac', 'masse', 'duree', 'recette', 'argent', 'geo', 'conv', 'angles', 'figures'] }[zone];
}
async function startBattle(zone) {
  if (busy) return;
  busy = true;
  inBattle = true;
  try { await battle(zone, encounterFor(zone)); } finally { inBattle = false; busy = false; afterChange(); }
}
async function battle(zone, id) {
  const c = CREATURES[id];
  sfx.enc();
  const flash = h('div', { class: 'layer flash' });
  const FL = pushLayer(flash, { onKey: () => true });
  await sleep(700);
  popLayer(FL);
  const [sky, g1, g2] = ZONE_BG[zone];
  const foeImg = h('img', { class: 'b-foe-img', src: A.creatureURL(id, 4) });
  const hpBar = h('i');
  const foeInfo = h('div', { class: 'b-info foe win' }, h('div', { class: 'b-name' }, c.name, c.rare ? h('span', { class: 'rare' }, ' ★ rare') : null), h('div', { class: 'b-hp' }, h('span', null, 'PV'), h('span', { class: 'hpbar' }, hpBar)));
  const back = A.canvas(16, 19); A.drawPerson(back.getContext('2d'), 0, 3, 'up', 0, playerLook());
  const meCv = A.canvas(96, 114); const mg = meCv.getContext('2d'); mg.imageSmoothingEnabled = false; mg.drawImage(back, 0, 0, 96, 114);
  const hearts = h('span', { class: 'hearts' });
  const meInfo = h('div', { class: 'b-info me win' }, h('div', { class: 'b-name' }, S.name, h('small', null, ` Niv. ${S.lvl}`)), h('div', { class: 'b-hp' }, h('span', null, 'Énergie'), hearts));
  const field = h('div', { class: 'b-field', style: `--sky:${sky};--g1:${g1};--g2:${g2}` },
    foeInfo, h('div', { class: 'b-foe' }, h('div', { class: 'b-plat' }), foeImg),
    h('div', { class: 'b-me' }, h('div', { class: 'b-plat' }), meCv), meInfo);
  const bottom = h('div', { class: 'b-bottom' });
  const root = h('div', { class: 'layer battle' }, field, bottom);
  const L = pushLayer(root, { onKey: () => false, battle: true });
  let hp = c.hp + 1, energy = 3;
  const maxHp = hp;
  const paint = () => {
    hpBar.style.width = `${(hp / maxHp) * 100}%`;
    hpBar.className = hp / maxHp <= 0.34 ? 'low' : hp / maxHp <= 0.67 ? 'mid' : '';
    hearts.innerHTML = '';
    for (let i = 0; i < 3; i++) hearts.append(h('b', { class: i < energy ? 'on' : '' }, '♥'));
  };
  paint();
  const msg = (text) => new Promise((resolve) => {
    bottom.innerHTML = '';
    const box = h('div', { class: 'dialog win inline' }, h('div', { class: 'dlg-text' }, text), h('div', { class: 'dlg-more' }, '▼'));
    bottom.append(box);
    const prev = { onA: L.onA, onKey: L.onKey };
    const fin = () => { L.onA = prev.onA; L.onKey = prev.onKey; resolve(); };
    L.onA = fin; L.onKey = (e) => { if ([' ', 'Enter', 'e'].includes(e.key)) { fin(); return true; } return false; };
    box.addEventListener('pointerdown', fin, { once: true });
  });
  await msg(`Un ${c.name} sauvage apparaît !${S.creatures[id] ? '' : ' (Nouvelle créature !)'}`);
  const go = await new Promise((resolve) => {
    bottom.innerHTML = '';
    const b1 = h('button', { class: 'btn big', onclick: () => resolve(true) }, 'DÉFIER');
    const b2 = h('button', { class: 'btn big ghost', onclick: () => resolve(false) }, 'FUIR');
    bottom.append(h('div', { class: 'b-menu win' }, h('p', null, `Que fait ${S.name} ?`), h('div', { class: 'b-acts' }, b1, b2)));
    L.onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { resolve(true); return true; } if (e.key === 'Escape') { resolve(false); return true; } return false; };
    L.onA = () => resolve(true); L.onB = () => resolve(false);
  });
  L.onB = null;
  if (!go) { await msg('Tu prends la fuite… en toute sécurité !'); popLayer(L); return; }
  const cats = battleCats(zone);
  const off = c.rare ? 1 : 0;
  while (hp > 0 && energy > 0) {
    const cat = pick(cats);
    const r = await askMath({ cat, off, title: `Attaque contre ${c.name}`, mount: bottom, noQuit: true });
    if (r.ok) {
      hp--; sfx.hit();
      foeImg.classList.remove('hit'); void foeImg.offsetWidth; foeImg.classList.add('hit');
      paint();
      if (hp > 0) await msg(r.first ? `Super calcul ! ${c.name} perd des PV !` : `Touché ! ${c.name} vacille.`);
    } else {
      energy--;
      root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
      paint();
      if (energy > 0) await msg(`${c.name} esquive et te fatigue un peu…`);
    }
  }
  S.stats.battles++;
  if (hp <= 0) {
    foeImg.classList.add('won');
    const first = !S.creatures[id];
    S.creatures[id] = (S.creatures[id] || 0) + 1;
    const coins = c.coins + (first ? c.coins : 0);
    const got = [];
    for (const [it, ch, q] of c.drops) if (Math.random() < ch) { addItem(it, q); got.push(`${q} × ${itemName(it)}`); }
    S.coins += coins; addXP(c.xp + (first ? c.xp : 0));
    await msg(`${c.name} est battu… et devient ton ami !`);
    popLayer(L);
    await celebrate({ sound: 'friend', title: first ? `Nouvel ami : ${c.name} !` : `${c.name} battu !`, lines: [`+${coins} pièces`, ...got], iconsBig: [A.creatureURL(id, 3)] });
  } else {
    await msg(`${c.name} s’enfuit dans les herbes… Tu feras mieux la prochaine fois !`);
    addXP(2);
    popLayer(L);
  }
}

// ============================================================ Rendering
let camX = 0, camY = 0;
function objectiveTarget() {
  const o = curObj();
  if (!o || !o.target) return null;
  if (o.target.startsWith('wild')) { const e = wildEnts.find((w) => w.id === o.target); return e && entShown(e) ? { x: e.x, y: e.y } : null; }
  if (o.target === 'plot') {
    let idx = S.plots.findIndex((p) => p.crop && progress(p) >= 1);
    if (idx < 0 && o.id === 'plant') idx = S.plots.findIndex((p) => p.u && !p.crop);
    if (idx < 0) idx = S.plots.findIndex((p) => p.crop);
    if (idx < 0) idx = 0;
    const pp = plotPos(idx); return { x: pp.x, y: pp.y };
  }
  if (o.target === 'forest') return S.stats.bois ? objById['rock@5,27'] : objById['tree@12,27'];
  if (o.target === 'crystal') return objById['crystal@48,4'];
  if (o.target === 'caisse') return objById['caisse@26,27'];
  const t = objById[o.target];
  if (t && !t.gone) return t;
  return null;
}
function drawObject(o, X, Y, t) {
  switch (o.type) {
    case 'house': return A.drawHouse(ctx, X, Y);
    case 'shop': return A.drawShop(ctx, X, Y, t);
    case 'bld':
      if (!S.built[o.bld]) return A.drawSite(ctx, X, Y, o.w, o.h, t);
      return { moulin: A.drawMill, four: A.drawBakery, pressoir: A.drawPress, serre: A.drawGreenhouse, etable: A.drawBarn, laiterie: A.drawDairy }[o.bld](ctx, X, Y, t);
    case 'caisse': return A.drawCrate(ctx, X, Y);
    case 'mailbox': return A.drawMailbox(ctx, X, Y, S.daily.mail !== today());
    case 'npc': {
      const n = NPCS[o.npc];
      return A.drawPerson(ctx, X, Y, npcDir[o.id] || n.dir, 0, n.look);
    }
    case 'guardian': return A.drawPerson(ctx, X, Y, npcDir.guardian || 'left', 0, NPCS.guardian.look);
    case 'chest': return A.drawChest(ctx, X, Y, S.chests[o.chest]);
    case 'plot': { const p = S.plots[o.plot]; return A.drawPlot(ctx, X, Y, p, progress(p), t, p.u); }
    case 'sign': return A.drawSign(ctx, X, Y);
    case 'board': return A.drawBoard(ctx, X, Y);
    case 'fountain': return A.drawFountain(ctx, X, Y, t);
    case 'owl': return A.drawOwl(ctx, X, Y, t);
    case 'bigrock': return A.drawBigRock(ctx, X, Y);
    case 'brokenbridge': return A.drawBrokenBridge(ctx, X, Y);
    case 'ancient': return A.drawAncient(ctx, X, Y, t, S.lvl >= GATE_LVL.arbre);
    case 'tree': return A.drawChopTree(ctx, X, Y, respawning(o));
    case 'rock': return A.drawRock(ctx, X, Y, respawning(o));
    case 'forage': return A.drawBush(ctx, X, Y, o.kind, respawning(o));
    case 'crystal': return A.drawCrystal(ctx, X, Y, t, respawning(o));
    case 'fishspot': return A.drawFishSpot(ctx, X, Y, t);
    default: return null;
  }
}
const FLAT = new Set(['plot', 'fishspot']);
function drawEnt(e, X, Y, t) {
  A.drawAnimal(ctx, X, Y, e.kind, e.flip, e.frame, t);
  if (e.wild) return;
  const a = animalOf(e);
  if (!a) return;
  const st = aStatus(a);
  if (st === 'occupe') return;
  const bob = Math.round(Math.sin(t * 4 + e.x) * 1), bx = X + 3, by = Y - 12 + bob;
  ctx.fillStyle = '#2c3048'; ctx.fillRect(bx - 1, by - 1, 12, 11);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, 10, 9); ctx.fillRect(bx + 4, by + 9, 2, 2);
  if (st === 'pret') ctx.drawImage(A.itemIcon(ANIMALS[a.kind].out), bx, by - 1, 10, 10);
  else { ctx.fillStyle = '#c03030'; ctx.fillRect(bx + 4, by + 1, 2, 4); ctx.fillRect(bx + 4, by + 6, 2, 2); }
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2a5a2a'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  let tx, ty;
  if (mode === 'title') {
    const k = t * 6;
    tx = 30 * 16 + Math.sin(k / 60) * 200; ty = 24 * 16 + Math.cos(k / 80) * 120;
  } else { tx = pl.px + 8; ty = pl.py + 8; }
  camX = Math.round(clamp(tx - VW / 2, 0, Math.max(0, W * 16 - VW)));
  camY = Math.round(clamp(ty - VH / 2, 0, Math.max(0, H * 16 - VH)));
  if (W * 16 < VW) camX = Math.round((W * 16 - VW) / 2);
  if (H * 16 < VH) camY = Math.round((H * 16 - VH) / 2);
  const x0 = Math.max(0, Math.floor(camX / 16)), y0 = Math.max(0, Math.floor(camY / 16));
  const x1 = Math.min(W - 1, Math.ceil((camX + VW) / 16)), y1 = Math.min(H - 1, Math.ceil((camY + VH) / 16));
  const wf = Math.floor(t * 2.5) % 8;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = tiles[x + y * W];
    const v = Math.floor(A.hash(x, y) * 4);
    const X = x * 16 - camX, Y = y * 16 - camY;
    ctx.drawImage(A.tile(ch, v, wf), X, Y);
    if (ch === 'w') {
      ctx.fillStyle = 'rgba(230,245,255,0.75)';
      const isW = (a, b) => { const c = tileAt(a, b); return c === 'w' || c === 'b' || c === 'k'; };
      if (!isW(x, y - 1)) ctx.fillRect(X, Y, 16, 2);
      if (!isW(x, y + 1)) ctx.fillRect(X, Y + 15, 16, 1);
      if (!isW(x - 1, y)) ctx.fillRect(X, Y, 1, 16);
      if (!isW(x + 1, y)) ctx.fillRect(X + 15, Y, 1, 16);
    }
  }
  // objects + player, sorted by their bottom edge
  const list = [];
  for (const o of objs) {
    if (o.gone) continue;
    if (o.x + o.w < x0 - 2 || o.x > x1 + 1 || o.y + o.h < y0 - 1 || o.y > y1 + 3) continue;
    list.push({ k: FLAT.has(o.type) ? o.y * 16 - 100 : (o.y + o.h) * 16, o });
  }
  if (mode === 'world') list.push({ k: pl.py + 16.5, player: true });
  for (const e of [...wildEnts, ...farmEnts]) {
    if (!entShown(e) || e.px + 16 < camX || e.px > camX + VW || e.py + 16 < camY - 8 || e.py > camY + VH) continue;
    list.push({ k: e.py + 16.2, ent: e });
  }
  list.sort((a, b) => a.k - b.k);
  for (const it of list) {
    if (it.player) A.drawPerson(ctx, pl.px - camX, pl.py - camY, pl.dir, pl.frame, playerLook());
    else if (it.ent) drawEnt(it.ent, it.ent.px - camX, it.ent.py - camY, t);
    else drawObject(it.o, it.o.x * 16 - camX, it.o.y * 16 - camY, t);
  }
  if (mode === 'world') drawGuide(t);
}
function drawGuide(t) {
  const tg = objectiveTarget();
  if (!tg) return;
  const w = tg.w || 1;
  const cx = tg.x * 16 + (w * 16) / 2 - camX, cy = tg.y * 16 - camY;
  const bob = Math.round(Math.sin(t * 5) * 2);
  const onScreen = cx > 4 && cx < VW - 4 && cy > 4 && cy < VH - 4;
  ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 1;
  if (onScreen) {
    const y = cy - 12 + bob;
    ctx.beginPath(); ctx.moveTo(cx - 5, y - 6); ctx.lineTo(cx + 5, y - 6); ctx.lineTo(cx, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    return;
  }
  const px = pl.px + 8 - camX, py = pl.py + 8 - camY;
  const ang = Math.atan2(cy - py, cx - px);
  const m = 22, css = DPR / SCALE; // css px → world px
  const top = 130 * css, bottom = (isTouch() ? 230 : 70) * css;
  const ex = clamp(px + Math.cos(ang) * 1000, m, VW - m), ey = clamp(py + Math.sin(ang) * 1000, top, VH - bottom);
  ctx.save(); ctx.translate(Math.round(ex), Math.round(ey)); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(9 + bob, 0); ctx.lineTo(-5 + bob, -7); ctx.lineTo(-2 + bob, 0); ctx.lineTo(-5 + bob, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ============================================================ Input
const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', z: 'up', q: 'left', W: 'up', S: 'down', A: 'left', D: 'right' };
function pressA() {
  const top = layers[layers.length - 1];
  if (activeMath && (!top || top.math || top.battle)) { activeMath.a(); return; }
  if (top) { if (top.onA) top.onA(); return; }
  if (mode === 'world' && !busy && !pl.moving) interact();
}
/**
 * A tap (or a click) on the map: if what was tapped is right next to the player (or the garden plot he stands on),
 * he turns to it and acts on it, as with A. Returns true if something happened.
 */
function tapAt(clientX, clientY) {
  if (mode !== 'world' || layers.length || busy || pl.moving) return false;
  const r = cv.getBoundingClientRect();
  const tx = Math.floor(((clientX - r.left) * DPR / SCALE + camX) / 16);
  let ty = Math.floor(((clientY - r.top) * DPR / SCALE + camY) / 16);
  let ent = entAt(tx, ty), o = ent ? null : objAt.get(tx + ty * W);
  if (!ent && !o) {
    // people and animals are drawn taller than their tile: a tap on their head lands on the tile above
    const e2 = entAt(tx, ty + 1), o2 = objAt.get(tx + (ty + 1) * W);
    if (e2) { ent = e2; ty++; } else if (o2 && o2.type === 'npc') { o = o2; ty++; } else return false;
  }
  // exactly what was tapped (not what the player faces): the plot under him, or a thing next to him
  const act = async () => {
    busy = true;
    try { await (ent ? (ent.wild ? onWild(ent) : onFarmAnimal(ent)) : handle(o)); } finally { busy = false; afterChange(); }
  };
  if (o && o.type === 'plot' && objAt.get(pl.x + pl.y * W) === o) { act(); return true; }
  for (const [d, [dx, dy]] of Object.entries(DIRS)) {
    const nx = pl.x + dx, ny = pl.y + dy;
    if (ent ? entAt(nx, ny) === ent : objAt.get(nx + ny * W) === o) {
      pl.dir = d;
      act();
      return true;
    }
  }
  return false;
}
function pressB() {
  const top = layers[layers.length - 1];
  if (top) { if (top.onB) top.onB(); return; }
  if (mode === 'world' && !busy) openMenu();
}
addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  const top = layers[layers.length - 1];
  if (top) {
    if (top.onKey && top.onKey(e)) e.preventDefault();
    return;
  }
  if (mode !== 'world') return;
  const d = KEYDIR[e.key];
  if (d) { if (!held.includes(d)) held.push(d); e.preventDefault(); return; }
  if (e.repeat) return;
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); pressA(); }
  else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { e.preventDefault(); pressB(); }
});
addEventListener('keyup', (e) => { const d = KEYDIR[e.key]; if (d) { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); } });
addEventListener('blur', () => { held.length = 0; });

function buildTouch() {
  const pad = h('div', { class: 'dpad' });
  for (const d of ['up', 'left', 'right', 'down']) pad.append(h('span', { class: 'dp ' + d }));
  pad.append(h('span', { class: 'dp mid' }));
  let active = null;
  const setDir = (d) => {
    if (active === d) return;
    if (active) { const i = held.indexOf(active); if (i >= 0) held.splice(i, 1); }
    active = d;
    pad.dataset.dir = d || '';
    if (d && !layers.length) held.push(d);
  };
  const fromEvent = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 10) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
    const d = fromEvent(e);
    const top = layers[layers.length - 1];
    if (top && top.onKey && d) top.onKey({ key: d === 'up' ? 'ArrowUp' : d === 'down' ? 'ArrowDown' : d === 'left' ? 'ArrowLeft' : 'ArrowRight', preventDefault() {} });
    setDir(d);
  });
  pad.addEventListener('pointermove', (e) => { if (active !== undefined && e.buttons) setDir(fromEvent(e)); });
  const end = () => setDir(null);
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  const a = h('button', { class: 'abtn', 'aria-label': 'A' }, 'A');
  const b = h('button', { class: 'bbtn', 'aria-label': 'B' }, 'B');
  a.addEventListener('pointerdown', (e) => { e.preventDefault(); pressA(); });
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); pressB(); });
  // The cross is gone: walking is done by sliding a finger anywhere (setupSwipeStick). Only A and B stay.
  void pad;
  return h('div', { class: 'tctl' }, h('div', { class: 'ab' }, b, a));
}

// Touch anywhere on the game screen and slide: the finger's starting point becomes a floating stick.
// The centre follows the finger when it goes far, so turning around is quick.
function setupSwipeStick() {
  const knob = h('i');
  const ring = h('div', { class: 'joy' }, knob);
  let id = null, ox = 0, oy = 0, dir = null, sx = 0, sy = 0, st = 0, moved = false;
  const set = (d) => {
    if (dir) { const i = held.indexOf(dir); if (i >= 0) held.splice(i, 1); }
    dir = d;
    if (d && !layers.length) held.push(d);
  };
  const place = () => { ring.style.left = ox + 'px'; ring.style.top = oy + 'px'; };
  cv.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || id !== null || mode !== 'world' || layers.length) return;
    e.preventDefault();
    id = e.pointerId; ox = sx = e.clientX; oy = sy = e.clientY; st = performance.now(); moved = false;
    try { cv.setPointerCapture(id); } catch { /* synthetic pointer */ }
    knob.style.transform = '';
    place(); ui.append(ring);
  });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const dist = Math.hypot(dx, dy), FOLLOW = 50, SHOW = 26, DEAD = 12;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) >= DEAD) moved = true;
    if (dist > FOLLOW) { ox = e.clientX - (dx / dist) * FOLLOW; oy = e.clientY - (dy / dist) * FOLLOW; dx = e.clientX - ox; dy = e.clientY - oy; place(); }
    const k = Math.min(1, SHOW / Math.max(1, Math.hypot(dx, dy)));
    knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if (layers.length) { set(null); return; }
    set(dist < DEAD ? null : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null; set(null); ring.remove();
    if (e.type === 'pointerup' && !moved && performance.now() - st < 450) tapAt(e.clientX, e.clientY); // a tap, not a slide
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  // with a mouse (computer), a click on a thing next to the player does the same
  cv.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse' && e.button === 0) tapAt(e.clientX, e.clientY); });
}
setupSwipeStick();
// In a menu or a multiple-choice question on a touch screen, a swipe anywhere moves the highlight (A then validates).
function setupMenuSwipe() {
  let id = null, sx = 0, sy = 0;
  ui.addEventListener('pointerdown', (e) => {
    if (!layers.length || e.pointerType === 'mouse') return;
    if (e.target.closest('button, input, select, textarea, .m-grid, .panel')) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY;
  }, true);
  ui.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return;
    const key = Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 'ArrowDown' : 'ArrowUp') : (dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    sx = e.clientX; sy = e.clientY; // a long swipe moves several steps
  }, true);
  const end = (e) => { if (e.pointerId === id) id = null; };
  ui.addEventListener('pointerup', end, true);
  ui.addEventListener('pointercancel', end, true);
}
setupMenuSwipe();

// ============================================================ Loop & title
let last = performance.now();
let offlineChecked = false;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000);
  last = ts;
  if (mode === 'world') { updatePlayer(dt); if (pendingRemote) applyPendingRemote(); }
  updateEnts(dt);
  render(ts / 1000);
  requestAnimationFrame(loop);
}

function titleScreen() {
  const saved = loadSave();
  S = saved || newState();
  applyWorldFlags();
  const logo = h('div', { class: 'logo' }, h('span', { class: 'l1' }, 'La Vallée'), h('span', { class: 'l2' }, 'des Graines'));
  const sub = h('p', { class: 'tagline' }, 'Cultive, calcule, grandis.');
  const btns = h('div', { class: 'title-btns' });
  const scr = h('div', { class: 'layer title' }, logo, sub, btns, h('p', { class: 'title-foot' }, 'Révisions de maths 7H-8H · Flèches + A, ou l’écran tactile'));
  const L = pushLayer(scr, {
    onKey: (e) => { if (e.key === 'Enter' || e.key === ' ') { btns.querySelector('button')?.click(); return true; } return false; },
    onA: () => btns.querySelector('button')?.click(),
  });
  let current = saved;
  const begin = (state) => {
    S = state;
    started = true;
    lastSig = progressSig(S);
    lastMilestone = milestoneSig(S); lastSent = Date.now(); // the next send waits for a milestone or 10 min
    if (!S.updatedAt) S.updatedAt = now();
    popLayer(L);
    startWorld();
    saveNow();
    if (syncState()) { if (unsynced()) pushSave(S, onRemote, true); pullRemote().then(onRemote); }
  };
  const useCode = async () => {
    const remote = await askCode(false);
    if (!remote) return;
    const st = migrate(remote);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch { /* private mode */ }
    begin(st);
  };
  function mainButtons() {
    btns.innerHTML = '';
    if (current) {
      btns.append(h('button', { class: 'btn big', onclick: () => begin(current) }, `Continuer (Niv. ${current.lvl})`));
      btns.append(h('div', { class: 'row2' },
        h('button', { class: 'btn ghost', onclick: async () => {
          if (await confirm('Commencer une nouvelle partie ? L’ancienne sera effacée sur cet appareil.', 'Oui', 'Non')) { stopSync(); newGame(); }
        } }, 'Nouvelle partie'),
        syncState() ? null : h('button', { class: 'btn ghost', onclick: useCode }, 'J’ai un code')));
    } else {
      btns.append(h('button', { class: 'btn big', onclick: () => newGame() }, 'Nouvelle partie'));
      btns.append(h('button', { class: 'btn ghost', onclick: useCode }, 'J’ai un code'));
    }
  }
  if (!syncState()) mainButtons();
  else {
    // Another device may have played under this code: check first (a few seconds at most), then show « Continuer ».
    btns.append(h('p', { class: 'ask' }, 'Synchronisation…'));
    Promise.race([pullRemote(), new Promise((r) => setTimeout(() => r(null), 5000))]).then((online) => {
      if (started) return;
      const st = syncState();
      const localNew = current && st && (current.updatedAt || 0) !== st.at;
      if (online && !(localNew && progressOf(current) > progressOf(online.save))) {
        current = migrate(online.save);
        current.updatedAt = online.updatedAt;
        markSynced(online.updatedAt);
        S = current; applyWorldFlags();
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(current)); } catch { /* private mode */ }
      }
      mainButtons();
    });
  }
  function newGame() {
    btns.innerHTML = '';
    btns.append(h('p', { class: 'ask' }, 'Choisis ton mode de jeu'),
      h('div', { class: 'row2' },
        h('button', { class: 'btn big', onclick: () => { const s = newState(); s.settings.grade = 7; begin(s); } }, 'Normal'),
        h('button', { class: 'btn big', onclick: () => { const s = newState(); s.settings.grade = 8; begin(s); } }, 'Dur')));
  }
}
function startWorld() {
  mode = 'world';
  pl.x = S.pos.x; pl.y = S.pos.y; pl.dir = S.pos.dir || 'down';
  pl.px = pl.x * 16; pl.py = pl.y * 16;
  applyWorldFlags();
  if (!walkable(pl.x, pl.y) && !(objAt.get(pl.x + pl.y * W)?.type === 'plot')) { pl.x = START.x; pl.y = START.y; pl.px = pl.x * 16; pl.py = pl.y * 16; }
  farmEnts = []; syncFarm();
  ui.append(hud, objBar, menuBtn, buildTouch());
  ensureOrders();
  updateHud(); updateObjective();
  afterChange();
  if (!S.flags.intro) setTimeout(() => toast('Va parler à Mamie Rose : la flèche jaune te montre où aller !', 'gold'), 600);
  else if (!offlineChecked) {
    offlineChecked = true;
    const ripe = S.plots.filter((p) => p.crop && progress(p) >= 1).length;
    if (ripe) setTimeout(() => toast(`${ripe} plante${ripe > 1 ? 's sont prêtes' : ' est prête'} à récolter !`, 'green'), 600);
  }
}

titleScreen();
requestAnimationFrame(loop);

// debug helpers for testing in the console
window.__vallee = {
  get S() { return S; }, get view() { return { SCALE, VW, VH, camX, camY }; },
  get audio() { return { state: AC && AC.state, key: music.key, gain: music.gain && music.gain.gain.value, pos: music.pos }; }, sfx,
  fn: { startBattle, craftPanel, ordersPanel, carnetPanel, bagPanel, onOwl, applyWorldFlags, saveNow, barnPanel, syncFarm, askMath, pickSkill, levelFor, isAcquis, lessonsPanel, parentPanel, say, choose, addXP, onLea },
  ents: () => ({ wildEnts, farmEnts }),
  step(n = 1) { for (let i = 0; i < n; i++) { if (mode === 'world') updatePlayer(1 / 60); } render(performance.now() / 1000); },
  world, pl, walkable, objById, objAt: () => objAt };
