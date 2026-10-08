import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  changePassword,
  logout,
} from "../api";

import AdminLiveDateTime
  from "../components/AdminLiveDateTime";

import "./AdminProfilePage.css";
import "./AdminProfileSessions.css";


const API_BASE_URL =
  `http://${window.location.hostname}:8000`;

const TOKEN_KEY =
  "access_token";


/* =========================================================
   ICONS
   ========================================================= */

function Icon({
  name,
  size = 20,
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    back: (
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>
    ),

    user: (
      <>
        <circle
          cx="12"
          cy="8"
          r="4"
        />

        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.8 8.3 7 10 4.2-1.7 7-5.3 7-10V6Z" />

        <path d="m9 12 2 2 4-4" />
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

    mail: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="m4 7 8 6 8-6" />
      </>
    ),

    role: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />

        <path d="m16 9 2 2 3-4" />
      </>
    ),

    building: (
      <>
        <path d="M5 21V4h10v17" />
        <path d="M15 9h4v12" />
        <path d="M8 8h4" />
        <path d="M8 12h4" />
        <path d="M8 16h4" />
      </>
    ),

    lock: (
      <>
        <rect
          x="5"
          y="10"
          width="14"
          height="10"
          rx="2"
        />

        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    key: (
      <>
        <circle
          cx="8"
          cy="15"
          r="4"
        />

        <path d="m11 12 8-8" />
        <path d="m16 7 2 2" />
        <path d="m14 9 2 2" />
      </>
    ),

    monitor: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
        />

        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),

    laptop: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="11"
          rx="2"
        />

        <path d="M2 19h20" />
        <path d="M8 19h8" />
      </>
    ),

    phone: (
      <>
        <rect
          x="6"
          y="2"
          width="12"
          height="20"
          rx="2"
        />

        <path d="M10 18h4" />
      </>
    ),

    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1.1a1.9 1.9 0 0 0 1.4-3.2 1.9 1.9 0 0 1 1.4-3.2H18a3 3 0 0 0 3-3A8.6 8.6 0 0 0 12 3Z" />

        <circle
          cx="8"
          cy="10"
          r=".8"
        />

        <circle
          cx="11"
          cy="7"
          r=".8"
        />

        <circle
          cx="15"
          cy="8"
          r=".8"
        />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

        <path d="M10 21h4" />
      </>
    ),

    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
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
        <path d="M2 12h2" />
        <path d="M20 12h2" />
      </>
    ),

    moon: (
      <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
    ),

    camera: (
      <>
        <path d="M5 7h3l1.5-2h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />

        <circle
          cx="12"
          cy="13"
          r="4"
        />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

        <circle
          cx="12"
          cy="12"
          r="2.5"
        />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />

        <path d="M6.6 6.6C3.5 8.2 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-.9" />
      </>
    ),

    x: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />

        <path d="M6.1 9A7 7 0 0 1 18 6" />
        <path d="M17.9 15A7 7 0 0 1 6 18" />
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

    browser: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M3 9h18" />
        <path d="M7 6.5h.01" />
        <path d="M10 6.5h.01" />
      </>
    ),

    patients: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <circle
          cx="17"
          cy="10"
          r="2"
        />

        <path d="M3 20a6 6 0 0 1 12 0" />

        <path d="M15 16a4 4 0 0 1 6 4" />
      </>
    ),

    inventory: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
      </>
    ),

    report: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </>
    ),

    prescription: (
      <>
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
        />

        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
  };

  return (
    <svg {...props}>
      {icons[name] || icons.user}
    </svg>
  );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Detail({
  icon,
  label,
  value,
}) {
  return (
    <div className="admin-profile-detail">
      <span className="admin-profile-detail__icon">
        <Icon
          name={icon}
          size={18}
        />
      </span>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}


function PasswordField({
  label,
  value,
  onChange,
  visible,
  setVisible,
  autoComplete,
}) {
  return (
    <label className="admin-password-field">
      <span>
        {label}
      </span>

      <div className="admin-password-input-wrap">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          autoComplete={autoComplete}
          onChange={
            (event) =>
              onChange(
                event.target.value
              )
          }
        />

        <button
          type="button"
          onClick={() =>
            setVisible(
              (current) =>
                !current
            )
          }
        >
          <Icon
            name={
              visible
                ? "eyeOff"
                : "eye"
            }
            size={18}
          />
        </button>
      </div>
    </label>
  );
}


function SessionDetail({
  icon,
  label,
  value,
}) {
  return (
    <div className="admin-session-detail">
      <span className="admin-session-detail__icon">
        <Icon
          name={icon}
          size={18}
        />
      </span>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}


/* =========================================================
   SESSION API
   ========================================================= */

function getToken() {
  return (
    localStorage.getItem(
      TOKEN_KEY
    ) ||
    ""
  );
}


async function sessionRequest(
  path,
  options = {}
) {
  const token =
    getToken();

  if (!token) {
    throw new Error(
      "You are not signed in."
    );
  }

  let response;

  try {
    response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(options.headers || {}),

            Authorization:
              `Bearer ${token}`,
          },
        }
      );
  } catch {
    throw new Error(
      "Unable to connect to Dr. Evans Pharmacy."
    );
  }

  let data;

  try {
    const contentType =
      response.headers.get(
        "content-type"
      ) ||
      "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      data =
        text ||
        null;
    }
  } catch {
    data =
      null;
  }

  if (
    response.status ===
    401
  ) {
    throw new Error(
      "Your session is no longer active."
    );
  }

  if (!response.ok) {
    throw new Error(
      typeof data?.detail ===
      "string"
        ? data.detail
        : typeof data?.message ===
            "string"
          ? data.message
          : typeof data ===
              "string"
            ? data
            : "Unable to complete the session request."
    );
  }

  return data;
}


async function identifySession(
  browser,
  deviceType,
  platform
) {
  return sessionRequest(
    "/me/sessions/current",
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          browser,

          device_type:
            deviceType,

          platform,

          user_agent:
            navigator.userAgent ||
            null,
        }),
    }
  );
}


async function fetchSessions() {
  return sessionRequest(
    "/me/sessions"
  );
}


async function removeSession(
  sessionId
) {
  return sessionRequest(
    `/me/sessions/${encodeURIComponent(
      sessionId
    )}`,
    {
      method:
        "DELETE",
    }
  );
}


