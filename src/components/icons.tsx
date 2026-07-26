// Sade monoxrom SVG ikonlar (stroke-based, currentColor).
// Butun ikonlar 24x24 sebekede, fill="none", strokeWidth 1.7, yuvarlaq uc/birlesme.
// 16px-de oxunaqli olmasi ucun formalar sade saxlanilib — doldurulmus fiqur yoxdur.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

/* ------------------------------------------------------------------ */
/* Naviqasiya / obyektler                                              */
/* ------------------------------------------------------------------ */

export const IconDashboard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconPhoneIncoming = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="16 2 16 8 22 8" />
    <line x1="22" y1="2" x2="16" y2="8" />
    <path d="M14.5 21.9a2 2 0 0 1-.68.02 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 .12 4.18 2 2 0 0 1 2.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2v3" />
  </svg>
);

export const IconPhoneOutgoing = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="22 8 22 2 16 2" />
    <line x1="16" y1="8" x2="22" y2="2" />
    <path d="M14.5 21.9a2 2 0 0 1-.68.02 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 .12 4.18 2 2 0 0 1 2.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2v3" />
  </svg>
);

export const IconPhoneMissed = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="22" y1="2" x2="16" y2="8" />
    <line x1="16" y1="2" x2="22" y2="8" />
    <path d="M14.5 21.9a2 2 0 0 1-.68.02 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 .12 4.18 2 2 0 0 1 2.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2v3" />
  </svg>
);

export const IconCallForward = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="18 3 21.5 6.5 18 10" />
    <path d="M21.5 6.5h-5a3 3 0 0 0-3 3" />
    <path d="M14.5 21.9a2 2 0 0 1-.68.02 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 .12 4.18 2 2 0 0 1 2.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2v3" />
  </svg>
);

export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const IconDatabase = (p: IconProps) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconBuilding = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="9" y1="7" x2="9" y2="7.01" />
    <line x1="15" y1="7" x2="15" y2="7.01" />
    <line x1="9" y1="11" x2="9" y2="11.01" />
    <line x1="15" y1="11" x2="15" y2="11.01" />
    <line x1="9" y1="15" x2="9" y2="15.01" />
    <line x1="15" y1="15" x2="15" y2="15.01" />
    <line x1="9" y1="19" x2="15" y2="19" />
  </svg>
);

export const IconDocument = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Emeliyyatlar                                                        */
/* ------------------------------------------------------------------ */

export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16" y2="16" />
  </svg>
);

export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
);

export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 8 12 3 17 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="21 4 21 10 15 10" />
    <polyline points="3 20 3 14 9 14" />
    <path d="M20 14a8 8 0 0 1-13.5 3.4L3 14" />
    <path d="M4 10a8 8 0 0 1 13.5-3.4L21 10" />
  </svg>
);

export const IconExternalLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const IconSend = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="21" y1="3" x2="10.5" y2="13.5" />
    <polygon points="21 3 14.5 21 10.5 13.5 3 9.5 21 3" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="4 12.5 9.5 18 20 6.5" />
  </svg>
);

export const IconMore = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Naviqasiya idareedicileri                                           */
/* ------------------------------------------------------------------ */

export const IconChevronUp = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="6 15 12 9 18 15" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Vaziyyet / geri elaqe                                               */
/* ------------------------------------------------------------------ */

export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16.5" />
    <line x1="12" y1="7.6" x2="12" y2="7.61" />
  </svg>
);

export const IconWarning = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10.3 3.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
    <line x1="12" y1="9" x2="12" y2="13.5" />
    <line x1="12" y1="17" x2="12" y2="17.01" />
  </svg>
);

export const IconErrorCircle = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8 12.2 11 15.2 16.2 9" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6.8 12 12 15.6 14" />
  </svg>
);

export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconEye = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.3 17.3 0 0 1-3.2 4.1" />
    <path d="M6.3 6.6A17.2 17.2 0 0 0 2 12s3.6 7 10 7a10.4 10.4 0 0 0 4.4-.95" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Ses / zeng                                                          */
/* ------------------------------------------------------------------ */

export const IconMic = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

export const IconMicOff = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 5v-.5a3 3 0 0 0-6-.4" />
    <path d="M9 9.3V11a3 3 0 0 0 4.6 2.5" />
    <path d="M5 10v1a7 7 0 0 0 10.4 6.1" />
    <path d="M19 11v-1" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <polygon points="7 4 20 12 7 20 7 4" />
  </svg>
);

export const IconPause = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="9" y1="4" x2="9" y2="20" />
    <line x1="15" y1="4" x2="15" y2="20" />
  </svg>
);

export const IconStop = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" rx="1.5" />
  </svg>
);

export const IconVolume = (p: IconProps) => (
  <svg {...base(p)}>
    <polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" />
    <path d="M16.5 9a4 4 0 0 1 0 6" />
    <path d="M19 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const IconWaveform = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="3" y1="10" x2="3" y2="14" />
    <line x1="7" y1="6" x2="7" y2="18" />
    <line x1="11" y1="9" x2="11" y2="15" />
    <line x1="15" y1="3.5" x2="15" y2="20.5" />
    <line x1="19" y1="8" x2="19" y2="16" />
  </svg>
);

export const IconHeadset = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <path d="M4 14h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M20 14h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1z" />
    <path d="M20 19v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Inteqrasiya                                                         */
/* ------------------------------------------------------------------ */

export const IconLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7.1.1l3-3a5 5 0 0 0-7.1-7.1L11.3 4.7" />
    <path d="M14 11a5 5 0 0 0-7.1-.1l-3 3a5 5 0 0 0 7.1 7.1l1.6-1.6" />
  </svg>
);

export const IconWebhook = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" />
    <circle cx="12" cy="5" r="3" />
    <line x1="10.5" y1="7.6" x2="7.5" y2="15.4" />
    <line x1="13.5" y1="7.6" x2="16.5" y2="15.4" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <line x1="10.8" y1="12.2" x2="21" y2="2" />
    <line x1="18" y1="5" x2="20.5" y2="7.5" />
    <line x1="15.2" y1="7.8" x2="17.7" y2="10.3" />
  </svg>
);
