import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { useDialogs } from '@/components/ui/Dialogs';
import { useI18n } from '@/i18n';
import { eggs } from '@/lib/eggs';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { Txt } from './ui/Txt';

const web = Platform.OS === 'web' && typeof document !== 'undefined';

/**
 * Three search-box surprises (the full list is in EASTER_EGGS.md):
 *   • « minitel » — the Minitel mode (green on black, ThemeProvider), announced by a modem's dial-up song;
 *   • « popcorn » — the cinema mode: black bars, sepia and film grain, until « Fin » or « popcorn » again;
 *   • « australie » — the whole site upside down for 10 seconds.
 */
export function FunModes() {
  const { d } = useI18n();
  const { minitel, setMinitel } = useTheme();
  const { toast } = useDialogs();
  const [cinema, setCinema] = useState(false);

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
      eggs.on('popcorn', () => {
        setCinema((c) => {
          toast(c ? d.fun.cinemaOff : d.fun.cinemaOn);
          return !c;
        });
      }),
    [toast, d]
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

  // The cinema look: sepia on the whole page while it is on.
  useEffect(() => {
    if (!web || !cinema) return;
    const root = document.documentElement;
    root.style.filter = 'sepia(0.85) contrast(1.08) brightness(0.95)';
    return () => {
      root.style.filter = '';
    };
  }, [cinema]);

  return cinema ? <Cinema onExit={() => setCinema(false)} /> : null;
}

/** Black bars top and bottom, flickering film grain and a « Fin » button. */
function Cinema({ onExit }: { onExit: () => void }) {
  const { d } = useI18n();
  const { isMobile } = useLayout();
  const bar = isMobile ? 46 : 72;
  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: bar, backgroundColor: '#000', zIndex: 1000 }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: bar, backgroundColor: '#000', zIndex: 1000 }} />
      {web && (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, opacity: 0.18 },
            {
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              animationName: 'lfk-grain',
              animationDuration: '0.6s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'steps(4)',
            } as object,
          ]}
        />
      )}
      {web && <GrainKeyframes />}
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        style={{ position: 'absolute', right: 16, bottom: (bar - 32) / 2, zIndex: 1001, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#D9C9A3' }}>
        <Txt style={{ color: '#F3E9D2', fontSize: 13, letterSpacing: 2 }}>{d.fun.cinemaExit}</Txt>
      </Pressable>
    </>
  );
}

/** The grain's jitter, injected once. */
function GrainKeyframes() {
  useEffect(() => {
    const id = 'lfk-grain-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '@keyframes lfk-grain { 0% { transform: translate(0,0) } 25% { transform: translate(-6px,4px) } 50% { transform: translate(5px,-5px) } 75% { transform: translate(-3px,-6px) } 100% { transform: translate(0,0) } }';
    document.head.appendChild(style);
  }, []);
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
