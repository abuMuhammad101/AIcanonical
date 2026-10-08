import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { M } from "../motion";
import type { StepApi } from "../flows/types";
import { ArrowUpRightIcon, PencilIcon } from "./icons";
import type { PickerSpec, Values } from "./pickers/shared";
import OptionPicker from "./pickers/OptionPicker";
import DatePicker from "./pickers/DatePicker";
import NumberPicker from "./pickers/NumberPicker";
import HeightPicker from "./pickers/HeightPicker";

export interface ReviewField {
  id: string;
  label: string;
  required?: boolean;
  /** Tile value; "" means missing. */
  display: (values: Values) => string;
  picker: PickerSpec;
}

export interface ReviewStepProps<C extends object> extends StepApi<C> {
  fields: ReviewField[];
  initialValues: (context: Readonly<C>) => Values;
  toContext: (values: Values) => Partial<C>;
  proceedLabel: string;
}

const TILE_W = 220;
const TILE_H = 146;
const GAP = 20;
// Proceed button and its rings at their largest (Figma state B)
const PROCEED = 120;
const RING_INNER = 170;
const RING_OUTER = 200;

function Picker({ field, values, onConfirm, flipId }: { field: ReviewField; values: Values; onConfirm: (p: Values) => void; flipId: string }) {
  const spec = field.picker;
  switch (spec.kind) {
    case "options": return <OptionPicker spec={spec} values={values} onConfirm={onConfirm} flipId={flipId} />;
    case "date": return <DatePicker spec={spec} values={values} onConfirm={onConfirm} flipId={flipId} />;
    case "number": return <NumberPicker spec={spec} values={values} onConfirm={onConfirm} flipId={flipId} />;
    case "height": return <HeightPicker spec={spec} values={values} onConfirm={onConfirm} flipId={flipId} />;
  }
}

