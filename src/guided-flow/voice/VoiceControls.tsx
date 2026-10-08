import { useLayoutEffect, useRef, type MouseEvent, type RefObject } from "react";
import { gsap } from "gsap";
import { M } from "../motion";
import micIcon from "../assets/mic.svg";
import tickIcon from "../assets/tick.svg";

const SIZE = 64;
const BARS = 9;
const BAR_MIN = 3;
const BAR_MAX = 22;
/** Middle bars run taller than the edges. */
const PROFILE = [0.35, 0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55, 0.35];

/**
 * Speak button. Idle: a 64px circle with the mic. Listening: morphs in place
 * into a pill with a live waveform on the left and ✓ on the right; the dock
 * stays centred, so Reset/Close slide with the width.
 */
export function MicButton({ listening, level, shakeKey, label, onToggle, reducedMotion: rm }: {
  listening: boolean;
  level: RefObject<number>;
  /** Increment to shake (empty transcript). */
  shakeKey: number;
  label: string;
  onToggle: () => void;
  reducedMotion: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const micRef = useRef<HTMLImageElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<HTMLImageElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mounted = useRef(false);

  // Morph circle ↔ pill
  useLayoutEffect(() => {
    const btn = btnRef.current, mic = micRef.current, wave = waveRef.current, tick = tickRef.current;
    if (!btn || !mic || !wave || !tick) return;
    const first = !mounted.current;
    mounted.current = true;
    const width = listening ? M.micPillWidth : SIZE;
    const on = { opacity: 1, scale: 1, x: 0 };

    if (first) {
      gsap.set(btn, { width });
      gsap.set(mic, { opacity: listening ? 0 : 1 });
      gsap.set([wave, tick], { opacity: listening ? 1 : 0 });
      return;
    }
    if (rm) {
      // No width morph: swap with a short fade.
      gsap.fromTo(btn, { opacity: 0 }, { opacity: 1, duration: M.micFadeReduced });
      gsap.set(btn, { width });
      gsap.set(mic, { opacity: listening ? 0 : 1 });
      gsap.set([wave, tick], { opacity: listening ? 1 : 0 });
      return;
    }
    if (listening) {
      const tl = gsap.timeline({ defaults: { duration: M.micExpand, ease: M.micExpandEase } });
      tl.to(btn, { width }, 0)
        .to(mic, { opacity: 0, scale: 0.6, duration: M.micExpand * 0.6 }, 0)
        .fromTo(wave, { opacity: 0, scale: 0.6 }, on, 0.05)
        .fromTo(tick, { opacity: 0, x: 10 }, on, 0.08);
    } else {
      const tl = gsap.timeline({ defaults: { duration: M.micCollapse, ease: M.micCollapseEase } });
      tl.to(btn, { width }, 0)
        .to(tick, { opacity: 0, x: 10, duration: M.micCollapse * 0.5 }, 0)
        .to(wave, { opacity: 0, scale: 0.6, duration: M.micCollapse * 0.6 }, 0)
        .fromTo(mic, { opacity: 0, scale: 0.6 }, on, M.micCollapse * 0.35);
    }
  }, [listening, rm]);

  // Waveform: bar heights follow the input level every frame
  useLayoutEffect(() => {
    const bars = barRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!listening) return;
    if (rm) { bars.forEach(b => { b.style.height = `${(BAR_MIN + BAR_MAX) / 2}px`; }); return; }
    const heights = bars.map(() => BAR_MIN);
    const jitter = bars.map(() => 1);
    let frame = 0;
    const tick = () => {
      const lvl = level.current ?? 0;
      if (frame++ % 6 === 0) for (let i = 0; i < jitter.length; i++) jitter[i] = 0.65 + Math.random() * 0.35;
      bars.forEach((b, i) => {
        const target = BAR_MIN + (BAR_MAX - BAR_MIN) * lvl * PROFILE[i] * jitter[i];
        heights[i] += (target - heights[i]) * 0.35;
        b.style.height = `${heights[i].toFixed(1)}px`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      bars.forEach(b => { b.style.height = `${BAR_MIN}px`; });
    };
  }, [listening, rm, level]);

  // Empty transcript: a small shake, nothing else
  useLayoutEffect(() => {
    if (!shakeKey || !btnRef.current) return;
    if (rm) { gsap.fromTo(btnRef.current, { opacity: 0.4 }, { opacity: 1, duration: M.micFadeReduced * 2 }); return; }
    gsap.fromTo(btnRef.current, { x: 0 }, { keyframes: { x: [-4, 4, -4, 4, 0] }, duration: M.micShake, ease: "none" });
  }, [shakeKey, rm]);

  function onClick(e: MouseEvent<HTMLButtonElement>) {
    // While listening the pill is the ✓ target, except its left (waveform) half.
    if (listening && e.detail > 0) {
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX - r.left < r.width / 2) return;
    }
    onToggle();
  }

  return (
    <button ref={btnRef} type="button" onClick={onClick} aria-label={label} aria-pressed={listening}
      className="gf-surface relative rounded-full shrink-0 overflow-hidden"
      style={{ width: SIZE, height: SIZE }}>
      <img ref={micRef} src={micIcon} alt="" width={32} height={32}
        className="absolute pointer-events-none" style={{ left: "50%", top: "50%", translate: "-50% -50%" }} />
      <span ref={waveRef} aria-hidden="true"
        className="absolute flex items-center pointer-events-none"
        style={{ left: 22, top: "50%", translate: "0 -50%", height: BAR_MAX, gap: 3, opacity: 0 }}>
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} ref={el => { barRefs.current[i] = el; }}
            className="rounded-full" style={{ width: 2, height: BAR_MIN, background: "currentColor" }} />
        ))}
      </span>
      <img ref={tickRef} src={tickIcon} alt="" width={26} height={26}
        className="absolute pointer-events-none" style={{ right: 20, top: "50%", translate: "0 -50%", opacity: 0 }} />
    </button>
  );
}
