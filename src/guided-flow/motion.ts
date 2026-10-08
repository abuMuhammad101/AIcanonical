// Single source of truth for all GuidedFlow motion tokens
export const M = {
  // durations (seconds)
  micro:  0.18,
  base:   0.5,
  slow:   0.9,

  // eases (GSAP strings)
  enter:  "expo.out",
  morph:  "power2.inOut",
  pop:    "back.out(1.3)",
  exit:   "power2.in",

  // beat transition
  outY:   -16,
  inY:     24,
  stagger: 0.06,

  // aurora loop range
  auroraMin: 20,
  auroraMax: 30,
};
