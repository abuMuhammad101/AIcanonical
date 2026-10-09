import type { FlowCommand } from "./flows/types";

// Scripted voice use cases for each guide, keyed by flow id, then step id.
// The transcript is what the scripted fallback "hears"; `matches` lets real
// speech land on the same reply. Inline **bold** is supported in reply text.

export type ReplyBlock =
  | { kind: "p"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

export type ChipAction =
  | { type: "back" }
  | { type: "command"; command: FlowCommand };

export interface ReplyChip {
  label: string;
  action: ChipAction;
}

export interface AssistantReply {
  blocks: ReplyBlock[];
  chips: ReplyChip[];
}

interface VoiceScript {
  transcript: string;
  matches: RegExp;
  reply: AssistantReply;
}

const BACK: ReplyChip = { label: "Back to guide", action: { type: "back" } };

const SPIROMETRY: Record<string, VoiceScript> = {
  patient: {
    transcript: "I can't find my patient in the search.",
    matches: /\b(find|search|missing|patient|can'?t see|not (showing|there))\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "Search matches patient name or MRN within your current facility. A few things to check:" },
        {
          kind: "ul",
          items: [
            "Try the last name or the MRN instead of the first name.",
            "Discharged patients don't appear by default.",
            "If the patient was admitted today, the EMR sync may take a few minutes.",
          ],
        },
        { kind: "p", text: "If they're still missing, you can add them from **All Patients → Add Patient**." },
      ],
      chips: [{ label: "Search by MRN", action: { type: "back" } }, BACK],
    },
  },

  device: {
    transcript: "My spirometer isn't showing up.",
    matches: /\b(spirometer|device|bluetooth|connect|pair|showing|scan)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "Let's get it connected:" },
        {
          kind: "ol",
          items: [
            "Make sure the spirometer is switched on and the battery isn't low.",
            "Keep it within about 1 metre of the iPad.",
            "Check that Bluetooth is turned on in iPad Settings.",
            "Tap **Refresh** under the devices.",
          ],
        },
        { kind: "p", text: "The serial number on the back of the device should match one of the bubbles (e.g. SE-011-E010832)." },
      ],
      chips: [{ label: "Refresh devices", action: { type: "command", command: { type: "rescan" } } }, BACK],
    },
  },

  test: {
    transcript: "What's the difference between the two maneuvers?",
    matches: /\b(difference|maneuver|manoeuvre|expiratory|inspiratory|which (one|test))\b/i,
    reply: {
      blocks: [
        {
          kind: "p",
          text: "**Expiratory Maneuver** measures forced exhalation only: the patient takes a full breath in, then blows out as hard and fast as possible. Use it for routine FVC/FEV1 testing.",
        },
        {
          kind: "p",
          text: "**Expiratory/Inspiratory Maneuver** adds a full forced inhalation after the exhale, which gives you the complete flow-volume loop. Use it when you need to look at the inspiratory limb, for example when assessing upper-airway obstruction.",
        },
      ],
      chips: [
        { label: "Choose Expiratory", action: { type: "command", command: { type: "choose", value: "expiratory" } } },
        { label: "Choose Expiratory/Inspiratory", action: { type: "command", command: { type: "choose", value: "exp_insp" } } },
        BACK,
      ],
    },
  },

  demographics: {
    transcript: "Why do you need height and ethnicity?",
    matches: /\b(height|ethnicity|weight|why|demographic|age|sex|gender)\b/i,
    reply: {
      blocks: [
        {
          kind: "p",
          text: "Spirometry results are compared against predicted normal values. The reference equations behind those predictions use age, sex and height, and some equations also use ethnicity.",
        },
        {
          kind: "p",
          text: "Wrong values here shift the % predicted figures, so please confirm them with the patient. You can tap any tile to edit it.",
        },
      ],
      chips: [{ label: "Edit height", action: { type: "command", command: { type: "edit", value: "height" } } }, BACK],
    },
  },
};

