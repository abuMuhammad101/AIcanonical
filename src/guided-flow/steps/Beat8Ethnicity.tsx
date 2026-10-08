import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ETHNICITIES } from "../data";

const SF = "system-ui,-apple-system,sans-serif";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Beat8Ethnicity({ value, onChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;
    const lenis = new Lenis({ wrapper: wrapperRef.current, content: contentRef.current });
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);

  // First item is selected by default if nothing chosen yet
  const effectiveValue = value || ETHNICITIES[0];

  return (
    <div className="flex flex-col gap-3 w-full flex-1 min-h-0" style={{ maxWidth: 760 }}>
      <div ref={wrapperRef} className="gf-scroll-region gf-no-scroll flex-1 min-h-0" style={{ maxHeight: 400 }}>
        <div ref={contentRef} className="flex flex-col gap-3 pb-3" style={{ paddingLeft: 14, paddingRight: 14, paddingTop: 4 }}>
          {ETHNICITIES.map((eth, idx) => {
            const isSel = effectiveValue === eth;
            const isFirst = idx === 0;
            return (
              <button
                key={eth}
                onClick={() => onChange(eth)}
                role="radio"
                aria-checked={isSel}
                className={`gf-capsule text-left flex items-center px-7 transition-all w-full ${isSel ? "gf-capsule-selected" : "opacity-85 hover:opacity-100"}`}
                style={{
                  height: isSel ? 84 : isFirst ? 84 : 68,
                  borderRadius: 9999,
                  transform: isSel ? "scale(1.02)" : "scale(1)",
                }}
              >
                {isSel && (
                  <svg className="shrink-0 mr-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                <span style={{ fontFamily: SF, fontSize: isFirst ? 20 : 18, fontWeight: isFirst ? 600 : 500, color: isSel ? "white" : "#434343" }}>{eth}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[#8B8C8E] text-[15px] mt-1 shrink-0" style={{ fontFamily: SF }}>Required to start the test.</p>
    </div>
  );
}
