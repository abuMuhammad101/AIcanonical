import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import "./guided-flow.css";
import { M } from "./motion";
import { Patient, Device, Answers, calcAge, ETHNICITIES } from "./data";
import Beat1Patient from "./steps/Beat1Patient";
import Beat2Device  from "./steps/Beat2Device";
import Beat3Test    from "./steps/Beat3Test";
import Beat4Gender  from "./steps/Beat4Gender";
import Beat5DOB     from "./steps/Beat5DOB";
import Beat6Weight  from "./steps/Beat6Weight";
import Beat7Height  from "./steps/Beat7Height";
import Beat8Ethnicity from "./steps/Beat8Ethnicity";
import Beat9Ready   from "./steps/Beat9Ready";
import Beat10Demographics from "./steps/Beat10Demographics";

gsap.registerPlugin(useGSAP, SplitText, Flip);

// ─── Types ────────────────────────────────────────────────────────────────────
type Beat = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Direction = "forward" | "back";

interface State {
  beat: Beat;
  direction: Direction;
  patient:  Patient | null;
  device:   Device  | null;
  testId:   string;
  testLabel:string;
  answers:  Answers;
}

type Action =
  | { type: "SET_BEAT"; beat: Beat; direction?: Direction }
  | { type: "SET_PATIENT"; patient: Patient }
  | { type: "SET_DEVICE";  device: Device }
  | { type: "SET_TEST";    testId: string; testLabel: string }
  | { type: "SET_ANSWER";  key: keyof Answers; value: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_BEAT":    return { ...state, beat: action.beat, direction: action.direction ?? "forward" };
    case "SET_PATIENT": return { ...state, patient: action.patient };
    case "SET_DEVICE":  return { ...state, device: action.device };
    case "SET_TEST":    return { ...state, testId: action.testId, testLabel: action.testLabel };
    case "SET_ANSWER":  return { ...state, answers: { ...state.answers, [action.key]: action.value } };
  }
}