export default function ReviewStep<C extends object>(p: ReviewStepProps<C>) {
  const { fields, reducedMotion: rm, setFocusMode, setEscapeHandler, announce } = p;
  const [values, setValues] = useState<Values>(() => p.initialValues(p.context));
  const [editing, setEditing] = useState<number | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  const innerRingRef = useRef<HTMLSpanElement>(null);
  const outerRingRef = useRef<HTMLSpanElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const returnFocus = useRef<number | null>(null);
  const morphing = useRef(false);

  const missing = fields.filter(f => f.required && !f.display(values));
  const ready = missing.length === 0;

  useEffect(() => { setFocusMode(editing !== null); }, [editing, setFocusMode]);
  useEffect(() => () => setEscapeHandler(null), [setEscapeHandler]);

  // Grid entrance
  useLayoutEffect(() => {
    const tiles = surfaceRef.current?.querySelectorAll("[data-flip-id]");
    if (!tiles?.length) return;
    gsap.fromTo(tiles, rm ? { opacity: 0 } : { opacity: 0, y: M.itemRise },
      { opacity: 1, y: 0, duration: M.itemIn, stagger: M.stagger, ease: M.stepInEase, clearProps: "transform" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proceed pulse: three circles breathing through the Figma states
  //   A        button 120, rings tucked behind it
  //   Variant3 button 130, outer ring 150
  //   B        button 140, inner ring 170, outer ring 200
  useLayoutEffect(() => {
    const btn = pulseRef.current, inner = innerRingRef.current, outer = outerRingRef.current;
    if (!btn || !inner || !outer || !ready) return;
    const A = { btn: 1, inner: PROCEED / RING_INNER, outer: PROCEED / RING_OUTER };
    if (rm) {
      // Static Variant3
      gsap.set(btn, { scale: 130 / PROCEED });
      gsap.set(inner, { scale: A.inner });
      gsap.set(outer, { scale: 150 / RING_OUTER });
      return;
    }
    gsap.set(btn, { scale: A.btn });
    gsap.set(inner, { scale: A.inner });
    gsap.set(outer, { scale: A.outer });
    // Built linear, then eased as a whole so it flows through Variant3 without a stop.
    const states = gsap.timeline({ paused: true, defaults: { ease: "none", duration: 1 } })
      .to(btn, { scale: 130 / PROCEED }, 0)
      .to(outer, { scale: 150 / RING_OUTER }, 0)
      .to(btn, { scale: 140 / PROCEED }, 1)
      .to(outer, { scale: 1 }, 1)
      .to(inner, { scale: 1, duration: 0.9 }, 1.1);
    const driver = gsap.to(states, {
      progress: 1, duration: M.proceedPulse, ease: "sine.inOut",
      repeat: -1, yoyo: true, repeatDelay: M.proceedPulseHold,
    });
    return () => { driver.kill(); states.kill(); };
  }, [ready, rm]);

  function capture() {
    const el = surfaceRef.current;
    flipState.current = el ? Flip.getState(el.querySelectorAll("[data-flip-id]")) : null;
  }

  function open(i: number) {
    if (editing !== null || morphing.current) return;
    capture();
    returnFocus.current = i;
    setEditing(i);
    setEscapeHandler(() => close());
    announce(`Editing ${fields[i].label}`);
  }

  function close(patch?: Values) {
    if (morphing.current) return;
    capture();
    if (patch) setValues(v => ({ ...v, ...patch }));
    setEditing(null);
    setEscapeHandler(null);
  }

  // Morph between grid and picker
  useLayoutEffect(() => {
    const state = flipState.current;
    const el = surfaceRef.current;
    if (!state || !el) return;
    flipState.current = null;
    const targets = el.querySelectorAll<HTMLElement>("[data-flip-id]");
    const focusAfter = () => {
      morphing.current = false;
      const target = editing === null
        ? el.querySelector<HTMLElement>(`[data-flip-id="slot-${returnFocus.current}"]`)
        : el.querySelector<HTMLElement>("input,button");
      target?.focus({ preventScroll: true });
    };
    if (rm) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: M.itemIn });
      focusAfter();
      return;
    }
    morphing.current = true;
    Flip.from(state, {
      targets,
      duration: M.flip,
      ease: M.flipEase,
      nested: true,
      onEnter: els => gsap.fromTo(els, { opacity: 0, scale: M.stepScale },
        { opacity: 1, scale: 1, duration: M.itemIn, delay: M.flip * 0.4, stagger: M.stagger }),
      onComplete: focusAfter,
    });
    // Contents of a morphing panel fade in once it has its new shape
    el.querySelectorAll<HTMLElement>("[data-flip-id] > *").forEach(child =>
      gsap.fromTo(child, { opacity: 0 }, { opacity: 1, duration: M.itemIn, delay: M.flip * 0.6 }));
  }, [editing, rm]);

  function proceed() {
    if (!ready || editing !== null || morphing.current) return;
    p.complete(p.toContext(values));
  }

  const field = editing !== null ? fields[editing] : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 120, paddingBottom: 160 }}>
      {/* Surface keeps the grid's footprint so pickers grow from where the tiles were */}
      <div ref={surfaceRef} className="flex justify-center items-start" style={{ minHeight: TILE_H * 2 + GAP }}>
        {field === null ? (
          <div className="grid" style={{ gridTemplateColumns: `repeat(3, ${TILE_W}px)`, gap: GAP }}>
            {fields.map((f, i) => {
              const v = f.display(values);
              return (
                <button
                  key={f.id}
                  data-flip-id={`slot-${i}`}
                  onClick={() => open(i)}
                  aria-label={`${f.label}: ${v || "not set"}. Edit`}
                  className="gf-glass gf-card relative flex flex-col justify-center items-start text-left"
                  style={{ width: TILE_W, height: TILE_H, padding: "18px 22px 18px 24px", gap: 6 }}
                >
                  <span className="absolute gf-muted" style={{ top: 16, right: 16 }}><PencilIcon size={18} /></span>
                  {v ? (
                    <span className="text-[23px] font-bold leading-tight line-clamp-2 break-words">{v}</span>
                  ) : (
                    <span className="text-[23px] font-bold leading-tight gf-muted">Add</span>
                  )}
                  <span className="gf-muted text-[16px]">{f.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Picker field={field} values={values} onConfirm={patch => close(patch)} flipId={`slot-${editing}`} />
        )}
      </div>

      {/* Proceed */}
      <div className="absolute flex items-center justify-center"
        style={{ right: 70, top: "50%", width: PROCEED, height: PROCEED, marginTop: -PROCEED / 2 + (120 - 160) / 2,
          opacity: editing !== null ? 0.4 : 1, transition: "opacity 0.2s ease" }}>
        {ready && editing === null && (
          <>
            <span ref={outerRingRef} aria-hidden="true" className="gf-proceed-ring gf-proceed-ring-outer"
              style={{ width: RING_OUTER, height: RING_OUTER }} />
            <span ref={innerRingRef} aria-hidden="true" className="gf-proceed-ring gf-proceed-ring-inner"
              style={{ width: RING_INNER, height: RING_INNER }} />
          </>
        )}
        <span ref={pulseRef} className="relative flex">
          <button
            onClick={proceed}
            disabled={!ready || editing !== null}
            aria-label={ready ? p.proceedLabel : `${p.proceedLabel} — add ${missing.map(f => f.label).join(", ")} first`}
            className={`relative rounded-full flex items-center justify-center ${ready && editing === null ? "gf-proceed" : "gf-glass"}`}
            style={{ width: PROCEED, height: PROCEED }}
          >
            <ArrowUpRightIcon size={80} strokeWidth={0.9} />
          </button>
        </span>
      </div>
    </div>
  );
}
