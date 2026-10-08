import React from "react";

const SF = "system-ui,-apple-system,sans-serif";

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function Beat6Weight({ value, onChange, error }: Props) {
  const num = parseFloat(value) || 0;

  function step(delta: number) {
    const next = Math.max(50, Math.min(600, num + delta));
    onChange(String(next));
  }

  return (
    <div className="flex flex-col items-center gap-4" style={{ maxWidth: 600, width: "100%" }}>
      <div className="gf-rect flex items-center px-8 gap-4 w-full" style={{ height: 96 }}>
        <button onClick={() => step(-1)} className="gf-stepper shrink-0" aria-label="Decrease weight">−</button>
        <input
          autoFocus
          type="number"
          min={50}
          max={600}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Weight in pounds"
          className="flex-1 bg-transparent outline-none text-[36px] text-center"
          style={{ fontFamily: SF, color: "#434343", minWidth: 0 }}
        />
        <span className="text-[22px] text-[#8B8C8E] shrink-0" style={{ fontFamily: SF }}>lbs</span>
        <button onClick={() => step(1)} className="gf-stepper shrink-0" aria-label="Increase weight">+</button>
      </div>
      {error && <p className="text-[#EA4A4A] text-[16px] self-start" style={{ fontFamily: SF }}>{error}</p>}
      <p className="text-[#8B8C8E] text-[16px]" style={{ fontFamily: SF }}>Valid range: 50–600 lbs. Required to start the test.</p>
    </div>
  );
}
