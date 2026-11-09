/**
 * Love Matrix ses motoru — tek AudioContext, tarayıcıda üretilen phonk + arayüz sesleri.
 * Dış dosya yok. Müzik sayfalar arası geçişte (client navigation) kesilmeden çalmaya devam eder.
 *
 * Phonk: 140 BPM, Fa minör. 808 bas (glide + saturasyon), punch'lı kick, clap+snare, swing'li hi-hat,
 * 808 cowbell melodisi (dotted delay + reverb), yan zincirli (sidechain) pad, plak cızırtısı.
 * Sesli okuma sırasında müzik belirgin şekilde kısılır (duck).
 */

export const BPM = 140;
export const SPB = 60 / BPM; // saniye / vuruş
export const S16 = SPB / 4; // saniye / 16'lık
export const BAR = SPB * 4;

type Graph = {
  ctx: BaseAudioContext;
  music: GainNode; // müzik girişi (filtreden önce)
  filter: BiquadFilterNode;
  pad: GainNode; // sidechain'li pad otobüsü
  rev: GainNode; // reverb gönderimi
  dly: GainNode; // delay gönderimi
  noise: AudioBuffer;
  soft: Float32Array<ArrayBuffer>;
  hard: Float32Array<ArrayBuffer>;
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function curve(k: number): Float32Array<ArrayBuffer> {
  const n = 2048;
  const c = new Float32Array(new ArrayBuffer(n * 4));
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * k) / norm;
  }
  return c;
}

function makeNoise(ctx: BaseAudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 1.5);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function makeImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const pre = Math.floor(ctx.sampleRate * 0.012);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / (len - pre);
      // basit tek kutuplu alçak geçiren: kuyruk zamanla kararır (gerçek oda gibi)
      const a = 0.25 + 0.7 * t;
      lp = lp * a + (Math.random() * 2 - 1) * (1 - a);
      d[i] = lp * Math.pow(1 - t, 2.6) * 1.6;
    }
  }
  return b;
}

/** Müzik grafiğini kurar; dest: müziğin bağlanacağı düğüm. */
function makeGraph(ctx: BaseAudioContext, dest: AudioNode): Graph {
  const music = ctx.createGain();
  music.gain.value = 1;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 18000;
  filter.Q.value = 0.6;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 28;
  music.connect(filter);
  filter.connect(hp);
  hp.connect(dest);

  const pad = ctx.createGain();
  pad.gain.value = 1;
  pad.connect(music);

  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(ctx, 2.4);
  const rev = ctx.createGain();
  rev.gain.value = 1;
  const revRet = ctx.createGain();
  revRet.gain.value = 0.32;
  rev.connect(conv);
  conv.connect(revRet);
  revRet.connect(music);

  const dly = ctx.createGain();
  dly.gain.value = 1;
  const d = ctx.createDelay(2);
  d.delayTime.value = S16 * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.34;
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 3200;
  const dRet = ctx.createGain();
  dRet.gain.value = 0.5;
  dly.connect(d);
  d.connect(tone);
  tone.connect(fb);
  fb.connect(d);
  tone.connect(dRet);
  dRet.connect(music);

  return { ctx, music, filter, pad, rev, dly, noise: makeNoise(ctx), soft: curve(2.2), hard: curve(4.5) };
}

/* ───────────────────────── Enstrümanlar ───────────────────────── */

