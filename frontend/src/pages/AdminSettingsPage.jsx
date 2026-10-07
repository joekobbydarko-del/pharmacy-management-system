import {
  useEffect,
  useState,
} from "react";

import "./AdminSettingsPage.css";


function SettingsIcon({
  name,
  size = 21,
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
    sun: (
      <>
        <circle
          cx="12"
          cy="12"
          r="4"
        />

        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),

    moon: (
      <>
        <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
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

    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.7 2.8 8.3 7 10 4.2-1.7 7-5.3 7-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    palette: (
      <>
        <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12Z" />
        <circle cx="7.5" cy="10" r=".7" />
        <circle cx="9" cy="6.5" r=".7" />
        <circle cx="14" cy="6" r=".7" />
      </>
    ),
  };


  return (
    <svg {...common}>
      {icons[name] || icons.user}
    </svg>
  );
}


function Toggle({
  checked,
  onChange,
  label,
}) {
  return (
    <button
      type="button"
      className={
        `admin-settings-toggle ${
          checked
            ? "is-on"
            : ""
        }`
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
      aria-pressed={
        checked
      }
      aria-label={
        label
      }
    >
      <span />
    </button>
  );
}


function AdminSettingsPage() {
  const initialName =
    localStorage.getItem(
      "user_name"
    ) ||
    "Dr. Evans Admin";

  const initialEmail =
    localStorage.getItem(
      "user_email"
    ) ||
    "";


  const [
    fullName,
    setFullName,
  ] = useState(
    initialName
  );

  const [
    email,
    setEmail,
  ] = useState(
    initialEmail
  );

  const [
    theme,
    setTheme,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_theme"
      ) ||
      "light"
  );

  const [
    notifications,
    setNotifications,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_notifications"
      ) !==
      "false"
  );

  const [
    compactMode,
    setCompactMode,
  ] = useState(
    () =>
      localStorage.getItem(
        "admin_compact_mode"
      ) ===
      "true"
  );

  const [
    saved,
    setSaved,
  ] = useState(false);


  useEffect(() => {
    document.documentElement
      .setAttribute(
        "data-admin-theme",
        theme
      );

    localStorage.setItem(
      "admin_theme",
      theme
    );
  }, [
    theme,
  ]);


  function saveProfile() {
    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim();


    if (cleanName) {
      localStorage.setItem(
        "user_name",
        cleanName
      );
    }


    localStorage.setItem(
      "user_email",
      cleanEmail
    );


    localStorage.setItem(
      "admin_notifications",
      String(
        notifications
      )
    );


    localStorage.setItem(
      "admin_compact_mode",
      String(
        compactMode
      )
    );


    setSaved(true);


    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800
    );
  }


  return (
    <section className="admin-settings-page">

      {/* HEADER */}

      <div className="admin-settings-page__header">

        <span>
          ADMIN SETTINGS
        </span>

        <h1>
          Account Settings
        </h1>

        <p>
          Manage your administrator profile,
          appearance, notifications and portal preferences.
        </p>

      </div>


      {/* THEME */}

      <article className="admin-settings-card admin-settings-card--theme">

        <div className="admin-settings-section-heading">

          <span className="admin-settings-section-icon">

            <SettingsIcon
              name="palette"
            />

          </span>


          <div>

            <span>
              APPEARANCE
            </span>

            <h2>
              Portal Theme
            </h2>

          </div>

        </div>


        <div className="admin-theme-options">

          <button
            type="button"
            className={
              `admin-theme-option ${
                theme ===
                "light"
                  ? "is-selected"
                  : ""
              }`
            }
            onClick={() =>
              setTheme(
                "light"
              )
            }
          >

            <span className="admin-theme-option__icon admin-theme-option__icon--light">

              <SettingsIcon
                name="sun"
              />

            </span>


            <div>

              <strong>
                Light Mode
              </strong>

              <small>
                Bright and clean administration portal.
              </small>

            </div>


            <span className="admin-theme-check">
              {
                theme ===
                  "light"
                  ? "✓"
                  : ""
              }
            </span>

          </button>


          <button
            type="button"
            className={
              `admin-theme-option ${
                theme ===
                "dark"
                  ? "is-selected"
                  : ""
              }`
            }
            onClick={() =>
              setTheme(
                "dark"
              )
            }
          >

            <span className="admin-theme-option__icon admin-theme-option__icon--dark">

              <SettingsIcon
                name="moon"
              />

            </span>


            <div>

              <strong>
                Dark Mode
              </strong>

              <small>
                Reduced brightness for darker environments.
              </small>

            </div>


            <span className="admin-theme-check">
              {
                theme ===
                  "dark"
                  ? "✓"
                  : ""
              }
            </span>

          </button>

        </div>

      </article>


      {/* DETAILS + PREFERENCES */}

      <div className="admin-settings-grid">

        {/* PERSONAL DETAILS */}

        <article className="admin-settings-card">

          <div className="admin-settings-section-heading">

            <span className="admin-settings-section-icon">

              <SettingsIcon
                name="user"
              />

            </span>


            <div>

              <span>
                PROFILE SETTINGS
              </span>

              <h2>
                Administrator Details
              </h2>

            </div>

          </div>


          <div className="admin-settings-form">

            <label>

              <span>
                Full Name
              </span>

              <input
                type="text"
                value={
                  fullName
                }
                onChange={
                  (event) =>
                    setFullName(
                      event.target.value
                    )
                }
              />

            </label>


            <label>

              <span>
                Email Address
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={
                  (event) =>
                    setEmail(
                      event.target.value
                    )
                }
              />

            </label>


            <label>

              <span>
                Account Type
              </span>

              <input
                type="text"
                value="Administrator"
                readOnly
              />

            </label>


            <label>

              <span>
                Pharmacy
              </span>

              <input
                type="text"
                value="Dr. Evans Pharmacy"
                readOnly
              />

            </label>


            <button
              type="button"
              className="admin-settings-save"
              onClick={
                saveProfile
              }
            >
              {
                saved
                  ? "Changes Saved"
                  : "Save Changes"
              }
            </button>

          </div>

        </article>


        {/* PREFERENCES */}

        <article className="admin-settings-card">

          <div className="admin-settings-section-heading">

            <span className="admin-settings-section-icon admin-settings-section-icon--blue">

              <SettingsIcon
                name="bell"
              />

            </span>


            <div>

              <span>
                ADMIN PREFERENCES
              </span>

              <h2>
                Portal Preferences
              </h2>

            </div>

          </div>


          <div className="admin-settings-preferences">

            <div>

              <div>

                <strong>
                  Notifications
                </strong>

                <span>
                  Show pharmacy management alerts.
                </span>

              </div>


              <Toggle
                checked={
                  notifications
                }
                onChange={
                  setNotifications
                }
                label="Administrator notifications"
              />

            </div>


            <div>

              <div>

                <strong>
                  Compact Mode
                </strong>

                <span>
                  Reduce spacing in management screens.
                </span>

              </div>


              <Toggle
                checked={
                  compactMode
                }
                onChange={
                  setCompactMode
                }
                label="Compact administrator mode"
              />

            </div>

          </div>

        </article>

      </div>


      {/* SECURITY */}

      <div className="admin-settings-secure-note">

        <span>

          <SettingsIcon
            name="shield"
            size={18}
          />

        </span>


        <div>

          <strong>
            Secure administrator settings
          </strong>

          <small>
            Administration preferences are linked
            to your Dr. Evans Pharmacy portal session.
          </small>

        </div>

      </div>

    </section>
  );
}


export default AdminSettingsPage;