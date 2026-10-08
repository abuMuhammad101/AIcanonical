import React, { useState } from "react";
import { TEST_TYPES } from "../data";

const SF = "system-ui,-apple-system,sans-serif";

interface Props {
  onSelect: (id: string, label: string) => void;
  current?: string;
}

export default function Beat3Test({ onSelect, current }: Props) {
  const [sel, setSel] = useState<string | undefined>(current);
  const [expanded, setExpanded] = useState<string | null>(null);

  function choose(t: typeof TEST_TYPES[0]) {
    setSel(t.id);
    onSelect(t.id, t.label);
  }

  return (
    <div className="flex flex-col gap-4 w-full" style={{ maxWidth: 720 }}>
      {TEST_TYPES.map(t => {
        const isSelected = sel === t.id;
        const isExpanded = expanded === t.id;
        return (
          <div
            key={t.id}
            onClick={() => choose(t)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && choose(t)}
            className={`gf-capsule flex flex-col cursor-pointer hover:brightness-[0.97] transition-all overflow-hidden ${isSelected ? "gf-capsule-selected" : ""}`}
            style={{ borderRadius: 28, padding: "0 32px" }}
          >
            <div className="flex items-center" style={{ height: 96 }}>
              {/* Radio indicator */}
              <div className="size-6 rounded-full border-2 shrink-0 flex items-center justify-center mr-5 transition-colors"
                style={{ borderColor: isSelected ? "rgba(255,255,255,0.9)" : "#C5C5C7" }}>
                {isSelected && <div className="size-3 rounded-full bg-white" />}
              </div>
              <span className="text-[21px] font-semibold flex-1" style={{ fontFamily: SF, color: isSelected ? "white" : "#007A8B" }}>
                {t.label}
              </span>
              {/* Info toggle */}
              <button
                onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : t.id); }}
                aria-label="More info"
                className="size-9 rounded-full flex items-center justify-center shrink-0 hover:bg-black/10 transition-colors"
                style={{ background: isSelected ? "rgba(255,255,255,0.2)" : "rgba(0,122,139,0.08)" }}
              >
                <span className="text-[14px] font-bold" style={{ color: isSelected ? "white" : "#007A8B" }}>?</span>
              </button>
            </div>
            {isExpanded && (
              <div className="pb-5">
                <p className="text-[16px] leading-relaxed" style={{ fontFamily: SF, color: isSelected ? "rgba(255,255,255,0.85)" : "#6E6F72" }}>
                  {t.desc}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
