import React from "react";
import { Patient, Device } from "../data";

const SF = "system-ui,-apple-system,sans-serif";
const GRADIENT = "linear-gradient(135deg, #007A8B 0%, #3AAF4D 37%, #A8CB38 86%)";

interface Props {
  patient: Patient;
  device: Device;
  testLabel: string;
  answers: { gender: string; dob: string; weight: string; heightFt: string; heightIn: string; ethnicity: string };
}

interface SummaryItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SummaryRow({ icon, label, value }: SummaryItem) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-[16px] transition-all"
      style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="size-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(0,122,139,0.1)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#8B8C8E", fontFamily: SF }}>{label}</p>
        <p className="text-[14px] font-semibold truncate" style={{ color: "#434343", fontFamily: SF }}>{value}</p>
      </div>
    </div>
  );
}

export default function Beat9Ready({ patient, device, testLabel, answers }: Props) {
  const firstName = patient.name.split(" ")[0];
  const heightStr = answers.heightFt && `${answers.heightFt}′${answers.heightIn ?? "0"}″`;

  const rows: SummaryItem[] = [
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      label: "Patient",
      value: patient.name,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
      label: "Device",
      value: device.serial,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
      label: "Test",
      value: testLabel,
    },
    ...(answers.gender ? [{
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
      label: "Gender",
      value: answers.gender,
    }] : []),
    ...(answers.dob ? [{
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      label: "Date of Birth",
      value: answers.dob,
    }] : []),
    ...(answers.weight ? [{
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><path d="M6 2h12l1 6-7 3-7-3z"/><path d="M3 20h18l-3-12H6z"/></svg>,
      label: "Weight",
      value: `${answers.weight} lbs`,
    }] : []),
    ...(heightStr ? [{
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="7 17 12 22 17 17"/></svg>,
      label: "Height",
      value: heightStr,
    }] : []),
    ...(answers.ethnicity ? [{
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      label: "Ethnicity",
      value: answers.ethnicity,
    }] : []),
  ];

  // Split rows into 2 columns
  const col1 = rows.filter((_, i) => i % 2 === 0);
  const col2 = rows.filter((_, i) => i % 2 === 1);

  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: 760 }}>

      {/* Patient avatar */}
      <div className="size-16 rounded-full flex items-center justify-center text-[22px] font-bold text-white relative"
        style={{ background: "#1A1A1A", boxShadow: "0 8px 28px rgba(0,0,0,0.3)" }}>
        {patient.initials}
        <div className="absolute -bottom-1 -right-1 size-6 rounded-full flex items-center justify-center"
          style={{ background: "#599400", boxShadow: "0 2px 6px rgba(89,148,0,0.4)", border: "2px solid white" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>

      {/* 2-column summary grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col gap-2">
          {col1.map(r => <SummaryRow key={r.label} {...r} />)}
        </div>
        <div className="flex flex-col gap-2">
          {col2.map(r => <SummaryRow key={r.label} {...r} />)}
        </div>
      </div>

      {/* Instruction card */}
      <div className="w-full rounded-[18px] px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(0,122,139,0.08)",
          border: "1px solid rgba(0,122,139,0.18)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
        <div className="size-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#007A8B,#3AAF4D)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#007A8B", fontFamily: SF }}>Before you start</p>
          <p className="text-[14px]" style={{ color: "#434343", fontFamily: SF, lineHeight: 1.4 }}>
            Have {firstName} seated upright with the nose clip on.
          </p>
        </div>
      </div>
    </div>
  );
}