async function removeOtherSessions() {
  return sessionRequest(
    "/me/sessions",
    {
      method:
        "DELETE",
    }
  );
}


/* =========================================================
   DEVICE HELPERS
   ========================================================= */

function getBrowserName() {
  const ua =
    navigator.userAgent;

  if (
    ua.includes(
      "Edg/"
    )
  ) {
    return "Microsoft Edge";
  }

  if (
    ua.includes(
      "Firefox/"
    )
  ) {
    return "Mozilla Firefox";
  }

  if (
    ua.includes(
      "OPR/"
    )
  ) {
    return "Opera";
  }

  if (
    ua.includes(
      "Chrome/"
    )
  ) {
    return "Google Chrome";
  }

  if (
    ua.includes(
      "Safari/"
    )
  ) {
    return "Safari";
  }

  return "Web Browser";
}


function getDeviceType() {
  const ua =
    navigator.userAgent
      .toLowerCase();

  if (
    /ipad|tablet/.test(
      ua
    )
  ) {
    return "Tablet";
  }

  if (
    /android|iphone|mobile/.test(
      ua
    )
  ) {
    return "Mobile";
  }

  return "Desktop";
}


function getPlatformName() {
  const ua =
    navigator.userAgent
      .toLowerCase();

  if (
    ua.includes(
      "windows"
    )
  ) {
    return "Windows";
  }

  if (
    ua.includes(
      "android"
    )
  ) {
    return "Android";
  }

  if (
    ua.includes(
      "iphone"
    ) ||
    ua.includes(
      "ipad"
    )
  ) {
    return "iOS";
  }

  if (
    ua.includes(
      "mac os"
    )
  ) {
    return "macOS";
  }

  if (
    ua.includes(
      "linux"
    )
  ) {
    return "Linux";
  }

  return (
    navigator.platform ||
    "Unknown Platform"
  );
}


function formatDateTime(
  value
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  return date
    .toLocaleString(
      [],
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );
}


