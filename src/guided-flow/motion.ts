// Single source of truth for all GuidedFlow motion tokens. Durations in seconds.
export const M = {
  // Overlay in / out
  overlayIn: 0.25,
  overlayOut: 0.3,
  overlayEase: "power2.out",
  stageRise: 12,

  // Step change — one surface reshaping itself, never a sideways slide
  stepOut: 0.18,
  stepIn: 0.22,
  stepScale: 0.96,
  stepOutEase: "power2.in",
  stepInEase: "power2.out",

  // Lists and grids
  stagger: 0.05,
  itemIn: 0.22,
  itemRise: 8,

  // Selection: white state, then hold before the step change
  select: 0.15,
  selectHold: 0.25,
  selectScale: 1.04,
  dimOpacity: 0.35,

  // Search
  searchDebounce: 0.15,

  // Device discovery
  radarPeriod: 1.6,
  radarRings: 3,
  radarScale: 2.4,
  bubbleScanScale: 0.7, // 140px scan bubble drawn from a 200px bubble
  bubbleGrow: 0.4,
  bubbleSplit: 0.6,
  bubbleEase: "back.out(1.4)",
  bubbleMerge: 0.45,
  bubbleGap: 40,
  scanEmptyAfter: 8,

  // Review
  flip: 0.45,
  flipEase: "power2.inOut",
  glowPulse: 2,
  glowScale: 1.06,

  // Dialog
  dialog: 0.2,
  dialogScale: 0.95,
} as const;

export const ms = (s: number) => Math.round(s * 1000);
