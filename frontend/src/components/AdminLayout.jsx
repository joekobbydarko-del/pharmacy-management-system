import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getAdminAlerts } from "../api";
import AdminNotificationCenter from "./AdminNotificationCenter";

import "./AdminTopbar.css";
import "./AdminLayout.css";
import "./AdminAppLock.css";

const API_BASE_URL =
  `http://${window.location.hostname}:8000`;

/* =========================================================
   DR. EVANS PHARMACY
   PHARMACIST APPLICATION LAYOUT

   Visible navigation:
   - Orders replaces POS
   - POS remains an internal backend engine

   Preserved:
   - Profile photo
   - Notifications and alert badges
   - Search
   - Mobile navigation
   - Application lock/unlock
   - Logout
   - Light/dark mode styling hooks
   ========================================================= */

/* =========================================================
   ICONS
   ========================================================= */

function AdminIcon({ name, size = 20 }) {
  const common = {
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
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    orders: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10" />
        <path d="M7 12h4" />
        <path d="M15 12h2" />
        <path d="M7 16h2" />
        <path d="M13 16h4" />
      </>
    ),

    inventory: (
      <>
        <path d="m4 7 8-4 8 4-8 4Z" />
        <path d="m4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),

    sales: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    purchase: (
      <>
        <path d="M3 4h2l2.2 10h10.6l2-7H6" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
      </>
    ),

    supplier: (
      <>
        <path d="M3 19V8l6-3v14" />
        <path d="M9 10l6-3v12" />
        <path d="M15 12l6-3v10" />
      </>
    ),

    patients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2" />
        <path d="M16 14a5 5 0 0 1 5 5" />
      </>
    ),

    appointments: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h3" />
        <path d="M8 17h6" />
      </>
    ),

    reports: (
      <>
        <path d="M5 3h10l4 4v14H5Z" />
        <path d="M15 3v5h5" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </>
    ),

    alerts: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    support: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h2v-6H4Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-2v-6h4Z" />
        <path d="M16 21h-4" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="m14 8 4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),

    chevron: <path d="m9 18 6-6-6-6" />,

    down: <path d="m7 9 5 5 5-5" />,

    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6" />
        <path d="M6.6 6.6C3.5 8.2 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-.9" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}

/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

const menuItems = [
  {
    label: "Dashboard",
    icon: "dashboard",
    path: "/admin",
  },
  {
    label: "Orders",
    icon: "orders",
    path: "/admin/orders",
  },
  {
    label: "Inventory",
    icon: "inventory",
    path: "/admin/inventory",
  },
  {
    label: "Sales",
    icon: "sales",
    path: "/admin/sales",
  },
  {
    label: "Purchases",
    icon: "purchase",
    path: "/admin/purchases",
  },
  {
    label: "Suppliers",
    icon: "supplier",
    path: "/admin/suppliers",
  },
  {
    label: "Patients",
    icon: "patients",
    path: "/admin/patients",
  },
  {
    label: "Appointments",
    icon: "appointments",
    path: "/admin/appointments",
  },
  {
    label: "Reports",
    icon: "reports",
    path: "/admin/reports",
  },
  {
    label: "Alerts",
    icon: "alerts",
    path: "/admin/alerts",
  },
];

/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

const searchItems = [
  {
    title: "Dashboard",
    description: "Pharmacy management overview",
    path: "/admin",
    icon: "dashboard",
  },
  {
    title: "Orders",
    description: "Manage patient medicine orders and delivery",
    path: "/admin/orders",
    icon: "orders",
  },
  {
    title: "Inventory",
    description: "Manage medicine stock",
    path: "/admin/inventory",
    icon: "inventory",
  },
  {
    title: "Sales",
    description: "Review pharmacy sales and revenue",
    path: "/admin/sales",
    icon: "sales",
  },
  {
    title: "Purchases",
    description: "Receive medicines from suppliers",
    path: "/admin/purchases",
    icon: "purchase",
  },
  {
    title: "Suppliers",
    description: "Manage medicine suppliers",
    path: "/admin/suppliers",
    icon: "supplier",
  },
  {
    title: "Patients",
    description: "View registered patient records",
    path: "/admin/patients",
    icon: "patients",
  },
  {
    title: "Appointments",
    description: "Review and manage patient appointment requests",
    path: "/admin/appointments",
    icon: "appointments",
  },
  {
    title: "Reports",
    description: "Review pharmacy reports and analytics",
    path: "/admin/reports",
    icon: "reports",
  },
  {
    title: "Alerts",
    description: "Review pharmacy operational alerts",
    path: "/admin/alerts",
    icon: "alerts",
  },
  {
    title: "My Profile",
    description: "Profile, security and account controls",
    path: "/admin/profile",
    icon: "user",
  },
  {
    title: "Technical Support",
    description: "Submit and track technical support requests",
    path: "/admin/support",
    icon: "support",
  },
];

