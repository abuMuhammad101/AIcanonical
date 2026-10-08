import React from "react";

const SF = "system-ui,-apple-system,sans-serif";
const OPTIONS = ["Male", "Female", "Other"];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Beat4Gender({ value, onChange }: Props) {
  return (
    <div className="flex gap-4 justify-center flex-wrap" style={{ maxWidth: 720 }}>
      {OPTIONS.map(opt => {
        const isSel = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            role="radio"
            aria-checked={isSel}
            className={`gf-capsule flex items-center justify-center cursor-pointer transition-all ${isSel ? "gf-capsule-selected" : "opacity-80 hover:opacity-100"}`}
            style={{ height: 84, minWidth: 200, paddingLeft: 40, paddingRight: 40, borderRadius: 9999 }}
          >
            <span className="text-[21px] font-semibold" style={{ fontFamily: SF, color: isSel ? "white" : "#434343" }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
