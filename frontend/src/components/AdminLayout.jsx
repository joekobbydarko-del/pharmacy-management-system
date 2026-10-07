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

import {
  getAdminAlerts,
} from "../api";

import AdminNotificationCenter
  from "./AdminNotificationCenter";

import "./AdminTopbar.css";
import "./AdminLayout.css";


/* =========================================================
   ICONS
========================================================= */

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
    "aria-hidden": true,
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


    appointments: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

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
        <circle
          cx="10.5"
          cy="10.5"
          r="6"
        />

        <path d="m15 15 5 5" />
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


    logout: (
      <>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="m14 8 4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),


    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),


    down: (
      <path d="m7 9 5 5 5-5" />
    ),


    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
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
   SIDEBAR MENU
========================================================= */

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
   SEARCH ITEMS
========================================================= */

const searchItems = [
  {
    title: "Dashboard",
    description:
      "Pharmacy management overview",
    path: "/admin",
    icon: "dashboard",
  },

  {
    title: "POS",
    description:
      "Start and manage pharmacy sales",
    path: "/admin/pos",
    icon: "pos",
  },

  {
    title: "Inventory",
    description:
      "Manage medicine stock",
    path: "/admin/inventory",
    icon: "inventory",
  },

  {
    title: "Sales",
    description:
      "Review pharmacy sales and revenue",
    path: "/admin/sales",
    icon: "sales",
  },

  {
    title: "Purchases",
    description:
      "Receive medicines from suppliers",
    path: "/admin/purchases",
    icon: "purchase",
  },

  {
    title: "Suppliers",
    description:
      "Manage medicine suppliers",
    path: "/admin/suppliers",
    icon: "supplier",
  },

  {
    title: "Patients",
    description:
      "View registered patient records",
    path: "/admin/patients",
    icon: "patients",
  },

  {
    title: "Appointments",
    description:
      "Review and manage patient appointment requests",
    path: "/admin/appointments",
    icon: "appointments",
  },

  {
    title: "Reports",
    description:
      "Review pharmacy reports and analytics",
    path: "/admin/reports",
    icon: "reports",
  },

  {
    title: "Alerts",
    description:
      "Review pharmacy operational alerts",
    path: "/admin/alerts",
    icon: "alerts",
  },

  {
    title: "My Profile",
    description:
      "Profile, security and account controls",
    path: "/admin/profile",
    icon: "user",
  },

  {
    title: "Technical Support",
    description:
      "Submit and track technical support requests",
    path: "/admin/support",
    icon: "support",
  },
];


/* =========================================================
   ALERT HELPERS
========================================================= */

function alertText(
  alert
) {
  return `${alert?.type || ""} ${alert?.title || ""} ${alert?.message || ""}`
    .trim()
    .toLowerCase();
}


function isAttentionAlert(
  alert
) {
  const severity =
    String(
      alert?.severity ||
        ""
    )
      .trim()
      .toLowerCase();


  const text =
    alertText(
      alert
    );


  return (
    severity === "critical" ||
    severity === "warning" ||
    text.includes(
      "overdue"
    ) ||
    text.includes(
      "due today"
    )
  );
}


function isCriticalAlert(
  alert
) {
  const severity =
    String(
      alert?.severity ||
        ""
    )
      .trim()
      .toLowerCase();


  const text =
    alertText(
      alert
    );


  return (
    severity === "critical" ||
    text.includes(
      "overdue"
    )
  );
}