function adsr(p: AudioParam, t: number, peak: number, attack: number, decay: number) {
  p.setValueAtTime(0.0001, t);
  p.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  p.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noiseSrc(g: Graph, t: number, dur: number): AudioBufferSourceNode {
  const s = g.ctx.createBufferSource();
  s.buffer = g.noise;
  s.start(t, Math.random() * 0.8);
  s.stop(t + dur + 0.05);
  return s;
}

function send(g: Graph, node: AudioNode, revAmt: number, dlyAmt = 0) {
  if (revAmt > 0) {
    const r = g.ctx.createGain();
    r.gain.value = revAmt;
    node.connect(r);
    r.connect(g.rev);
  }
  if (dlyAmt > 0) {
    const d = g.ctx.createGain();
    d.gain.value = dlyAmt;
    node.connect(d);
    d.connect(g.dly);
  }
}

function kick(g: Graph, t: number, vel = 1) {
  const c = g.ctx;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(170, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
  const sh = c.createWaveShaper();
  sh.curve = g.soft;
  const a = c.createGain();
  a.gain.setValueAtTime(0.0001, t);
  a.gain.linearRampToValueAtTime(0.95 * vel, t + 0.002);
  a.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(sh);
  sh.connect(a);
  a.connect(g.music);
  o.start(t);
  o.stop(t + 0.5);
  // tık (beater)
  const n = noiseSrc(g, t, 0.02);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2200;
  const ng = c.createGain();
  adsr(ng.gain, t, 0.28 * vel, 0.001, 0.012);
  n.connect(hp);
  hp.connect(ng);
  ng.connect(g.music);
  // sidechain: pad kick'te nefes alır
  g.pad.gain.cancelScheduledValues(t);
  g.pad.gain.setValueAtTime(0.18, t);
  g.pad.gain.setTargetAtTime(1, t + 0.03, 0.11);
}

function bass808(g: Graph, t: number, midi: number, dur: number, glideFrom?: number) {
  const c = g.ctx;
  const f = mtof(midi);
  const o = c.createOscillator();
  o.type = "sine";
  if (glideFrom !== undefined) {
    o.frequency.setValueAtTime(mtof(glideFrom), t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.075);
  } else {
    o.frequency.setValueAtTime(f * 1.9, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
  }
  const sh = c.createWaveShaper();
  sh.curve = g.hard;
  sh.oversample = "2x";
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1100;
  const a = c.createGain();
  const end = t + Math.max(0.12, dur);
  a.gain.setValueAtTime(0.0001, t);
  a.gain.linearRampToValueAtTime(0.4, t + 0.004);
  a.gain.setValueAtTime(0.4, Math.max(t + 0.005, end - 0.08));
  a.gain.exponentialRampToValueAtTime(0.0001, end + 0.06);
  o.connect(sh);
  sh.connect(lp);
  lp.connect(a);
  a.connect(g.music);
  o.start(t);
  o.stop(end + 0.1);
}

function clap(g: Graph, t: number, vel = 1) {
  const c = g.ctx;
  const out = c.createGain();
  out.gain.value = vel;
  out.connect(g.music);
  send(g, out, 0.45);
  for (let k = 0; k < 4; k++) {
    const tk = t + k * 0.0095;
    const n = noiseSrc(g, tk, 0.25);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1250;
    bp.Q.value = 1.1;
    const ng = c.createGain();
    adsr(ng.gain, tk, k === 3 ? 0.55 : 0.4, 0.001, k === 3 ? 0.16 : 0.012);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(out);
  }
  // snare gövdesi + teli
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(230, t);
  o.frequency.exponentialRampToValueAtTime(175, t + 0.05);
  const og = c.createGain();
  adsr(og.gain, t, 0.3, 0.001, 0.09);
  o.connect(og);
  og.connect(out);
  o.start(t);
  o.stop(t + 0.15);
  const n2 = noiseSrc(g, t, 0.22);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2500;
  const n2g = c.createGain();
  adsr(n2g.gain, t, 0.22, 0.001, 0.15);
  n2.connect(hp);
  hp.connect(n2g);
  n2g.connect(out);
}

function hat(g: Graph, t: number, vel: number, open = false, pan = 0) {
  const c = g.ctx;
  const n = noiseSrc(g, t, open ? 0.35 : 0.06);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7400;
  const pk = c.createBiquadFilter();
  pk.type = "peaking";
  pk.frequency.value = 10500;
  pk.gain.value = 5;
  const a = c.createGain();
  adsr(a.gain, t, vel, 0.0008, open ? 0.24 : 0.032);
  n.connect(hp);
  hp.connect(pk);
  pk.connect(a);
  if (typeof c.createStereoPanner === "function") {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    a.connect(p);
    p.connect(g.music);
  } else a.connect(g.music);
}

function cowbell(g: Graph, t: number, midi: number, vel: number) {
  const c = g.ctx;
  const f = mtof(midi);
  const mix = c.createGain();
  mix.gain.value = 0.5;
  for (const ratio of [1, 1.4815]) {
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = f * ratio;
    o.connect(mix);
    o.start(t);
    o.stop(t + 0.5);
  }
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = f * 1.65;
  bp.Q.value = 2.4;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 420;
  const a = c.createGain();
  a.gain.setValueAtTime(0.0001, t);
  a.gain.exponentialRampToValueAtTime(vel, t + 0.0015);
  a.gain.exponentialRampToValueAtTime(vel * 0.32, t + 0.035);
  a.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  mix.connect(bp);
  bp.connect(hp);
  hp.connect(a);
  a.connect(g.music);
  send(g, a, 0.3, 0.38);
}

function padChord(g: Graph, t: number, notes: number[], dur: number) {
  const c = g.ctx;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(700, t);
  lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.5);
  lp.frequency.linearRampToValueAtTime(900, t + dur);
  lp.Q.value = 0.4;
  const a = c.createGain();
  a.gain.setValueAtTime(0.0001, t);
  a.gain.linearRampToValueAtTime(0.05, t + 0.45);
  a.gain.setValueAtTime(0.05, t + dur - 0.3);
  a.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
  for (const m of notes) {
    for (const det of [-9, 9]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = mtof(m);
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.3);
    }
  }
  lp.connect(a);
  a.connect(g.pad);
  send(g, a, 0.6);
}

function riser(g: Graph, t: number, dur: number) {
  const c = g.ctx;
  const n = noiseSrc(g, t, dur);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.6;
  bp.frequency.setValueAtTime(320, t);
  bp.frequency.exponentialRampToValueAtTime(7500, t + dur);
  const a = c.createGain();
  a.gain.setValueAtTime(0.0001, t);
  a.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.96);
  a.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(bp);
  bp.connect(a);
  a.connect(g.music);
  send(g, a, 0.5);
}

