import { forwardRef, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { M } from "../motion";
import micIcon from "../assets/mic.svg";
import tickIcon from "../assets/tick.svg";

export type VoiceState = "idle" | "listening" | "sending" | "missed";

const MIC = 64;

/** Figma "mic": mic and tick side by side in a clipped circle; listening slides the tick in. */
export function MicButton({ state, label, onClick, reducedMotion: rm }: {
  state: VoiceState;
  label: string;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  const trackRef = useRef<HTMLSpanElement>(null);
  const micRef = useRef<HTMLImageElement>(null);
  const tickRef = useRef<HTMLImageElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const listening = state === "listening";

  // Slide mic ↔ tick (fade under reduced motion)
  useLayoutEffect(() => {
    if (rm) {
      gsap.to(micRef.current, { opacity: listening ? 0 : 1, duration: M.micSlide });
      gsap.to(tickRef.current, { opacity: listening ? 1 : 0, duration: M.micSlide });
      return;
    }
    gsap.to(trackRef.current, { x: listening ? -M.micSlideDistance : 0, duration: M.micSlide, ease: M.micSlideEase });
  }, [listening, rm]);

  // Level ring: a scripted, slightly irregular pulse while listening
  useLayoutEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (!listening) { gsap.to(ring, { opacity: 0, scale: 1, duration: 0.2, overwrite: true }); return; }
    if (rm) { gsap.set(ring, { opacity: 1, scale: 1.12 }); return; }
    const tw = gsap.to(ring, {
      keyframes: { scale: [1.04, 1.22, 1.1, 1.3, 1.06], opacity: [0.9, 0.5, 0.8, 0.35, 0.9] },
      duration: 1.6, ease: "sine.inOut", repeat: -1,
    });
    gsap.fromTo(ring, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    return () => { tw.kill(); };
  }, [listening, rm]);

  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={listening}
      className="gf-surface relative rounded-full flex items-center justify-center shrink-0"
      style={{ width: MIC, height: MIC }}>
      <span ref={ringRef} aria-hidden="true" className="gf-mic-ring" style={{ opacity: 0 }} />
      <span className="relative overflow-hidden rounded-full" style={{ width: MIC, height: MIC }}>
        <span ref={trackRef} className="absolute inset-0">
          <img ref={micRef} src={micIcon} alt="" width={32} height={32}
            className="absolute" style={{ left: "50%", top: "50%", translate: "-50% -50%" }} />
          <img ref={tickRef} src={tickIcon} alt="" width={30} height={29}
            className="absolute"
            style={{ left: rm ? "50%" : `calc(50% + ${M.micSlideDistance}px)`, top: "50%", translate: "-50% -50%", opacity: rm ? 0 : 1 }} />
        </span>
      </span>
    </button>
  );
}

/** Live transcript pill, centred ~24px above the dock. */
export const TranscriptBubble = forwardRef<HTMLDivElement, { state: VoiceState; text: string }>(
  function TranscriptBubble({ state, text }, ref) {
    const visible = state !== "idle";
    const message = state === "missed"
      ? "Didn't catch that. Tap the mic to try again."
      : text || "Listening…";
    return (
      <div ref={ref} aria-live="polite" aria-atomic="true"
        className="gf-surface gf-pill absolute left-1/2 text-center text-[20px] leading-snug"
        style={{
          bottom: "calc(100% + 24px)", translate: "-50% 0",
          width: "max-content", maxWidth: 640, padding: "14px 28px",
          visibility: visible ? "visible" : "hidden",
        }}>
        <span className={text && state !== "missed" ? "" : "gf-muted"}>{visible ? message : ""}</span>
      </div>
    );
  },
);