/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  const profileRef =
    useRef(null);

  const searchRef =
    useRef(null);


  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);


  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);


  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);


  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");


  const [
    alertCount,
    setAlertCount,
  ] = useState(0);


  const [
    sidebarAlertCount,
    setSidebarAlertCount,
  ] = useState(0);


  const [
    sidebarAlertTone,
    setSidebarAlertTone,
  ] = useState(
    "warning"
  );


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


  const adminName =
    localStorage.getItem(
      "user_name"
    ) ||
    "Dr. Evans Admin";


  const adminEmail =
    localStorage.getItem(
      "user_email"
    ) ||
    "";


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
     PROFILE PHOTO SYNC
  ======================================================= */

  useEffect(() => {
    function handlePhotoUpdate(
      event
    ) {
      const newPhoto =
        event?.detail?.photo ??
        localStorage.getItem(
          "admin_profile_photo"
        ) ??
        "";

      setProfilePhoto(
        newPhoto
      );
    }


    function handleStorage(
      event
    ) {
      if (
        event.key ===
        "admin_profile_photo"
      ) {
        setProfilePhoto(
          event.newValue ||
            ""
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


  /* =======================================================
     ALERT LOADING
  ======================================================= */

  useEffect(() => {
    let active = true;


    async function loadAlerts() {
      try {
        const data =
          await getAdminAlerts();


        if (!active) {
          return;
        }


        const alerts =
          Array.isArray(
            data?.alerts
          )
            ? data.alerts
            : [];


        const total =
          Number(
            data?.count ??
            alerts.length ??
            0
          );


        setAlertCount(
          Number.isFinite(
            total
          )
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
        if (!active) {
          return;
        }


        setAlertCount(
          0
        );


        setSidebarAlertCount(
          0
        );


        setSidebarAlertTone(
          "warning"
        );
      }
    }


    loadAlerts();


    return () => {
      active = false;
    };
  }, [
    location.pathname,
  ]);


  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handleOutsideClick(
      event
    ) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(
          false
        );
      }


      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target
        )
      ) {
        setSearchOpen(
          false
        );
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


  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredSearch =
    useMemo(
      () => {
        const term =
          searchTerm
            .trim()
            .toLowerCase();


        if (!term) {
          return [];
        }


        return searchItems.filter(
          (item) => {
            const haystack =
              `${item.title} ${item.description}`
                .toLowerCase();


            return haystack.includes(
              term
            );
          }
        );
      },
      [
        searchTerm,
      ]
    );


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


    return location.pathname
      .startsWith(
        item.path
      );
  }


  function goTo(
    path
  ) {
    navigate(
      path
    );


    setMobileOpen(
      false
    );


    setProfileOpen(
      false
    );


    setSearchOpen(
      false
    );


    setSearchTerm(
      ""
    );
  }


  function handleSearchSubmit(
    event
  ) {
    event.preventDefault();


    if (
      filteredSearch.length >
      0
    ) {
      goTo(
        filteredSearch[0].path
      );
    }
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    useCallback(
      () => {
        [
          "access_token",
          "user_id",
          "user_role",
          "user_name",
          "user_email",
          "token",
          "role",
        ].forEach(
          (key) => {
            localStorage.removeItem(
              key
            );
          }
        );


        setProfileOpen(
          false
        );


        setMobileOpen(
          false
        );


        navigate(
          "/login",
          {
            replace: true,
          }
        );
      },
      [
        navigate,
      ]
    );


  /* =======================================================
     PROFILE PAGE LOGOUT EVENT
  ======================================================= */

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
  }, [
    handleLogout,
  ]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-shell">

      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}

      {mobileOpen && (
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
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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
          onClick={() =>
            goTo(
              "/admin"
            )
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

          {menuItems.map(
            (item) => {
              const active =
                isItemActive(
                  item
                );


              const isAlerts =
                item.path ===
                "/admin/alerts";


              return (
                <button
                  type="button"
                  key={
                    item.path
                  }
                  className={`admin-nav-item ${
                    active
                      ? "is-active"
                      : ""
                  } ${
                    isAlerts &&
                    sidebarAlertCount >
                      0
                      ? "has-alert-signal"
                      : ""
                  }`}
                  onClick={() =>
                    goTo(
                      item.path
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


                  <span className="admin-nav-item__label">
                    {item.label}
                  </span>


                  {isAlerts &&
                    sidebarAlertCount >
                      0 && (
                      <span
                        className={`admin-sidebar-alert-badge admin-sidebar-alert-badge--${sidebarAlertTone}`}
                        aria-label={`${sidebarAlertCount} alerts require attention`}
                        title={`${sidebarAlertCount} alerts require attention`}
                      >
                        {sidebarAlertCount >
                        9
                          ? "9+"
                          : sidebarAlertCount}
                      </span>
                    )}

                </button>
              );
            }
          )}

        </nav>


        {/* ===================================================
            SIDEBAR BOTTOM
        =================================================== */}

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
              goTo(
                "/admin/support"
              )
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


      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="admin-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

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


          <div className="admin-topbar-admin">
            <strong>
              {adminName}
            </strong>

            <span>
              Administrator
            </span>
          </div>


          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="admin-topbar-search-area"
            ref={
              searchRef
            }
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
                value={
                  searchTerm
                }
                onChange={
                  (event) => {
                    setSearchTerm(
                      event.target
                        .value
                    );

                    setSearchOpen(
                      true
                    );
                  }
                }
                onFocus={() =>
                  setSearchOpen(
                    true
                  )
                }
                placeholder="Search pharmacy management..."
                aria-label="Search pharmacy management"
              />


              {searchTerm && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => {
                    setSearchTerm(
                      ""
                    );

                    setSearchOpen(
                      false
                    );
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

                  {filteredSearch.length >
                  0 ? (
                    filteredSearch.map(
                      (item) => (
                        <button
                          type="button"
                          key={
                            item.path
                          }
                          onClick={() =>
                            goTo(
                              item.path
                            )
                          }
                        >

                          <span className="admin-search-result-icon">
                            <AdminIcon
                              name={
                                item.icon
                              }
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
                        Try Inventory, Patients, Appointments,
                        Sales, Reports, Alerts or Profile.
                      </span>
                    </div>
                  )}

                </div>
              )}

          </div>


          {/* =================================================
              TOPBAR ACTIONS
          ================================================= */}

          <div className="admin-topbar__actions">

            <AdminNotificationCenter
              initialCount={
                alertCount
              }
            />


            {/* ===============================================
                PROFILE
            =============================================== */}

            <div
              className="admin-profile-wrap"
              ref={
                profileRef
              }
            >

              <button
                type="button"
                className="admin-profile-trigger admin-profile-trigger--named"
                onClick={() =>
                  setProfileOpen(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={
                  profileOpen
                }
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
                      src={
                        profilePhoto
                      }
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


              {/* =============================================
                  PROFILE DROPDOWN
              ============================================= */}

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
                          src={
                            profilePhoto
                          }
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
                        goTo(
                          "/admin/profile"
                        )
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
                          Profile, security and account controls
                        </small>
                      </span>


                      <AdminIcon
                        name="chevron"
                        size={16}
                      />

                    </button>

                  </div>


                  {/* =========================================
                      SIGN OUT
                  ========================================= */}

                  <div className="admin-profile-dropdown__footer">

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
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


        {/* ===================================================
            CONTENT
        =================================================== */}

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}


export default AdminLayout;