import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import "./guided-flow.css";
import { M } from "./motion";
import type { FlowConfig, StepApi } from "./flows/types";
import { CloseIcon, ResetIcon } from "./steps/icons";

gsap.registerPlugin(useGSAP, Flip);

// Generic flow runner: scrim, stage, dock and exit dialog. Knows nothing about
// any particular flow — steps and their order come from `flow`.

interface Props<C extends object> {
  flow: FlowConfig<C>;
  initialContext?: Partial<C>;
  onClose: () => void;
  /** Called once with the collected context after the last step (the flow's onComplete). */
  onStart: (context: C) => void;
}

const FOCUSABLE = 'input:not([disabled]),button:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function isFilled<C extends object>(ctx: Partial<C>, keys: (keyof C)[]) {
  return keys.length > 0 && keys.every(k => ctx[k] !== undefined && ctx[k] !== null);
}

export default function GuidedFlow<C extends object>({ flow, initialContext, onClose, onStart }: Props<C>) {
  const steps = flow.steps;
  const initialRef = useRef<Partial<C>>(initialContext ?? {});

  const nextIndex = useCallback((from: number, ctx: Partial<C>) => {
    for (let i = from + 1; i < steps.length; i++) if (!isFilled(ctx, steps[i].provides)) return i;
    return -1;
  }, [steps]);

  const firstIndex = useMemo(() => Math.max(0, nextIndex(-1, initialRef.current)), [nextIndex]);

  const [context, setContext] = useState<Partial<C>>(initialRef.current);
  const [index, setIndex] = useState(firstIndex);
  const [resetKey, setResetKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [liveMsg, setLiveMsg] = useState("");

  const ctxRef = useRef(context);
  const indexRef = useRef(index);
  const busyRef = useRef(false);
  const escapeRef = useRef<(() => void) | null>(null);
  indexRef.current = index;

  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  const rm = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // ── Scrim blur (tweened through a proxy so it can go to 0) ──────────────────
  const blur = useRef({ px: 0 });
  const hostBlur = useCallback(() => {
    const raw = rootRef.current ? getComputedStyle(rootRef.current).getPropertyValue("--gf-host-blur") : "";
    return parseFloat(raw) || 22;
  }, []);
  const applyBlur = useCallback(() => {
    const el = scrimRef.current;
    if (!el) return;
    const v = `blur(${blur.current.px}px)`;
    el.style.backdropFilter = v;
    el.style.setProperty("-webkit-backdrop-filter", v);
  }, []);

  // ── Focus helpers ───────────────────────────────────────────────────────────
  const focusFirst = useCallback(() => {
    requestAnimationFrame(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const el = stage.querySelector<HTMLElement>(FOCUSABLE);
      (el ?? stage).focus({ preventScroll: true });
    });
  }, []);

  // ── Overlay in ──────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const scrim = scrimRef.current, stage = stageRef.current, dock = dockRef.current;
    if (!scrim || !stage || !dock) return;
    const full = hostBlur();
    if (rm) {
      blur.current.px = full;
      applyBlur();
      gsap.fromTo([scrim, stage, dock], { opacity: 0 }, { opacity: 1, duration: M.overlayIn });
    } else {
      const tl = gsap.timeline({ defaults: { duration: M.overlayIn, ease: M.overlayEase } });
      tl.fromTo(scrim, { opacity: 0 }, { opacity: 1 }, 0)
        .fromTo(blur.current, { px: 0 }, { px: full, onUpdate: applyBlur }, 0)
        .fromTo([stage, dock], { opacity: 0, y: M.stageRise }, { opacity: 1, y: 0 }, 0.05);
    }
    focusFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step in (after every step change or reset) ──────────────────────────────
  const mounted = useRef(false);
  useLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const stage = stageRef.current;
    if (!stage) return;
    const from = rm ? { opacity: 0 } : { opacity: 0, scale: M.stepScale };
    const to = rm ? { opacity: 1 } : { opacity: 1, scale: 1 };
    gsap.fromTo(stage, from, {
      ...to, duration: M.stepIn, ease: M.stepInEase,
      onComplete: () => { busyRef.current = false; },
    });
    focusFirst();
  }, [index, resetKey, rm, focusFirst]);

  const stepOut = useCallback((then: () => void) => {
    const stage = stageRef.current;
    if (!stage) { then(); return; }
    gsap.to(stage, {
      opacity: 0, ...(rm ? {} : { scale: M.stepScale }),
      duration: M.stepOut, ease: M.stepOutEase, onComplete: then,
    });
  }, [rm]);

  const clearStepChrome = () => {
    setDirty(false);
    setFocusMode(false);
    escapeRef.current = null;
  };

  // ── Leaving the overlay ─────────────────────────────────────────────────────
  const fadeOut = useCallback((then: () => void) => {
    const targets = [stageRef.current, dockRef.current].filter(Boolean);
    const tl = gsap.timeline({ onComplete: then, defaults: { duration: M.overlayOut, ease: "power2.inOut" } });
    tl.to(targets, { opacity: 0, duration: M.stepOut }, 0)
      .to(scrimRef.current, { opacity: 0 }, 0);
    if (!rm) tl.to(blur.current, { px: 0, onUpdate: applyBlur }, 0);
  }, [rm, applyBlur]);

  const finish = useCallback((ctx: Partial<C>) => {
    // Every step's values are present here, so the context is complete.
    fadeOut(() => onStart(ctx as C));
  }, [fadeOut, onStart]);

  // ── Step API ────────────────────────────────────────────────────────────────
  const complete = useCallback((patch: Partial<C>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const next = { ...ctxRef.current, ...patch };
    ctxRef.current = next;
    setContext(next);
    const ni = nextIndex(indexRef.current, next);
    if (ni === -1) { finish(next); return; }
    stepOut(() => {
      clearStepChrome();
      setIndex(ni);
    });
  }, [nextIndex, finish, stepOut]);

  const announce = useCallback((msg: string) => setLiveMsg(msg), []);
  const setEscapeHandler = useCallback((fn: (() => void) | null) => { escapeRef.current = fn; }, []);

  const api: StepApi<C> = useMemo(() => ({
    context: context as C,
    complete,
    setDirty,
    announce,
    setFocusMode,
    setEscapeHandler,
    reducedMotion: rm,
  }), [context, complete, announce, setEscapeHandler, rm]);

  // ── Dock actions ────────────────────────────────────────────────────────────
  const hasProgress =
    index !== firstIndex || dirty || Object.keys(context).length > Object.keys(initialRef.current).length;

  function reset() {
    if (busyRef.current) return;
    busyRef.current = true;
    stepOut(() => {
      ctxRef.current = initialRef.current;
      setContext(initialRef.current);
      clearStepChrome();
      setLiveMsg("");
      setIndex(firstIndex);
      setResetKey(k => k + 1);
    });
  }

  function requestClose() {
    if (hasProgress) { setShowExit(true); return; }
    fadeOut(onClose);
  }

  function exitConfirmed() {
    setShowExit(false);
    fadeOut(onClose);
  }

  // ── Exit dialog motion + focus ──────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!showExit || !dialogRef.current) return;
    gsap.fromTo(dialogRef.current,
      rm ? { opacity: 0 } : { opacity: 0, scale: M.dialogScale },
      { opacity: 1, scale: 1, duration: M.dialog, ease: M.stepInEase });
    continueRef.current?.focus({ preventScroll: true });
  }, [showExit, rm]);

  // ── Keyboard: Escape + focus trap ───────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showExit) { setShowExit(false); focusFirst(); return; }
        if (escapeRef.current) { escapeRef.current(); return; }
        requestClose();
        return;
      }
      if (e.key !== "Tab") return;
      const scope = showExit ? dialogRef.current : rootRef.current;
      if (!scope) return;
      const focusable = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.offsetParent !== null);
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !scope.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const step = steps[index];

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label={flow.label}
      className="gf-root fixed inset-0 z-50 overflow-hidden select-none">

      {/* Scrim — blurs the host screen; taps do nothing */}
      <div ref={scrimRef} className="gf-scrim absolute inset-0" style={{ opacity: 0 }} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{ background: "var(--gf-dim-focus)", opacity: focusMode ? 1 : 0 }} aria-hidden="true" />

      {/* Announcements */}
      <p className="sr-only" aria-live="polite">{`Step ${index + 1} of ${steps.length}, ${step.prompt}`}</p>
      <p className="sr-only" aria-live="polite">{liveMsg}</p>

      {/* Stage — the current step renders and swaps in place */}
      <div ref={stageRef} tabIndex={-1} className="absolute inset-0 outline-none" style={{ opacity: 0 }}>
        <div key={`${step.id}:${resetKey}`} className="contents">
          {step.render(api)}
        </div>
      </div>

      {/* Dock */}
      <div ref={dockRef}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-200"
        style={{ bottom: 52, opacity: 0 }}>
        <div style={{ opacity: focusMode ? 0.4 : 1 }} className="flex items-center gap-4 transition-opacity duration-200">
          {hasProgress && (
            <button onClick={reset} aria-label="Reset guide"
              className="gf-glass rounded-full flex items-center justify-center" style={{ width: 60, height: 60 }}>
              <ResetIcon size={26} />
            </button>
          )}
          <button onClick={requestClose} aria-label="Close guide"
            className="gf-glass rounded-full flex items-center justify-center" style={{ width: 60, height: 60 }}>
            <CloseIcon size={26} />
          </button>
        </div>
      </div>

      {/* Exit dialog */}
      {showExit && (
        <>
          <div className="absolute inset-0" style={{ background: "var(--gf-dim-dialog)" }} aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div ref={dialogRef} role="alertdialog" aria-modal="true"
              aria-labelledby="gf-exit-title" aria-describedby="gf-exit-body"
              className="gf-dialog flex flex-col overflow-hidden"
              style={{ width: 400, borderRadius: 16, background: "var(--gf-dialog-bg)" }}>
              <div className="flex flex-col items-center gap-2 text-center" style={{ padding: "28px 28px 24px" }}>
                <h2 id="gf-exit-title" className="text-[19px] font-semibold" style={{ color: "var(--gf-dialog-text)" }}>
                  Exit Guided Flow
                </h2>
                <p id="gf-exit-body" className="text-[15px] leading-snug" style={{ color: "var(--gf-dialog-text-muted)" }}>
                  You have not completed the session yet. Are you sure you want to exit now?
                </p>
              </div>
              <div className="flex" style={{ borderTop: "1px solid var(--gf-dialog-divider)" }}>
                <button ref={continueRef} onClick={() => { setShowExit(false); focusFirst(); }}
                  className="flex-1 h-14 text-[16px] font-semibold"
                  style={{ color: "var(--gf-dialog-text)" }}>
                  Continue Guide
                </button>
                <div style={{ width: 1, background: "var(--gf-dialog-divider)" }} />
                <button onClick={exitConfirmed}
                  className="flex-1 h-14 text-[16px] font-semibold"
                  style={{ color: "var(--gf-danger)" }}>
                  Exit Guide
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
