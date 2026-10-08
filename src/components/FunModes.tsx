import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { useI18n } from '@/i18n';
import { eggs } from '@/lib/eggs';
import { useTheme } from '@/theme/ThemeProvider';

const web = Platform.OS === 'web' && typeof document !== 'undefined';

/**
 * Two search-box surprises (the full list is in EASTER_EGGS.md):
 *   • « minitel » — the Minitel mode (green on black, ThemeProvider), announced by a modem's dial-up song;
 *   • « australie » — the whole site upside down for 10 seconds.
 */
export function FunModes() {
  const { d } = useI18n();
  const { minitel, setMinitel } = useTheme();
  const { toast } = useDialogs();

  useEffect(
    () =>
      eggs.on('minitel', () => {
        const on = !minitel;
        setMinitel(on);
        toast(on ? d.fun.minitelOn : d.fun.minitelOff);
        if (on) playDialUp();
      }),
    [minitel, setMinitel, toast, d]
  );

  useEffect(
    () =>
      eggs.on('australia', () => {
        if (!web) return;
        toast(d.fun.flip);
        const root = document.documentElement;
        root.style.transition = 'transform 0.9s ease-in-out';
        root.style.transform = 'rotate(180deg)';
        setTimeout(() => {
          root.style.transform = '';
          setTimeout(() => (root.style.transition = ''), 1000);
        }, 10_000);
      }),
    [toast, d]
  );

  return null;
}

/**
 * A modem's dial-up song (about 4 s, synthesised): the dial tones, the answer tone, then the
 * handshake screech and hiss. Quiet, and only after the person typed (browsers need a gesture).
 */
function playDialUp() {
  if (!web) return;
  const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const out = ctx.createGain();
    out.gain.value = 0.12;
    out.connect(ctx.destination);
    const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 1) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g).connect(out);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
      return o;
    };
    // Dial tones (DTMF pairs for « 3615 »… the Minitel number every French kid knew).
    const dtmf: [number, number][] = [[697, 1477], [697, 1209], [697, 1209], [770, 1336]];
    dtmf.forEach(([a, b], i) => {
      tone(a, i * 0.16, 0.11);
      tone(b, i * 0.16, 0.11);
    });
    // Answer tone, then the handshake: warbling tones and bursts.
    tone(2100, 0.8, 0.9);
    for (let k = 0; k < 14; k++) tone(980 + ((k * 397) % 1400), 1.8 + k * 0.09, 0.09, 'square', 0.35);
    const sweep = tone(1200, 3.0, 0.7, 'sawtooth', 0.25);
    sweep.frequency.setValueAtTime(1200, ctx.currentTime + 3.0);
    sweep.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 3.7);
    // Hiss.
    const len = Math.floor(ctx.sampleRate * 0.9);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.connect(out);
    noise.start(ctx.currentTime + 3.2);
    setTimeout(() => void ctx.close(), 5000);
  } catch {
    // No sound: the mode still switches on.
  }
}