function impact(g: Graph, t: number) {
  const c = g.ctx;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(32, t + 0.7);
  const a = c.createGain();
  adsr(a.gain, t, 0.85, 0.003, 1.3);
  o.connect(a);
  a.connect(g.music);
  o.start(t);
  o.stop(t + 1.5);
  const n = noiseSrc(g, t, 1.4);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(6000, t);
  lp.frequency.exponentialRampToValueAtTime(500, t + 1.2);
  const na = c.createGain();
  adsr(na.gain, t, 0.24, 0.002, 1.2);
  n.connect(lp);
  lp.connect(na);
  na.connect(g.music);
  send(g, na, 0.8);
}

function crackle(g: Graph, t: number) {
  const c = g.ctx;
  const n = noiseSrc(g, t, 0.01);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800 + Math.random() * 2500;
  const a = c.createGain();
  adsr(a.gain, t, 0.025 + Math.random() * 0.04, 0.0005, 0.004);
  n.connect(bp);
  bp.connect(a);
  a.connect(g.music);
}

/* ───────────────────────── Düzenleme ───────────────────────── */

// Fa minör: Fm · Db · Eb · Cm (her akor 2 ölçü)
const ROOTS = [41, 37, 39, 36]; // F2, Db2, Eb2, C2 (telefon hoparlöründe de duyulsun diye bir oktav yukarıda)
const CHORDS = [
  [53, 56, 60, 65],
  [49, 53, 56, 61],
  [51, 55, 58, 63],
  [48, 51, 55, 60],
];
// cowbell melodisi (2 ölçü = 32 adım), Fa4'e (65) göre yarım ton
const BELL: Record<number, number> = {
  0: 12, 2: 12, 3: 15, 5: 12, 6: 19, 8: 17, 10: 15, 11: 17, 12: 15, 14: 12,
  16: 12, 18: 12, 19: 15, 21: 12, 22: 20, 24: 19, 26: 17, 27: 19, 28: 22, 30: 19,
};
// 808: adım → [köke göre yarım ton, uzunluk (16'lık), glide başlangıcı?]
type BassNote = [number, number, number?];
const BASS_A: Record<number, BassNote> = { 0: [0, 6], 7: [0, 3], 10: [0, 4], 14: [3, 2, 0] };
const BASS_B: Record<number, BassNote> = { 0: [0, 6], 7: [0, 3], 10: [12, 3, 0], 13: [0, 3] };
const KICK_A = new Set([0, 7, 10]);
const KICK_B = new Set([0, 7, 10, 13]);
const HAT_VEL = [0.075, 0.035, 0.055, 0.035];

