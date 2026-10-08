import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { M, ms } from "../motion";
import type { StepApi } from "../flows/types";
import { ArrowUpRightIcon } from "./icons";

export interface ChoiceOption {
  id: string;
  title: string;
  description?: string;
}

export interface ChoiceStepProps<C extends object> extends StepApi<C> {
  options: ChoiceOption[];
  toContext: (option: ChoiceOption) => Partial<C>;
}

export default function ChoiceStep<C extends object>(p: ChoiceStepProps<C>) {
  const { options, reducedMotion: rm, setCommandHandler } = p;
  const [selected, setSelected] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    const els = rowRef.current ? Array.from(rowRef.current.children) : [];
    gsap.fromTo(els,
      rm ? { opacity: 0 } : { opacity: 0, y: M.itemRise },
      { opacity: 1, y: 0, duration: M.itemIn, stagger: M.stagger, ease: M.stepInEase, clearProps: "transform" });
  }, [rm]);

  function pick(o: ChoiceOption) {
    if (selected) return;
    setSelected(o.id);
    timer.current = window.setTimeout(() => p.complete(p.toContext(o)), ms(M.select + M.selectHold));
  }

  // External "choose" (e.g. the assistant's Choose … chip)
  const pickRef = useRef(pick);
  pickRef.current = pick;
  useEffect(() => {
    setCommandHandler(cmd => {
      const option = cmd.type === "choose" ? options.find(o => o.id === cmd.value) : undefined;
      if (!option) return false;
      pickRef.current(option);
      return true;
    });
    return () => setCommandHandler(null);
  }, [setCommandHandler, options]);

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 120, paddingBottom: 160 }}>
      <div ref={rowRef} role="radiogroup" className="flex flex-wrap justify-center" style={{ gap: 36 }}>
        {options.map(o => {
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={isSel}
              onClick={() => pick(o)}
              className={`gf-surface gf-card relative flex flex-col items-start text-left ${isSel ? "gf-selected" : "hover:scale-105 active:scale-105"}`}
              style={{
                width: 400, minHeight: 212, padding: "34px 64px 30px 34px", gap: 14,
                opacity: selected && !isSel ? M.dimOpacity : 1,
                transition: selected
                  ? `transform ${M.select}s ease, background-color ${M.select}s ease, opacity ${M.select}s ease`
                  : `transform ${M.select}s ease, background-color ${M.select}s ease`,
              }}
            >
              <span className="text-[23px] font-semibold leading-tight">{o.title}</span>
              {o.description && <span className="gf-muted text-[18px] leading-snug">{o.description}</span>}
              <span className="absolute" style={{ top: 26, right: 26 }}><ArrowUpRightIcon size={26} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
