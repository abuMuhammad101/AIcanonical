import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { M, ms } from "../motion";
import type { StepApi } from "../flows/types";
import { SearchIcon } from "./icons";

export type StatusTone = "positive" | "warning" | "neutral";

export interface SearchStepProps<T, C extends object> extends StepApi<C> {
  items: T[];
  placeholder: string;
  /** Plural noun for announcements and the empty state, e.g. "patients". */
  noun: string;
  maxResults?: number;
  getKey: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string[];
  getInitials: (item: T) => string;
  getStatus?: (item: T) => { label: string; tone: StatusTone };
  matches: (item: T, query: string) => boolean;
  toContext: (item: T) => Partial<C>;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="gf-match">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

const PILL_W = 700;
const PILL_W_SELECTED = 744;

export default function SearchStep<T, C extends object>(p: SearchStepProps<T, C>) {
  const { items, maxResults = 4, getKey, setDirty, announce, reducedMotion: rm } = p;
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(undefined);

  useEffect(() => { setDirty(query.length > 0); }, [query, setDirty]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Live filtering, debounced
  useEffect(() => {
    const t = window.setTimeout(() => { setTerm(query.trim()); setActive(0); }, ms(M.searchDebounce));
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => (term ? items.filter(it => p.matches(it, term)).slice(0, maxResults) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [term, items, maxResults],
  );
  const resultsKey = results.map(getKey).join("|");

  useEffect(() => {
    if (!term) return;
    announce(results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : `No ${p.noun} match ${term}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsKey, term]);

  useLayoutEffect(() => {
    const els = listRef.current ? Array.from(listRef.current.children) : [];
    if (!els.length) return;
    gsap.fromTo(els,
      rm ? { opacity: 0 } : { opacity: 0, y: M.itemRise },
      { opacity: 1, y: 0, duration: M.itemIn, stagger: M.stagger, ease: M.stepInEase });
  }, [resultsKey, rm]);

  function pick(item: T) {
    if (selected) return;
    setSelected(getKey(item));
    timer.current = window.setTimeout(() => p.complete(p.toContext(item)), ms(M.select + M.selectHold));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); pick(results[active]); }
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
      style={{ top: "min(270px, 24vh)", width: 800, maxWidth: "calc(100vw - 32px)" }}>

      <label className="gf-glass gf-pill w-full flex items-center gap-4" style={{ height: 100, padding: "0 36px" }}>
        <span className="gf-muted shrink-0"><SearchIcon size={30} /></span>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={p.placeholder}
          aria-label={p.placeholder}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="gf-search-results"
          aria-activedescendant={results[active] ? `gf-opt-${getKey(results[active])}` : undefined}
          disabled={selected !== null}
          className="flex-1 min-w-0 bg-transparent text-[26px] outline-none border-none"
          style={{ color: "var(--gf-text)", boxShadow: "none" }}
        />
      </label>

      <div ref={listRef} id="gf-search-results" role="listbox" aria-label={`Matching ${p.noun}`}
        className="flex flex-col items-center w-full" style={{ gap: 18, marginTop: 34 }}>
        {term && results.length === 0 && (
          <p className="gf-muted text-[20px] text-center" style={{ paddingTop: 12 }}>
            No {p.noun} match &lsquo;{term}&rsquo;
          </p>
        )}
        {results.map((item, i) => {
          const key = getKey(item);
          const isSel = selected === key;
          const status = p.getStatus?.(item);
          return (
            <button
              key={key}
              id={`gf-opt-${key}`}
              role="option"
              aria-selected={isSel || (selected === null && i === active)}
              tabIndex={-1}
              onClick={() => pick(item)}
              onMouseEnter={() => selected === null && setActive(i)}
              className={`gf-glass gf-pill flex items-center gap-5 text-left ${isSel ? "gf-selected" : ""}`}
              style={{
                width: isSel ? PILL_W_SELECTED : PILL_W,
                maxWidth: "100%",
                height: isSel ? 108 : 100,
                padding: "0 32px 0 18px",
                transform: "none",
                opacity: selected && !isSel ? M.dimOpacity : 1,
                transition: selected
                  ? `width ${M.select}s ease, height ${M.select}s ease, opacity ${M.select}s ease, background-color ${M.select}s ease`
                  : undefined,
                outline: selected === null && i === active && term ? "1px solid var(--gf-text)" : "none",
                outlineOffset: -1,
              }}
            >
              <span className="rounded-full flex items-center justify-center shrink-0 text-[20px] font-medium"
                style={{
                  width: 64, height: 64,
                  background: isSel ? "rgba(0,0,0,0.07)" : "var(--gf-selected-bg)",
                  color: "var(--gf-selected-text)",
                }}>
                {p.getInitials(item)}
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-[21px] font-semibold truncate"><Highlight text={p.getTitle(item)} query={isSel ? "" : term} /></span>
                <span className="gf-muted text-[16px] flex items-center gap-2 min-w-0">
                  {p.getSubtitle(item).map((part, j) => (
                    <span key={j} className="flex items-center gap-2 min-w-0">
                      {j > 0 && <span aria-hidden="true" style={{ width: 1, height: 14, background: "currentColor", opacity: 0.6 }} />}
                      <span className="truncate">{part}</span>
                    </span>
                  ))}
                </span>
              </span>
              {status && (
                <span className="flex items-center gap-2 shrink-0 text-[16px]">
                  <span className="rounded-full" aria-hidden="true"
                    style={{ width: 6, height: 6, background: `var(--gf-status-${status.tone})` }} />
                  {status.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
