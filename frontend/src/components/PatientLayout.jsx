import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import "./PatientLayout.css";

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

    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
        <path d="M8 3v4M16 3v4M3.5 9.5h17" />
        <path d="M8 13h.01M12 13h.01M16 13h.01" />
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

    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 6.8-3 7.2-3 9h18c0-1.8-3-2.2-3-9Z" />
        <path d="M10 21h4" />
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
  };

  return (
    <svg {...common}>
      {icons[name] || icons.dashboard}
    </svg>
  );
}

const navigation = [
  {
    label: "Dashboard",
    to: "/patient",
    icon: "dashboard",
    end: true,
  },
  {
    label: "Appointments",
    to: "/patient/appointments",
    icon: "calendar",
  },
  {
    label: "Prescriptions",
    to: "/patient/prescriptions",
    icon: "pill",
  },
  {
    label: "Order Medicines",
    to: "/patient/orders",
    icon: "cart",
  },
  {
    label: "Refill Requests",
    to: "/patient/refills",
    icon: "refresh",
  },
  {
    label: "My Orders",
    to: "/patient/order-history",
    icon: "orders",
  },
];

function PatientLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
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

  const closeMenus = () => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("role");
    localStorage.removeItem("token");

    navigate("/login");
  };

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

          <strong>
            Dr. Evans Pharmacy
          </strong>

          <span>
            SMARTER HEALTH. BETTER LIVES.
          </span>
        </div>

        <div className="patient-sidebar__divider" />

        <span className="patient-sidebar__label">
          MAIN MENU
        </span>

        <nav className="patient-sidebar__nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `patient-nav-link ${
                  isActive
                    ? "is-active"
                    : ""
                }`
              }
              onClick={() =>
                setMobileOpen(false)
              }
            >
              <span className="patient-nav-link__icon">
                <Icon
                  name={item.icon}
                  size={19}
                />
              </span>

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="patient-sidebar__bottom">
          <button
            type="button"
            className="patient-support-button"
            onClick={() => {
              setMobileOpen(false);
              navigate("/patient/support");
            }}
          >
            <span>
              <Icon
                name="support"
                size={18}
              />
            </span>

            <div>
              <strong>
                Technical Support
              </strong>

              <small>
                Need help?
              </small>
            </div>
          </button>

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

            <strong>
              Logout
            </strong>
          </button>
        </div>
      </aside>

      <div className="patient-main">
        <header className="patient-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Open navigation"
          >
            <span />
            <span />
            <span />
          </button>

          {/* HEADER LOGO */}

          <div className="patient-topbar__logo">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />

            <div>
              <strong>
                Dr. Evans Pharmacy
              </strong>

              <span>
                Patient Portal
              </span>
            </div>
          </div>

          {/* CENTERED SEARCH */}

          <div className="patient-topbar__search-wrap">
            <div className="patient-search">
              <Icon
                name="search"
                size={19}
              />

              <input
                type="search"
                placeholder="Search medicines, orders, or prescriptions..."
                aria-label="Search pharmacy portal"
              />
            </div>
          </div>

          <div className="patient-topbar__actions">
            <div className="topbar-menu">
              <button
                type="button"
                className="notification-button"
                onClick={() => {
                  setNotificationsOpen(
                    !notificationsOpen
                  );

                  setProfileOpen(false);
                }}
                aria-label="Notifications"
              >
                <Icon
                  name="bell"
                  size={20}
                />

                <span className="notification-dot">
                  0
                </span>
              </button>

              {notificationsOpen && (
                <div className="notification-menu">
                  <div className="dropdown-eyebrow">
                    PHARMACY UPDATES
                  </div>

                  <h3>
                    Notifications
                  </h3>

                  <div className="notification-empty">
                    <span>
                      <Icon
                        name="bell"
                        size={20}
                      />
                    </span>

                    <div>
                      <strong>
                        No new notifications
                      </strong>

                      <p>
                        Pharmacy updates,
                        refill reminders,
                        appointment reminders,
                        and prescription
                        notifications will
                        appear here.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-menu">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => {
                  setProfileOpen(
                    !profileOpen
                  );

                  setNotificationsOpen(
                    false
                  );
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

                  <small>
                    Patient
                  </small>
                </span>

                <Icon
                  name="chevron"
                  size={15}
                />
              </button>

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
                    <span>
                      ACCOUNT
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
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
                          View your patient
                          information
                        </small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
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
                          Manage your account
                          preferences
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

        <main className="patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PatientLayout;