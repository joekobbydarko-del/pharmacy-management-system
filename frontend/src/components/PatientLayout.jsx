
import {
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import Notifications from "./Notifications";
import "./PatientLayout.css";

// ============================================================
// DR. EVANS PHARMACY
// PATIENT PORTAL LAYOUT
//
// Navigation aligned with remote-pharmacy requirements.
//
// Existing routes, theme styling, authentication storage,
// search, notifications and responsive behavior preserved.
// ============================================================

function Icon({ name, size = 20 }) {
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

    pill: (
      <>
        <path d="m7.2 16.8 9.6-9.6" />
        <path d="M6.3 18a4.45 4.45 0 0 1 0-6.3l5.4-5.4a4.45 4.45 0 1 1 6.3 6.3L12.6 18a4.45 4.45 0 0 1-6.3 0Z" />
        <path d="m9.2 9.2 5.6 5.6" />
      </>
    ),

    cart: (
      <>
        <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20.5 8H6" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
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

    orders: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),

    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),

    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="7.5" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
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

    upload: (
      <>
        <path d="M12 16V5" />
        <path d="m7 10 5-5 5 5" />
        <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
      </>
    ),

    billing: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M6 14.5h4" />
      </>
    ),

    truck: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h3.5l3 3v3h-6.5z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}

// ============================================================
// PATIENT SIDEBAR NAVIGATION
//
// Approved order and grouping:
//   Overview            -> Dashboard, My Medications
//   Pharmacy Services   -> Upload Prescription, Order Medicines,
//                          Refill Requests, My Orders
//   Payments & Delivery -> Payment & Billing, Delivery Tracking
//   Support             -> Technical Support
//   Bottom              -> Logout
//
// Existing route URLs are preserved. Appointments and
// laboratory items are intentionally absent from the
// patient navigation.
// ============================================================

const navigation = [
  // OVERVIEW
  {
    label: "Dashboard",
    to: "/patient",
    icon: "dashboard",
    section: "Overview",
    end: true,
  },
  {
    label: "My Medications",
    to: "/patient/prescriptions",
    icon: "pill",
    section: "Overview",
  },

  // PHARMACY SERVICES
  {
    label: "Upload Prescription",
    to: "/patient/prescriptions",
    icon: "upload",
    section: "Pharmacy Services",
  },
  {
    label: "Order Medicines",
    to: "/patient/orders",
    icon: "cart",
    section: "Pharmacy Services",
  },
  {
    label: "Refill Requests",
    to: "/patient/refills",
    icon: "refresh",
    section: "Pharmacy Services",
  },
  {
    label: "My Orders",
    to: "/patient/order-history",
    icon: "orders",
    section: "Pharmacy Services",
  },

  // PAYMENTS & DELIVERY
  {
    label: "Payment & Billing",
    to: "/patient/billing",
    icon: "billing",
    section: "Payments & Delivery",
  },
  {
    label: "Delivery Tracking",
    to: "/patient/delivery",
    icon: "truck",
    section: "Payments & Delivery",
  },
];

// Render navigation grouped by its section label, keeping
// the approved top-to-bottom order.
const navigationSections = [
  "Overview",
  "Pharmacy Services",
  "Payments & Delivery",
];

// ============================================================
// GLOBAL SEARCH
//
// Only use already established patient routes.
// Appointments are excluded.
// ============================================================

