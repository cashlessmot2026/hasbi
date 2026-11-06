const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = (paths) => (props) => <svg {...base} {...props} aria-hidden="true">{paths}</svg>;

export const IconHome = I(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>);
export const IconCart = I(<><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" /><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></>);
export const IconReceipt = I(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>);
export const IconStar = I(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />);
export const IconSearch = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconBack = I(<path d="m15 18-6-6 6-6" />);
export const IconPlus = I(<path d="M12 5v14M5 12h14" />);
export const IconMinus = I(<path d="M5 12h14" />);
export const IconClose = I(<path d="M6 6l12 12M18 6 6 18" />);
export const IconShare = I(<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>);
export const IconExpand = I(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />);
export const IconTrash = I(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IconDownload = I(<><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>);
export const IconInstall = I(<><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M12 8v6M9.5 11.5 12 14l2.5-2.5" /></>);
export const IconPin = I(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const IconGlobe = I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const IconCheck = I(<path d="m5 12 5 5 9-10" />);
export const IconWhatsApp = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12.04 2C6.6 2 2.18 6.4 2.18 11.84c0 1.74.46 3.44 1.32 4.94L2.1 22l5.36-1.4a9.86 9.86 0 0 0 4.58 1.12h.01c5.43 0 9.85-4.42 9.85-9.86A9.86 9.86 0 0 0 12.04 2Zm5.77 13.94c-.24.68-1.42 1.32-1.96 1.38-.5.06-1.13.08-1.82-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.18-4.94-4.37-.15-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.57-.36.77-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.2-.14.31-.29.48-.14.17-.3.38-.43.5-.14.15-.29.3-.12.6.17.28.74 1.22 1.6 1.98 1.1.98 2.02 1.28 2.31 1.43.29.14.46.12.63-.08.17-.19.72-.84.92-1.13.19-.29.38-.24.65-.14.26.1 1.68.79 1.97.94.29.14.48.21.55.33.07.12.07.7-.17 1.38Z" />
  </svg>
);
