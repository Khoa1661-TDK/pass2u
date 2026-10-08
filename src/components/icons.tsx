import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const SearchIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const ChatIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
);
export const CheckBadge = (p: P) => (
  <svg {...base({ strokeWidth: 2, ...p })}><path d="M12 3 14.4 5l3.1-.3.8 3 2.7 1.6-1.2 2.8 1.2 2.8-2.7 1.6-.8 3-3.1-.3L12 21l-2.4-2-3.1.3-.8-3L3 14.7l1.2-2.8L3 9.2l2.7-1.6.8-3 3.1.3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const ShieldIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.9 4-1.5 7-5.5 7-9.9V6Z" /></svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}><path d="M15 18l-6-6 6-6" /></svg>
);
export const CameraIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const XIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const SendIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h13M13 6l6 6-6 6" /></svg>
);
