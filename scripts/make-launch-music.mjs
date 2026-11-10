import fs from 'node:fs'
import path from 'node:path'

const SR = 48000
const DURATION = 44.5
const N = Math.ceil(SR * DURATION)
const L = new Float32Array(N)
const R = new Float32Array(N)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12)
const beat = 0.6
const bar = beat * 4

function panGains(pan) {
  const p = clamp(pan, -1, 1)
  return [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)]
}

function addSample(i, value, pan = 0) {
  if (i < 0 || i >= N) return
  const [gl, gr] = panGains(pan)
  L[i] += value * gl
  R[i] += value * gr
}

function envelope(t, dur, attack, release, curve = 1) {
  if (t < 0 || t > dur) return 0
  const a = attack > 0 ? Math.min(1, t / attack) : 1
  const r = release > 0 ? Math.min(1, (dur - t) / release) : 1
  return Math.pow(Math.max(0, Math.min(a, r)), curve)
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t)
}

function triangle(freq, t) {
  const phase = (freq * t) % 1
  return 4 * Math.abs(phase - 0.5) - 1
}

function saw(freq, t) {
  const phase = (freq * t) % 1
  return 2 * phase - 1
}

function addPad(start, dur, notes, amp = 0.1, panSpread = true) {
  notes.forEach((midiNote, idx) => {
    const f = midi(midiNote)
    const pan = panSpread ? ((idx / Math.max(1, notes.length - 1)) * 2 - 1) * 0.55 : 0
    const localStart = Math.round(start * SR)
    const localDur = Math.round(dur * SR)
    for (let j = 0; j < localDur; j++) {
      const t = j / SR
      const env = envelope(t, dur, 1.7, 2.4, 1.2)
      if (env <= 0) continue
      const detune = 1 + (idx - 1.5) * 0.0018
      const wave =
        sine(f * detune, t) * 0.55 +
        sine(f * 2 * detune, t) * 0.16 +
        triangle(f * 0.5 * detune, t) * 0.12 +
        saw(f * detune, t) * 0.035
      const slow = 0.88 + 0.12 * Math.sin(2 * Math.PI * 0.08 * t + idx)
      addSample(localStart + j, wave * env * amp * slow, pan)
    }
  })
}

function addBass(start, dur, midiNote, amp = 0.22) {
  const f = midi(midiNote)
  const s = Math.round(start * SR)
  const n = Math.round(dur * SR)
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const env = envelope(t, dur, 0.018, 0.18, 1.6)
    if (env <= 0) continue
    // Duck on every beat for a modern pump.
    const inBeat = (start + t) % beat
    const duck = 0.55 + 0.45 * clamp(inBeat / 0.16, 0, 1)
    const wave = sine(f, t) * 0.86 + sine(f * 2, t) * 0.1 + triangle(f, t) * 0.06
    addSample(s + j, Math.tanh(wave * 1.15) * env * amp * duck, 0)
  }
}

function addKick(start, amp = 0.5) {
  const s = Math.round(start * SR)
  const n = Math.round(0.34 * SR)
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const env = Math.exp(-t * 11)
    const f = 42 + 110 * Math.exp(-t * 32)
    const click = j < 90 ? (Math.random() * 2 - 1) * 0.16 * Math.exp(-t * 90) : 0
    addSample(s + j, (sine(f, t) * 0.9 + click) * env * amp, 0)
  }
}

function addClap(start, amp = 0.12) {
  const s = Math.round(start * SR)
  const n = Math.round(0.22 * SR)
  let prev = 0
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const noise = Math.random() * 2 - 1
    const hp = noise - prev * 0.92
    prev = noise
    const env = Math.exp(-t * 24) * (t < 0.012 ? 0.4 : 1)
    addSample(s + j, hp * env * amp, 0.08)
  }
}

function addHat(start, amp = 0.045, open = false) {
  const s = Math.round(start * SR)
  const n = Math.round((open ? 0.2 : 0.06) * SR)
  let prev = 0
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const noise = Math.random() * 2 - 1
    const hp = noise - prev * 0.97
    prev = noise
    const env = Math.exp(-t * (open ? 16 : 55))
    addSample(s + j, hp * env * amp, 0.28)
  }
}

function addPluck(start, midiNote, amp = 0.075, pan = 0) {
  const f = midi(midiNote)
  const s = Math.round(start * SR)
  const n = Math.round(1.2 * SR)
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const env = Math.exp(-t * 7.5) * envelope(t, 1.2, 0.004, 0.15)
    if (env <= 0) continue
    const wave = triangle(f, t) * 0.55 + sine(f * 2, t) * 0.18 + sine(f, t) * 0.27
    addSample(s + j, wave * env * amp, pan)
  }
}

function addImpact(start, amp = 0.5) {
  const s = Math.round(start * SR)
  const n = Math.round(1.2 * SR)
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const env = Math.exp(-t * 4.2)
    const f = 28 + 52 * Math.exp(-t * 7)
    const boom = sine(f, t) * 0.8 + sine(f * 0.5, t) * 0.35
    const noise = (Math.random() * 2 - 1) * 0.08 * Math.exp(-t * 12)
    addSample(s + j, (boom + noise) * env * amp, 0)
  }
}

function addRiser(start, dur, amp = 0.1) {
  const s = Math.round(start * SR)
  const n = Math.round(dur * SR)
  let prev = 0
  for (let j = 0; j < n; j++) {
    const t = j / SR
    const x = t / dur
    const noise = Math.random() * 2 - 1
    const hp = noise - prev * (0.55 - x * 0.35)
    prev = noise
    const env = Math.pow(x, 2.2) * (1 - Math.pow(x, 6))
    addSample(s + j, hp * env * amp, Math.sin(x * 8) * 0.15)
  }
}

