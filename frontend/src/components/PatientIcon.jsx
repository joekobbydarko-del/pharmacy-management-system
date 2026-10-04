function PatientIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className = "",
}) {
  const icons = {
    dashboard: (
      <>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2.5"
        />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 9h18" />
        <path d="M8 13h.01" />
        <path d="M12 13h.01" />
        <path d="M16 13h.01" />
        <path d="M8 17h.01" />
        <path d="M12 17h.01" />
      </>
    ),

    pill: (
      <>
        <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7.1-7.1l7 7a5 5 0 0 1-7.1 7.1Z" />
        <path d="m8 9 7 7" />
      </>
    ),

    medicine: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v5l-4.8 8.3A3.2 3.2 0 0 0 8 21h8a3.2 3.2 0 0 0 2.8-4.7L14 8V3" />
        <path d="M7.5 14h9" />
      </>
    ),

    check: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),

    plus: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
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
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    clipboard: (
      <>
        <rect
          x="5"
          y="4"
          width="14"
          height="17"
          rx="2"
        />
        <path d="M9 4V2h6v2" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),

    package: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
      </>
    ),

    cart: (
      <>
        <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20.5 8H6" />
        <circle
          cx="9"
          cy="19"
          r="1.2"
        />
        <circle
          cx="17"
          cy="19"
          r="1.2"
        />
      </>
    ),

    search: (
      <>
        <circle
          cx="11"
          cy="11"
          r="6.5"
        />
        <path d="m16 16 4.5 4.5" />
      </>
    ),

    info: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 7v5l3 2" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),

    user: (
      <>
        <circle
          cx="12"
          cy="7.5"
          r="3.5"
        />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),

    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.3v-2.6h.2A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.6v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),

    support: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0v4" />
        <path d="M4 16v-3h3v5H5a1 1 0 0 1-1-1Z" />
        <path d="M20 16v-3h-3v5h2a1 1 0 0 0 1-1Z" />
        <path d="M9 21h6" />
      </>
    ),

    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),

    chevron: (
      <path d="m7 10 5 5 5-5" />
    ),

    orders: (
      <>
        <rect
          x="5"
          y="3.5"
          width="14"
          height="17"
          rx="2"
        />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    sun: (
      <>
        <circle
          cx="12"
          cy="12"
          r="4"
        />
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name] || icons.info}
    </svg>
  );
}

export default PatientIcon;