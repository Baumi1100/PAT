// Lucide-style stroke icons. Single source of truth so the rest of the app
// can just <Icon name="..." /> without re-pasting paths.

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  briefcase: <><rect x="2.5" y="6.5" width="19" height="13" rx="2"/><path d="M8 6.5V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"/><path d="M2.5 12.5h19"/></>,
  resume: <><path d="M6 2.5h9l4 4V21a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z"/><path d="M15 2.5V7h4"/><path d="M9 12h6M9 16h4"/></>,
  certificate: <><circle cx="12" cy="9" r="5"/><path d="m8.5 13-1.5 7 5-3 5 3-1.5-7"/></>,
  send: <><path d="m21 3-9 18-2.5-8L1.5 10.5 21 3Z"/><path d="m21 3-10.5 10.5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.15.69.39 1 .73"/></>,

  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  filter: <><path d="M3 4h18l-7 9v6l-4 2v-8L3 4Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  chevDown: <><path d="m6 9 6 6 6-6"/></>,
  chevRight: <><path d="m9 6 6 6-6 6"/></>,
  chevLeft: <><path d="m15 6-6 6 6 6"/></>,
  check: <><path d="m5 12 5 5L20 7"/></>,
  x: <><path d="M18 6 6 18M6 6l12 12"/></>,
  pencil: <><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></>,
  trash: <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/></>,
  more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  external: <><path d="M14 3h7v7"/><path d="M21 3 11 13"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/></>,
  link: <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
  star: <><path d="m12 2 3.1 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.6 21l1.5-7L1.9 9.3l7-.8L12 2Z"/></>,
  starOutline: <><path d="m12 2 3.1 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.6 21l1.5-7L1.9 9.3l7-.8L12 2Z" fill="none"/></>,
  flag: <><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></>,
  map: <><path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13Z"/><circle cx="12" cy="9" r="2.5"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></>,
  euro: <><path d="M18 7a6 6 0 1 0 0 10"/><path d="M4 10h9M4 14h9"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  note: <><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M15 4v5h5"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></>,
  inbox: <><path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 3h14l2 10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6L5 3Z"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1 1.2-1 1.7"/><path d="M12 17h.01"/></>,
  sparkles: <><path d="m12 3 1.7 4.8L18 9.5l-4.3 1.7L12 16l-1.7-4.8L6 9.5l4.3-1.7L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></>,
  zap: <><path d="M13 2 4 13h7l-1 9 9-11h-7l1-9Z"/></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  paperclip: <><path d="m21 11.5-9 9a5 5 0 0 1-7-7L13.5 5a3.5 3.5 0 0 1 5 5L10 18.5a2 2 0 0 1-3-3l7.5-7.5"/></>,
  telegram: <><path d="M3 12 21 4l-3 16-7-4-3 5v-5l13-11"/></>,
  shield: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></>,
  arrowRight: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
};

window.Icon = function Icon({ name, size = 16, className = "", style = {}, strokeWidth = 1.75 }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {path}
    </svg>
  );
};
