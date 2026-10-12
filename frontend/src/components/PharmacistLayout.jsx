import { useState } from "react";

import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import { clearAuthStorage } from "../api";

import "./PharmacistLayout.css";


// ============================================================
// DR. EVANS PHARMACY
// PHARMACIST PORTAL LAYOUT
//
// Professional shell providing authentication context and an
// empty landing page only. Operational and clinical features
// will be added once the doctors provide their requirements.
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
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pill: (
      <>
        <path d="m7.2 16.8 9.6-9.6" />
        <path d="M6.3 18a4.45 4.45 0 0 1 0-6.3l5.4-5.4a4.45 4.45 0 1 1 6.3 6.3L12.6 18a4.45 4.45 0 0 1-6.3 0Z" />
        <path d="m9.2 9.2 5.6 5.6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}


// Navigation is intentionally non-functional: features are pending
// the doctors' requirements. Items are shown as a professional
// preview and are clearly marked "Pending".
const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", active: true },
  { label: "Prescription Review", icon: "shield", badge: "Pending" },
  { label: "Medications", icon: "pill", badge: "Pending" },
  { label: "Verification Queue", icon: "clock", badge: "Pending" },
];


function initialsOf(name) {
  return String(name || "Pharmacist")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}


function PharmacistLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userName =
    localStorage.getItem("user_name") || "Pharmacist";

  function handleLogout() {
    clearAuthStorage();
    navigate("/login", { replace: true });
  }

  return (
    <div className="pharm-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="pharm-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={
          "pharm-sidebar" +
          (sidebarOpen ? " is-open" : "")
        }
      >
        <div className="pharm-sidebar__brand">
          <img
            src="/dr-evans-logo.png"
            alt=""
          />
          <div>
            <strong>Dr. Evans Pharmacy</strong>
            <span>Pharmacist Portal</span>
          </div>
        </div>

        <nav className="pharm-sidebar__nav">
          <span className="pharm-sidebar__section">
            Overview
          </span>

          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className={
                "pharm-nav-item" +
                (item.active ? " is-active" : "")
              }
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="pharm-nav-item__badge">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="pharm-sidebar__footer">
          Features pending doctors’ requirements.
        </div>
      </aside>

      <div className="pharm-main">
        <header className="pharm-topbar">
          <div className="pharm-topbar__left">
            <button
              type="button"
              className="pharm-icon-button pharm-menu-toggle"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={20} />
            </button>

            <div className="pharm-topbar__titles">
              <h1>Pharmacist Portal</h1>
              <p>Dr. Evans Pharmacy</p>
            </div>
          </div>

          <div className="pharm-topbar__right">
            <div className="pharm-user">
              <span className="pharm-user__avatar">
                {initialsOf(userName)}
              </span>
              <span className="pharm-user__meta">
                <strong>{userName}</strong>
                <span>Pharmacist</span>
              </span>
            </div>

            <button
              type="button"
              className="pharm-icon-button"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <Icon name="logout" size={19} />
            </button>
          </div>
        </header>

        <main className="pharm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PharmacistLayout;