/* =========================================================
   ALERT HELPERS
   ========================================================= */

function alertText(alert) {
  return [
    alert?.type || "",
    alert?.title || "",
    alert?.message || "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();
}

function isAttentionAlert(alert) {
  const severity = String(
    alert?.severity || ""
  )
    .trim()
    .toLowerCase();

  const text = alertText(alert);

  return (
    severity === "critical" ||
    severity === "warning" ||
    text.includes("overdue") ||
    text.includes("due today")
  );
}

function isCriticalAlert(alert) {
  const severity = String(
    alert?.severity || ""
  )
    .trim()
    .toLowerCase();

  return (
    severity === "critical" ||
    alertText(alert).includes("overdue")
  );
}

/* =========================================================
   VERIFY LOCK PASSWORD

   Uses the current authenticated session.
   Does not create a new login session.
   ========================================================= */

async function verifyUnlockPassword(password) {
  const token = localStorage.getItem(
    "access_token"
  );

  if (!token) {
    throw new Error(
      "Your administrator session is no longer available. Please sign in again."
    );
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/me/verify-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password,
        }),
      }
    );
  } catch {
    throw new Error(
      "Unable to verify your password. Check that the backend is running."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    throw new Error(
      "Your administrator session has expired. Please sign in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to verify your password."
    );
  }

  return data;
}