function buildInitialAnswers(p: Patient | null): Answers {
  if (!p) return { gender: "", dob: "", weight: "", heightFt: "", heightIn: "", ethnicity: "" };
  const [ft = "", inPart = ""] = (p.height ?? "").replace(/['"]/g,"").split(/[\s]+/);
  return {
    gender:    p.gender    ?? "",
    dob:       p.dob       ?? "",
    weight:    p.weight    ?? "",
    heightFt:  ft,
    heightIn:  inPart,
    ethnicity: p.ethnicity ?? "",
  };
}

// ─── Step config ──────────────────────────────────────────────────────────────
const STEP_LABELS: Record<number, string> = {
  0: "Start",
  1: "Select Patient",
  2: "Connect Device",
  3: "Choose Test",
  4: "Gender",
  5: "Date of Birth",
  6: "Weight",
  7: "Height",
  8: "Ethnicity",
  9: "Ready",
  10: "Demographics",
};

// beat 10 is the demographics screen inserted between 3 and 9
const BEAT_STEP: Record<number, number> = { 1: 0, 2: 1, 3: 2, 10: 3, 9: 7 };

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ beat, radius = 44 }: { beat: Beat; radius?: number }) {
  const circumference = 2 * Math.PI * radius;
  const step = BEAT_STEP[beat] ?? Math.max(0, beat - 1);
  const pct = Math.max(0, step / 7);
  return (
    <svg width={radius * 2 + 16} height={radius * 2 + 16} viewBox={`0 0 ${radius*2+16} ${radius*2+16}`}
      style={{ position: "absolute", top: -8, left: -8, pointerEvents: "none" }}>
      <circle cx={radius+8} cy={radius+8} r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6"/>
      <circle cx={radius+8} cy={radius+8} r={radius} fill="none"
        stroke="white" strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${radius+8} ${radius+8})`}
        style={{ transition: `stroke-dashoffset ${M.base}s ${M.enter}` }}
      />
    </svg>
  );
}

// ─── Aurora blob ─────────────────────────────────────────────────────────────
function AuroraBlob({ color, size, top, left, delay }: { color: string; size: number; top: string; left: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current) return;
    const dur = M.auroraMin + Math.random() * (M.auroraMax - M.auroraMin);
    gsap.to(ref.current, {
      x: `${(Math.random() - 0.5) * 160}px`,
      y: `${(Math.random() - 0.5) * 120}px`,
      duration: dur,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay,
    });
  }, []);
  return (
    <div ref={ref} className="gf-aurora"
      style={{ width: size, height: size, backgroundColor: color, top, left, transform: "translate(-50%,-50%)" }} />
  );
}

// ─── Trail chip ───────────────────────────────────────────────────────────────
interface TrailChip { id: string; label: string; initials?: string; beat: Beat; }

function TrailChipEl({ chip, onClick }: { chip: TrailChip; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="gf-capsule flex items-center gap-2 px-4 hover:brightness-[0.97] transition-all shrink-0"
      style={{ height: 44, borderRadius: 9999 }}
      aria-label={`Rewind to ${chip.label}`}
    >
      {chip.initials && (
        <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#007A8B,#3AAF4D)" }}>
          {chip.initials}
        </div>
      )}
      <span className="text-[14px] font-medium text-[#434343] whitespace-nowrap" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>
        {chip.label}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  onStart: (p: Patient, d: Device, testLabel: string, ans: Answers) => void;
  startButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function GuidedFlow({ onClose, onStart, startButtonRef }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    beat: 1 as Beat,
    direction: "forward",
    patient: null,
    device:  null,
    testId:   "",
    testLabel: "",
    answers: buildInitialAnswers(null),
  });
  const [fieldError, setFieldError] = useState("");
  const [showExit, setShowExit] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [editingFromDemographics, setEditingFromDemographics] = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const backdropRef   = useRef<HTMLDivElement>(null);
  const contentRef    = useRef<HTMLDivElement>(null);
  const headlineRef   = useRef<HTMLHeadingElement>(null);
  const helperRef     = useRef<HTMLParagraphElement>(null);
  const stepAreaRef   = useRef<HTMLDivElement>(null);
  const nextBtnRef    = useRef<HTMLButtonElement>(null);
  const closeBtnRef   = useRef<HTMLButtonElement>(null);
  const splitRef      = useRef<SplitText | null>(null);

  const SF = "system-ui,-apple-system,sans-serif";
  const GRADIENT = "linear-gradient(135deg, #007A8B 0%, #3AAF4D 37%, #A8CB38 86%)";

  // ── Reduced motion ─────────────────────────────────────────────────────────
  const rm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Entry animation ────────────────────────────────────────────────────────
  useGSAP(() => {
    if (!backdropRef.current || !contentRef.current) return;
    if (rm) {
      gsap.set(backdropRef.current, { opacity: 1 });
      gsap.set(contentRef.current, { opacity: 1 });
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: M.base, ease: "power2.out" })
      .fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: M.base * 0.8, ease: M.enter }, "-=0.3");

    // Focus trap — focus close button first
    if (closeBtnRef.current) closeBtnRef.current.focus({ preventScroll: true });
  }, []);

  // ── Headline SplitText on beat change ──────────────────────────────────────
  useGSAP(() => {
    if (!headlineRef.current || rm) return;
    splitRef.current?.revert();
    splitRef.current = new SplitText(headlineRef.current, { type: "lines,words" });
    gsap.fromTo(splitRef.current.words, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.7, ease: M.enter, stagger: 0.03,
    });
    return () => { splitRef.current?.revert(); };
  }, [state.beat]);

  // ── Step area beat transition ───────────────────────────────────────────────
  const goToBeat = useCallback((beat: Beat, dir: Direction = "forward") => {
    if (transitioning) return;
    setTransitioning(true);
    setFieldError("");
    const area = stepAreaRef.current;
    if (!area || rm) {
      dispatch({ type: "SET_BEAT", beat, direction: dir });
      setTransitioning(false);
      return;
    }
    if (dir === "forward") {
      // Expansion effect: scale up & fade → next beat scales in from small
      gsap.to(area, { opacity: 0, scale: 1.06, duration: M.base * 0.5, ease: "power2.in",
        onComplete: () => {
          dispatch({ type: "SET_BEAT", beat, direction: dir });
          gsap.fromTo(area, { opacity: 0, scale: 0.93 }, { opacity: 1, scale: 1, duration: M.base * 0.85, ease: M.enter,
            onComplete: () => setTransitioning(false),
          });
        },
      });
    } else {
      const outY = -M.outY;
      const inY  = -M.inY;
      gsap.to(area, { opacity: 0, y: outY, duration: M.base * 0.45, ease: M.exit,
        onComplete: () => {
          dispatch({ type: "SET_BEAT", beat, direction: dir });
          gsap.fromTo(area, { opacity: 0, y: inY }, { opacity: 1, y: 0, duration: M.base * 0.85, ease: M.enter,
            onComplete: () => setTransitioning(false),
          });
        },
      });
    }
  }, [transitioning, rm]);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): string {
    const { beat, patient, device, testId, answers } = state;
    if (beat === 1 && !patient)     return "Please select a patient.";
    if (beat === 2 && !device)      return "Please connect a device.";
    if (beat === 3 && !testId)      return "Please choose a test type.";
    if (beat === 10) return ""; // demographics review — always valid
    if (beat === 4 && !answers.gender) return "Please select a gender.";
    if (beat === 5) {
      if (!answers.dob) return "Date of birth is required.";
      if (!calcAge(answers.dob)) return "Enter a valid date (MM/DD/YYYY).";
    }
    if (beat === 6) {
      const w = parseFloat(answers.weight);
      if (!answers.weight) return "Weight is required.";
      if (isNaN(w) || w < 50 || w > 600) return "Weight must be between 50 and 600 lbs.";
    }
    if (beat === 7) {
      const ft = parseFloat(answers.heightFt);
      const ins = parseFloat(answers.heightIn);
      if (!answers.heightFt) return "Height (ft) is required.";
      if (isNaN(ft) || ft < 3 || ft > 8) return "Enter a valid height.";
      if (answers.heightIn && (isNaN(ins) || ins < 0 || ins > 11)) return "Inches must be 0–11.";
    }
    if (beat === 8 && !answers.ethnicity && !ETHNICITIES[0]) return "Please select an ethnicity.";
    return "";
  }

  function handleNext() {
    if (transitioning) return;
    const err = validate();
    if (err) {
      setFieldError(err);
      // shake the step area
      if (stepAreaRef.current && !rm) {
        stepAreaRef.current.classList.remove("gf-shake");
        void stepAreaRef.current.offsetWidth;
        stepAreaRef.current.classList.add("gf-shake");
        setTimeout(() => stepAreaRef.current?.classList.remove("gf-shake"), 400);
      }
      return;
    }

    // Default ethnicity to first option if not explicitly selected
    if (state.beat === 8 && !state.answers.ethnicity && ETHNICITIES[0]) {
      dispatch({ type: "SET_ANSWER", key: "ethnicity", value: ETHNICITIES[0] });
    }

    // Editing a field from demographics review — save & return to beat 10
    if (editingFromDemographics && [4, 5, 6, 7, 8].includes(state.beat)) {
      setEditingFromDemographics(false);
      goToBeat(10, "back");
      return;
    }

    if (state.beat === 9) {
      handleStart();
      return;
    }

    // After test selection → skip to demographics review (beat 10)
    if (state.beat === 3) {
      if (state.patient) {
        const prefilled = buildInitialAnswers(state.patient);
        Object.entries(prefilled).forEach(([k, v]) => {
          if (v) dispatch({ type: "SET_ANSWER", key: k as keyof Answers, value: v });
        });
      }
      goToBeat(10, "forward");
      return;
    }

    // Demographics review → All Set
    if (state.beat === 10) {
      goToBeat(9, "forward");
      return;
    }

    goToBeat((state.beat + 1) as Beat, "forward");
  }

  function handleBack() {
    if (transitioning || state.beat <= 1) return;
    // Editing from demographics — back without saving returns to beat 10
    if (editingFromDemographics && [4, 5, 6, 7, 8].includes(state.beat)) {
      setEditingFromDemographics(false);
      goToBeat(10, "back");
      return;
    }
    if (state.beat === 10) { goToBeat(3, "back"); return; }
    if (state.beat === 9)  { goToBeat(10, "back"); return; }
    goToBeat((state.beat - 1) as Beat, "back");
  }

  function handleStart() {
    if (!state.patient || !state.device) return;
    // Circular reveal from the Start/Next button
    if (nextBtnRef.current && !rm) {
      const rect = nextBtnRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const mask = document.createElement("div");
      mask.style.cssText = `position:fixed;inset:0;z-index:9999;background:white;
        clip-path:circle(0px at ${cx}px ${cy}px);pointer-events:none;`;
      document.body.appendChild(mask);
      gsap.to(mask, {
        clipPath: `circle(200vmax at ${cx}px ${cy}px)`,
        duration: M.slow,
        ease: "power3.inOut",
        onComplete: () => {
          onStart(state.patient!, state.device!, state.testLabel, state.answers);
          mask.remove();
        },
      });
    } else {
      onStart(state.patient!, state.device!, state.testLabel, state.answers);
    }
  }

  // ── Magnetic pull on Next (pointer:fine) ────────────────────────────────────
  const qX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const qY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  useEffect(() => {
    if (!nextBtnRef.current || rm) return;
    qX.current = gsap.quickTo(nextBtnRef.current, "x", { duration: 0.4, ease: M.morph });
    qY.current = gsap.quickTo(nextBtnRef.current, "y", { duration: 0.4, ease: M.morph });
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !nextBtnRef.current) return;
      const rect = nextBtnRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 100) {
        qX.current?.(dx * 0.18);
        qY.current?.(dy * 0.18);
      } else {
        qX.current?.(0);
        qY.current?.(0);
      }
    }
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (nextBtnRef.current) gsap.set(nextBtnRef.current, { x: 0, y: 0 });
    };
  }, [rm]);

  // ── Pulse Next when becomes valid ──────────────────────────────────────────
  const isValid = validate() === "";
  const wasValid = useRef(false);
  useEffect(() => {
    if (isValid && !wasValid.current && nextBtnRef.current && !rm) {
      nextBtnRef.current.classList.remove("gf-next-pulse");
      void nextBtnRef.current.offsetWidth;
      nextBtnRef.current.classList.add("gf-next-pulse");
    }
    wasValid.current = isValid;
  }, [isValid]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showExit) { setShowExit(false); return; }
        handleCloseRequest();
      }
      if (e.key === "Enter" && document.activeElement === nextBtnRef.current) {
        handleNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = Array.from(container!.querySelectorAll<HTMLElement>(
        'button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", trapFocus);
    return () => container.removeEventListener("keydown", trapFocus);
  }, []);

  // ── Trail chips ────────────────────────────────────────────────────────────
  const chips: TrailChip[] = [];
  if (state.patient && state.beat > 1)  chips.push({ id: "patient",  label: state.patient.name, initials: state.patient.initials, beat: 1 });
  if (state.device  && state.beat > 2)  chips.push({ id: "device",   label: state.device.serial.slice(-6),  beat: 2 });
  if (state.testLabel && state.beat > 3) chips.push({ id: "test",    label: state.testLabel.split(" ")[0],   beat: 3 });
  if (state.beat === 9) chips.push({ id: "demographics", label: "Demographics", beat: 10 });

  // ── Headline & helper copy per beat ───────────────────────────────────────
  const firstName = state.patient?.name.split(" ")[0] ?? "Patient";
  const HEADLINES: Record<number, string> = {
    1: "Who are we assessing today?",
    2: "",  // heading lives inside Beat2Device
    3: "Choose the test.",
    4: `${firstName}'s gender?`,
    5: "Date of birth?",
    6: "Body weight?",
    7: "Height?",
    8: "Ethnicity?",
    9: `All set, ${firstName}.`,
    10: `${firstName}'s demographics.`,
  };
  const HELPERS: Record<number, string> = {
    1: "Search by name or MRN.",
    2: "",
    3: "Select the protocol for this assessment.",
    4: "Used to calculate predicted values.",
    5: "Used to calculate age and predicted values.",
    6: "Used to calculate predicted values. Valid range: 50–600 lbs.",
    7: "Used to calculate predicted values.",
    8: "Used to calculate predicted values.",
    9: "Have the patient seated upright.",
    10: "",
  };

  function handleCloseRequest() {
    const hasAnswers = state.patient || state.device || state.testId;
    if (hasAnswers) { setShowExit(true); return; }
    doClose();
  }

  function doClose() {
    if (rm) { onClose(); return; }
    if (backdropRef.current) gsap.to(backdropRef.current, { opacity: 0, duration: M.base * 0.6, onComplete: onClose });
  }

  // ── Update answers when patient changes ───────────────────────────────────
  useEffect(() => {
    if (state.patient && state.beat === 2) {
      const prefilled = buildInitialAnswers(state.patient);
      Object.entries(prefilled).forEach(([k, v]) => {
        if (v) dispatch({ type: "SET_ANSWER", key: k as keyof Answers, value: v });
      });
    }
  }, [state.patient]);

  const isBeat9 = state.beat === 9;
  const isEditSave = editingFromDemographics && [4, 5, 6, 7, 8].includes(state.beat);
  const nextLabel = isBeat9 ? "Start" : "→";

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" aria-label="ARA Assessment Guide"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ fontFamily: SF }}>

      {/* Backdrop + aurora layer */}
      <div ref={backdropRef} className="absolute inset-0" style={{ opacity: 0 }}>
        {/* Gradient backdrop — 90% opaque */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(236,252,255,0.92) 0%, rgba(244,255,248,0.90) 48%, rgba(252,255,240,0.92) 100%)",
          backdropFilter: "blur(22px) saturate(1.5)",
          WebkitBackdropFilter: "blur(22px) saturate(1.5)",
        }} />
        {/* Aurora blobs */}
        <AuroraBlob color="rgba(0,122,139,0.28)"   size={520} top="20%"  left="18%"  delay={0} />
        <AuroraBlob color="rgba(58,175,77,0.22)"   size={480} top="65%"  left="72%"  delay={4} />
        <AuroraBlob color="rgba(168,203,56,0.18)"  size={460} top="40%"  left="85%"  delay={8} />
        <AuroraBlob color="rgba(0,122,139,0.15)"   size={400} top="80%"  left="30%"  delay={12} />
      </div>

      {/* Content layer */}
      <div ref={contentRef} className="relative flex flex-col h-full" style={{ opacity: 0 }}>

        {/* Top bar: trail + close */}
        <div className="flex items-center justify-between px-10 pt-7 pb-3 shrink-0">
          {/* Answer trail */}
          <div className="flex items-center gap-2 overflow-x-auto gf-no-scroll" style={{ maxWidth: "calc(100% - 60px)" }}>
            {chips.map(chip => (
              <TrailChipEl key={chip.id} chip={chip} onClick={() => goToBeat(chip.beat, "back")} />
            ))}
          </div>
          {/* Close */}
          <button ref={closeBtnRef} onClick={handleCloseRequest} aria-label="Close guide"
            className="size-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors shrink-0 ml-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Step announce */}
        <p className="sr-only" aria-live="polite">
          {`Step ${BEAT_STEP[state.beat] ?? state.beat} of 7 — ${STEP_LABELS[state.beat] ?? ""}`}
        </p>

        {/* Main content area */}
        <div className="flex flex-col flex-1 items-center justify-start px-10 pt-8 pb-6 min-h-0 overflow-hidden">
          {/* Headline */}
          <h1 key={state.beat} ref={headlineRef}
            className="text-center font-semibold mb-3 leading-tight"
            style={{ fontSize: 48, letterSpacing: "-0.02em", maxWidth: 760, lineHeight: 1.12, color: "rgba(0,0,0,0.60)" }}>
            {HEADLINES[state.beat] ?? ""}
          </h1>
          {/* Helper */}
          {!fieldError && (
            <p ref={helperRef} className="text-[18px] text-center mb-8" style={{ color: "rgba(0,0,0,0.45)" }}>
              {HELPERS[state.beat] ?? ""}
            </p>
          )}
          {fieldError && (
            <p className="text-[#FF6B6B] text-[18px] text-center mb-8">{fieldError}</p>
          )}

          {/* Step area */}
          <div ref={stepAreaRef} className="flex flex-col items-center w-full flex-1 min-h-0" style={{ maxWidth: 760 }}>
            {state.beat === 1 && (
              <Beat1Patient
                initial={state.patient}
                onSelect={p => {
                  dispatch({ type: "SET_PATIENT", patient: p });
                  setTimeout(() => goToBeat(2, "forward"), 300);
                }}
              />
            )}
            {state.beat === 2 && (
              <Beat2Device
                onSelect={d => {
                  dispatch({ type: "SET_DEVICE", device: d });
                  setTimeout(() => goToBeat(3, "forward"), 500);
                }}
              />
            )}
            {state.beat === 3 && (
              <Beat3Test
                current={state.testId}
                onSelect={(id, label) => {
                  dispatch({ type: "SET_TEST", testId: id, testLabel: label });
                }}
              />
            )}
            {state.beat === 4 && (
              <Beat4Gender
                value={state.answers.gender}
                onChange={v => dispatch({ type: "SET_ANSWER", key: "gender", value: v })}
              />
            )}
            {state.beat === 5 && (
              <Beat5DOB
                value={state.answers.dob}
                onChange={v => dispatch({ type: "SET_ANSWER", key: "dob", value: v })}
                error={fieldError || undefined}
              />
            )}
            {state.beat === 6 && (
              <Beat6Weight
                value={state.answers.weight}
                onChange={v => dispatch({ type: "SET_ANSWER", key: "weight", value: v })}
                error={fieldError || undefined}
              />
            )}
            {state.beat === 7 && (
              <Beat7Height
                ft={state.answers.heightFt}
                inches={state.answers.heightIn}
                onChangeFt={v => dispatch({ type: "SET_ANSWER", key: "heightFt", value: v })}
                onChangeIn={v => dispatch({ type: "SET_ANSWER", key: "heightIn", value: v })}
                error={fieldError || undefined}
              />
            )}
            {state.beat === 8 && (
              <Beat8Ethnicity
                value={state.answers.ethnicity || ETHNICITIES[0]}
                onChange={v => dispatch({ type: "SET_ANSWER", key: "ethnicity", value: v })}
              />
            )}
            {state.beat === 9 && state.patient && state.device && (
              <Beat9Ready
                patient={state.patient}
                device={state.device}
                testLabel={state.testLabel}
                answers={state.answers}
              />
            )}
            {state.beat === 10 && state.patient && (
              <Beat10Demographics
                answers={state.answers}
                patientFirstName={state.patient.name.split(" ")[0]}
                onChange={(key, value) => dispatch({ type: "SET_ANSWER", key, value })}
                onEditBeat={beat => { setEditingFromDemographics(true); goToBeat(beat as Beat, "forward"); }}
              />
            )}

            {/* ── Control cluster (inline, right-aligned) ── */}
            <div className="flex items-center gap-4 mt-8 self-end">
              {/* Back */}
              {state.beat > 1 && (
                <button onClick={handleBack} aria-label="Go back"
                  className="flex items-center gap-2 hover:opacity-70 active:scale-95 transition-all"
                  style={{ color: "#007A8B" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  <span className="text-[17px] font-semibold" style={{ fontFamily: SF }}>Back</span>
                </button>
              )}
              {/* Next / Start — hidden during patient search (1) and device scan (2) */}
              {state.beat !== 1 && state.beat !== 2 && (
                <div className="relative" style={{ width: 88, height: 88 }}>
                  <ProgressRing beat={state.beat} radius={44} />
                  <button
                    ref={nextBtnRef}
                    onClick={handleNext}
                    aria-label={isBeat9 ? "Start test" : isEditSave ? "Save and return" : "Next step"}
                    className="relative size-full rounded-full flex items-center justify-center text-white text-[26px] font-bold transition-opacity"
                    style={{
                      background: GRADIENT,
                      opacity: isValid ? 1 : 0.45,
                      boxShadow: "0 8px 32px rgba(0,122,139,0.35)",
                      width: 88,
                      height: 88,
                      borderRadius: 9999,
                    }}
                  >
                    {isBeat9
                      ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      : isEditSave
                        ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirm */}
      {showExit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="gf-rect px-8 py-7 flex flex-col gap-5" style={{ width: 360, borderRadius: 24 }}>
            <p className="text-[#434343] text-[19px] font-semibold text-center" style={{ fontFamily: SF }}>Exit guide?</p>
            <p className="text-[#6E6F72] text-[16px] text-center" style={{ fontFamily: SF }}>Your answers will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowExit(false)}
                className="gf-capsule flex-1 h-[52px] text-[#007A8B] text-[16px] font-semibold hover:brightness-95"
                style={{ fontFamily: SF }}>Keep guide</button>
              <button onClick={() => { setShowExit(false); doClose(); }}
                className="flex-1 h-[52px] rounded-full text-white text-[16px] font-semibold"
                style={{ background: GRADIENT, fontFamily: SF }}>Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
