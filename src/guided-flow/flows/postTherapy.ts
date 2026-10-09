import { createElement as h } from "react";
import type { FlowConfig } from "./types";
import {
  NOTE_TYPES, QR_SESSIONS, THERAPY_SETTINGS,
  type Patient, type TherapySession, type TherapySetting,
} from "../data";
import { patientStep } from "./shared";
import ScanStep from "../steps/ScanStep";
import ChoiceStep from "../steps/ChoiceStep";
import ReviewStep, { type ReviewField } from "../steps/ReviewStep";
import { formatTime } from "../steps/pickers/TimePicker";
import type { Values } from "../steps/pickers/shared";

// Quick Connect → Scan QR: a therapy session already ran on an ACP device;
// the clinician picks the patient, scans the device, confirms what it
// recorded and adds what it can't know. Ends on Post Therapy Documentation.

export interface TreatmentDetails {
  skilledMinutes: string;
  location: string;
  placementNotes: string;
}

export interface NoteInfo {
  date: string;
  time: string;
  noteType: string;
}

export interface PostTherapyContext {
  patient?: Patient;
  session?: TherapySession;
  /** The clinician-entered record fields (e.g. Muscle support), by id. */
  clinicianRecords?: Values;
  setting?: TherapySetting;
  treatment?: TreatmentDetails;
  noteInfo?: NoteInfo;
}

/**
 * Mock QR read. `?gfQr=omnicycle` scans the OmniCycle session instead of
 * OmniVersa; `?gfNoQr` never reads a code, to show the failure state.
 */
function mockQrScan(onRead: (s: TherapySession) => void) {
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  if (q?.has("gfNoQr")) return () => {};
  const session = QR_SESSIONS[q?.get("gfQr") ?? ""] ?? QR_SESSIONS.omniversa;
  const t = window.setTimeout(() => onRead(session), 2800);
  return () => window.clearTimeout(t);
}

function recordFields(s: TherapySession): ReviewField[] {
  const device: ReviewField[] = s.records.map(r => ({ id: r.id, label: r.label, display: () => r.value }));
  const clinician: ReviewField[] = s.clinician.map(c => ({
    id: c.id,
    label: c.label,
    display: v => v[c.id],
    picker: c.input.kind === "text"
      ? { kind: "text", key: c.id, label: c.label, placeholder: c.input.placeholder }
      : { kind: "options", key: c.id, options: c.input.options, layout: "list" },
  }));
  return [...device, ...clinician];
}

const TREATMENT_FIELDS: ReviewField[] = [
  {
    id: "skilled", label: "Skilled time", required: true,
    display: v => (v.skilledMinutes ? `${v.skilledMinutes} min` : ""),
    picker: { kind: "number", key: "skilledMinutes", min: 1, max: 120, step: 0.5, unit: "min", label: "Skilled time" },
  },
  {
    id: "location", label: "Treatment location", required: true,
    display: v => v.location,
    picker: { kind: "text", key: "location", label: "Treatment location", placeholder: "e.g. Therapy gym", required: true },
  },
  {
    id: "placement", label: "Placement notes",
    display: v => v.placementNotes,
    picker: { kind: "text", key: "placementNotes", label: "Placement notes", placeholder: "Pad or strap placement, skin check…", multiline: true },
  },
];

const NOTE_FIELDS: ReviewField[] = [
  {
    id: "date", label: "Effective date", required: true,
    display: v => v.date,
    picker: { kind: "date", key: "date", label: "Effective date" },
  },
  {
    id: "time", label: "Effective time", required: true,
    display: v => v.time,
    picker: { kind: "time", key: "time", label: "Effective time" },
  },
  {
    id: "noteType", label: "Note type", required: true,
    display: v => v.noteType,
    picker: { kind: "options", key: "noteType", options: NOTE_TYPES, layout: "tiles" },
  },
];

const today = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

export const postTherapyFlow: FlowConfig<PostTherapyContext> = {
  id: "post-therapy",
  label: "Post therapy documentation guide",
  steps: [
    patientStep<PostTherapyContext>(),
    {
      id: "scan",
      label: "Scan device",
      prompt: "scan the QR code on the therapy device",
      provides: ["session"],
      render: api => h(ScanStep<TherapySession, PostTherapyContext>, {
        ...api,
        scan: mockQrScan,
        getTitle: s => s.device,
        getDetails: s => [`SN ${s.serial}`, `${s.mode} mode · ended ${s.endedAt}`],
        noun: "device",
        toContext: session => ({ session }),
      }),
    },
    {
      id: "records",
      label: "Device data",
      prompt: "review the treatment records from the device",
      provides: ["clinicianRecords"],
      render: api => h(ReviewStep<PostTherapyContext>, {
        ...api,
        fields: recordFields(api.context.session!),
        density: "compact",
        initialValues: ctx => Object.fromEntries(ctx.session!.clinician.map(c => [c.id, ""])),
        toContext: v => ({ clinicianRecords: v }),
        proceedLabel: "Confirm device data",
      }),
    },
    {
      id: "setting",
      label: "Therapy setting",
      prompt: "choose the therapy setting",
      provides: ["setting"],
      render: api => h(ChoiceStep<PostTherapyContext>, {
        ...api,
        options: THERAPY_SETTINGS.map(t => ({ id: t.id, title: t.label, description: t.desc })),
        columns: 2,
        toContext: o => ({ setting: THERAPY_SETTINGS.find(t => t.id === o.id) }),
      }),
    },
    {
      id: "treatment",
      label: "Treatment details",
      prompt: "add skilled time and treatment location",
      provides: ["treatment"],
      render: api => h(ReviewStep<PostTherapyContext>, {
        ...api,
        fields: TREATMENT_FIELDS,
        initialValues: ctx => ({ skilledMinutes: String(ctx.session?.runMinutes ?? ""), location: "", placementNotes: "" }),
        toContext: v => ({ treatment: { skilledMinutes: v.skilledMinutes, location: v.location, placementNotes: v.placementNotes } }),
        proceedLabel: "Continue",
      }),
    },
    {
      id: "note",
      label: "Note info",
      prompt: "confirm the note date, time and type",
      provides: ["noteInfo"],
      render: api => h(ReviewStep<PostTherapyContext>, {
        ...api,
        fields: NOTE_FIELDS,
        initialValues: () => ({ date: today(), time: formatTime(new Date()), noteType: "" }),
        toContext: v => ({ noteInfo: { date: v.date, time: v.time, noteType: v.noteType } }),
        proceedLabel: "Open documentation",
      }),
    },
  ],
};