/* =========================================================
   MAIN ADMIN LAYOUT
   ========================================================= */

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [alertCount, setAlertCount] =
    useState(0);

  const [sidebarAlertCount, setSidebarAlertCount] =
    useState(0);

  const [sidebarAlertTone, setSidebarAlertTone] =
    useState("warning");

  const [profilePhoto, setProfilePhoto] =
    useState(
      () =>
        localStorage.getItem(
          "admin_profile_photo"
        ) || ""
    );

  const [applicationLocked, setApplicationLocked] =
    useState(
      () =>
        localStorage.getItem(
          "admin_application_locked"
        ) === "1"
    );

  const [unlockPassword, setUnlockPassword] =
    useState("");

  const [unlockError, setUnlockError] =
    useState("");

  const [unlocking, setUnlocking] =
    useState(false);

  const [showUnlockPassword, setShowUnlockPassword] =
    useState(false);

  const adminName =
    localStorage.getItem("user_name") ||
    "Dr. Evans Admin";

  const adminEmail =
    localStorage.getItem("user_email") ||
    "";

  const initials =
    adminName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part[0]?.toUpperCase()
      )
      .join("") || "DE";

  /* =====================================================
     PROFILE PHOTO
     ===================================================== */

  useEffect(() => {
    function handlePhotoUpdate(event) {
      const newPhoto =
        event?.detail?.photo ??
        localStorage.getItem(
          "admin_profile_photo"
        ) ??
        "";

      setProfilePhoto(newPhoto);
    }

    function handleStorage(event) {
      if (
        event.key ===
        "admin_profile_photo"
      ) {
        setProfilePhoto(
          event.newValue || ""
        );
      }
    }

    window.addEventListener(
      "admin-profile-photo-updated",
      handlePhotoUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "admin-profile-photo-updated",
        handlePhotoUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =====================================================
     LOCK APPLICATION
     ===================================================== */

  const lockApplication = useCallback(() => {
    localStorage.setItem(
      "admin_application_locked",
      "1"
    );

    setApplicationLocked(true);
    setUnlockPassword("");
    setUnlockError("");
    setShowUnlockPassword(false);
    setProfileOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    function handleLockRequest() {
      lockApplication();
    }

    function handleStorage(event) {
      if (
        event.key !==
        "admin_application_locked"
      ) {
        return;
      }

      const locked =
        event.newValue === "1";

      setApplicationLocked(locked);

      if (locked) {
        setUnlockPassword("");
        setUnlockError("");
      }
    }

    window.addEventListener(
      "admin-request-lock",
      handleLockRequest
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "admin-request-lock",
        handleLockRequest
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [lockApplication]);

  useEffect(() => {
    if (!applicationLocked) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [applicationLocked]);

  /* =====================================================
     UNLOCK APPLICATION
     ===================================================== */

  async function handleUnlock(event) {
    event.preventDefault();
    setUnlockError("");

    if (!adminEmail) {
      setUnlockError(
        "Administrator email is missing from this session. Please sign out and sign in again."
      );
      return;
    }

    if (!unlockPassword) {
      setUnlockError(
        "Enter your administrator password."
      );
      return;
    }

    setUnlocking(true);

    try {
      const result =
        await verifyUnlockPassword(
          unlockPassword
        );

      const role = String(
        result?.role ||
        localStorage.getItem(
          "user_role"
        ) ||
        ""
      )
        .trim()
        .toLowerCase();

      if (
        role &&
        role !== "admin"
      ) {
        throw new Error(
          "Administrator verification failed."
        );
      }

      localStorage.removeItem(
        "admin_application_locked"
      );

      setApplicationLocked(false);
      setUnlockPassword("");
      setUnlockError("");
      setShowUnlockPassword(false);
    } catch (error) {
      setUnlockError(
        error?.message ||
        "Incorrect password. The application remains locked."
      );
    } finally {
      setUnlocking(false);
    }
  }

  /* =====================================================
     ADMIN ALERTS
     ===================================================== */

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      try {
        const data =
          await getAdminAlerts();

        if (!active) return;

        const alerts =
          Array.isArray(data?.alerts)
            ? data.alerts
            : [];

        const total = Number(
          data?.count ??
          alerts.length ??
          0
        );

        setAlertCount(
          Number.isFinite(total)
            ? total
            : 0
        );

        const actionable =
          alerts.filter(
            isAttentionAlert
          );

        setSidebarAlertCount(
          actionable.length
        );

        setSidebarAlertTone(
          actionable.some(
            isCriticalAlert
          )
            ? "critical"
            : "warning"
        );
      } catch {
        if (!active) return;

        setAlertCount(0);
        setSidebarAlertCount(0);
        setSidebarAlertTone(
          "warning"
        );
      }
    }

    if (!applicationLocked) {
      void loadAlerts();
    }

    return () => {
      active = false;
    };
  }, [
    location.pathname,
    applicationLocked,
  ]);

  /* =====================================================
     CLICK OUTSIDE DROPDOWNS
     ===================================================== */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setSearchOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =====================================================
     SEARCH
     ===================================================== */

  const filteredSearch = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    if (!term) {
      return [];
    }

    return searchItems.filter((item) => {
      const haystack =
        `${item.title} ${item.description}`
          .toLowerCase();

      return haystack.includes(term);
    });
  }, [searchTerm]);

  function isItemActive(item) {
    if (item.path === "/admin") {
      return (
        location.pathname ===
        "/admin"
      );
    }

    return location.pathname.startsWith(
      item.path
    );
  }

  function goTo(path) {
    if (applicationLocked) {
      return;
    }

    navigate(path);
    setMobileOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    setSearchTerm("");
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (filteredSearch.length > 0) {
      goTo(filteredSearch[0].path);
    }
  }

  /* =====================================================
     LOGOUT
     ===================================================== */

  const handleLogout = useCallback(() => {
    [
      "access_token",
      "user_id",
      "user_role",
      "user_name",
      "user_email",
      "token",
      "role",
      "admin_application_locked",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    setProfileOpen(false);
    setMobileOpen(false);
    setApplicationLocked(false);

    navigate("/login", {
      replace: true,
    });
  }, [navigate]);

  useEffect(() => {
    function handleProfileLogout() {
      handleLogout();
    }

    window.addEventListener(
      "admin-request-logout",
      handleProfileLogout
    );

    return () => {
      window.removeEventListener(
        "admin-request-logout",
        handleProfileLogout
      );
    };
  }, [handleLogout]);

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <button
          type="button"
          className="admin-backdrop"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close navigation"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`admin-sidebar ${
          mobileOpen ? "is-open" : ""
        }`}
      >
        <button
          type="button"
          className="admin-brand"
          onClick={() =>
            goTo("/admin")
          }
        >
          <span className="admin-brand__logo">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />
          </span>

          <span className="admin-brand__copy">
            <strong>
              Dr. Evans Pharmacy
            </strong>

            <small>
              Administration
            </small>
          </span>
        </button>

        <div className="admin-sidebar__divider" />

        <span className="admin-sidebar__label">
          Management
        </span>

        <nav className="admin-sidebar__nav">
          {menuItems.map((item) => {
            const active =
              isItemActive(item);

            const isAlerts =
              item.path ===
              "/admin/alerts";

            return (
              <button
                type="button"
                key={item.path}
                className={`admin-nav-item ${
                  active ? "is-active" : ""
                } ${
                  isAlerts &&
                  sidebarAlertCount > 0
                    ? "has-alert-signal"
                    : ""
                }`}
                onClick={() =>
                  goTo(item.path)
                }
              >
                <span className="admin-nav-item__icon">
                  <AdminIcon
                    name={item.icon}
                    size={19}
                  />
                </span>

                <span className="admin-nav-item__label">
                  {item.label}
                </span>

                {isAlerts &&
                  sidebarAlertCount > 0 && (
                    <span
                      className={`admin-sidebar-alert-badge admin-sidebar-alert-badge--${sidebarAlertTone}`}
                    >
                      {sidebarAlertCount > 9
                        ? "9+"
                        : sidebarAlertCount}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar__bottom">
          <button
            type="button"
            className={`admin-nav-item ${
              location.pathname ===
              "/admin/support"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              goTo("/admin/support")
            }
          >
            <span className="admin-nav-item__icon">
              <AdminIcon
                name="support"
                size={19}
              />
            </span>

            <span className="admin-nav-item__label">
              Technical Support
            </span>
          </button>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <AdminIcon
              name="logout"
              size={18}
            />

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN APPLICATION */}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Open navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="admin-topbar-admin">
            <strong>
              {adminName}
            </strong>

            <span>
              Administrator
            </span>
          </div>

          {/* TOPBAR SEARCH */}

          <div
            className="admin-topbar-search-area"
            ref={searchRef}
          >
            <form
              className="admin-topbar__search"
              onSubmit={
                handleSearchSubmit
              }
            >
              <AdminIcon
                name="search"
                size={18}
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(
                    event.target.value
                  );

                  setSearchOpen(true);
                }}
                onFocus={() =>
                  setSearchOpen(true)
                }
                placeholder="Search pharmacy management..."
                aria-label="Search pharmacy management"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => {
                    setSearchTerm("");
                    setSearchOpen(false);
                  }}
                  aria-label="Clear search"
                >
                  <AdminIcon
                    name="close"
                    size={15}
                  />
                </button>
              )}
            </form>

            {searchOpen &&
              searchTerm.trim() && (
                <div className="admin-search-results">
                  {filteredSearch.length > 0 ? (
                    filteredSearch.map(
                      (item) => (
                        <button
                          type="button"
                          key={item.path}
                          onClick={() =>
                            goTo(item.path)
                          }
                        >
                          <span className="admin-search-result-icon">
                            <AdminIcon
                              name={item.icon}
                              size={18}
                            />
                          </span>

                          <span className="admin-search-result-copy">
                            <strong>
                              {item.title}
                            </strong>

                            <small>
                              {item.description}
                            </small>
                          </span>
                        </button>
                      )
                    )
                  ) : (
                    <div className="admin-search-empty">
                      <strong>
                        No matching section
                      </strong>

                      <span>
                        Try Orders, Inventory,
                        Patients, Appointments,
                        Sales, Reports, Alerts
                        or Profile.
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* NOTIFICATIONS AND PROFILE */}

          <div className="admin-topbar__actions">
            <AdminNotificationCenter
              initialCount={alertCount}
            />

            <div
              className="admin-profile-wrap"
              ref={profileRef}
            >
              <button
                type="button"
                className="admin-profile-trigger admin-profile-trigger--named"
                onClick={() =>
                  setProfileOpen(
                    (current) => !current
                  )
                }
                aria-expanded={profileOpen}
              >
                <span
                  className={`admin-profile-avatar ${
                    profilePhoto
                      ? "has-photo"
                      : ""
                  }`}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt=""
                      className="admin-profile-avatar__photo"
                    />
                  ) : (
                    initials
                  )}
                </span>

                <span className="admin-profile-name">
                  {adminName}
                </span>

                <AdminIcon
                  name="down"
                  size={15}
                />
              </button>

              {profileOpen && (
                <section className="admin-profile-dropdown">
                  <div className="admin-profile-dropdown__hero">
                    <span
                      className={`admin-profile-dropdown__avatar ${
                        profilePhoto
                          ? "has-photo"
                          : ""
                      }`}
                    >
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt=""
                          className="admin-profile-dropdown__avatar-photo"
                        />
                      ) : (
                        initials
                      )}
                    </span>

                    <div>
                      <span className="admin-profile-dropdown__role">
                        Administrator
                      </span>

                      <strong>
                        {adminName}
                      </strong>

                      <p>
                        {adminEmail ||
                          "Dr. Evans Pharmacy"}
                      </p>
                    </div>
                  </div>

                  <div className="admin-profile-dropdown__menu">
                    <button
                      type="button"
                      onClick={() =>
                        goTo("/admin/profile")
                      }
                    >
                      <span className="admin-profile-dropdown__menu-icon">
                        <AdminIcon
                          name="user"
                          size={18}
                        />
                      </span>

                      <span className="admin-profile-dropdown__menu-text">
                        <strong>
                          My Profile
                        </strong>

                        <small>
                          Profile, security and
                          account controls
                        </small>
                      </span>

                      <AdminIcon
                        name="chevron"
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        lockApplication
                      }
                    >
                      <span className="admin-profile-dropdown__menu-icon">
                        <AdminIcon
                          name="lock"
                          size={18}
                        />
                      </span>

                      <span className="admin-profile-dropdown__menu-text">
                        <strong>
                          Lock Application
                        </strong>

                        <small>
                          Protect the dashboard
                          without signing out
                        </small>
                      </span>

                      <AdminIcon
                        name="chevron"
                        size={16}
                      />
                    </button>
                  </div>

                  <div className="admin-profile-dropdown__footer">
                    <button
                      type="button"
                      onClick={handleLogout}
                    >
                      <AdminIcon
                        name="logout"
                        size={18}
                      />

                      <span>
                        <strong>
                          Sign Out
                        </strong>

                        <small>
                          End administrator session
                        </small>
                      </span>
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* APPLICATION LOCK SCREEN */}

      {applicationLocked && (
        <div className="admin-app-lock">
          <div className="admin-app-lock__background" />

          <section className="admin-app-lock__card">
            <div className="admin-app-lock__brand">
              <span className="admin-app-lock__logo">
                <img
                  src="/dr-evans-logo.png"
                  alt=""
                />
              </span>

              <div>
                <strong>
                  Dr. Evans Pharmacy
                </strong>

                <span>
                  Administration
                </span>
              </div>
            </div>

            <div className="admin-app-lock__lock-icon">
              <AdminIcon
                name="lock"
                size={30}
              />
            </div>

            <span className="admin-app-lock__eyebrow">
              Application Locked
            </span>

            <h1>
              Welcome back, {adminName}
            </h1>

            <p className="admin-app-lock__description">
              The pharmacy dashboard has been
              temporarily locked. Enter your
              administrator password to continue.
            </p>

            <div className="admin-app-lock__identity">
              <span
                className={`admin-app-lock__avatar ${
                  profilePhoto
                    ? "has-photo"
                    : ""
                }`}
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt=""
                  />
                ) : (
                  initials
                )}
              </span>

              <div>
                <strong>
                  {adminName}
                </strong>

                <span>
                  {adminEmail}
                </span>
              </div>
            </div>

            <form
              className="admin-app-lock__form"
              onSubmit={handleUnlock}
            >
              <label className="admin-app-lock__field">
                <span>
                  Administrator Password
                </span>

                <div className="admin-app-lock__password-wrap">
                  <AdminIcon
                    name="lock"
                    size={18}
                  />

                  <input
                    type={
                      showUnlockPassword
                        ? "text"
                        : "password"
                    }
                    value={unlockPassword}
                    onChange={(event) => {
                      setUnlockPassword(
                        event.target.value
                      );

                      if (unlockError) {
                        setUnlockError("");
                      }
                    }}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowUnlockPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showUnlockPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <AdminIcon
                      name={
                        showUnlockPassword
                          ? "eyeOff"
                          : "eye"
                      }
                      size={18}
                    />
                  </button>
                </div>
              </label>

              {unlockError && (
                <div className="admin-app-lock__error">
                  {unlockError}
                </div>
              )}

              <button
                type="submit"
                className="admin-app-lock__unlock"
                disabled={unlocking}
              >
                <AdminIcon
                  name="lock"
                  size={18}
                />

                <span>
                  {unlocking
                    ? "Verifying..."
                    : "Unlock Dashboard"}
                </span>
              </button>
            </form>

            <button
              type="button"
              className="admin-app-lock__signout"
              onClick={handleLogout}
              disabled={unlocking}
            >
              Sign out instead
            </button>

            <div className="admin-app-lock__security-note">
              <AdminIcon
                name="lock"
                size={14}
              />

              Your pharmacy session remains
              protected while locked.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;