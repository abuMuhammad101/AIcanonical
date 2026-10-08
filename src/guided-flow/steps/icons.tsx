// Line icons for the overlay. All draw in currentColor so they follow the glass tokens.

interface IconProps { size?: number; strokeWidth?: number }

const base = (size: number, strokeWidth: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const SearchIcon = ({ size = 28, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><circle cx="11" cy="11" r="7.5" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
);

export const CloseIcon = ({ size = 24, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

export const ResetIcon = ({ size = 24, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><polyline points="20 4 20 9 15 9" /></svg>
);

export const RefreshIcon = ({ size = 22, strokeWidth = 1.6 }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M20 11a8 8 0 0 0-14.7-4.4" /><polyline points="4 3 5 7 9 6" />
    <path d="M4 13a8 8 0 0 0 14.7 4.4" /><polyline points="20 21 19 17 15 18" />
  </svg>
);

export const ArrowUpRightIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><line x1="6" y1="18" x2="18" y2="6" /><polyline points="8 6 18 6 18 16" /></svg>
);

export const PencilIcon = ({ size = 16, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></svg>
);

export const CheckIcon = ({ size = 24, strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, strokeWidth)}><polyline points="20 6 9 17 4 12" /></svg>
);

export const ChevronIcon = ({ size = 18, strokeWidth = 2, dir = "left" }: IconProps & { dir?: "left" | "right" }) => (
  <svg {...base(size, strokeWidth)}>
    {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

/** Handheld spirometer (body + angled mouthpiece). */
export const SpirometerIcon = ({ size = 44, strokeWidth = 1.5 }: IconProps) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="7" y="9" width="9" height="13" rx="2" />
    <rect x="9" y="12" width="5" height="4.5" rx="0.6" />
    <line x1="10" y1="19.3" x2="10.01" y2="19.3" /><line x1="13" y1="19.3" x2="13.01" y2="19.3" />
    <path d="M10.5 9 9.5 6.3a1 1 0 0 1 .5-1.25l6.6-3a1 1 0 0 1 1.33.5l1 2.2a1 1 0 0 1-.5 1.32L13.6 8.3" />
  </svg>
);
