import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { PATIENTS, Patient } from "../data";
import { M } from "../motion";

const SF = "system-ui,-apple-system,sans-serif";

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="gf-match bg-transparent">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Active: "#3AAF4D",
  Pending: "#F59E0B",
  Discharge: "#8B8C8E",
};

interface Props {
  onSelect: (p: Patient) => void;
  initial?: Patient | null;
}

export default function Beat1Patient({ onSelect, initial }: Props) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const transitioning = useRef(false);

  const rawFiltered = query.trim().length >= 1
    ? PATIENTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) || p.mrn.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  // Displayed list — updated after exit animation to create slide-fade in/out
  const [filtered, setFiltered] = useState<Patient[]>([]);

  // Animate items in when filtered list is updated
  useEffect(() => {
    if (!listRef.current || filtered.length === 0) return;
    const items = Array.from(itemRefs.current.values()).filter(Boolean);
    gsap.fromTo(items,
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: M.base * 0.65, stagger: M.stagger * 0.5, ease: M.enter },
    );
  }, [filtered]);
  const animating = useRef(false);
  const pendingFiltered = useRef<Patient[]>([]);

  useEffect(() => {
    pendingFiltered.current = rawFiltered;
    if (animating.current) return;

    // No items currently visible — just set directly
    if (filtered.length === 0) {
      setFiltered(rawFiltered);
      return;
    }

    // No new items — clear directly
    if (rawFiltered.length === 0) {
      setFiltered([]);
      return;
    }

    // Exit current items, then swap in new ones
    animating.current = true;
    const items = Array.from(itemRefs.current.values()).filter(Boolean);
    if (items.length > 0) {
      gsap.to(items, {
        opacity: 0, y: -10, scale: 0.96,
        duration: M.micro * 1.5,
        stagger: M.stagger * 0.3,
        ease: M.exit,
        onComplete: () => {
          animating.current = false;
          setFiltered(pendingFiltered.current);
        },
      });
    } else {
      animating.current = false;
      setFiltered(pendingFiltered.current);
    }
  }, [query]);

  function handleSelect(p: Patient) {
    if (transitioning.current) return;
    transitioning.current = true;
    setSelectedMrn(p.mrn);

    const key = p.mrn;
    const el = itemRefs.current.get(key);

    // Dissolve the others
    const others = Array.from(itemRefs.current.values()).filter(e => e && e !== el);
    gsap.to(others, { opacity: 0, scale: 0.88, duration: M.micro * 2, stagger: M.stagger * 0.5, ease: M.exit });

    // Scale up chosen capsule briefly then trigger parent
    if (el) {
      gsap.to(el, {
        scale: 1.025,
        duration: M.micro,
        ease: M.pop,
        onComplete: () => {
          gsap.to(el, { scale: 1, duration: M.micro, onComplete: () => onSelect(p) });
        },
      });
    } else {
      onSelect(p);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && filtered[highlighted]) handleSelect(filtered[highlighted]);
  }

  return (
    <div className="flex flex-col w-full flex-1 min-h-0" style={{ maxWidth: 760, gap: 16 }}>
      {/* Search capsule — fixed */}
      <div className="gf-rect w-full flex items-center gap-4 px-6 shrink-0" style={{ height: 96 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B8C8E" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
          onKeyDown={onKeyDown}
          placeholder="Search patient by name or MRN…"
          aria-label="Search patient"
          className="flex-1 bg-transparent text-[22px] placeholder-[#8B8C8E]"
          style={{ fontFamily: SF, color: "#434343", letterSpacing: "-0.01em", outline: "none", border: "none" }}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear" className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8C8E" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {/* Helper / empty state */}
      {!query && (
        <div className="flex flex-col items-center gap-3 py-6 shrink-0">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontFamily: SF, color: "rgba(0,0,0,0.40)", fontSize: 17 }}>
            Type a name or MRN — try <span style={{ color: "rgba(0,0,0,0.65)", fontWeight: 600 }}>Barry</span>, <span style={{ color: "rgba(0,0,0,0.65)", fontWeight: 600 }}>Kate</span>, or <span style={{ color: "rgba(0,0,0,0.65)", fontWeight: 600 }}>Grace</span>
          </p>
        </div>
      )}

      {/* Results — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto gf-no-scroll" style={{ paddingTop: 4, paddingBottom: 16, paddingLeft: 14, paddingRight: 14, marginLeft: -14, marginRight: -14, width: "calc(100% + 28px)" }}>
        <div ref={listRef} className="flex flex-col gap-3 w-full" aria-live="polite">
          {filtered.length === 0 && query.trim().length >= 1 && (
            <div className="gf-capsule flex items-center justify-center" style={{ height: 84 }}>
              <span className="text-[#8B8C8E] text-[18px]" style={{ fontFamily: SF }}>No patient found for "{query}"</span>
            </div>
          )}
          {filtered.map((p, i) => {
            const key = p.mrn;
            const isFirst = i === 0;
            return (
              <div
                key={key}
                ref={el => { if (el) itemRefs.current.set(key, el); else itemRefs.current.delete(key); }}
                onClick={() => handleSelect(p)}
                onKeyDown={e => e.key === "Enter" && handleSelect(p)}
                tabIndex={0}
                role="option"
                aria-selected={highlighted === i}
                className={`gf-capsule flex items-center gap-5 px-7 cursor-pointer transition-all ${selectedMrn === key ? "gf-capsule-selected" : ""}`}
                style={{
                  height: isFirst ? 96 : 80,
                  opacity: isFirst ? 1 : 0.85,
                  boxShadow: selectedMrn === key
                    ? "0 20px 56px rgba(0,122,139,0.38), 0 6px 20px rgba(0,0,0,0.12)"
                    : isFirst
                      ? "0 24px 64px rgba(0,122,139,0.28), 0 4px 16px rgba(0,0,0,0.12)"
                      : "0 8px 24px rgba(0,122,139,0.10)",
                  outline: highlighted === i ? "3px solid rgba(0,122,139,0.45)" : "none",
                  outlineOffset: 2,
                  transform: selectedMrn === key ? "scale(1.02)" : "scale(1)",
                }}
              >
              {/* Avatar */}
              <div
                className="rounded-full flex items-center justify-center shrink-0 font-bold text-white"
                style={{
                  width: isFirst ? 52 : 44,
                  height: isFirst ? 52 : 44,
                  fontSize: isFirst ? 19 : 16,
                  background: selectedMrn === key ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg,#007A8B,#3AAF4D)",
                }}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ fontFamily: SF, fontSize: isFirst ? 20 : 17, color: selectedMrn === key ? "white" : "#434343" }}>
                  {highlight(p.name, query)}
                </p>
                <p style={{ fontFamily: SF, fontSize: isFirst ? 14 : 13, color: selectedMrn === key ? "rgba(255,255,255,0.75)" : "#8B8C8E" }}>
                  {highlight(p.mrn, query)} · {p.planOfCare} · {p.admissionDate}
                </p>
              </div>
              {/* Status dot */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="size-2 rounded-full" style={{ backgroundColor: selectedMrn === key ? "rgba(255,255,255,0.6)" : (STATUS_COLORS[p.status] ?? "#8B8C8E") }} />
                <span style={{ fontFamily: SF, fontSize: isFirst ? 15 : 13, color: selectedMrn === key ? "rgba(255,255,255,0.85)" : (STATUS_COLORS[p.status] ?? "#8B8C8E") }}>{p.status}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