/** Mutlak 16'lık adımı t anına yerleştirir. introBars: davulsuz, filtreli giriş ölçüsü sayısı. */
function scheduleStep(g: Graph, step: number, t: number, introBars: number) {
  const bar = Math.floor(step / 16);
  const s = step % 16;
  const songBar = bar - introBars;
  const chordIdx = songBar < 0 ? 0 : Math.floor(songBar / 2) % 4;
  const swing = s % 2 === 1 ? S16 * 0.09 : 0;
  const ts = t + swing;

  // pad
  if (s === 0) {
    if (songBar < 0 && bar === 0) padChord(g, t, CHORDS[0], introBars * BAR);
    else if (songBar >= 0 && songBar % 2 === 0) padChord(g, t, CHORDS[chordIdx], 2 * BAR);
  }
  // cowbell (girişte de çalar)
  const mi = (bar % 2) * 16 + s;
  const fill = songBar >= 0 && songBar % 8 === 7;
  if (BELL[mi] !== undefined && !(fill && s >= 12)) cowbell(g, ts, 65 + BELL[mi], songBar < 0 ? 0.12 : 0.15);

  // plak cızırtısı
  if (Math.random() < 0.22) crackle(g, t + Math.random() * S16);

  if (songBar < 0) {
    if (bar === introBars - 1 && s === 0) riser(g, t, BAR);
    if (s % 4 === 0 && bar === introBars - 1) hat(g, t, 0.03 + (s / 16) * 0.05);
    return;
  }
  if (songBar === 0 && s === 0) impact(g, t);

  const isB = songBar % 2 === 1;
  const root = ROOTS[chordIdx];
  const bassMap = isB ? BASS_B : BASS_A;
  const kicks = isB ? KICK_B : KICK_A;
  const bn = bassMap[s];
  if (bn && !(fill && s >= 13)) bass808(g, ts, root + bn[0], bn[1] * S16, bn[2] !== undefined ? root + bn[2] : undefined);
  if (kicks.has(s) && !(fill && s >= 13)) kick(g, ts, s === 0 ? 1 : 0.85);

  // clap 2 ve 4'te; dolguda 32'lik trampet
  if (s === 4 || s === 12) clap(g, ts, 1);
  if (fill && s >= 12) {
    clap(g, t, 0.35 + (s - 12) * 0.12);
    clap(g, t + S16 / 2, 0.4 + (s - 12) * 0.12);
  }

  // hi-hat: 16'lıklar, B ölçülerinde son çeyrekte triole roll
  if (isB && s >= 12) {
    for (let k = 0; k < 3; k++) hat(g, t + (k * S16) / 3, 0.045 + k * 0.01, false, (k - 1) * 0.25);
  } else if (!isB && s === 14) {
    hat(g, ts, 0.06, true, 0.2);
  } else {
    hat(g, ts, HAT_VEL[s % 4] * (0.85 + Math.random() * 0.3), false, (Math.random() - 0.5) * 0.3);
  }
}

