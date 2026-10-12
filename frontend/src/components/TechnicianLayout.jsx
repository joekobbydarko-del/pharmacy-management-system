import { Outlet, useNavigate } from "react-router-dom";

import { clearAuthStorage } from "../api";

import "./TechnicianLayout.css";


// ============================================================
// DR. EVANS PHARMACY
// PHARMACY TECHNICIAN PORTAL — LAYOUT SHELL
//
// Desktop shell matching the Technical Support Center design:
// a full-width top header (brand, search, notifications, profile)
// above a dark navigation sidebar and the routed content area.
//
// Route protection lives in App.jsx (ProtectedTechnicianRoute)
// and is intentionally left untouched here. Navigation items are
// a non-functional visual preview only; operational features are
// pending the doctors' requirements.
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
    ticket: (
      <>
        <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    stethoscope: (
      <>
        <path d="M6 3v5a5 5 0 0 0 10 0V3" />
        <path d="M11 13v3a4 4 0 0 0 8 0v-2" />
        <circle cx="19" cy="11" r="2" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    activity: (
      <>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    chevron: (
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}


const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", active: true },
  { label: "Support Tickets", icon: "ticket" },
  { label: "Live Chat", icon: "chat" },
  { label: "Doctors Requests", icon: "stethoscope" },
  { label: "Patient Requests", icon: "users" },
  { label: "System Health", icon: "activity" },
  { label: "Knowledge Base", icon: "book" },
  { label: "Settings", icon: "settings" },
];


function initialsOf(name) {
  return String(name || "Tech Admin")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}


function TechnicianLayout() {
  const navigate = useNavigate();

  const userName =
    localStorage.getItem("user_name") || "Tech Admin";

  function handleLogout() {
    clearAuthStorage();
    navigate("/login", { replace: true });
  }

  return (
    <div className="tech-shell">
      <header className="tech-header">
        <div className="tech-header__brand">
          <span className="tech-header__logo">
            <img src="/dr-evans-logo.png" alt="" />
          </span>
          <div className="tech-header__titles">
            <strong>Dr. Evans Pharmacy</strong>
            <span>Technical Support Center</span>
          </div>
        </div>

        <div className="tech-header__search">
          <Icon name="search" size={18} />
          <input
            type="text"
            aria-label="Search"
            placeholder="Search tickets, users, issues, or knowledge base..."
          />
        </div>

        <div className="tech-header__actions">
          <button
            type="button"
            className="tech-header__icon"
            aria-label="Notifications"
          >
            <Icon name="bell" size={20} />
            <span className="tech-header__badge">5</span>
          </button>

          <button
            type="button"
            className="tech-header__icon"
            aria-label="Settings"
          >
            <Icon name="settings" size={20} />
          </button>

          <div className="tech-header__user">
            <span className="tech-header__avatar">
              {initialsOf(userName)}
            </span>
            <span className="tech-header__meta">
              <strong>{userName}</strong>
              <span>Technical Support</span>
            </span>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </header>

      <div className="tech-body">
        <aside className="tech-sidebar">
          <nav className="tech-sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={
                  "tech-nav-item" +
                  (item.active ? " is-active" : "")
                }
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          <button
            type="button"
            className="tech-sidebar__logout"
            onClick={handleLogout}
          >
            <Icon name="logout" size={19} />
            <span>Log Out</span>
          </button>
        </aside>

        <main className="tech-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TechnicianLayout;