function relativeTime(
  value
) {
  if (!value) {
    return "Unknown";
  }

  const timestamp =
    new Date(
      value
    )
      .getTime();

  if (
    Number.isNaN(
      timestamp
    )
  ) {
    return "Unknown";
  }

  const minutes =
    Math.floor(
      Math.max(
        0,
        Date.now() -
        timestamp
      ) /
      60000
    );

  if (
    minutes <
    1
  ) {
    return "Active now";
  }

  if (
    minutes ===
    1
  ) {
    return "1 minute ago";
  }

  if (
    minutes <
    60
  ) {
    return `${minutes} minutes ago`;
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  if (
    hours ===
    1
  ) {
    return "1 hour ago";
  }

  if (
    hours <
    24
  ) {
    return `${hours} hours ago`;
  }

  const days =
    Math.floor(
      hours /
      24
    );

  return days ===
    1
    ? "1 day ago"
    : `${days} days ago`;
}


/* =========================================================
   PAGE
   ========================================================= */

function AdminProfilePage() {
  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);


  const adminName =
    localStorage.getItem(
      "user_name"
    ) ||
    "Dr. Evans Admin";


  const adminEmail =
    localStorage.getItem(
      "user_email"
    ) ||
    "Administrator account";


  const initials =
    adminName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase()
      )
      .join("") ||
    "DE";


  /* =======================================================
     PROFILE PHOTO
     ======================================================= */

  const [
    profilePhoto,
    setProfilePhoto,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_profile_photo"
      ) ||
      ""
  );

  const [
    pendingPhoto,
    setPendingPhoto,
  ] = useState("");

  const [
    photoMessage,
    setPhotoMessage,
  ] = useState("");


  /* =======================================================
     THEME
     ======================================================= */

  const [
    theme,
    setTheme,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_theme"
      ) ||
      document.documentElement
        .getAttribute(
          "data-admin-theme"
        ) ||
      "light"
  );


  /* =======================================================
     ALERT PREFERENCES
     ======================================================= */

  const [
    notificationPrefs,
    setNotificationPrefs,
  ] = useState(
    () => {
      try {
        const saved =
          localStorage.getItem(
            "admin_notification_preferences"
          );

        return saved
          ? JSON.parse(
              saved
            )
          : {
              lowStock:
                true,

              expiry:
                true,

              purchases:
                true,

              support:
                true,
            };
      } catch {
        return {
          lowStock:
            true,

          expiry:
            true,

          purchases:
            true,

          support:
            true,
        };
      }
    }
  );


  /* =======================================================
     PASSWORD
     ======================================================= */

  const [
    passwordModalOpen,
    setPasswordModalOpen,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  /* =======================================================
     SESSIONS
     ======================================================= */

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] = useState(true);

  const [
    sessionsError,
    setSessionsError,
  ] = useState("");

  const [
    sessionMessage,
    setSessionMessage,
  ] = useState("");

  const [
    selectedSessionId,
    setSelectedSessionId,
  ] = useState("");

  const [
    sessionModalOpen,
    setSessionModalOpen,
  ] = useState(false);

  const [
    refreshingSessions,
    setRefreshingSessions,
  ] = useState(false);

  const [
    revokingSessionId,
    setRevokingSessionId,
  ] = useState("");

  const [
    revokingOthers,
    setRevokingOthers,
  ] = useState(false);

  const [
    sessionHighlight,
    setSessionHighlight,
  ] = useState(false);


  const browserName =
    getBrowserName();

  const deviceType =
    getDeviceType();

  const platformName =
    getPlatformName();


  const currentSession =
    sessions.find(
      (session) =>
        session.is_current
    ) ||
    null;


  const selectedSession =
    sessions.find(
      (session) =>
        session.session_id ===
        selectedSessionId
    ) ||
    currentSession ||
    sessions[0] ||
    null;


  const otherSessionCount =
    sessions.filter(
      (session) =>
        !session.is_current
    ).length;


  /* =======================================================
     ACCESS SUMMARY

     These are informational capabilities inherited from
     the administrator role.
     ======================================================= */

  const accessItems = [
    {
      icon:
        "patients",

      title:
        "Patient Management",

      scope:
        "Full Access",

      role:
        "Included with Administrator role",

      description:
        "View patient records, review patient activity and manage patient-related pharmacy workflows.",
    },

    {
      icon:
        "prescription",

      title:
        "Prescription & Refill Oversight",

      scope:
        "Full Access",

      role:
        "Included with Administrator role",

      description:
        "Review refill activity, monitor prescription-related workflows and handle pharmacy follow-up tasks.",
    },

    {
      icon:
        "inventory",

      title:
        "Medicine Inventory",

      scope:
        "Full Access",

      role:
        "Included with Administrator role",

      description:
        "View and manage medicine stock, prices, reorder levels, expiry information and inventory records.",
    },

    {
      icon:
        "report",

      title:
        "Reports & Operations",

      scope:
        "Full Access",

      role:
        "Included with Administrator role",

      description:
        "Access pharmacy reports, sales and purchase information, operational alerts and administration tools.",
    },
  ];


  /* =======================================================
     THEME
     ======================================================= */

  useEffect(
    () => {
      document.documentElement
        .setAttribute(
          "data-admin-theme",
          theme
        );

      localStorage.setItem(
        "admin_theme",
        theme
      );
    },
    [
      theme,
    ]
  );


  /* =======================================================
     ALERT PREFERENCES
     ======================================================= */

  useEffect(
    () => {
      localStorage.setItem(
        "admin_notification_preferences",
        JSON.stringify(
          notificationPrefs
        )
      );
    },
    [
      notificationPrefs,
    ]
  );


  /* =======================================================
     LOAD SESSIONS
     ======================================================= */

  const loadSessions =
    useCallback(
      async ({
        identify = false,
        silent = false,
      } = {}) => {
        if (!silent) {
          setSessionsLoading(
            true
          );
        }

        setSessionsError("");

        try {
          if (identify) {
            await identifySession(
              getBrowserName(),
              getDeviceType(),
              getPlatformName()
            );
          }

          const result =
            await fetchSessions();

          const next =
            Array.isArray(
              result?.sessions
            )
              ? result.sessions
              : [];

          setSessions(
            next
          );

          const current =
            next.find(
              (session) =>
                session.is_current
            );

          if (current) {
            setSelectedSessionId(
              (existing) =>
                existing ||
                current.session_id
            );
          }
        } catch (error) {
          const errorMessage =
            error?.message ||
            "Unable to load signed-in devices.";

          setSessionsError(
            errorMessage
          );

          if (
            errorMessage
              .toLowerCase()
              .includes(
                "no longer active"
              )
          ) {
            logout();

            navigate(
              "/login",
              {
                replace:
                  true,
              }
            );
          }
        } finally {
          if (!silent) {
            setSessionsLoading(
              false
            );
          }
        }
      },
      [
        navigate,
      ]
    );


  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadSessions({
              identify:
                true,
            });
          },
          0
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      loadSessions,
    ]
  );


  useEffect(
    () => {
      const timer =
        window.setInterval(
          () => {
            void loadSessions({
              silent:
                true,
            });
          },
          60000
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      loadSessions,
    ]
  );


  /* =======================================================
     PASSWORD HELPERS
     ======================================================= */

  const resetPassword =
    useCallback(
      () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      },
      []
    );


  const closePassword =
    useCallback(
      () => {
        if (
          changingPassword
        ) {
          return;
        }

        setPasswordModalOpen(
          false
        );

        resetPassword();
      },
      [
        changingPassword,
        resetPassword,
      ]
    );


  useEffect(
    () => {
      if (
        !passwordModalOpen
      ) {
        return undefined;
      }

      function onKeyDown(
        event
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          closePassword();
        }
      }

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    [
      passwordModalOpen,
      closePassword,
    ]
  );


  useEffect(
    () => {
      if (
        !sessionModalOpen
      ) {
        return undefined;
      }

      function onKeyDown(
        event
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setSessionModalOpen(
            false
          );
        }
      }

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    [
      sessionModalOpen,
    ]
  );


  /* =======================================================
     PASSWORD
     ======================================================= */

  async function submitPassword(
    event
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError(
        "Enter your current password."
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      setPasswordError(
        "New password must contain at least 8 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );

      return;
    }

    if (
      currentPassword ===
      newPassword
    ) {
      setPasswordError(
        "New password must be different from your current password."
      );

      return;
    }

    setChangingPassword(
      true
    );

    try {
      const result =
        await changePassword(
          currentPassword,
          newPassword,
          confirmPassword
        );

      setPasswordSuccess(
        result?.message ||
        "Password changed successfully. Please sign in again."
      );
    } catch (error) {
      setPasswordError(
        error?.message ||
        "Unable to change password."
      );
    } finally {
      setChangingPassword(
        false
      );
    }
  }


  /* =======================================================
     SESSION ACTIONS
     ======================================================= */

  async function refreshSessions() {
    if (
      refreshingSessions
    ) {
      return;
    }

    setRefreshingSessions(
      true
    );

    setSessionMessage("");

    try {
      await identifySession(
        browserName,
        deviceType,
        platformName
      );

      await loadSessions({
        silent:
          true,
      });

      setSessionMessage(
        "Signed-in devices refreshed successfully."
      );
    } catch (error) {
      setSessionMessage(
        error?.message ||
        "Unable to refresh signed-in devices."
      );
    } finally {
      setRefreshingSessions(
        false
      );
    }
  }


  async function revokeSession(
    session
  ) {
    if (
      !session?.session_id ||
      revokingSessionId
    ) {
      return;
    }

    setRevokingSessionId(
      session.session_id
    );

    setSessionMessage("");

    try {
      const result =
        await removeSession(
          session.session_id
        );

      if (
        result?.is_current
      ) {
        logout();

        navigate(
          "/login",
          {
            replace:
              true,
          }
        );

        return;
      }

      setSessionModalOpen(
        false
      );

      setSessionMessage(
        "Device signed out successfully."
      );

      await loadSessions({
        silent:
          true,
      });
    } catch (error) {
      setSessionMessage(
        error?.message ||
        "Unable to sign out this device."
      );
    } finally {
      setRevokingSessionId(
        ""
      );
    }
  }


  async function revokeOthers() {
    if (
      revokingOthers
    ) {
      return;
    }

    setRevokingOthers(
      true
    );

    setSessionMessage("");

    try {
      const result =
        await removeOtherSessions();

      const count =
        Number(
          result?.revoked ||
          0
        );

      setSessionMessage(
        count ===
        1
          ? "1 other device was signed out."
          : `${count} other devices were signed out.`
      );

      await loadSessions({
        silent:
          true,
      });
    } catch (error) {
      setSessionMessage(
        error?.message ||
        "Unable to sign out other devices."
      );
    } finally {
      setRevokingOthers(
        false
      );
    }
  }


  async function handleLogout() {
    if (
      currentSession
        ?.session_id
    ) {
      try {
        await removeSession(
          currentSession.session_id
        );
      } catch {
        // Local logout still continues.
      }
    }

    logout();

    navigate(
      "/login",
      {
        replace:
          true,
      }
    );
  }


  function openSessions() {
    const section =
      document.getElementById(
        "admin-active-session-section"
      );

    section?.scrollIntoView({
      behavior:
        "smooth",

      block:
        "center",
    });

    setSessionHighlight(
      true
    );

    void loadSessions({
      identify:
        true,
    });

    window.setTimeout(
      () => {
        setSessionHighlight(
          false
        );

        setSessionModalOpen(
          true
        );
      },
      350
    );
  }


  function openSession(
    session
  ) {
    setSelectedSessionId(
      session.session_id
    );

    setSessionMessage("");

    setSessionModalOpen(
      true
    );
  }


  /* =======================================================
     PHOTO
     ======================================================= */

  const visiblePhoto =
    pendingPhoto ||
    profilePhoto;


  function choosePhoto() {
    fileInputRef.current
      ?.click();
  }


  function selectPhoto(
    event
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(
        file.type
      )
    ) {
      setPhotoMessage(
        "Please choose a JPG, PNG or WebP image."
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      2 *
      1024 *
      1024
    ) {
      setPhotoMessage(
        "Profile photo must be 2 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          setPendingPhoto(
            reader.result
          );

          setPhotoMessage(
            "Preview ready. Save the photo to use it across the admin dashboard."
          );
        }
      };

    reader.readAsDataURL(
      file
    );

    event.target.value =
      "";
  }


  function savePhoto() {
    if (!pendingPhoto) {
      return;
    }

    localStorage.setItem(
      "admin_profile_photo",
      pendingPhoto
    );

    setProfilePhoto(
      pendingPhoto
    );

    setPendingPhoto("");

    setPhotoMessage(
      "Profile photo saved successfully."
    );

    window.dispatchEvent(
      new CustomEvent(
        "admin-profile-photo-updated",
        {
          detail: {
            photo:
              pendingPhoto,
          },
        }
      )
    );
  }


  function removePhoto() {
    localStorage.removeItem(
      "admin_profile_photo"
    );

    setProfilePhoto("");
    setPendingPhoto("");

    setPhotoMessage(
      "Profile photo removed."
    );

    window.dispatchEvent(
      new CustomEvent(
        "admin-profile-photo-updated",
        {
          detail: {
            photo: "",
          },
        }
      )
    );
  }


  function toggleNotification(
    key
  ) {
    setNotificationPrefs(
      (current) => ({
        ...current,

        [key]:
          !current[key],
      })
    );
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <section className="admin-profile-page">
        {/* =================================================
            HEADER
            ================================================= */}

        <header className="admin-profile-page__header">
          <button
            type="button"
            className="admin-profile-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            <Icon
              name="back"
              size={18}
            />

            Back
          </button>


          <div className="admin-profile-hero-main">
            <span className="admin-profile-hero-icon">
              {
                profilePhoto
                  ? (
                    <img
                      src={
                        profilePhoto
                      }
                      alt=""
                      className="admin-profile-hero-icon__photo"
                    />
                  )
                  : (
                    <Icon
                      name="user"
                      size={30}
                    />
                  )
              }
            </span>


            <div className="admin-profile-page__heading">
              <span className="admin-profile-page__eyebrow">
                Administrator Account
              </span>

              <h1>
                My Profile
              </h1>

              <p>
                Manage your administrator identity,
                security, preferences and account access.
              </p>
            </div>
          </div>


          <div className="admin-profile-hero-side">
            <span className="admin-profile-hero-badge">
              <Icon
                name="shield"
                size={15}
              />

              Secure Admin
            </span>

            <AdminLiveDateTime />
          </div>
        </header>


        {/* =================================================
            PROFILE
            ================================================= */}

        <div className="admin-profile-page__top-grid">
          <article className="admin-profile-card">
            <div className="admin-profile-card__top-accent" />


            <div className="admin-profile-card__avatar-section">
              <div className="admin-profile-card__avatar-wrap">
                <div className="admin-profile-card__avatar">
                  {
                    visiblePhoto
                      ? (
                        <img
                          src={
                            visiblePhoto
                          }
                          alt={`${adminName} profile`}
                        />
                      )
                      : initials
                  }
                </div>


                <span className="admin-profile-card__verified">
                  <Icon
                    name="shield"
                    size={16}
                  />
                </span>
              </div>


              <button
                type="button"
                className="admin-profile-photo-camera"
                onClick={
                  choosePhoto
                }
              >
                <Icon
                  name="camera"
                  size={17}
                />
              </button>
            </div>


            <input
              ref={
                fileInputRef
              }
              className="admin-profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                selectPhoto
              }
            />


            <span className="admin-profile-card__eyebrow">
              Administrator Profile
            </span>

            <h2>
              {adminName}
            </h2>

            <p className="admin-profile-card__description">
              Dr. Evans Pharmacy Administration
            </p>


            <div className="admin-profile-card__status">
              <span className="admin-profile-card__status-dot" />

              Active administrator account
            </div>


            <div className="admin-profile-photo-panel">
              <strong>
                Profile Photo
              </strong>

              <small>
                JPG, PNG or WebP. Maximum 2 MB.
              </small>


              <div className="admin-profile-photo-actions">
                {
                  pendingPhoto
                    ? (
                      <>
                        <button
                          type="button"
                          className="admin-profile-photo-button admin-profile-photo-button--save"
                          onClick={
                            savePhoto
                          }
                        >
                          Save Photo
                        </button>


                        <button
                          type="button"
                          className="admin-profile-photo-button"
                          onClick={() => {
                            setPendingPhoto("");
                            setPhotoMessage("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )
                    : (
                      <>
                        <button
                          type="button"
                          className="admin-profile-photo-button admin-profile-photo-button--primary"
                          onClick={
                            choosePhoto
                          }
                        >
                          <Icon
                            name="upload"
                            size={16}
                          />

                          {
                            profilePhoto
                              ? "Change Photo"
                              : "Add Photo"
                          }
                        </button>


                        {
                          profilePhoto && (
                            <button
                              type="button"
                              className="admin-profile-photo-button admin-profile-photo-button--remove"
                              onClick={
                                removePhoto
                              }
                            >
                              <Icon
                                name="trash"
                                size={16}
                              />

                              Remove
                            </button>
                          )
                        }
                      </>
                    )
                }
              </div>


              {
                photoMessage && (
                  <p className="admin-profile-photo-message">
                    {photoMessage}
                  </p>
                )
              }
            </div>
          </article>


          <article className="admin-profile-details-card">
            <div className="admin-profile-section-header">
              <span className="admin-profile-section-icon">
                <Icon
                  name="user"
                  size={22}
                />
              </span>

              <div>
                <span className="admin-profile-section-eyebrow">
                  Profile Information
                </span>

                <h2>
                  Administrator Details
                </h2>

                <p>
                  Identity attached to this account.
                </p>
              </div>
            </div>


            <div className="admin-profile-details-grid">
              <Detail
                icon="user"
                label="Full Name"
                value={
                  adminName
                }
              />

              <Detail
                icon="role"
                label="Account Role"
                value="Administrator"
              />

              <Detail
                icon="mail"
                label="Email Address"
                value={
                  adminEmail
                }
              />

              <Detail
                icon="building"
                label="Pharmacy"
                value="Dr. Evans Pharmacy"
              />
            </div>
          </article>
        </div>


        {/* =================================================
            SECURITY
            ================================================= */}

        <article className="admin-profile-control-card">
          <div className="admin-profile-section-header admin-profile-section-header--blue">
            <span className="admin-profile-section-icon">
              <Icon
                name="shield"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-section-eyebrow">
                Account & Security
              </span>

              <h2>
                Security Controls
              </h2>

              <p>
                Protect administrator access.
              </p>
            </div>

            <span className="admin-profile-section-badge">
              Protected
            </span>
          </div>


          <div className="admin-account-action-grid">
            <button
              type="button"
              className="admin-account-action admin-account-action--blue"
              onClick={() => {
                resetPassword();

                setPasswordModalOpen(
                  true
                );
              }}
            >
              <span className="admin-account-action__icon">
                <Icon
                  name="key"
                  size={22}
                />
              </span>

              <span className="admin-account-action__copy">
                <small>
                  Authentication
                </small>

                <strong>
                  Change Password
                </strong>

                <span>
                  Verify your current password and set a new one.
                </span>
              </span>

              <span className="admin-account-action__footer">
                <b>
                  Change Password
                </b>

                <Icon
                  name="chevron"
                  size={17}
                />
              </span>
            </button>


            <button
              type="button"
              className="admin-account-action admin-account-action--violet"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent(
                    "admin-request-lock"
                  )
                )
              }
            >
              <span className="admin-account-action__icon">
                <Icon
                  name="lock"
                  size={22}
                />
              </span>

              <span className="admin-account-action__copy">
                <small>
                  Quick Security
                </small>

                <strong>
                  Lock Application
                </strong>

                <span>
                  Lock the dashboard without ending the session.
                </span>
              </span>

              <span className="admin-account-action__footer">
                <b>
                  Lock Application
                </b>

                <Icon
                  name="chevron"
                  size={17}
                />
              </span>
            </button>


            <button
              type="button"
              className="admin-account-action admin-account-action--orange"
              onClick={
                openSessions
              }
            >
              <span className="admin-account-action__icon">
                <Icon
                  name="monitor"
                  size={22}
                />
              </span>

              <span className="admin-account-action__copy">
                <small>
                  Sessions
                </small>

                <strong>
                  Active Sessions
                </strong>

                <span>
                  Review browsers and devices signed into this account.
                </span>
              </span>

              <span className="admin-account-action__footer">
                <b>
                  View Sessions
                </b>

                <Icon
                  name="chevron"
                  size={17}
                />
              </span>
            </button>
          </div>
        </article>


        {/* =================================================
            THEME
            ================================================= */}

        <article className="admin-profile-control-card">
          <div className="admin-profile-section-header admin-profile-section-header--cyan">
            <span className="admin-profile-section-icon">
              <Icon
                name="palette"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-section-eyebrow">
                Preferences
              </span>

              <h2>
                Theme & Display
              </h2>

              <p>
                Choose how the administration interface appears.
              </p>
            </div>
          </div>


          <div className="admin-theme-choice-grid">
            <button
              type="button"
              className={
                `admin-theme-choice ${
                  theme ===
                  "light"
                    ? "is-active"
                    : ""
                }`
              }
              onClick={() =>
                setTheme(
                  "light"
                )
              }
            >
              <Icon
                name="sun"
                size={22}
              />

              <span>
                <strong>
                  Light Mode
                </strong>

                <small>
                  Bright workspace
                </small>
              </span>
            </button>


            <button
              type="button"
              className={
                `admin-theme-choice ${
                  theme ===
                  "dark"
                    ? "is-active"
                    : ""
                }`
              }
              onClick={() =>
                setTheme(
                  "dark"
                )
              }
            >
              <Icon
                name="moon"
                size={22}
              />

              <span>
                <strong>
                  Dark Mode
                </strong>

                <small>
                  Reduced-glare workspace
                </small>
              </span>
            </button>
          </div>
        </article>


        {/* =================================================
            ALERTS
            ================================================= */}

        <article className="admin-profile-control-card">
          <div className="admin-profile-section-header admin-profile-section-header--orange">
            <span className="admin-profile-section-icon">
              <Icon
                name="bell"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-section-eyebrow">
                Notifications
              </span>

              <h2>
                Pharmacy Alerts
              </h2>

              <p>
                Control which operational events are highlighted.
              </p>
            </div>
          </div>


          <div className="admin-notification-grid">
            {
              [
                {
                  key:
                    "lowStock",

                  title:
                    "Low Stock Alerts",

                  text:
                    "Medicine quantities reaching reorder levels.",
                },

                {
                  key:
                    "expiry",

                  title:
                    "Expiry Alerts",

                  text:
                    "Medicines approaching expiry.",
                },

                {
                  key:
                    "purchases",

                  title:
                    "Purchase Activity",

                  text:
                    "Important supplier and purchase changes.",
                },

                {
                  key:
                    "support",

                  title:
                    "Support Tickets",

                  text:
                    "Technical support updates and responses.",
                },
              ].map(
                (item) => (
                  <label
                    className="admin-notification-option"
                    key={
                      item.key
                    }
                  >
                    <span>
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.text}
                      </small>
                    </span>


                    <input
                      type="checkbox"
                      checked={
                        Boolean(
                          notificationPrefs[
                            item.key
                          ]
                        )
                      }
                      onChange={() =>
                        toggleNotification(
                          item.key
                        )
                      }
                    />

                    <span className="admin-profile-switch" />
                  </label>
                )
              )
            }
          </div>
        </article>


        {/* =================================================
            SIGNED-IN DEVICES
            ================================================= */}

        <article
          id="admin-active-session-section"
          className={
            `admin-profile-control-card admin-session-card ${
              sessionHighlight
                ? "is-session-highlighted"
                : ""
            }`
          }
        >
          <div className="admin-profile-section-header admin-profile-section-header--violet">
            <span className="admin-profile-section-icon">
              <Icon
                name="phone"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-section-eyebrow">
                Active Sessions
              </span>

              <h2>
                Signed-in Devices
              </h2>

              <p>
                Review and revoke administrator sessions.
              </p>
            </div>

            <span className="admin-profile-section-badge">
              {
                sessionsLoading
                  ? "Loading..."
                  : `${sessions.length} Active`
              }
            </span>
          </div>


          <div className="admin-session-list">
            {
              sessionsError && (
                <div className="admin-profile-inline-message">
                  <span>
                    {sessionsError}
                  </span>
                </div>
              )
            }


            {
              sessionsLoading &&
              sessions.length ===
                0 && (
                <div className="admin-profile-inline-message">
                  <span>
                    Loading signed-in devices...
                  </span>
                </div>
              )
            }


            {
              !sessionsLoading &&
              sessions.length ===
                0 && (
                <div className="admin-profile-inline-message">
                  <span>
                    No active sessions were found.
                  </span>
                </div>
              )
            }


            <div
              className={
                `admin-session-devices-scroll ${
                  sessions.length <=
                  2
                    ? "is-short-list"
                    : ""
                }`
              }
            >
              {
                sessions.map(
                  (session) => (
                    <div
                      className="admin-session-item"
                      key={
                        session.session_id
                      }
                    >
                      <span className="admin-session-item__icon">
                        <Icon
                          name={
                            session.device_type ===
                            "Mobile"
                              ? "phone"
                              : "monitor"
                          }
                          size={22}
                        />
                      </span>


                      <div className="admin-session-item__main">
                        <strong>
                          {
                            session.is_current
                              ? "Current Browser Session"
                              : `${session.browser || "Browser"} Session`
                          }
                        </strong>

                        <span>
                          {
                            session.browser ||
                            "Unidentified Browser"
                          }

                          {" • "}

                          {
                            session.device_type ||
                            "Unknown Device"
                          }

                          {" • "}

                          {
                            session.platform ||
                            "Unknown Platform"
                          }
                        </span>

                        <small>
                          {
                            session.is_current
                              ? "Active now"
                              : `Last active ${relativeTime(
                                  session.last_seen_at
                                )}`
                          }
                        </small>
                      </div>


                      <div className="admin-session-item__actions">
                        <span className="admin-session-current">
                          {
                            session.is_current
                              ? "Current Session"
                              : "Active"
                          }
                        </span>

                        <button
                          type="button"
                          className="admin-session-view-button"
                          onClick={() =>
                            openSession(
                              session
                            )
                          }
                        >
                          View Details

                          <Icon
                            name="chevron"
                            size={15}
                          />
                        </button>

                        {
                          !session.is_current && (
                            <button
                              type="button"
                              className="admin-session-signout-button"
                              disabled={
                                Boolean(
                                  revokingSessionId
                                )
                              }
                              onClick={() =>
                                revokeSession(
                                  session
                                )
                              }
                            >
                              <Icon
                                name="logout"
                                size={15}
                              />

                              {
                                revokingSessionId ===
                                session.session_id
                                  ? "Signing Out..."
                                  : "Sign Out"
                              }
                            </button>
                          )
                        }
                      </div>
                    </div>
                  )
                )
              }
            </div>


            {
              currentSession && (
                <div className="admin-session-summary-grid">
                  <div className="admin-session-summary-item">
                    <Icon
                      name="clock"
                      size={18}
                    />

                    <div>
                      <span>
                        Current Login
                      </span>

                      <strong>
                        {formatDateTime(
                          currentSession.created_at
                        )}
                      </strong>
                    </div>
                  </div>


                  <div className="admin-session-summary-item">
                    <Icon
                      name="refresh"
                      size={18}
                    />

                    <div>
                      <span>
                        Last Activity
                      </span>

                      <strong>
                        {relativeTime(
                          currentSession.last_seen_at
                        )}
                      </strong>
                    </div>
                  </div>


                  <div className="admin-session-summary-item">
                    <Icon
                      name="browser"
                      size={18}
                    />

                    <div>
                      <span>
                        Browser
                      </span>

                      <strong>
                        {
                          currentSession.browser ||
                          browserName
                        }
                      </strong>
                    </div>
                  </div>


                  <div className="admin-session-summary-item">
                    <Icon
                      name="laptop"
                      size={18}
                    />

                    <div>
                      <span>
                        Device
                      </span>

                      <strong>
                        {
                          currentSession.device_type ||
                          deviceType
                        }
                      </strong>
                    </div>
                  </div>
                </div>
              )
            }


            {
              sessionMessage && (
                <div className="admin-profile-inline-message admin-session-status-message">
                  <span>
                    {sessionMessage}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSessionMessage("")
                    }
                  >
                    ×
                  </button>
                </div>
              )
            }


            <div className="admin-session-controls">
              <button
                type="button"
                className="admin-session-refresh-button"
                disabled={
                  refreshingSessions
                }
                onClick={
                  refreshSessions
                }
              >
                <Icon
                  name="refresh"
                  size={17}
                />

                {
                  refreshingSessions
                    ? "Refreshing..."
                    : "Refresh Devices"
                }
              </button>


              {
                otherSessionCount >
                  0 && (
                  <button
                    type="button"
                    className="admin-session-signout-button"
                    disabled={
                      revokingOthers
                    }
                    onClick={
                      revokeOthers
                    }
                  >
                    <Icon
                      name="logout"
                      size={17}
                    />

                    {
                      revokingOthers
                        ? "Signing Out..."
                        : `Sign Out Other Device${
                            otherSessionCount ===
                            1
                              ? ""
                              : "s"
                          }`
                    }
                  </button>
                )
              }
            </div>
          </div>
        </article>


        {/* =================================================
            ACCOUNT ACCESS
            ================================================= */}

        <article className="admin-profile-access-card">
          <div className="admin-profile-section-header admin-profile-section-header--green">
            <span className="admin-profile-section-icon">
              <Icon
                name="shield"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-section-eyebrow">
                Administrator Permissions
              </span>

              <h2>
                Account Access
              </h2>

              <p>
                This section summarizes the pharmacy areas
                available to your Administrator role.
              </p>
            </div>

            <span className="admin-profile-section-badge">
              Full Administrator Access
            </span>
          </div>


          <div className="admin-profile-access-grid">
            {
              accessItems.map(
                (item) => (
                  <div
                    className="admin-profile-access-item"
                    key={
                      item.title
                    }
                  >
                    <span className="admin-profile-access-item__icon">
                      <Icon
                        name={
                          item.icon
                        }
                        size={21}
                      />
                    </span>


                    <div>
                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "space-between",

                          gap:
                            "12px",

                          marginBottom:
                            "6px",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <strong>
                          {item.title}
                        </strong>

                        <span
                          style={{
                            display:
                              "inline-flex",

                            alignItems:
                              "center",

                            gap:
                              "5px",

                            padding:
                              "5px 9px",

                            borderRadius:
                              "999px",

                            background:
                              "rgba(29, 177, 126, 0.12)",

                            color:
                              "#20a879",

                            fontSize:
                              "9px",

                            fontWeight:
                              "900",

                            letterSpacing:
                              ".3px",

                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <Icon
                            name="check"
                            size={13}
                          />

                          {item.scope}
                        </span>
                      </div>


                      <span
                        style={{
                          display:
                            "block",

                          marginBottom:
                            "7px",

                          color:
                            "#5ea992",

                          fontSize:
                            "9px",

                          fontWeight:
                            "800",

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            ".55px",
                        }}
                      >
                        {item.role}
                      </span>


                      <p>
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              )
            }
          </div>


          <div
            style={{
              display:
                "flex",

              alignItems:
                "flex-start",

              gap:
                "10px",

              margin:
                "14px 17px 17px",

              padding:
                "12px 14px",

              border:
                "1px solid rgba(54, 139, 113, .32)",

              borderRadius:
                "12px",

              background:
                "rgba(24, 111, 87, .08)",
            }}
          >
            <span
              style={{
                width:
                  "32px",

                height:
                  "32px",

                display:
                  "grid",

                placeItems:
                  "center",

                flex:
                  "0 0 32px",

                borderRadius:
                  "9px",

                background:
                  "rgba(32, 168, 121, .14)",

                color:
                  "#20a879",
              }}
            >
              <Icon
                name="shield"
                size={17}
              />
            </span>


            <div>
              <strong
                style={{
                  display:
                    "block",

                  marginBottom:
                    "3px",
                }}
              >
                Access is inherited from your Administrator role
              </strong>

              <p
                style={{
                  margin:
                    0,

                  fontSize:
                    "10px",

                  lineHeight:
                    "1.55",

                  opacity:
                    ".75",
                }}
              >
                These cards are an access summary. They do not
                create separate permissions or change pharmacy
                records. Your administrator role controls access
                to these management areas.
              </p>
            </div>
          </div>
        </article>


        {/* =================================================
            LOGOUT
            ================================================= */}

        <article className="admin-profile-danger-card">
          <div className="admin-profile-danger-copy">
            <span className="admin-profile-danger-icon">
              <Icon
                name="shield"
                size={22}
              />
            </span>

            <div>
              <span className="admin-profile-danger-eyebrow">
                Account Session
              </span>

              <h2>
                Secure Administrator Access
              </h2>

              <p>
                Always sign out after using a shared workstation.
              </p>
            </div>
          </div>


          <button
            type="button"
            className="admin-profile-logout-button"
            onClick={
              handleLogout
            }
          >
            <Icon
              name="logout"
              size={19}
            />

            Log Out
          </button>
        </article>
      </section>


      {/* ===================================================
          PASSWORD MODAL
          =================================================== */}

      {
        passwordModalOpen && (
          <div
            className="admin-password-modal-backdrop"
            role="presentation"
            onMouseDown={
              (event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closePassword();
                }
              }
            }
          >
            <div
              className="admin-password-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-password-title"
            >
              {
                passwordSuccess
                  ? (
                    <div className="admin-password-success">
                      <span className="admin-password-success__icon">
                        <Icon
                          name="shield"
                          size={28}
                        />
                      </span>

                      <span className="admin-password-modal__eyebrow">
                        Password Updated
                      </span>

                      <h2 id="admin-password-title">
                        Password changed successfully
                      </h2>

                      <p>
                        {passwordSuccess}
                      </p>

                      <button
                        type="button"
                        className="admin-password-primary-button"
                        onClick={() => {
                          logout();

                          navigate(
                            "/login",
                            {
                              replace:
                                true,
                            }
                          );
                        }}
                      >
                        Sign In Again
                      </button>
                    </div>
                  )
                  : (
                    <>
                      <div className="admin-password-modal__header">
                        <span className="admin-password-modal__icon">
                          <Icon
                            name="key"
                            size={23}
                          />
                        </span>

                        <div>
                          <span className="admin-password-modal__eyebrow">
                            Account Security
                          </span>

                          <h2 id="admin-password-title">
                            Change Password
                          </h2>

                          <p>
                            Verify your current password
                            before creating a new one.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="admin-password-modal__close"
                          onClick={
                            closePassword
                          }
                        >
                          <Icon
                            name="x"
                            size={19}
                          />
                        </button>
                      </div>


                      <form
                        className="admin-password-form"
                        onSubmit={
                          submitPassword
                        }
                      >
                        <PasswordField
                          label="Current Password"
                          value={
                            currentPassword
                          }
                          onChange={
                            setCurrentPassword
                          }
                          visible={
                            showCurrentPassword
                          }
                          setVisible={
                            setShowCurrentPassword
                          }
                          autoComplete="current-password"
                        />

                        <PasswordField
                          label="New Password"
                          value={
                            newPassword
                          }
                          onChange={
                            setNewPassword
                          }
                          visible={
                            showNewPassword
                          }
                          setVisible={
                            setShowNewPassword
                          }
                          autoComplete="new-password"
                        />

                        <PasswordField
                          label="Confirm New Password"
                          value={
                            confirmPassword
                          }
                          onChange={
                            setConfirmPassword
                          }
                          visible={
                            showConfirmPassword
                          }
                          setVisible={
                            setShowConfirmPassword
                          }
                          autoComplete="new-password"
                        />


                        <div className="admin-password-rules">
                          <Icon
                            name="shield"
                            size={15}
                          />

                          <p>
                            Use at least 8 characters and choose
                            a different password.
                          </p>
                        </div>


                        {
                          passwordError && (
                            <div className="admin-password-error">
                              {passwordError}
                            </div>
                          )
                        }


                        <div className="admin-password-modal__actions">
                          <button
                            type="button"
                            className="admin-password-secondary-button"
                            onClick={
                              closePassword
                            }
                            disabled={
                              changingPassword
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            className="admin-password-primary-button"
                            disabled={
                              changingPassword
                            }
                          >
                            {
                              changingPassword
                                ? "Changing Password..."
                                : "Change Password"
                            }
                          </button>
                        </div>
                      </form>
                    </>
                  )
              }
            </div>
          </div>
        )
      }


      {/* ===================================================
          SESSION MODAL
          =================================================== */}

      {
        sessionModalOpen &&
        selectedSession && (
          <div
            className="admin-session-modal-backdrop"
            role="presentation"
            onMouseDown={
              (event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setSessionModalOpen(
                    false
                  );
                }
              }
            }
          >
            <section
              className="admin-session-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="session-title"
            >
              <div className="admin-session-modal__header">
                <span className="admin-session-modal__icon">
                  <Icon
                    name="monitor"
                    size={24}
                  />
                </span>

                <div>
                  <span className="admin-session-modal__eyebrow">
                    Signed-in Device
                  </span>

                  <h2 id="session-title">
                    {
                      selectedSession.is_current
                        ? "Current Browser Session"
                        : "Administrator Session"
                    }
                  </h2>

                  <p>
                    Review this device session.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-session-modal__close"
                  onClick={() =>
                    setSessionModalOpen(
                      false
                    )
                  }
                >
                  <Icon
                    name="x"
                    size={19}
                  />
                </button>
              </div>


              <div className="admin-session-modal__body">
                <div className="admin-session-modal__identity">
                  <div className="admin-session-modal__avatar">
                    {
                      profilePhoto
                        ? (
                          <img
                            src={
                              profilePhoto
                            }
                            alt=""
                          />
                        )
                        : initials
                    }
                  </div>

                  <div>
                    <strong>
                      {adminName}
                    </strong>

                    <span>
                      {adminEmail}
                    </span>
                  </div>

                  <span className="admin-session-modal__current">
                    {
                      selectedSession.is_current
                        ? "Current"
                        : "Active"
                    }
                  </span>
                </div>


                <div className="admin-session-detail-grid">
                  <SessionDetail
                    icon="browser"
                    label="Browser"
                    value={
                      selectedSession.browser ||
                      "Unidentified Browser"
                    }
                  />

                  <SessionDetail
                    icon="laptop"
                    label="Device Type"
                    value={
                      selectedSession.device_type ||
                      "Unknown Device"
                    }
                  />

                  <SessionDetail
                    icon="phone"
                    label="Platform"
                    value={
                      selectedSession.platform ||
                      "Unknown Platform"
                    }
                  />

                  <SessionDetail
                    icon="clock"
                    label="Signed In"
                    value={
                      formatDateTime(
                        selectedSession.created_at
                      )
                    }
                  />

                  <SessionDetail
                    icon="refresh"
                    label="Last Activity"
                    value={
                      relativeTime(
                        selectedSession.last_seen_at
                      )
                    }
                  />

                  <SessionDetail
                    icon="shield"
                    label="Session Status"
                    value="Authenticated"
                  />
                </div>


                <div className="admin-session-security-note">
                  <Icon
                    name="shield"
                    size={17}
                  />

                  <div>
                    <strong>
                      {
                        selectedSession.is_current
                          ? "This is your current session"
                          : "Remote session controls enabled"
                      }
                    </strong>

                    <p>
                      {
                        selectedSession.is_current
                          ? "Signing out this session returns this browser to login."
                          : "Signing out this device revokes its server-side session."
                      }
                    </p>
                  </div>
                </div>
              </div>


              <div className="admin-session-modal__footer">
                <button
                  type="button"
                  className="admin-session-refresh-button"
                  onClick={
                    refreshSessions
                  }
                  disabled={
                    refreshingSessions
                  }
                >
                  <Icon
                    name="refresh"
                    size={17}
                  />

                  {
                    refreshingSessions
                      ? "Refreshing..."
                      : "Refresh"
                  }
                </button>

                <button
                  type="button"
                  className="admin-session-signout-button"
                  disabled={
                    Boolean(
                      revokingSessionId
                    )
                  }
                  onClick={() =>
                    revokeSession(
                      selectedSession
                    )
                  }
                >
                  <Icon
                    name="logout"
                    size={17}
                  />

                  {
                    revokingSessionId ===
                    selectedSession.session_id
                      ? "Signing Out..."
                      : selectedSession.is_current
                        ? "Sign Out This Session"
                        : "Sign Out This Device"
                  }
                </button>
              </div>
            </section>
          </div>
        )
      }
    </>
  );
}


export default AdminProfilePage;