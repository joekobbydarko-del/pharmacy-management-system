import {
  useEffect,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  updateMe,
} from "../api";

import "./PatientSettingsPage.css";


function PatientSettingsPage() {
  const storedName =
    localStorage.getItem(
      "user_name"
    ) || "Patient";


  const [
    fullName,
    setFullName,
  ] = useState(
    storedName
  );


  const [
    theme,
    setTheme,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "patient_theme"
      ) || "light"
    );
  });


  const [
    emailNotifications,
    setEmailNotifications,
  ] = useState(() => {
    const storedValue =
      localStorage.getItem(
        "patient_email_notifications"
      );


    return storedValue === null
      ? true
      : storedValue === "true";
  });


  const [
    refillReminders,
    setRefillReminders,
  ] = useState(() => {
    const storedValue =
      localStorage.getItem(
        "patient_refill_reminders"
      );


    return storedValue === null
      ? true
      : storedValue === "true";
  });


  const [
    appointmentReminders,
    setAppointmentReminders,
  ] = useState(() => {
    const storedValue =
      localStorage.getItem(
        "patient_appointment_reminders"
      );


    return storedValue === null
      ? true
      : storedValue === "true";
  });


  const [
    saved,
    setSaved,
  ] = useState(false);


  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);


  const [
    profileError,
    setProfileError,
  ] = useState("");


  /* =========================================================
     APPLY THEME
  ========================================================= */

  useEffect(() => {
    document.documentElement
      .setAttribute(
        "data-theme",
        theme
      );
  }, [theme]);


  /* =========================================================
     THEME CHANGE
  ========================================================= */

  const handleThemeChange = (
    selectedTheme
  ) => {
    setTheme(
      selectedTheme
    );


    localStorage.setItem(
      "patient_theme",
      selectedTheme
    );


    document.documentElement
      .setAttribute(
        "data-theme",
        selectedTheme
      );
  };


  /* =========================================================
     NOTIFICATION SETTINGS
  ========================================================= */

  const handleEmailNotifications =
    () => {
      const newValue =
        !emailNotifications;


      setEmailNotifications(
        newValue
      );


      localStorage.setItem(
        "patient_email_notifications",
        String(newValue)
      );
    };


  const handleRefillReminders =
    () => {
      const newValue =
        !refillReminders;


      setRefillReminders(
        newValue
      );


      localStorage.setItem(
        "patient_refill_reminders",
        String(newValue)
      );
    };


  const handleAppointmentReminders =
    () => {
      const newValue =
        !appointmentReminders;


      setAppointmentReminders(
        newValue
      );


      localStorage.setItem(
        "patient_appointment_reminders",
        String(newValue)
      );
    };


  /* =========================================================
     SAVE PROFILE TO DATABASE
  ========================================================= */

  const handleSaveChanges =
    async (event) => {
      event.preventDefault();


      const cleanedName =
        fullName.trim();


      if (!cleanedName) {
        setProfileError(
          "Please enter your full name."
        );

        return;
      }


      if (
        cleanedName.length < 2
      ) {
        setProfileError(
          "Your full name must contain at least 2 characters."
        );

        return;
      }


      try {
        setSavingProfile(true);

        setSaved(false);

        setProfileError("");


        const data =
          await updateMe(
            cleanedName
          );


        const updatedName =
          data?.full_name ||
          cleanedName;


        localStorage.setItem(
          "user_name",
          updatedName
        );


        setFullName(
          updatedName
        );


        setSaved(true);


        /*
          Reload after database update.

          This makes PatientLayout and
          PatientDashboard immediately
          read the new name from
          localStorage without needing
          extra complicated shared state.
        */

        window.setTimeout(
          () => {
            window.location.reload();
          },
          700
        );

      } catch (err) {
        console.error(
          "Profile update failed:",
          err
        );


        setProfileError(
          err?.message ||
            "Unable to update your profile."
        );

      } finally {
        setSavingProfile(false);
      }
    };


  return (
    <section className="patient-settings-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="settings-page-header">

        <div>

          <span className="settings-eyebrow">
            PATIENT SETTINGS
          </span>


          <h1>
            Account Settings
          </h1>


          <p>
            Manage your patient profile,
            appearance, pharmacy
            notifications, and account
            preferences.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* =====================================================
          THEME
      ===================================================== */}

      <article className="settings-panel">

        <div className="settings-panel-header">

          <div>

            <span className="settings-panel-icon">

              <PatientIcon
                name="sun"
                size={21}
              />

            </span>


            <div>

              <span className="settings-section-label">
                APPEARANCE
              </span>

              <h2>
                Portal Theme
              </h2>

            </div>

          </div>

        </div>


        <div className="settings-theme-grid">

          <button
            type="button"
            className={
              theme === "light"
                ? "settings-theme-card active"
                : "settings-theme-card"
            }
            onClick={() =>
              handleThemeChange(
                "light"
              )
            }
          >

            <span className="settings-theme-icon settings-theme-icon--light">

              <PatientIcon
                name="sun"
                size={23}
              />

            </span>


            <div>

              <strong>
                Light Mode
              </strong>

              <small>
                Bright and clean
                patient portal.
              </small>

            </div>


            {theme === "light" && (

              <PatientIcon
                name="check"
                size={17}
              />

            )}

          </button>


          <button
            type="button"
            className={
              theme === "dark"
                ? "settings-theme-card active"
                : "settings-theme-card"
            }
            onClick={() =>
              handleThemeChange(
                "dark"
              )
            }
          >

            <span className="settings-theme-icon settings-theme-icon--dark">

              <PatientIcon
                name="moon"
                size={23}
              />

            </span>


            <div>

              <strong>
                Dark Mode
              </strong>

              <small>
                Reduced brightness
                for darker environments.
              </small>

            </div>


            {theme === "dark" && (

              <PatientIcon
                name="check"
                size={17}
              />

            )}

          </button>

        </div>

      </article>


      {/* =====================================================
          MAIN SETTINGS GRID
      ===================================================== */}

      <div className="settings-main-grid">

        {/* ===================================================
            PERSONAL DETAILS
        =================================================== */}

        <article className="settings-panel">

          <div className="settings-panel-header">

            <div>

              <span className="settings-panel-icon">

                <PatientIcon
                  name="medicine"
                  size={21}
                />

              </span>


              <div>

                <span className="settings-section-label">
                  PROFILE SETTINGS
                </span>

                <h2>
                  Personal Details
                </h2>

              </div>

            </div>

          </div>


          <div className="settings-panel-body">

            <form
              className="settings-form"
              onSubmit={
                handleSaveChanges
              }
            >

              {profileError && (

                <div className="settings-profile-error">

                  <PatientIcon
                    name="info"
                    size={17}
                  />

                  <span>
                    {profileError}
                  </span>

                </div>

              )}


              <div className="settings-field">

                <label htmlFor="patient-name">
                  Full Name
                </label>


                <input
                  id="patient-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(
                      event.target.value
                    );

                    setProfileError("");
                  }}
                  disabled={
                    savingProfile
                  }
                />

              </div>


              <div className="settings-field">

                <label>
                  Account Type
                </label>


                <input
                  type="text"
                  value="Patient"
                  disabled
                  readOnly
                />

              </div>


              <div className="settings-field">

                <label>
                  Pharmacy
                </label>


                <input
                  type="text"
                  value="Dr. Evans Pharmacy"
                  disabled
                  readOnly
                />

              </div>


              <button
                type="submit"
                className="settings-save-button"
                disabled={
                  savingProfile
                }
              >

                {savingProfile
                  ? "Saving..."
                  : saved
                    ? "Changes Saved"
                    : "Save Changes"}


                {!savingProfile && (

                  <PatientIcon
                    name={
                      saved
                        ? "check"
                        : "arrow"
                    }
                    size={16}
                  />

                )}

              </button>

            </form>

          </div>

        </article>


        {/* ===================================================
            REMINDER PREFERENCES
        =================================================== */}

        <article className="settings-panel">

          <div className="settings-panel-header">

            <div>

              <span className="settings-panel-icon settings-panel-icon--blue">

                <PatientIcon
                  name="bell"
                  size={21}
                />

              </span>


              <div>

                <span className="settings-section-label">
                  NOTIFICATIONS
                </span>

                <h2>
                  Reminder Preferences
                </h2>

              </div>

            </div>

          </div>


          <div className="settings-toggle-list">

            <div className="settings-toggle-row">

              <div>

                <strong>
                  Email Notifications
                </strong>

                <small>
                  Receive pharmacy
                  updates and account
                  messages.
                </small>

              </div>


              <button
                type="button"
                className={
                  emailNotifications
                    ? "settings-switch active"
                    : "settings-switch"
                }
                onClick={
                  handleEmailNotifications
                }
                aria-pressed={
                  emailNotifications
                }
              >
                <span />
              </button>

            </div>


            <div className="settings-toggle-row">

              <div>

                <strong>
                  Refill Reminders
                </strong>

                <small>
                  Receive reminders
                  when medication
                  refills are due.
                </small>

              </div>


              <button
                type="button"
                className={
                  refillReminders
                    ? "settings-switch active"
                    : "settings-switch"
                }
                onClick={
                  handleRefillReminders
                }
                aria-pressed={
                  refillReminders
                }
              >
                <span />
              </button>

            </div>


            <div className="settings-toggle-row">

              <div>

                <strong>
                  Appointment Reminders
                </strong>

                <small>
                  Receive reminders
                  before scheduled
                  appointments.
                </small>

              </div>


              <button
                type="button"
                className={
                  appointmentReminders
                    ? "settings-switch active"
                    : "settings-switch"
                }
                onClick={
                  handleAppointmentReminders
                }
                aria-pressed={
                  appointmentReminders
                }
              >
                <span />
              </button>

            </div>

          </div>

        </article>

      </div>


      {/* =====================================================
          SECURITY
      ===================================================== */}

      <div className="settings-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure account settings
          </strong>

          <small>
            Your profile information
            is securely linked to your
            Dr. Evans Pharmacy account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default PatientSettingsPage;