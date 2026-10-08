import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { M, ms } from "../motion";
import { useSpeech } from "./useSpeech";
import type { VoiceState } from "./VoiceControls";

interface Options {
  reducedMotion: boolean;
  bubbleRef: RefObject<HTMLDivElement | null>;
  /** Transcript the scripted fallback types for the current step. */
  script: () => string;
  /** Where the transcript flies to on send (e.g. the host's Ask! button). */
  target?: () => DOMRect | null;
  onSend: (transcript: string) => void;
}

// Voice session state machine:
//   idle → listening → (✓ with text) sending → idle
//                    → (✓ with nothing heard, early) idle        — cancel
//                    → (✓ with nothing heard, later) missed → idle
export function useVoice({ reducedMotion: rm, bubbleRef, script, target, onSend }: Options) {
  const [state, setState] = useState<VoiceState>("idle");
  const [text, setText] = useState("");
  const [windowPassed, setWindowPassed] = useState(false);
  const speech = useSpeech();
  const timers = useRef<number[]>([]);
  const prevState = useRef<VoiceState>("idle");

  const clearTimers = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clearTimers, []);

  const cancel = useCallback(() => {
    clearTimers();
    speech.cancel();
    setText("");
    setState(s => (s === "sending" ? s : "idle"));
  }, [speech]);

  const start = useCallback(() => {
    clearTimers();
    setText("");
    setWindowPassed(false);
    setState("listening");
    speech.start({ script: script(), onText: setText });
    timers.current.push(window.setTimeout(() => setWindowPassed(true), ms(M.voiceCancelWindow)));
  }, [speech, script]);

  const finish = useCallback(() => {
    const final = speech.stop();
    clearTimers();
    if (final) { setText(final); setState("sending"); return; }
    if (!windowPassed) { cancel(); return; }
    setState("missed");
    timers.current.push(window.setTimeout(() => setState("idle"), ms(M.voiceMissedHold)));
  }, [speech, windowPassed, cancel]);

  const toggle = useCallback(() => {
    if (state === "listening") finish();
    else if (state === "idle" || state === "missed") start();
  }, [state, start, finish]);

  // Bubble in / fly to the target on send
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const prev = prevState.current;
    prevState.current = state;
    if (!bubble) return;
    if (prev === "idle" && (state === "listening" || state === "missed")) {
      gsap.fromTo(bubble, rm ? { opacity: 0 } : { opacity: 0, y: 6, x: 0, scale: 1 },
        { opacity: 1, y: 0, duration: M.itemIn, ease: M.stepInEase });
    }
    if (state !== "sending") return;
    const transcript = text;
    const done = () => {
      gsap.set(bubble, { clearProps: "transform,opacity" });
      setText("");
      setState("idle");
      onSend(transcript);
    };
    const to = target?.();
    if (rm || !to) { gsap.to(bubble, { opacity: 0, duration: M.itemIn, onComplete: done }); return; }
    const from = bubble.getBoundingClientRect();
    gsap.to(bubble, {
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: 0.12, opacity: 0.2,
      duration: M.voiceFly, ease: "power2.in", onComplete: done,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const label =
    state === "listening" ? (!text && !windowPassed ? "Cancel" : "Stop and send")
    : state === "sending" ? "Sending to assistant"
    : "Speak to assistant";

  return { state, text, label, toggle, cancel };
}
