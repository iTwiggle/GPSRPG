import { SOUND } from "./config";
import type { FeedbackEvent, FeedbackSink, SoundCue, SoundSink } from "./types";
import { getRarityFeedback, LEVEL_UP } from "./config";

/**
 * Sound is intentionally a *hook architecture*, not bundled audio. No audio
 * assets ship with the app. Wire real samples later by implementing SoundSink
 * (e.g. an <audio>/Howler/WebAudio-buffer sink) and calling registerSoundSink().
 */

const silentSoundSink: SoundSink = {
  play() {
    // no-op
  },
};

let activeSoundSink: SoundSink = silentSoundSink;

export function registerSoundSink(sink: SoundSink): void {
  activeSoundSink = sink;
}

export function resetSoundSink(): void {
  activeSoundSink = silentSoundSink;
}

/**
 * Optional zero-asset WebAudio sink. Synthesizes short, gentle cues so the app
 * can feel alive without shipping files. Opt-in via enableSynthSound(); it lazily
 * resumes the AudioContext on the first cue (which always follows a user gesture
 * like tapping Explore, satisfying autoplay policies).
 */
export function createSynthSoundSink(): SoundSink {
  let ctx: AudioContext | null = null;

  const ensureContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const CUE_TONES: Record<SoundCue, { freq: number; ms: number; type: OscillatorType }> = {
    "pickup.common": { freq: 520, ms: 90, type: "triangle" },
    "pickup.uncommon": { freq: 660, ms: 120, type: "triangle" },
    "pickup.rare": { freq: 880, ms: 200, type: "sine" },
    xp: { freq: 720, ms: 70, type: "sine" },
    levelUp: { freq: 990, ms: 260, type: "sine" },
    toast: { freq: 600, ms: 110, type: "triangle" },
  };

  return {
    play(cue, options) {
      const audio = ensureContext();
      if (!audio) return;
      const tone = CUE_TONES[cue];
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const volume = (options?.volume ?? 1) * SOUND.masterVolume;

      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.ms / 1000);

      osc.connect(gain).connect(audio.destination);
      osc.start(now);
      osc.stop(now + tone.ms / 1000 + 0.02);
    },
  };
}

/** Convenience: register the built-in synth sink. */
export function enableSynthSound(): void {
  registerSoundSink(createSynthSoundSink());
}

function cueForEvent(event: FeedbackEvent): SoundCue | null {
  switch (event.kind) {
    case "pickup":
      return getRarityFeedback(event.rarity).sound;
    case "levelUp":
      return LEVEL_UP.sound;
    case "toast":
      return "toast";
    case "xp":
      return null; // XP floats stay silent to avoid rapid-fire blips.
    default:
      return null;
  }
}

export const soundSink: FeedbackSink = {
  id: "sound",
  handle(event: FeedbackEvent): void {
    if (!SOUND.enabled) return;
    const cue = cueForEvent(event);
    if (cue) activeSoundSink.play(cue);
  },
};
