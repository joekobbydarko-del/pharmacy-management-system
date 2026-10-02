function PatientIcon({
  name,
  size = 22,
  strokeWidth = 1.8,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
        <path d="M8 3v4M16 3v4M3.5 9.5h17" />
        <path d="M8 13h.01M12 13h.01M16 13h.01" />
        <path d="M8 17h.01M12 17h.01M16 17h.01" />
      </>
      
    ),

    pill: (
      <>
        <path d="m7.2 16.8 9.6-9.6" />
        <path d="M6.3 18a4.45 4.45 0 0 1 0-6.3l5.4-5.4a4.45 4.45 0 1 1 6.3 6.3L12.6 18a4.45 4.45 0 0 1-6.3 0Z" />
        <path d="m9.2 9.2 5.6 5.6" />
      </>
    ),

    medicine: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="3" />
        <path d="M7 10h10" />
        <path d="M10 6h4" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.5 12 2.3 2.3 4.7-4.8" />
      </>
    ),

    plus: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 6.8-3 7.2-3 9h18c0-1.8-3-2.2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),

    clipboard: (
      <>
        <rect x="5" y="4.5" width="14" height="16" rx="2" />
        <path d="M9 4.5V3h6v1.5" />
        <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
      </>
    ),

    package: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),

    cart: (
      <>
        <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20.5 8H6" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
      </>
    ),

    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m15.8 15.8 4.2 4.2" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),

    arrow: (
      <path d="M5 12h13M13 7l5 5-5 5" />
    ),
    sun: (
  <>
    <circle cx="12" cy="12" r="4" />

    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>
),

moon: (
  <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.info}
    </svg>
  );
  
}

export default PatientIcon;