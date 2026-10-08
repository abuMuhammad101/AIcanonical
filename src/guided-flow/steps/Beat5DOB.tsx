import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { calcAge } from "../data";
import { M } from "../motion";

const SF = "system-ui,-apple-system,sans-serif";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDob(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function parseDob(v: string): { m: number; d: number; y: number } | null {
  const [ms, ds, ys] = v.split("/");
  const m = parseInt(ms) - 1, d = parseInt(ds), y = parseInt(ys);
  if (isNaN(m) || isNaN(d) || isNaN(y) || y < 1900) return null;
  return { m, d, y };
}

interface CalendarProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

function Calendar({ value, onChange, onClose }: CalendarProps) {
  const parsed = parseDob(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear() - 40);
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? 0);
  const [mode, setMode] = useState<"days" | "months" | "years">("days");

  const selectedD = parsed?.d;
  const selectedM = parsed?.m;
  const selectedY = parsed?.y;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(d: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${mm}/${dd}/${viewYear}`);
    onClose();
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const yearRange = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i);

  return (
    <div
      className="absolute z-10 rounded-[24px] p-4 shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 32px 80px rgba(0,122,139,0.22), 0 4px 20px rgba(0,0,0,0.08)",
        width: 360,
        top: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {mode === "days" && (
          <button onClick={prevMonth} className="size-8 flex items-center justify-center rounded-full hover:bg-[#007A8B]/10 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        {mode !== "days" && <div />}
        <button
          onClick={() => setMode(m => m === "days" ? "months" : m === "months" ? "years" : "days")}
          className="text-[15px] font-semibold hover:text-[#007A8B] transition-colors"
          style={{ fontFamily: SF, color: "#434343" }}>
          {mode === "days" && `${MONTHS[viewMonth]} ${viewYear}`}
          {mode === "months" && viewYear}
          {mode === "years" && "Select Year"}
        </button>
        {mode === "days" && (
          <button onClick={nextMonth} className="size-8 flex items-center justify-center rounded-full hover:bg-[#007A8B]/10 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        {mode !== "days" && <div />}
      </div>

      {/* Days view */}
      {mode === "days" && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: "#8B8C8E", fontFamily: SF }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              const isSel = day !== null && day === selectedD && viewMonth === selectedM && viewYear === selectedY;
              const isToday = day !== null && day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isFuture = day !== null && new Date(viewYear, viewMonth, day) > today;
              return (
                <button
                  key={idx}
                  disabled={!day || isFuture}
                  onClick={() => day && !isFuture && selectDay(day)}
                  className="size-9 mx-auto rounded-full flex items-center justify-center text-[14px] transition-all"
                  style={{
                    fontFamily: SF,
                    background: isSel ? "linear-gradient(135deg,#007A8B,#3AAF4D)" : isToday ? "rgba(0,122,139,0.08)" : "transparent",
                    color: isSel ? "white" : isFuture ? "#C5C5C7" : day ? "#434343" : "transparent",
                    fontWeight: isSel ? 700 : isToday ? 600 : 400,
                    cursor: !day || isFuture ? "default" : "pointer",
                  }}>
                  {day ?? ""}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Months view */}
      {mode === "months" && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {MONTHS.map((name, idx) => {
            const isSel = idx === selectedM && viewYear === selectedY;
            return (
              <button key={name} onClick={() => { setViewMonth(idx); setMode("days"); }}
                className="py-2 px-1 rounded-[12px] text-[13px] font-medium transition-all"
                style={{
                  fontFamily: SF,
                  background: isSel ? "linear-gradient(135deg,#007A8B,#3AAF4D)" : idx === viewMonth ? "rgba(0,122,139,0.08)" : "transparent",
                  color: isSel ? "white" : "#434343",
                }}>
                {name.slice(0,3)}
              </button>
            );
          })}
        </div>
      )}

      {/* Years view */}
      {mode === "years" && (
        <div className="overflow-y-auto max-h-[220px] mt-2" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-4 gap-1">
            {yearRange.map(yr => {
              const isSel = yr === selectedY;
              return (
                <button key={yr} onClick={() => { setViewYear(yr); setMode("months"); }}
                  className="py-2 rounded-[10px] text-[13px] font-medium transition-all"
                  style={{
                    fontFamily: SF,
                    background: isSel ? "linear-gradient(135deg,#007A8B,#3AAF4D)" : yr === viewYear ? "rgba(0,122,139,0.08)" : "transparent",
                    color: isSel ? "white" : "#434343",
                  }}>
                  {yr}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function Beat5DOB({ value, onChange, error }: Props) {
  const age = calcAge(value);
  const ageRef = useRef<HTMLSpanElement>(null);
  const prevAge = useRef("");
  const [calOpen, setCalOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ageRef.current || age === prevAge.current) return;
    const prev = parseFloat(prevAge.current) || 0;
    const next = parseFloat(age) || 0;
    if (next > 0) {
      gsap.fromTo({ val: prev }, { val: next }, {
        duration: M.base * 0.6,
        ease: M.morph,
        onUpdate() { if (ageRef.current) ageRef.current.textContent = (this.targets()[0] as {val:number}).val.toFixed(1); },
      });
    } else if (ageRef.current) {
      ageRef.current.textContent = "";
    }
    prevAge.current = age;
  }, [age]);

  // Close calendar on outside click
  useEffect(() => {
    if (!calOpen) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setCalOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  return (
    <div className="flex flex-col items-center gap-4" style={{ maxWidth: 720, width: "100%" }}>
      <div ref={wrapRef} className="relative w-full">
        <div className="gf-rect flex items-center px-8 gap-6 w-full cursor-pointer" style={{ height: 96 }}
          onClick={() => setCalOpen(o => !o)}>
          {/* Calendar icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={value ? "#007A8B" : "#8B8C8E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="text"
            inputMode="numeric"
            value={value}
            placeholder="MM/DD/YYYY"
            onChange={e => onChange(formatDob(e.target.value))}
            onClick={e => { e.stopPropagation(); setCalOpen(true); }}
            aria-label="Date of birth"
            className="flex-1 bg-transparent text-[28px] placeholder-[#C5C5C7] cursor-text"
            style={{ fontFamily: SF, color: "#434343", letterSpacing: "0.04em", outline: "none", border: "none" }}
          />
          {age && (
            <div className="gf-age-badge shrink-0">
              <span ref={ageRef}>{age}</span> yrs
            </div>
          )}
        </div>
        {calOpen && (
          <Calendar
            value={value}
            onChange={v => { onChange(v); }}
            onClose={() => setCalOpen(false)}
          />
        )}
      </div>
      {error && <p className="text-[#EA4A4A] text-[16px] self-start" style={{ fontFamily: SF }}>{error}</p>}
      <p className="text-white/50 text-[16px]" style={{ fontFamily: SF }}>Tap the field or type — required to start the test.</p>
    </div>
  );
}
