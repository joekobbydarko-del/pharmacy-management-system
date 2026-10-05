import {
  useEffect,
  useState,
} from "react";

import "./AdminSettingsPage.css";


function AdminSettingsPage() {
  const [
    adminName,
    setAdminName,
  ] = useState(
    localStorage.getItem(
      "user_name"
    ) || "Administrator"
  );

  const [
    adminEmail,
    setAdminEmail,
  ] = useState(
    localStorage.getItem(
      "user_email"
    ) || ""
  );

  const [
    theme,
    setTheme,
  ] = useState(
    localStorage.getItem(
      "admin_theme"
    ) || "light"
  );

  const [
    compactMode,
    setCompactMode,
  ] = useState(
    localStorage.getItem(
      "admin_compact_mode"
    ) === "true"
  );

  const [
    notifications,
    setNotifications,
  ] = useState(
    localStorage.getItem(
      "admin_notifications"
    ) !== "false"
  );

  const [
    saved,
    setSaved,
  ] = useState("");


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
  }, [theme]);


  function handleSaveProfile(
    event
  ) {
    event.preventDefault();

    localStorage.setItem(
      "user_name",
      adminName.trim()
    );

    localStorage.setItem(
      "user_email",
      adminEmail.trim()
    );

    setSaved(
      "Admin profile settings saved."
    );

    window.setTimeout(
      () => {
        setSaved("");
      },
      2500
    );
  }


  function handleCompactChange(
    value
  ) {
    setCompactMode(
      value
    );

    localStorage.setItem(
      "admin_compact_mode",
      String(value)
    );
  }


  function handleNotificationChange(
    value
  ) {
    setNotifications(
      value
    );

    localStorage.setItem(
      "admin_notifications",
      String(value)
    );
  }


  return (
    <div className="admin-settings-page">

      <div className="admin-settings-header">

        <p className="admin-settings-eyebrow">
          Administration
        </p>

        <h1>
          Settings
        </h1>

        <p>
          Manage your administrator profile,
          theme and dashboard preferences.
        </p>

      </div>


      {
        saved && (
          <div className="admin-settings-success">
            {saved}
          </div>
        )
      }


      <div className="admin-settings-grid">

        <section className="admin-settings-card">

          <h2>
            Admin Profile
          </h2>


          <form
            className="admin-settings-form"
            onSubmit={
              handleSaveProfile
            }
          >

            <label>
              Full Name

              <input
                type="text"
                value={
                  adminName
                }
                onChange={
                  (
                    event
                  ) =>
                    setAdminName(
                      event.target.value
                    )
                }
              />
            </label>


            <label>
              Email Address

              <input
                type="email"
                value={
                  adminEmail
                }
                onChange={
                  (
                    event
                  ) =>
                    setAdminEmail(
                      event.target.value
                    )
                }
              />
            </label>


            <label>
              Role

              <input
                type="text"
                value="Administrator"
                disabled
              />
            </label>


            <button
              type="submit"
            >
              Save Profile
            </button>

          </form>

        </section>


        <section className="admin-settings-card">

          <h2>
            Appearance
          </h2>


          <div className="admin-settings-option">

            <div>

              <strong>
                Theme
              </strong>

              <span>
                Choose the Admin dashboard appearance.
              </span>

            </div>


            <select
              value={
                theme
              }
              onChange={
                (
                  event
                ) =>
                  setTheme(
                    event.target.value
                  )
              }
            >
              <option value="light">
                Light
              </option>

              <option value="dark">
                Dark
              </option>
            </select>

          </div>


          <div className="admin-settings-option">

            <div>

              <strong>
                Compact Mode
              </strong>

              <span>
                Reduce spacing in management screens.
              </span>

            </div>


            <button
              type="button"
              className={`admin-settings-toggle ${
                compactMode
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleCompactChange(
                  !compactMode
                )
              }
            >

              <span />

            </button>

          </div>


          <div className="admin-settings-option">

            <div>

              <strong>
                Notifications
              </strong>

              <span>
                Show pharmacy management alerts.
              </span>

            </div>


            <button
              type="button"
              className={`admin-settings-toggle ${
                notifications
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNotificationChange(
                  !notifications
                )
              }
            >

              <span />

            </button>

          </div>

        </section>

      </div>


      <section className="admin-settings-card admin-settings-info">

        <h2>
          System Information
        </h2>


        <div className="admin-settings-info-grid">

          <div>
            <span>
              Pharmacy
            </span>

            <strong>
              Dr. Evans Pharmacy
            </strong>
          </div>


          <div>
            <span>
              Portal
            </span>

            <strong>
              Administration
            </strong>
          </div>


          <div>
            <span>
              Data Source
            </span>

            <strong>
              PostgreSQL + Google Sheets
            </strong>
          </div>


          <div>
            <span>
              Slogan
            </span>

            <strong>
              Smarter Pharmacy, Bettering Lives.
            </strong>
          </div>

        </div>

      </section>

    </div>
  );
}


export default AdminSettingsPage;