import {
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./AdminLayout.css";


function AdminIcon({
  name,
  size = 20,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };


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

    pos: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M7 8h10M7 12h4M15 12h2M7 16h2M13 16h4" />
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

    supplier: (
      <>
        <path d="M3 19V8l6-3v14" />
        <path d="M9 10l6-3v12" />
        <path d="M15 12l6-3v10" />
      </>
    ),

    patients: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3 20a6 6 0 0 1 12 0" />

        <circle
          cx="17"
          cy="9"
          r="2"
        />

        <path d="M16 14a5 5 0 0 1 5 5" />
      </>
    ),

    reports: (
      <>
        <path d="M5 3h10l4 4v14H5Z" />
        <path d="M15 3v5h5" />
        <path d="M8 13h8M8 17h6" />
      </>
    ),

    alerts: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />

        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5L9 6a7 7 0 0 0-1.7 1L5 6 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5L5 18l2.3-1a7 7 0 0 0 1.7 1l.5 3h5l.5-3a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z" />
      </>
    ),

    search: (
      <>
        <circle
          cx="10.5"
          cy="10.5"
          r="6"
        />

        <path d="m15 15 5 5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="m14 8 4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),
  };


  return (
    <svg {...common}>
      {
        icons[name] ||
        icons.dashboard
      }
    </svg>
  );
}


const menuItems = [
  {
    label: "Dashboard",
    icon: "dashboard",
    path: "/admin",
  },

  {
    label: "POS",
    icon: "pos",
    path: "/admin/pos",
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


function AdminLayout() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const adminName =
    localStorage.getItem(
      "user_name"
    ) ||
    "Administrator";

  const initials =
    adminName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase()
      )
      .join("") ||
    "AD";


  function isItemActive(
    item
  ) {
    if (
      item.path ===
      "/admin"
    ) {
      return (
        location.pathname ===
        "/admin"
      );
    }

    if (!item.path) {
      return false;
    }

    return location.pathname
      .startsWith(
        item.path
      );
  }


  function handleNavigation(
    item
  ) {
    if (item.path) {
      navigate(
        item.path
      );
    }

    setMobileOpen(
      false
    );
  }


  function handleLogout() {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user_id"
    );

    localStorage.removeItem(
      "user_role"
    );

    localStorage.removeItem(
      "user_name"
    );

    localStorage.removeItem(
      "user_email"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "role"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  }


  return (
    <div className="admin-shell">

      {
        mobileOpen && (
          <button
            type="button"
            className="admin-backdrop"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="Close navigation"
          />
        )
      }


      <aside
        className={`admin-sidebar ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
      >

        <button
          type="button"
          className="admin-brand"
          onClick={() => {
            navigate(
              "/admin"
            );

            setMobileOpen(
              false
            );
          }}
        >

          <span className="admin-brand__logo">

            <img
              src="/dr-evans-logo.png"
              alt=""
            />

          </span>


          <span>

            <strong>
              Dr. Evans Pharmacy
            </strong>

            <small>
              ADMINISTRATION
            </small>

          </span>

        </button>


        <div className="admin-sidebar__divider" />


        <span className="admin-sidebar__label">
          MANAGEMENT
        </span>


        <nav className="admin-sidebar__nav">

          {
            menuItems.map(
              (
                item
              ) => {
                const active =
                  isItemActive(
                    item
                  );

                return (
                  <button
                    type="button"
                    key={
                      item.label
                    }
                    className={`admin-nav-item ${
                      active
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigation(
                        item
                      )
                    }
                  >

                    <span className="admin-nav-item__icon">

                      <AdminIcon
                        name={
                          item.icon
                        }
                        size={19}
                      />

                    </span>

                    <span>
                      {
                        item.label
                      }
                    </span>

                  </button>
                );
              }
            )
          }

        </nav>


        <div className="admin-sidebar__bottom">

          <button
            type="button"
            className={`admin-nav-item ${
              location.pathname === "/admin/settings"
                ? "is-active"
                : ""
            }`}
            onClick={() =>
              navigate(
                "/admin/settings"
              )
            }
          >

            <span className="admin-nav-item__icon">

              <AdminIcon
                name="settings"
                size={19}
              />

            </span>

            <span>
              Settings
            </span>

          </button>


          <button
            type="button"
            className="admin-logout"
            onClick={
              handleLogout
            }
          >

            <AdminIcon
              name="logout"
              size={18}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      <div className="admin-main">

        <header className="admin-topbar">

          <button
            type="button"
            className="admin-mobile-menu"
            onClick={() =>
              setMobileOpen(
                true
              )
            }
            aria-label="Open navigation"
          >

            <span />
            <span />
            <span />

          </button>


          <div className="admin-topbar__search">

            <AdminIcon
              name="search"
              size={18}
            />

            <input
              type="search"
              placeholder="Search pharmacy management..."
            />

          </div>


          <div className="admin-topbar__actions">

            <button
              type="button"
              className="admin-icon-button"
              aria-label="Notifications"
            >

              <AdminIcon
                name="bell"
                size={19}
              />

              <span className="admin-notification-dot">
                3
              </span>

            </button>


            <div className="admin-profile-wrap">

              <button
                type="button"
                className="admin-profile-trigger"
                onClick={() =>
                  setProfileOpen(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              >

                <span className="admin-profile-avatar">
                  {initials}
                </span>


                <span className="admin-profile-text">

                  <strong>
                    {adminName}
                  </strong>

                  <small>
                    Administrator
                  </small>

                </span>

              </button>


              {
                profileOpen && (
                  <div className="admin-profile-menu">

                    <div>

                      <strong>
                        {adminName}
                      </strong>

                      <span>
                        Administrator account
                      </span>

                    </div>


                    <button
                      type="button"
                    >
                      Profile
                    </button>


                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(
                          "/admin/settings"
                        );
                      }}
                    >
                      Settings
                    </button>


                    <button
                      type="button"
                      className="danger"
                      onClick={
                        handleLogout
                      }
                    >
                      Logout
                    </button>

                  </div>
                )
              }

            </div>

          </div>

        </header>


        <main className="admin-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}


export default AdminLayout;