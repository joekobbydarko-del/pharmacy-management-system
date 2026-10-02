import { useState } from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./PatientSettingsPage.css";

function PatientSettingsPage() {
  const storedName =
    localStorage.getItem("user_name") ||
    "Patient";

  const initialTheme =
    document.documentElement.getAttribute(
      "data-theme"
    ) || "light";

  const [fullName, setFullName] =
    useState(storedName);

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [refillReminders, setRefillReminders] =
    useState(true);

  const [
    appointmentReminders,
    setAppointmentReminders,
  ] = useState(true);

  const [theme, setTheme] =
    useState(initialTheme);

  const [saved, setSaved] =
    useState(false);

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);

    document.documentElement.setAttribute(
      "data-theme",
      nextTheme
    );

    localStorage.setItem(
      "theme",
      nextTheme
    );
  };

  const handleSave = (event) => {
    event.preventDefault();

    localStorage.setItem(
      "user_name",
      fullName.trim() || "Patient"
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <section className="patient-settings-page">
      <div className="patient-settings-header">
        <div>
          <span className="patient-settings-eyebrow">
            PATIENT ACCOUNT
          </span>

          <h1>Account Settings</h1>

          <p>
            Manage your patient profile,
            appearance, pharmacy notifications,
            and account preferences.
          </p>
        </div>

        <PatientDateCard />
      </div>

      {saved && (
        <div className="patient-settings-success">
          <span>
            <PatientIcon
              name="check"
              size={18}
            />
          </span>

          <div>
            <strong>
              Settings saved
            </strong>

            <p>
              Your account preferences
              have been updated.
            </p>
          </div>
        </div>
      )}

      {/* APPEARANCE */}

      <article className="patient-settings-panel patient-settings-appearance">
        <div className="patient-settings-panel__header">
          <span className="patient-settings-panel__icon">
            <PatientIcon
              name={
                theme === "dark"
                  ? "moon"
                  : "sun"
              }
              size={21}
            />
          </span>

          <div>
            <span>APPEARANCE</span>

            <h2>
              Portal Theme
            </h2>
          </div>
        </div>

        <div className="patient-settings-panel__body">
          <div className="theme-selector">
            <button
              type="button"
              className={
                theme === "light"
                  ? "theme-option is-selected"
                  : "theme-option"
              }
              onClick={() =>
                changeTheme("light")
              }
            >
              <span className="theme-option__icon">
                <PatientIcon
                  name="sun"
                  size={22}
                />
              </span>

              <div>
                <strong>
                  Light Mode
                </strong>

                <small>
                  Bright and clean patient portal.
                </small>
              </div>

              <span className="theme-option__check">
                {theme === "light" && (
                  <PatientIcon
                    name="check"
                    size={17}
                  />
                )}
              </span>
            </button>

            <button
              type="button"
              className={
                theme === "dark"
                  ? "theme-option is-selected"
                  : "theme-option"
              }
              onClick={() =>
                changeTheme("dark")
              }
            >
              <span className="theme-option__icon theme-option__icon--dark">
                <PatientIcon
                  name="moon"
                  size={22}
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

              <span className="theme-option__check">
                {theme === "dark" && (
                  <PatientIcon
                    name="check"
                    size={17}
                  />
                )}
              </span>
            </button>
          </div>
        </div>
      </article>

      <div className="patient-settings-grid">
        {/* PROFILE */}

        <article className="patient-settings-panel">
          <div className="patient-settings-panel__header">
            <span className="patient-settings-panel__icon">
              <PatientIcon
                name="medicine"
                size={20}
              />
            </span>

            <div>
              <span>
                PROFILE SETTINGS
              </span>

              <h2>
                Personal Details
              </h2>
            </div>
          </div>

          <div className="patient-settings-panel__body">
            <form
              className="patient-settings-form"
              onSubmit={handleSave}
            >
              <div className="patient-settings-field">
                <label htmlFor="settings-name">
                  Full Name
                </label>

                <input
                  id="settings-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="patient-settings-field">
                <label>
                  Account Type
                </label>

                <input
                  type="text"
                  value="Patient"
                  disabled
                />
              </div>

              <div className="patient-settings-field">
                <label>
                  Pharmacy
                </label>

                <input
                  type="text"
                  value="Dr. Evans Pharmacy"
                  disabled
                />
              </div>

              <button
                type="submit"
                className="patient-settings-save"
              >
                Save Changes

                <PatientIcon
                  name="arrow"
                  size={16}
                />
              </button>
            </form>
          </div>
        </article>

        {/* NOTIFICATIONS */}

        <article className="patient-settings-panel">
          <div className="patient-settings-panel__header">
            <span className="patient-settings-panel__icon patient-settings-panel__icon--blue">
              <PatientIcon
                name="bell"
                size={20}
              />
            </span>

            <div>
              <span>
                NOTIFICATIONS
              </span>

              <h2>
                Reminder Preferences
              </h2>
            </div>
          </div>

          <div className="patient-settings-panel__body">
            <div className="patient-settings-toggle-list">
              <div className="patient-settings-toggle-row">
                <div>
                  <strong>
                    Email Notifications
                  </strong>

                  <p>
                    Receive pharmacy updates
                    and account messages.
                  </p>
                </div>

                <button
                  type="button"
                  className={`patient-toggle ${
                    emailNotifications
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setEmailNotifications(
                      (current) =>
                        !current
                    )
                  }
                >
                  <span />
                </button>
              </div>

              <div className="patient-settings-toggle-row">
                <div>
                  <strong>
                    Refill Reminders
                  </strong>

                  <p>
                    Receive reminders when
                    medication refills are due.
                  </p>
                </div>

                <button
                  type="button"
                  className={`patient-toggle ${
                    refillReminders
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setRefillReminders(
                      (current) =>
                        !current
                    )
                  }
                >
                  <span />
                </button>
              </div>

              <div className="patient-settings-toggle-row">
                <div>
                  <strong>
                    Appointment Reminders
                  </strong>

                  <p>
                    Receive reminders before
                    scheduled appointments.
                  </p>
                </div>

                <button
                  type="button"
                  className={`patient-toggle ${
                    appointmentReminders
                      ? "is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setAppointmentReminders(
                      (current) =>
                        !current
                    )
                  }
                >
                  <span />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="patient-settings-security-panel">
        <div className="patient-settings-security-heading">
          <span>
            <PatientIcon
              name="shield"
              size={21}
            />
          </span>

          <div>
            <span>
              ACCOUNT SECURITY
            </span>

            <h2>
              Security & Privacy
            </h2>
          </div>
        </div>

        <div className="patient-settings-security-body">
          <div>
            <strong>
              Secure patient account
            </strong>

            <p>
              Your account is protected
              through the pharmacy
              authentication system.
            </p>
          </div>

          <div>
            <strong>
              Privacy protected
            </strong>

            <p>
              Your pharmacy information is
              linked only to your patient
              account.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default PatientSettingsPage;