/* ───────────────────────── Canlı motor ───────────────────────── */

type Live = {
  ac: AudioContext;
  master: GainNode;
  sfx: GainNode;
  g: Graph;
  level: GainNode; // müzik seviyesi (duck burada)
};

let L: Live | null = null;
let playing = false;
let timer: number | null = null;
let nextStep = 0;
let t0 = 0;
let intro = 0;
let ducked = false;
const listeners = new Set<() => void>();

const MUSIC_LEVEL = 0.62;
const DUCK_LEVEL = 0.13;

function emit() {
  listeners.forEach((fn) => fn());
}

export function onAudioChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Kullanıcı etkileşimi içinde çağrılmalı (tarayıcı kuralı). */
export function ensureAudio(): Live | null {
  if (typeof window === "undefined") return null;
  if (L) {
    if (L.ac.state === "suspended" && !document.hidden) void L.ac.resume().catch(() => {});
    return L;
  }
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ac = new Ctor({ latencyHint: "interactive" });
  const glue = ac.createDynamicsCompressor();
  glue.threshold.value = -14;
  glue.knee.value = 8;
  glue.ratio.value = 3;
  glue.attack.value = 0.006;
  glue.release.value = 0.18;
  const limit = ac.createDynamicsCompressor();
  limit.threshold.value = -2;
  limit.knee.value = 0;
  limit.ratio.value = 20;
  limit.attack.value = 0.001;
  limit.release.value = 0.06;
  const master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(glue);
  glue.connect(limit);
  limit.connect(ac.destination);
  const level = ac.createGain();
  level.gain.value = 0;
  level.connect(master);
  const sfx = ac.createGain();
  sfx.gain.value = 0.6;
  sfx.connect(master);
  const g = makeGraph(ac, level);
  L = { ac, master, sfx, g, level };
  document.addEventListener("visibilitychange", () => {
    if (!L) return;
    if (document.hidden) void L.ac.suspend().catch(() => {});
    else if (playing) void L.ac.resume().catch(() => {});
  });
  return L;
}

function schedule() {
  if (!L) return;
  const horizon = L.ac.currentTime + 0.14;
  while (t0 + nextStep * S16 < horizon) {
    scheduleStep(L.g, nextStep, t0 + nextStep * S16, intro);
    nextStep++;
  }
}

/**
 * Müziği başlatır. introBars: davulsuz giriş ölçüsü (0 = doğrudan drop).
 * Dönüş: 0. vuruşun AudioContext zamanı.
 */
export function startMusic(introBars = 2): number | null {
  const live = ensureAudio();
  if (!live) return null;
  if (playing) return t0;
  const now = live.ac.currentTime;
  intro = introBars;
  t0 = now + 0.08;
  nextStep = 0;
  playing = true;
  const f = live.g.filter.frequency;
  f.cancelScheduledValues(now);
  if (introBars > 0) {
    f.setValueAtTime(380, now);
    f.setValueAtTime(380, t0 + (introBars - 1) * BAR);
    f.exponentialRampToValueAtTime(2600, t0 + introBars * BAR - 0.05);
    f.setValueAtTime(18000, t0 + introBars * BAR);
  } else f.setValueAtTime(18000, now);
  const lv = live.level.gain;
  lv.cancelScheduledValues(now);
  lv.setValueAtTime(lv.value, now);
  lv.linearRampToValueAtTime(ducked ? DUCK_LEVEL : MUSIC_LEVEL, now + 0.3);
  schedule();
  timer = window.setInterval(schedule, 25);
  emit();
  return t0;
}