const POST_THERAPY: Record<string, VoiceScript> = {
  patient: {
    transcript: "Which patient was on the device?",
    matches: /\b(find|search|missing|patient|which|who)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "Pick the patient who just finished the session. The device doesn't know who used it, so the QR code only carries the session data." },
        { kind: "p", text: "Search by last name or MRN. Discharged patients don't appear by default." },
      ],
      chips: [{ label: "Search by MRN", action: { type: "back" } }, BACK],
    },
  },

  scan: {
    transcript: "The QR code isn't scanning.",
    matches: /\b(qr|scan|code|camera|read|device)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "The code appears on the device's screen once the session ends:" },
        {
          kind: "ol",
          items: [
            "Tap the device's screen to wake it and open **Session Summary**.",
            "Hold the iPad about 20 cm away, with the whole code inside the brackets.",
            "Tilt slightly if there's glare on the device's screen.",
          ],
        },
        { kind: "p", text: "Each code holds one session. Once it's read, check the device and patient on the card, then tap **Confirm**. If it's the wrong session, tap **Scan again**." },
      ],
      chips: [{ label: "Scan again", action: { type: "command", command: { type: "rescan" } } }, BACK],
    },
  },

  records: {
    transcript: "Some of these values say N/A.",
    matches: /\b(n\/?a|missing|wrong|value|record|data|edit)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "These values come straight from the device and can't be edited, so the note matches what the device recorded." },
        { kind: "p", text: "**N/A** means the device didn't measure it in this mode. That's expected and won't block the note. Only the fields with a pencil are yours to fill." },
      ],
      chips: [BACK],
    },
  },

  setting: {
    transcript: "What's the difference between concurrent and group?",
    matches: /\b(concurrent|group|individual|co-?treat|setting|difference)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "**Concurrent:** you treat two patients at the same time who are doing different activities." },
        { kind: "p", text: "**Group:** two to six patients doing the same or similar activities." },
        { kind: "p", text: "For Medicare Part A, concurrent and group minutes count toward the patient's total but are capped at 25% of therapy minutes per discipline." },
      ],
      chips: [
        { label: "Choose Individual", action: { type: "command", command: { type: "choose", value: "individual" } } },
        BACK,
      ],
    },
  },

  treatment: {
    transcript: "What counts as skilled time?",
    matches: /\b(skilled|time|minutes|count|cpt|location|placement)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "Skilled time is every minute you were providing skilled care, including the device run time." },
        {
          kind: "ul",
          items: [
            "**Counts:** setup that needs your judgement, therapeutic interaction, assessment during the session.",
            "**Doesn't count:** unattended device time, rest breaks, transport.",
          ],
        },
        { kind: "p", text: "It starts at the device run time. Add your hands-on minutes on top." },
      ],
      chips: [{ label: "Edit skilled time", action: { type: "command", command: { type: "edit", value: "skilled" } } }, BACK],
    },
  },

  scales: {
    transcript: "Do I have to fill in both scales?",
    matches: /\b(scale|pain|borg|both|skip|exertion)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "No, both are optional. Record the ones you measured this session." },
        {
          kind: "ul",
          items: [
            "**Pain Scale:** the patient's pain after treatment, 0–60. The level (Mild, Moderate…) is filled in for you.",
            "**Borg Scale:** perceived exertion, 0–10. Most useful after active sessions like cycling.",
          ],
        },
      ],
      chips: [{ label: "Set pain scale", action: { type: "command", command: { type: "edit", value: "pain" } } }, BACK],
    },
  },

  note: {
    transcript: "Which note type should I pick?",
    matches: /\b(note|type|progress|daily|date|time|effective)\b/i,
    reply: {
      blocks: [
        { kind: "p", text: "It starts on **Progress Note**. Switch to **Daily Note** for a routine session when no progress note is due (one is needed at least every 10 treatment days)." },
        { kind: "p", text: "Effective date and time default to now. Change them if you're documenting a session from earlier today." },
      ],
      chips: [{ label: "Choose note type", action: { type: "command", command: { type: "edit", value: "noteType" } } }, BACK],
    },
  },
};

const VOICE_SCRIPTS: Record<string, Record<string, VoiceScript>> = {
  spirometry: SPIROMETRY,
  "post-therapy": POST_THERAPY,
};

export const FALLBACK_REPLY: AssistantReply = {
  blocks: [{ kind: "p", text: "I can help with this step. Ask me what it needs, or what any of the values mean." }],
  chips: [BACK],
};

/** What the scripted fallback "hears" on a given step. */
export function scriptedTranscript(flowId: string, stepId: string): string {
  return VOICE_SCRIPTS[flowId]?.[stepId]?.transcript ?? "How do I complete this step?";
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export function resolveReply(flowId: string, stepId: string, text: string): AssistantReply {
  const script = VOICE_SCRIPTS[flowId]?.[stepId];
  if (script && (normalise(text) === normalise(script.transcript) || script.matches.test(text))) return script.reply;
  return FALLBACK_REPLY;
}
