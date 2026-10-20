import { useCallback, useEffect, useRef, useState } from 'react';

// An original, softly voiced piano-like score is always available, without assets.
const CHORDS = [
  [48, 55, 60, 64], [45, 52, 60, 64], [41, 48, 57, 60], [43, 50, 59, 62],
  [48, 55, 59, 64], [45, 52, 57, 60], [41, 48, 57, 64], [43, 50, 55, 62],
];
const ARPEGGIO = [0, 2, 1, 3, 2, 1, 3, 2];
const MELODY = [76, 74, 72, 71, 72, 69, 67, 71];
const NOTE_INTERVAL = 60 / 68 / 2;

function fade(parameter, value, time, duration = 0.65) {
  if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(time);
  else {
    const current = parameter.value;
    parameter.cancelScheduledValues(time);
    parameter.setValueAtTime(current, time);
  }
  parameter.linearRampToValueAtTime(value, time + duration);
}

function pianoNote(engine, midi, when, duration, velocity) {
  const { context, synthGain } = engine;
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(velocity, when + 0.012);
  envelope.gain.exponentialRampToValueAtTime(Math.max(velocity * 0.28, 0.0001), when + 0.35);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  envelope.connect(synthGain);

  let remaining = 3;
  [1, 2, 3].forEach((harmonic, index) => {
    const oscillator = context.createOscillator();
    const level = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency * harmonic;
    oscillator.detune.value = index === 0 ? -1.5 : index === 1 ? 1.2 : 0;
    level.gain.value = [1, 0.2, 0.055][index];
    oscillator.connect(level);
    level.connect(envelope);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      level.disconnect();
      remaining -= 1;
      if (remaining === 0) envelope.disconnect();
    };
  });
}

function scheduleScore(engine) {
  const { context } = engine;
  if (!engine.wanted || context.state !== 'running' || engine.trackSource) return;
  if (engine.nextNote < context.currentTime) engine.nextNote = context.currentTime + 0.04;
  while (engine.nextNote < context.currentTime + 1.5) {
    const bar = Math.floor(engine.step / 8) % CHORDS.length;
    const beat = engine.step % 8;
    const chord = CHORDS[bar];
    const velocity = beat % 2 === 0 ? 0.105 : 0.075;
    pianoNote(engine, chord[ARPEGGIO[beat]], engine.nextNote, 2.9, velocity);
    if (beat === 0) pianoNote(engine, chord[0] - 12, engine.nextNote, 3.3, 0.11);
    if (beat === 2 || beat === 6) {
      const melodyIndex = (bar + (beat === 6 ? 1 : 0)) % MELODY.length;
      pianoNote(engine, MELODY[melodyIndex], engine.nextNote, 2.5, 0.055);
    }
    engine.nextNote += NOTE_INTERVAL;
    engine.step += 1;
  }
}

function createEngine() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const master = context.createGain();
  const synthGain = context.createGain();
  const trackGain = context.createGain();
  const warmth = context.createBiquadFilter();
  warmth.type = 'lowpass';
  warmth.frequency.value = 2800;
  warmth.Q.value = 0.3;
  master.gain.value = 0;
  trackGain.gain.value = 0;
  synthGain.connect(warmth);
  warmth.connect(master);
  trackGain.connect(master);
  master.connect(context.destination);
  return {
    context, master, synthGain, trackGain,
    wanted: false, nextNote: 0, step: 0,
    interval: null, suspendTimer: null, trackSource: null,
    trackPromise: null, loadedPath: null, abortController: null,
  };
}

async function loadTrack(engine, path) {
  if (!path || engine.loadedPath === path || engine.trackPromise) return;
  engine.loadedPath = path;
  engine.abortController = new AbortController();
  engine.trackPromise = (async () => {
    try {
      const response = await fetch(path, { signal: engine.abortController.signal });
      const contentType = response.headers.get('content-type') || '';
      // Development servers can answer missing asset routes with index.html.
      if (!response.ok || contentType.includes('text/html')) return;
      const buffer = await engine.context.decodeAudioData(await response.arrayBuffer());
      if (engine.context.state === 'closed') return;
      const source = engine.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(engine.trackGain);
      source.start();
      engine.trackSource = source;
      const now = engine.context.currentTime;
      fade(engine.synthGain.gain, 0, now, 1.6);
      fade(engine.trackGain.gain, 0.65, now, 1.6);
    } catch {
      // The bundled score remains available when a custom file cannot be read.
    }
  })();
  await engine.trackPromise;
}

export function useGiftAudio(backgroundMusic = '') {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const engineRef = useRef(null);
  const mountedRef = useRef(true);
  const trustedRef = useRef(false);
  const requestRef = useRef(0);
  const pathRef = useRef(backgroundMusic);
  pathRef.current = backgroundMusic;

  useEffect(() => {
    mountedRef.current = true;
    const markTrusted = (event) => {
      if (event.isTrusted) trustedRef.current = true;
    };
    window.addEventListener('pointerdown', markTrusted, { capture: true, passive: true });
    window.addEventListener('keydown', markTrusted, { capture: true });
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      window.removeEventListener('pointerdown', markTrusted, true);
      window.removeEventListener('keydown', markTrusted, true);
      const engine = engineRef.current;
      if (!engine) return;
      engine.wanted = false;
      clearInterval(engine.interval);
      clearTimeout(engine.suspendTimer);
      engine.abortController?.abort();
      try { engine.trackSource?.stop(); } catch { /* Already stopped. */ }
      engine.context.close().catch(() => {});
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    // Construct/resume AudioContext inside the user's click, before any fetch.
    if (navigator.userActivation ? !navigator.userActivation.isActive : !trustedRef.current) return false;
    const request = ++requestRef.current;
    try {
      const engine = engineRef.current || createEngine();
      if (!engine) {
        setNotice('Trình duyệt này chưa hỗ trợ phát nhạc.');
        return false;
      }
      engineRef.current = engine;
      engine.wanted = true;
      clearTimeout(engine.suspendTimer);
      await engine.context.resume();
      if (!mountedRef.current || request !== requestRef.current || !engine.wanted) return false;
      if (engine.context.state !== 'running') throw new Error('Audio is suspended');
      fade(engine.master.gain, 0.55, engine.context.currentTime, 1.2);
      if (!engine.interval) {
        engine.nextNote = engine.context.currentTime + 0.05;
        scheduleScore(engine);
        engine.interval = setInterval(() => scheduleScore(engine), 180);
      }
      setIsPlaying(true);
      setNotice('');
      if (pathRef.current) void loadTrack(engine, pathRef.current);
      return true;
    } catch {
      if (engineRef.current) engineRef.current.wanted = false;
      if (mountedRef.current) {
        setIsPlaying(false);
        setNotice('Chạm vào nốt nhạc để bật nhạc nhé.');
      }
      return false;
    }
  }, []);

  const toggle = useCallback(() => {
    const engine = engineRef.current;
    if (!engine?.wanted) return start();
    requestRef.current += 1;
    engine.wanted = false;
    clearInterval(engine.interval);
    engine.interval = null;
    fade(engine.master.gain, 0, engine.context.currentTime, 0.4);
    engine.suspendTimer = setTimeout(() => {
      if (!engine.wanted && engine.context.state === 'running') engine.context.suspend().catch(() => {});
    }, 450);
    setIsPlaying(false);
    setNotice('');
    return false;
  }, [start]);

  return { isPlaying, toggle, start, notice };
}

export default useGiftAudio;