export function stopMusic() {
  if (!L || !playing) return;
  playing = false;
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  const now = L.ac.currentTime;
  const f = L.g.filter.frequency;
  f.cancelScheduledValues(now);
  f.setValueAtTime(Math.min(18000, f.value), now);
  f.exponentialRampToValueAtTime(300, now + 0.5);
  const lv = L.level.gain;
  lv.cancelScheduledValues(now);
  lv.setValueAtTime(lv.value, now);
  lv.linearRampToValueAtTime(0, now + 0.6);
  emit();
}

export const isMusicPlaying = () => playing;

/** Müzik çalıyorsa 0. vuruştan beri geçen vuruş (çıkış gecikmesi düzeltilmiş), yoksa null. */
export function musicBeat(): number | null {
  if (!L || !playing) return null;
  const lat = (L.ac as AudioContext & { outputLatency?: number }).outputLatency || L.ac.baseLatency || 0;
  return (L.ac.currentTime - lat - t0) / SPB;
}

export const musicIntroBars = () => intro;

/** Kalp atışı fazı (0..1): müzik varsa her 2 vuruşta bir, yoksa 70 BPM. */
export function heartPhase(perfSec: number): number {
  const b = musicBeat();
  if (b !== null) return (((b / 2) % 1) + 1) % 1;
  return (perfSec / (60 / 70)) % 1;
}

/** "lub-dub" zarfı. */
export function heartbeatEnvelope(p: number): number {
  const a = Math.exp(-Math.pow(p / 0.05, 2)) + Math.exp(-Math.pow((p - 1) / 0.05, 2));
  return a + 0.62 * Math.exp(-Math.pow((p - 0.17) / 0.055, 2));
}

export function duck(on: boolean) {
  ducked = on;
  if (!L || !playing) return;
  const now = L.ac.currentTime;
  const lv = L.level.gain;
  lv.cancelScheduledValues(now);
  lv.setTargetAtTime(on ? DUCK_LEVEL : MUSIC_LEVEL, now, on ? 0.06 : 0.35);
}

/* ───────────────────────── Müzik tercihi ───────────────────────── */

const PREF = "lm-music";
export function musicPreferred(): boolean {
  try {
    return localStorage.getItem(PREF) !== "off";
  } catch {
    return true;
  }
}
export function setMusicPreferred(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? "on" : "off");
  } catch {
    /* depolama kapalı olabilir */
  }
}

/* ───────────────────────── Arayüz sesleri ───────────────────────── */

export type Sfx = "key" | "enter" | "error" | "access" | "hit" | "whoosh" | "heartbeat" | "tick" | "blip" | "count" | "word" | "beat" | "gag";

