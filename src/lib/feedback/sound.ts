import { getRarityFeedback, SOUND } from "./config";
import type {
  FeedbackEvent,
  FeedbackSink,
  SoundCue,
  SoundSink,
} from "./types";

interface SynthNote {
  freq: number;
  endFreq?: number;
  atMs: number;
  durationMs: number;
  gain: number;
  type: OscillatorType;
}

const CUE_PATTERNS: Record<SoundCue, SynthNote[]> = {
  "pickup.common": [
    { freq: 520, endFreq: 610, atMs: 0, durationMs: 90, gain: 0.48, type: "triangle" },
    { freq: 760, atMs: 48, durationMs: 105, gain: 0.32, type: "sine" },
  ],
  "pickup.uncommon": [
    { freq: 560, endFreq: 650, atMs: 0, durationMs: 105, gain: 0.42, type: "triangle" },
    { freq: 790, endFreq: 880, atMs: 58, durationMs: 125, gain: 0.38, type: "triangle" },
    { freq: 1110, atMs: 116, durationMs: 150, gain: 0.28, type: "sine" },
  ],
  "pickup.rare": [
    { freq: 523.25, endFreq: 659.25, atMs: 0, durationMs: 180, gain: 0.34, type: "triangle" },
    { freq: 783.99, endFreq: 987.77, atMs: 54, durationMs: 240, gain: 0.3, type: "sine" },
    { freq: 1046.5, endFreq: 1318.51, atMs: 118, durationMs: 300, gain: 0.26, type: "sine" },
    { freq: 1567.98, atMs: 185, durationMs: 320, gain: 0.16, type: "sine" },
  ],
  xp: [
    { freq: 720, endFreq: 820, atMs: 0, durationMs: 70, gain: 0.22, type: "sine" },
  ],
  levelUp: [
    { freq: 523.25, atMs: 0, durationMs: 180, gain: 0.3, type: "triangle" },
    { freq: 659.25, atMs: 100, durationMs: 220, gain: 0.3, type: "triangle" },
    { freq: 783.99, atMs: 210, durationMs: 360, gain: 0.32, type: "sine" },
  ],
  toast: [
    { freq: 600, endFreq: 680, atMs: 0, durationMs: 110, gain: 0.24, type: "triangle" },
  ],
};

function createSilentSoundSink(): SoundSink {
  return {
    play() {
      // no-op
    },
  };
}

/**
 * Zero-asset WebAudio sink. Pickup cues are short authored synth phrases rather
 * than one oscillator beep. The sink installs a one-shot audio unlock listener
 * at client startup so mobile browsers can resume AudioContext during the first
 * real interaction, before an encounter later emits its pickup event.
 */
export function createSynthSoundSink(): SoundSink {
  let ctx: AudioContext | null = null;
  let unlockInstalled = false;

  const ensureContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  };

  const unlock = () => {
    const audio = ensureContext();
    if (audio?.state === "suspended") {
      void audio.resume().catch(() => {
        // A later user gesture can try again.
      });
    }
  };

  const installUnlock = () => {
    if (unlockInstalled || typeof window === "undefined") return;
    unlockInstalled = true;

    const handleUnlock = () => {
      unlock();
      window.removeEventListener("pointerdown", handleUnlock, true);
      window.removeEventListener("keydown", handleUnlock, true);
    };

    window.addEventListener("pointerdown", handleUnlock, true);
    window.addEventListener("keydown", handleUnlock, true);
  };

  const renderCue = (
    audio: AudioContext,
    cue: SoundCue,
    volume: number
  ) => {
    const baseTime = audio.currentTime + 0.004;

    for (const note of CUE_PATTERNS[cue]) {
      const start = baseTime + note.atMs / 1000;
      const end = start + note.durationMs / 1000;
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, start);
      if (note.endFreq) {
        osc.frequency.exponentialRampToValueAtTime(note.endFreq, end);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, volume * note.gain),
        start + 0.012
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  };

  installUnlock();

  return {
    play(cue, options) {
      const audio = ensureContext();
      if (!audio) return;

      const volume = (options?.volume ?? 1) * SOUND.masterVolume;
      if (audio.state === "suspended") {
        void audio
          .resume()
          .then(() => renderCue(audio, cue, volume))
          .catch(() => {
            // Audio is optional feedback; blocked playback must never affect play.
          });
        return;
      }

      renderCue(audio, cue, volume);
    },
  };
}

const defaultSynthSoundSink =
  typeof window === "undefined"
    ? createSilentSoundSink()
    : createSynthSoundSink();

let activeSoundSink: SoundSink = defaultSynthSoundSink;

export function registerSoundSink(sink: SoundSink): void {
  activeSoundSink = sink;
}

export function resetSoundSink(): void {
  activeSoundSink = defaultSynthSoundSink;
}

/** Convenience: restore the built-in synth sink after a custom sink. */
export function enableSynthSound(): void {
  activeSoundSink =
    typeof window === "undefined"
      ? createSilentSoundSink()
      : createSynthSoundSink();
}

function cueForEvent(event: FeedbackEvent): SoundCue | null {
  if (event.kind !== "pickup") return null;
  return getRarityFeedback(event.rarity).sound;
}

export const soundSink: FeedbackSink = {
  id: "sound",
  handle(event: FeedbackEvent): void {
    if (!SOUND.enabled) return;
    const cue = cueForEvent(event);
    if (!cue) return;

    const volume =
      event.kind === "pickup"
        ? Math.min(1.12, 0.9 + Math.max(0, event.count - 1) * 0.05)
        : 1;

    activeSoundSink.play(cue, { volume });
  },
};
