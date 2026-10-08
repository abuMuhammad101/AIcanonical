import React from "react";

const SF = "system-ui,-apple-system,sans-serif";

interface Props {
  ft: string;
  inches: string;
  onChangeFt: (v: string) => void;
  onChangeIn: (v: string) => void;
  error?: string;
}

function toCm(ft: string, inches: string): string {
  const f = parseFloat(ft) || 0;
  const i = parseFloat(inches) || 0;
  const cm = Math.round((f * 12 + i) * 2.54);
  return cm > 0 ? `${cm} cm` : "";
}

export default function Beat7Height({ ft, inches, onChangeFt, onChangeIn, error }: Props) {
  const cmLabel = toCm(ft, inches);
  return (
    <div className="flex flex-col items-center gap-4" style={{ maxWidth: 600, width: "100%" }}>
      <div className="gf-rect flex items-center px-8 gap-6 w-full" style={{ height: 96 }}>
        <input
          autoFocus
          type="number"
          min={3}
          max={8}
          value={ft}
          onChange={e => onChangeFt(e.target.value)}
          aria-label="Height feet"
          className="w-20 bg-transparent outline-none text-[36px] text-right"
          style={{ fontFamily: SF, color: "#434343" }}
        />
        <span className="text-[28px] text-[#8B8C8E]" style={{ fontFamily: SF }}>ft</span>
        <input
          type="number"
          min={0}
          max={11}
          value={inches}
          onChange={e => onChangeIn(e.target.value)}
          aria-label="Height inches"
          className="w-20 bg-transparent outline-none text-[36px] text-right"
          style={{ fontFamily: SF, color: "#434343" }}
        />
        <span className="text-[28px] text-[#8B8C8E]" style={{ fontFamily: SF }}>in</span>
        {cmLabel && (
          <span className="ml-auto text-[20px] font-medium" style={{ fontFamily: SF, color: "rgba(0,122,139,0.7)" }}>{cmLabel}</span>
        )}
      </div>
      {error && <p className="text-[#EA4A4A] text-[16px] self-start" style={{ fontFamily: SF }}>{error}</p>}
      <p className="text-[#8B8C8E] text-[16px]" style={{ fontFamily: SF }}>Required to start the test.</p>
    </div>
  );
}