const searchablePages = [
  {
    title: "Dashboard",
    description: "Patient portal overview",
    path: "/patient",
    icon: "dashboard",
    keywords: "dashboard home overview portal",
  },
  {
    title: "My Medications",
    description:
      "View current medicines and uploaded prescriptions",
    path: "/patient/prescriptions",
    icon: "pill",
    keywords:
      "medications prescriptions medicine medicines drugs dosage upload ocr transcription",
  },
  {
    title: "Order Medicines",
    description: "Submit medicine orders",
    path: "/patient/orders",
    icon: "cart",
    keywords:
      "order medicine medicines buy purchase pharmacy",
  },
  {
    title: "Refill Requests",
    description: "Request medication refills",
    path: "/patient/refills",
    icon: "refresh",
    keywords:
      "refill refills request renewal medication",
  },
  {
    title: "My Orders",
    description: "View medicine order history",
    path: "/patient/order-history",
    icon: "orders",
    keywords:
      "orders order history pending processing completed deliveries",
  },
  {
    title: "Payment & Billing",
    description: "Invoices, payments and receipts",
    path: "/patient/billing",
    icon: "billing",
    keywords:
      "payment billing invoice receipt momo mobile money bank transfer balance",
  },
  {
    title: "Delivery Tracking",
    description: "Track your medicine deliveries",
    path: "/patient/delivery",
    icon: "truck",
    keywords:
      "delivery tracking rider dispatch shipment address",
  },
  {
    title: "Activity History",
    description: "View patient activity",
    path: "/patient/activity",
    icon: "clock",
    keywords: "activity history recent timeline events",
  },
  {
    title: "Contact Pharmacist",
    description: "Send a message to the pharmacist",
    path: "/patient/contact-pharmacist",
    icon: "message",
    keywords:
      "pharmacist contact message question pharmacy chat",
  },
  {
    title: "Technical Support",
    description: "Get help using the portal",
    path: "/patient/support",
    icon: "support",
    keywords:
      "support technical help problem issue assistance error",
  },
  {
    title: "My Profile",
    description: "View patient information",
    path: "/patient/profile",
    icon: "user",
    keywords:
      "profile patient personal details name email account",
  },
  {
    title: "Account Settings",
    description: "Manage portal settings",
    path: "/patient/settings",
    icon: "settings",
    keywords:
      "settings account theme dark light notification",
  },
];

// ============================================================
// PATIENT LAYOUT
// ============================================================

function PatientLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const userName =
    localStorage.getItem("user_name") || "Patient";

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P";

  // ==========================================================
  // SEARCH RESULTS
  // ==========================================================

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    const titleStarts = searchablePages.filter(
      (page) =>
        page.title.toLowerCase().startsWith(query)
    );

    if (titleStarts.length > 0) {
      return titleStarts.slice(0, 4);
    }

    const titleContains = searchablePages.filter(
      (page) =>
        page.title.toLowerCase().includes(query)
    );

    if (titleContains.length > 0) {
      return titleContains.slice(0, 4);
    }

    return searchablePages
      .filter((page) => {
        const text =
          `${page.description} ${page.keywords}`.toLowerCase();

        return text.includes(query);
      })
      .slice(0, 4);
  }, [searchQuery]);

  // ==========================================================
  // NAVIGATION HANDLERS
  // ==========================================================

  function openSearchResult(path) {
    setSearchQuery("");
    setSearchOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);

    navigate(path);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (searchResults.length > 0) {
      openSearchResult(searchResults[0].path);
    }
  }

  function handleSearchChange(event) {
    const value = event.target.value;

    setSearchQuery(value);
    setSearchOpen(Boolean(value.trim()));
    setProfileOpen(false);
  }

  function handleSearchFocus() {
    if (searchQuery.trim()) {
      setSearchOpen(true);
    }

    setProfileOpen(false);
  }

  function handleBrandClick() {
    setSearchQuery("");
    setSearchOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);

    navigate("/patient");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("patient_notifications");

    navigate("/login", { replace: true });
  }

  function closeMobileNavigation() {
    setMobileOpen(false);
    setSearchOpen(false);
  }

  // ==========================================================
  // LAYOUT
  // ==========================================================

  return (
    <div className="patient-shell">
      {mobileOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`patient-sidebar ${
          mobileOpen ? "is-open" : ""
        }`}
      >
        <div className="patient-sidebar__brand">
          <div className="patient-sidebar__logo">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />
          </div>

          <strong>Dr. Evans Pharmacy</strong>

          <span>
            SMARTER HEALTH. BETTER LIVES.
          </span>
        </div>

        <div className="patient-sidebar__divider" />

        <nav
          className="patient-sidebar__nav"
          aria-label="Patient navigation"
        >
          {navigationSections.map((sectionName) => (
            <div
              key={sectionName}
              className="patient-sidebar__section"
            >
              <span className="patient-sidebar__label">
                {sectionName.toUpperCase()}
              </span>

              {navigation
                .filter(
                  (item) => item.section === sectionName
                )
                .map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `patient-nav-link ${
                        isActive ? "is-active" : ""
                      }`
                    }
                    onClick={closeMobileNavigation}
                  >
                    <span className="patient-nav-link__icon">
                      <Icon
                        name={item.icon}
                        size={19}
                      />
                    </span>

                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}

          {/* SUPPORT SECTION */}
          <div className="patient-sidebar__section">
            <span className="patient-sidebar__label">
              SUPPORT
            </span>

            <button
              type="button"
              className="patient-nav-link patient-nav-link--button"
              onClick={() => {
                closeMobileNavigation();
                navigate("/patient/support");
              }}
            >
              <span className="patient-nav-link__icon">
                <Icon
                  name="support"
                  size={19}
                />
              </span>

              <span>Technical Support</span>
            </button>
          </div>
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="patient-sidebar__bottom">
          <button
            type="button"
            className="patient-logout-button"
            onClick={handleLogout}
          >
            <span>
              <Icon
                name="logout"
                size={18}
              />
            </span>

            <strong>Logout</strong>
          </button>
        </div>
      </aside>

      {/* MAIN PATIENT AREA */}

      <div className="patient-main">
        {/* TOP HEADER */}

        <header className="patient-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => {
              setMobileOpen(true);
              setProfileOpen(false);
              setSearchOpen(false);
            }}
            aria-label="Open navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <button
            type="button"
            className="patient-header-logo"
            onClick={handleBrandClick}
            aria-label="Go to patient dashboard"
          >
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />
          </button>

          {/* GLOBAL SEARCH */}

          <div className="patient-topbar__search-wrap">
            <form
              className="patient-search"
              onSubmit={handleSearchSubmit}
            >
              <Icon
                name="search"
                size={19}
              />

              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Search portal..."
                aria-label="Search patient portal"
                autoComplete="off"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="patient-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </form>

            {searchOpen && searchQuery.trim() && (
              <div className="patient-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.path}
                      type="button"
                      className="patient-search-result"
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={() =>
                        openSearchResult(result.path)
                      }
                    >
                      <span>
                        <Icon
                          name={result.icon}
                          size={17}
                        />
                      </span>

                      <div>
                        <strong>
                          {result.title}
                        </strong>

                        <small>
                          {result.description}
                        </small>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="patient-search-empty">
                    <strong>
                      No result found
                    </strong>

                    <small>
                      Try another portal section.
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTIFICATIONS AND PROFILE */}

          <div className="patient-topbar__actions">
            <Notifications />

            <div className="topbar-menu">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => {
                  setProfileOpen(
                    (current) => !current
                  );

                  setSearchOpen(false);
                }}
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">
                  {initials}
                </span>

                <span className="profile-trigger__text">
                  <strong>
                    {userName}
                  </strong>

                  <small>Patient</small>
                </span>

                <Icon
                  name="chevron"
                  size={15}
                />
              </button>

              {/* PROFILE MENU */}

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu__header">
                    <span className="profile-avatar profile-avatar--large">
                      {initials}
                    </span>

                    <div>
                      <strong>
                        {userName}
                      </strong>

                      <small>
                        Patient account
                      </small>
                    </div>
                  </div>

                  <div className="profile-menu__section">
                    <span>ACCOUNT</span>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/patient/profile");
                      }}
                    >
                      <Icon
                        name="user"
                        size={18}
                      />

                      <div>
                        <strong>
                          My Profile
                        </strong>

                        <small>
                          View your patient information
                        </small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/patient/settings");
                      }}
                    >
                      <Icon
                        name="settings"
                        size={18}
                      />

                      <div>
                        <strong>
                          Account Settings
                        </strong>

                        <small>
                          Manage your account preferences
                        </small>
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="profile-menu__logout"
                    onClick={handleLogout}
                  >
                    <Icon
                      name="logout"
                      size={18}
                    />

                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE BRAND — OUTSIDE HEADER */}

        <button
          type="button"
          className="patient-mobile-brand"
          onClick={handleBrandClick}
          aria-label="Go to patient dashboard"
        >
          <img
            src="/dr-evans-logo.png"
            alt=""
          />

          <span>
            DR. EVANS PHARMACY
          </span>
        </button>

        {/* CURRENT PATIENT PAGE */}

        <main className="patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PatientLayout;
