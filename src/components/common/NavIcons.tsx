import type { SVGProps } from 'react';

const common: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const NAV_ICONS = {
  dashboard: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M4 13.5 9 8l4 4 7-8" />
      <path d="M4 20h16" />
      <path d="M4 20v-4M9 20v-6M13 20v-4M20 20V9" />
    </svg>
  ),
  learn: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M12 6.5c-1.6-1.3-3.7-2-6.5-2v13c2.8 0 4.9.7 6.5 2 1.6-1.3 3.7-2 6.5-2v-13c-2.8 0-4.9.7-6.5 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  ),
  play: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <rect x="3" y="6" width="18" height="13" rx="6.5" />
      <circle cx="12" cy="12.5" r="2.4" />
    </svg>
  ),
  drills: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  timer: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9M9.5 3.5h5" />
      <path d="M18.5 6.5l1.2-1.2" />
    </svg>
  ),
  history: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M4 11a8 8 0 1 1 2.3 5.6" />
      <path d="M4 15v-4h4" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  ),
  reference: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.3-4.3" />
      <path d="M9 11h4M11 9v4" />
    </svg>
  ),
  chevron: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  check: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  arrowRight: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  clock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...common} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

export function Icon({ name, className, size = 18 }: { name: NavIconName; className?: string; size?: number }) {
  const Cmp = NAV_ICONS[name];
  return <Cmp className={className} width={size} height={size} />;
}