export function sfx(kind: Sfx) {
  const live = ensureAudio();
  if (!live) return;
  const c = live.ac;
  const t = c.currentTime + 0.005;
  const out = live.sfx;
  const tone = (type: OscillatorType, f0: number, f1: number, dur: number, peak: number, at = 0) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t + at);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + at + dur);
    const a = c.createGain();
    adsr(a.gain, t + at, peak, 0.002, dur);
    o.connect(a);
    a.connect(out);
    o.start(t + at);
    o.stop(t + at + dur + 0.05);
  };
  const hiss = (freq: number, type: BiquadFilterType, dur: number, peak: number, at = 0) => {
    const s = c.createBufferSource();
    s.buffer = live.g.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const a = c.createGain();
    adsr(a.gain, t + at, peak, 0.001, dur);
    s.connect(f);
    f.connect(a);
    a.connect(out);
    s.start(t + at, Math.random());
    s.stop(t + at + dur + 0.05);
  };
  switch (kind) {
    case "key":
      hiss(3800 + Math.random() * 1500, "bandpass", 0.018, 0.12);
      tone("square", 1900 + Math.random() * 300, 1500, 0.012, 0.012);
      break;
    case "enter":
      hiss(2400, "bandpass", 0.03, 0.18);
      tone("sine", 880, 660, 0.06, 0.08);
      break;
    case "error":
      tone("sawtooth", 180, 120, 0.22, 0.07);
      tone("sawtooth", 185, 118, 0.22, 0.05);
      break;
    case "access":
      [72, 76, 79, 84].forEach((m, i) => tone("sine", mtof(m), mtof(m), 0.5, 0.09, i * 0.075));
      hiss(9000, "highpass", 0.4, 0.04);
      break;
    case "hit":
      tone("sine", 140, 38, 0.45, 0.5);
      hiss(1600, "lowpass", 0.25, 0.12);
      break;
    case "whoosh": {
      const s = c.createBufferSource();
      s.buffer = live.g.noise;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(5000, t + 0.35);
      const a = c.createGain();
      a.gain.setValueAtTime(0.0001, t);
      a.gain.exponentialRampToValueAtTime(0.14, t + 0.2);
      a.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      s.connect(f);
      f.connect(a);
      a.connect(out);
      s.start(t, Math.random());
      s.stop(t + 0.5);
      break;
    }
    case "heartbeat":
      tone("sine", 120, 42, 0.26, 0.55);
      tone("sine", 110, 40, 0.24, 0.38, 0.17);
      break;
    case "tick":
      tone("sine", 1200, 1200, 0.03, 0.05);
      break;
    case "blip":
      tone("sine", 1300, 560, 0.08, 0.16);
      break;
    /* ── orijinal hikâye sesleri (8524b64) ── */
    case "count": {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 350;
      const a = c.createGain();
      a.gain.setValueAtTime(0, t);
      a.gain.linearRampToValueAtTime(0.5, t + 0.04);
      a.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      for (const [type, f0, f1] of [["sawtooth", 160, 40], ["triangle", 80, 20]] as const) {
        const o = c.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + 0.7);
        o.connect(f);
        o.start(t);
        o.stop(t + 0.75);
      }
      f.connect(a);
      a.connect(out);
      break;
    }
    case "word": {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(490, t + 0.12);
      const a = c.createGain();
      a.gain.setValueAtTime(0.12, t);
      a.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(a);
      a.connect(out);
      o.start(t);
      o.stop(t + 0.12);
      break;
    }
    case "beat": {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(58, t);
      const a = c.createGain();
      a.gain.setValueAtTime(0.4, t);
      a.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(a);
      a.connect(out);
      o.start(t);
      o.stop(t + 0.2);
      break;
    }
    case "gag": {
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(800, t);
      f.frequency.linearRampToValueAtTime(550, t + 0.4);
      f.Q.setValueAtTime(4, t);
      const a = c.createGain();
      a.gain.setValueAtTime(0, t);
      a.gain.linearRampToValueAtTime(0.45, t + 0.18);
      a.gain.linearRampToValueAtTime(0.3, t + 0.35);
      a.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      for (const [type, f0, f1] of [["triangle", 420, 240], ["sine", 425, 245]] as const) {
        const o = c.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + 0.5);
        o.connect(f);
        o.start(t);
        o.stop(t + 0.65);
      }
      f.connect(a);
      a.connect(out);
      break;
    }
  }
}

/* ───────────────────────── Test kancası ───────────────────────── */

/** Çevrimdışı render (yalnızca test/önizleme için): verilen ölçü sayısını bir OfflineAudioContext'e yazar. */
export function renderPhonk(ctx: BaseAudioContext, dest: AudioNode, bars: number, introBars = 2) {
  const g = makeGraph(ctx, dest);
  const start = 0.05;
  if (introBars > 0) {
    g.filter.frequency.setValueAtTime(380, 0);
    g.filter.frequency.setValueAtTime(380, start + (introBars - 1) * BAR);
    g.filter.frequency.exponentialRampToValueAtTime(2600, start + introBars * BAR - 0.05);
    g.filter.frequency.setValueAtTime(18000, start + introBars * BAR);
  }
  for (let s = 0; s < bars * 16; s++) scheduleStep(g, s, start + s * S16, introBars);
}