function addShimmer(start, dur, amp = 0.025) {
  const notes = [81, 84, 88, 91]
  notes.forEach((m, idx) => {
    const f = midi(m)
    const s = Math.round((start + idx * 0.08) * SR)
    const n = Math.round(dur * SR)
    for (let j = 0; j < n; j++) {
      const t = j / SR
      const env = envelope(t, dur, 1.4, 2.4, 1.4)
      addSample(s + j, sine(f, t) * env * amp, (idx % 2 ? 0.65 : -0.65))
    }
  })
}

// Chord progression: Am – F – C – G, 4 bars each.
const progression = [
  { start: 0.0, notes: [57, 60, 64, 69], root: 33 },
  { start: 9.6, notes: [53, 57, 60, 65], root: 29 },
  { start: 19.2, notes: [48, 52, 55, 60], root: 24 },
  { start: 28.8, notes: [55, 59, 62, 67], root: 31 },
  { start: 38.4, notes: [57, 60, 64, 69], root: 33 },
]

// Intro pad + heartbeat.
addPad(0, 11.5, progression[0].notes, 0.105)
addPad(9.6, 11.0, progression[1].notes, 0.105)
addPad(19.2, 11.0, progression[2].notes, 0.095)
addPad(28.8, 11.0, progression[3].notes, 0.105)
addPad(38.4, 6.0, progression[4].notes, 0.115)
addShimmer(38.3, 5.5, 0.022)

for (let t = 0; t < 5; t += 1.2) addKick(t, 0.2)

// Groove from 5s to 39s.
for (let t = 5.0; t < 39.0; t += beat) addKick(t, 0.43)
for (let t = 11.0; t < 39.0; t += beat * 2) addClap(t + beat, 0.1)
for (let t = 11.0; t < 39.0; t += beat / 2) addHat(t, t % beat === 0 ? 0.055 : 0.032)
for (let t = 17.0; t < 39.0; t += beat / 4) addHat(t, 0.014, t % beat === 0)

// Bass roots, one per bar, following the current chord.
for (let t = 5.0; t < 39.0; t += bar) {
  const chord = progression.filter((p) => p.start <= t).at(-1) || progression[0]
  addBass(t, bar * 0.92, chord.root, 0.2)
}

// Pluck arpeggio from 11s, denser after 17s.
const patterns = [
  [0, 2, 1, 3, 0, 2, 3, 1],
  [0, 1, 2, 3, 2, 1, 0, 2],
]
let step = 0
for (let t = 11.0; t < 39.0; t += beat / 4) {
  const chord = progression.filter((p) => p.start <= t).at(-1) || progression[0]
  const pattern = patterns[Math.floor(t / bar) % patterns.length]
  const note = chord.notes[pattern[step % pattern.length]] + 12
  addPluck(t, note, t < 17 ? 0.045 : 0.065, step % 2 ? 0.35 : -0.35)
  step++
}

// Scene accents and transitions.
for (const t of [0, 5.0, 11.0, 17.0, 23.0, 29.0, 34.0, 39.0]) addImpact(t, t === 0 ? 0.42 : 0.5)
addRiser(4.0, 1.0, 0.08)
addRiser(16.1, 0.9, 0.1)
addRiser(28.1, 0.9, 0.1)
addRiser(38.1, 0.9, 0.12)
addImpact(43.6, 0.22)

// Simple stereo delay/reverb for space.
const delay = Math.round(0.375 * SR)
const wetL = new Float32Array(N)
const wetR = new Float32Array(N)
for (let i = delay; i < N; i++) {
  wetL[i] = L[i - delay] * 0.16 + wetR[i - delay] * 0.05
  wetR[i] = R[i - delay] * 0.16 + wetL[i - delay] * 0.05
}
for (let i = 0; i < N; i++) {
  L[i] += wetL[i]
  R[i] += wetR[i]
}

// Master: gentle saturation, fade in/out, normalize.
let peak = 0
for (let i = 0; i < N; i++) {
  const fadeIn = Math.min(1, i / (SR * 0.35))
  const fadeOut = Math.min(1, (N - i) / (SR * 1.4))
  L[i] = Math.tanh(L[i] * 1.05) * fadeIn * fadeOut
  R[i] = Math.tanh(R[i] * 1.05) * fadeIn * fadeOut
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const gain = peak > 0 ? 0.88 / peak : 1
for (let i = 0; i < N; i++) {
  L[i] *= gain
  R[i] *= gain
}

const out = path.resolve('assets/launch/audio/ahsends-launch-music.wav')
fs.mkdirSync(path.dirname(out), { recursive: true })
const bytes = 44 + N * 2 * 2
const buf = Buffer.alloc(bytes)
buf.write('RIFF', 0)
buf.writeUInt32LE(bytes - 8, 4)
buf.write('WAVE', 8)
buf.write('fmt ', 12)
buf.writeUInt32LE(16, 16)
buf.writeUInt16LE(1, 20)
buf.writeUInt16LE(2, 22)
buf.writeUInt32LE(SR, 24)
buf.writeUInt32LE(SR * 2 * 2, 28)
buf.writeUInt16LE(4, 32)
buf.writeUInt16LE(16, 34)
buf.write('data', 36)
buf.writeUInt32LE(N * 2 * 2, 40)
let offset = 44
for (let i = 0; i < N; i++) {
  const l = Math.round(clamp(L[i], -1, 1) * 32767)
  const r = Math.round(clamp(R[i], -1, 1) * 32767)
  buf.writeInt16LE(l, offset); offset += 2
  buf.writeInt16LE(r, offset); offset += 2
}
fs.writeFileSync(out, buf)
console.log('WROTE', out, 'seconds=', DURATION, 'peak=', peak.toFixed(3))
