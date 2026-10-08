import React from "react";
import { Answers, ETHNICITIES } from "../data";

const SF = "system-ui,-apple-system,sans-serif";

interface Props {
  answers: Answers;
  patientFirstName: string;
  onChange: (key: keyof Answers, value: string) => void;
  onEditBeat: (beat: 4 | 5 | 6 | 7 | 8) => void;
}

function toCm(ft: string, inc: string) {
  const f = parseFloat(ft) || 0;
  const i = parseFloat(inc) || 0;
  const cm = Math.round((f * 12 + i) * 2.54);
  return cm > 0 ? ` · ${cm} cm` : "";
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

interface DemoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
  placeholder?: boolean;
}

function DemoCard({ icon, label, value, onEdit, placeholder }: DemoCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-[18px] relative"
      style={{ background: "rgba(255,255,255,0.58)", border: "1px solid rgba(255,255,255,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="size-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(0,122,139,0.08)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#8B8C8E", fontFamily: SF }}>{label}</p>
        <p className="text-[15px] font-semibold truncate" style={{ color: placeholder ? "#ABABAB" : "#434343", fontFamily: SF }}>
          {value || "Not set"}
        </p>
      </div>
      <button
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="size-8 rounded-full flex items-center justify-center hover:bg-[rgba(0,122,139,0.08)] transition-colors shrink-0">
        <EditIcon />
      </button>
    </div>
  );
}

export default function Beat10Demographics({ answers, patientFirstName, onChange, onEditBeat }: Props) {
  const heightVal = answers.heightFt
    ? `${answers.heightFt}′${answers.heightIn ?? "0"}″${toCm(answers.heightFt, answers.heightIn)}`
    : "";

  const cards: { beat: 4 | 5 | 6 | 7 | 8; icon: React.ReactNode; label: string; value: string }[] = [
    {
      beat: 4,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
      label: "Gender",
      value: answers.gender,
    },
    {
      beat: 5,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      label: "Date of Birth",
      value: answers.dob,
    },
    {
      beat: 6,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><path d="M6 2h12l1 6-7 3-7-3z"/><path d="M3 20h18l-3-12H6z"/></svg>,
      label: "Weight",
      value: answers.weight ? `${answers.weight} lbs` : "",
    },
    {
      beat: 7,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="17 7 12 2 7 7"/><polyline points="7 17 12 22 17 17"/></svg>,
      label: "Height",
      value: heightVal,
    },
    {
      beat: 8,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007A8B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
      label: "Ethnicity",
      value: answers.ethnicity || ETHNICITIES[0],
    },
  ];

  return (
    <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 760 }}>
      <p className="text-[15px] mb-1" style={{ fontFamily: SF, color: "rgba(0,0,0,0.45)" }}>
        {patientFirstName}'s demographics are pre-filled. Review and edit if needed.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        {cards.map(card => (
          <DemoCard
            key={card.beat}
            icon={card.icon}
            label={card.label}
            value={card.value}
            placeholder={!card.value}
            onEdit={() => onEditBeat(card.beat)}
          />
        ))}
      </div>
    </div>
  );
}
