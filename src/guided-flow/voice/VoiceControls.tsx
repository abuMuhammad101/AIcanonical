import { useLayoutEffect, useRef, type MouseEvent, type RefObject } from "react";
import { gsap } from "gsap";
import SiriWave from "siriwave";
import { M } from "../motion";
import micIcon from "../assets/mic.svg";
import tickIcon from "../assets/tick.svg";

const SIZE = 64;
/** Waveform canvas inside the pill (left part; ✓ sits on the right). */
const WAVE_W = 100;
const WAVE_H = 48;
/** Reduced motion: static bars instead of the live wave. */
const BARS = 9;
const PROFILE = [0.35, 0.55, 0.75, 0.9, 1, 0.9, 0.75, 0.55, 0.35];

/**
 * Speak button. Idle: a 64px circle with the mic. Listening: pops open into a
 * pill with a live Siri-style wave (SiriWave, iOS 9 curves) on the left and ✓
 * on the right. The wave's amplitude and speed follow the mic level.
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
  const mounted = useRef(false);

  // Morph circle ↔ pill
  useLayoutEffect(() => {
    const btn = btnRef.current, mic = micRef.current, wave = waveRef.current, tick = tickRef.current;
    if (!btn || !mic || !wave || !tick) return;
    const first = !mounted.current;
    mounted.current = true;
    const width = listening ? M.micPillWidth : SIZE;

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
      // Pop open: a quick squash, then the pill springs to width
      const tl = gsap.timeline();
      tl.to(btn, { scale: 0.9, duration: 0.08, ease: "power2.out" }, 0)
        .to(btn, { scale: 1, duration: M.micExpand, ease: M.micPopEase }, 0.08)
        .to(btn, { width, duration: M.micExpand, ease: M.micPopEase }, 0.06)
        .to(mic, { opacity: 0, scale: 0.4, duration: 0.14, ease: "power2.in" }, 0)
        .fromTo(wave, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: M.micExpand, ease: M.micPopEase }, 0.12)
        .fromTo(tick, { opacity: 0, scale: 0.3, rotate: -30 }, { opacity: 1, scale: 1, rotate: 0, duration: M.micExpand, ease: M.micTickEase }, 0.18);
    } else {
      const tl = gsap.timeline({ defaults: { duration: M.micCollapse, ease: M.micCollapseEase } });
      tl.to(btn, { width }, 0)
        .to(tick, { opacity: 0, scale: 0.5, duration: M.micCollapse * 0.5 }, 0)
        .to(wave, { opacity: 0, scaleY: 0.2, duration: M.micCollapse * 0.6 }, 0)
        .fromTo(mic, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, ease: M.micPopEase }, M.micCollapse * 0.35);
    }
  }, [listening, rm]);

  // Live wave while listening: amplitude and speed follow the input level
  useLayoutEffect(() => {
    const host = waveRef.current;
    if (!listening || !host || rm) return;
    const wave = new SiriWave({
      container: host,
      width: WAVE_W,
      height: WAVE_H,
      style: "ios9",
      amplitude: 0.05,
      speed: 0.12,
      autostart: true,
      // Monochrome: white and silver curves glow additively on the glass
      curveDefinition: [
        { color: "255,255,255", supportLine: true },
        { color: "255,255,255" },
        { color: "214,214,214" },
        { color: "168,168,168" },
      ],
      globalCompositeOperation: "lighter",
    });
    let smooth = 0;
    const tick = () => {
      const lvl = level.current ?? 0;
      smooth += (lvl - smooth) * 0.25;
      wave.setAmplitude(0.05 + smooth * 1.6);
      wave.setSpeed(0.12 + smooth * 0.18);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      wave.dispose();
      host.replaceChildren();
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
      className="gf-surface gf-dock relative rounded-full shrink-0 overflow-hidden"
      style={{ width: SIZE, height: SIZE }}>
      <img ref={micRef} src={micIcon} alt="" width={32} height={32}
        className="absolute pointer-events-none" style={{ left: "50%", top: "50%", translate: "-50% -50%" }} />
      <span ref={waveRef} aria-hidden="true"
        className="absolute flex items-center justify-center gap-[3px] pointer-events-none"
        style={{ left: 14, top: "50%", translate: "0 -50%", width: WAVE_W, height: WAVE_H, opacity: 0 }}>
        {rm && Array.from({ length: BARS }, (_, i) => (
          <span key={i} className="rounded-full" style={{ width: 2, height: 3 + 19 * 0.5 * PROFILE[i] + 4, background: "currentColor" }} />
        ))}
      </span>
      <img ref={tickRef} src={tickIcon} alt="" width={26} height={26}
        className="absolute pointer-events-none" style={{ right: 20, top: "50%", translate: "0 -50%", opacity: 0 }} />
    </button>
  );
}
