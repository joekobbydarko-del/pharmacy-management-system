import { useNavigate } from "react-router-dom";
import "./PatientDashboard.css";

function Icon({ name, size = 22 }) {
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
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
        <path d="M8 3v4M16 3v4M3.5 9.5h17" />
        <path d="M8 13h.01M12 13h.01M16 13h.01" />
        <path d="M8 17h.01M12 17h.01M16 17h.01" />
      </>
    ),

    pill: (
      <>
        <path d="m7.2 16.8 9.6-9.6" />
        <path d="M6.3 18a4.45 4.45 0 0 1 0-6.3l5.4-5.4a4.45 4.45 0 1 1 6.3 6.3L12.6 18a4.45 4.45 0 0 1-6.3 0Z" />
        <path d="m9.2 9.2 5.6 5.6" />
      </>
    ),

    lab: (
      <>
        <path d="M9 3h6M10 3v6l-5 8.8A2.1 2.1 0 0 0 6.8 21h10.4A2.1 2.1 0 0 0 19 17.8L14 9V3" />
        <path d="M8 16h8M9.5 13.5h5" />
      </>
    ),

    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 6.8-3 7.2-3 9h18c0-1.8-3-2.2-3-9Z" />
        <path d="M10 21h4" />
      </>
    ),

    activity: (
      <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
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

    arrow: (
      <path d="M5 12h13M13 7l5 5-5 5" />
    ),

    shield: (
      <>
        <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.activity}
    </svg>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
  description,
}) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <Icon name={icon} size={22} />
      </div>

      <div className="stat-card__content">
        <span className="stat-card__label">
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </article>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();

  const userName =
    localStorage.getItem("user_name") || "Patient";

  const firstName =
    userName.split(" ")[0] || "Patient";

  const currentDate =
    new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

  return (
    <section className="patient-dashboard">
      {/* PAGE HEADER */}

      <div className="dashboard-hero">
        <div>
          <span className="dashboard-eyebrow">
            PATIENT DASHBOARD
          </span>

          <h1>
            Welcome back,{" "}
            <span>
              {firstName}!
            </span>
          </h1>

          <p>
            Manage your prescriptions, medicine orders,
            refill requests, appointments, and pharmacy
            services from one secure place.
          </p>
        </div>

        <div className="dashboard-date-card">
          <span className="dashboard-date-card__icon">
            <Icon
              name="calendar"
              size={21}
            />
          </span>

          <div>
            <strong>
              {currentDate}
            </strong>

            <small>
              Today
            </small>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="dashboard-stats-grid">
        <StatCard
          tone="blue"
          icon="calendar"
          label="UPCOMING APPOINTMENT"
          value="0"
          description="No upcoming appointment"
        />

        <StatCard
          tone="teal"
          icon="pill"
          label="ACTIVE PRESCRIPTIONS"
          value="0"
          description="Current medications"
        />

        <StatCard
          tone="purple"
          icon="lab"
          label="LAB RESULTS"
          value="0"
          description="No new results"
        />

        <StatCard
          tone="orange"
          icon="bell"
          label="PENDING REMINDERS"
          value="0"
          description="You are all caught up"
        />
      </div>

      {/* MAIN DASHBOARD PANELS */}

      <div className="dashboard-main-grid">
        {/* UPCOMING APPOINTMENT */}

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div className="dashboard-panel__title">
              <span>
                <Icon
                  name="calendar"
                  size={20}
                />
              </span>

              <h2>
                Upcoming Appointment
              </h2>
            </div>

            <button
              type="button"
              className="dashboard-panel__link"
              onClick={() =>
                navigate(
                  "/patient/appointments"
                )
              }
            >
              View All
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>

          <div className="dashboard-panel__body">
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-state__icon">
                <Icon
                  name="calendar"
                  size={25}
                />
              </span>

              <h3>
                No upcoming appointment
              </h3>

              <p>
                Your upcoming appointments will appear
                here when they are scheduled.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/patient/appointments"
                  )
                }
              >
                Book an appointment

                <Icon
                  name="arrow"
                  size={15}
                />
              </button>
            </div>
          </div>
        </article>

        {/* LAB RESULTS */}

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div className="dashboard-panel__title">
              <span>
                <Icon
                  name="lab"
                  size={20}
                />
              </span>

              <h2>
                Recent Lab Results
              </h2>
            </div>

            <button
              type="button"
              className="dashboard-panel__link"
            >
              View All
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>

          <div className="dashboard-panel__body">
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-state__icon">
                <Icon
                  name="lab"
                  size={25}
                />
              </span>

              <h3>
                No recent lab results
              </h3>

              <p>
                Your recent laboratory results will
                appear here when they become available.
              </p>
            </div>
          </div>
        </article>

        {/* PRESCRIPTIONS */}

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div className="dashboard-panel__title">
              <span>
                <Icon
                  name="pill"
                  size={20}
                />
              </span>

              <h2>
                My Prescriptions
              </h2>
            </div>

            <button
              type="button"
              className="dashboard-panel__link"
              onClick={() =>
                navigate(
                  "/patient/prescriptions"
                )
              }
            >
              View All
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>

          <div className="dashboard-panel__body">
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-state__icon">
                <Icon
                  name="pill"
                  size={25}
                />
              </span>

              <h3>
                No prescriptions yet
              </h3>

              <p>
                Your active prescriptions will appear
                here once they are available.
              </p>
            </div>
          </div>
        </article>

        {/* RECENT ACTIVITY */}

        <article className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div className="dashboard-panel__title">
              <span>
                <Icon
                  name="activity"
                  size={20}
                />
              </span>

              <h2>
                Recent Activity
              </h2>
            </div>

            <button
              type="button"
              className="dashboard-panel__link"
            >
              View All
              <Icon
                name="arrow"
                size={15}
              />
            </button>
          </div>

          <div className="dashboard-panel__body">
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-state__icon">
                <Icon
                  name="activity"
                  size={25}
                />
              </span>

              <h3>
                No recent activity
              </h3>

              <p>
                Your pharmacy activity will appear here
                as you use the patient portal.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* QUICK ACTIONS */}

      <section className="quick-actions">
        <div className="quick-actions__heading">
          <span className="dashboard-eyebrow">
            PHARMACY SERVICES
          </span>

          <h2>
            Quick Actions
          </h2>

          <p>
            Access your most frequently used pharmacy
            services.
          </p>
        </div>

        <div className="quick-actions__grid">
          {/* BOOK APPOINTMENT */}

          <button
            type="button"
            className="quick-action quick-action--blue"
            onClick={() =>
              navigate(
                "/patient/appointments"
              )
            }
          >
            <span className="quick-action__icon">
              <Icon
                name="calendar"
                size={20}
              />
            </span>

            <span className="quick-action__text">
              <strong>
                Book Appointment
              </strong>

              <small>
                Schedule an appointment with your
                pharmacy.
              </small>
            </span>

            <Icon
              name="arrow"
              size={16}
            />
          </button>

          {/* REQUEST REFILL */}

          <button
            type="button"
            className="quick-action quick-action--teal"
            onClick={() =>
              navigate(
                "/patient/refills"
              )
            }
          >
            <span className="quick-action__icon">
              <Icon
                name="refresh"
                size={20}
              />
            </span>

            <span className="quick-action__text">
              <strong>
                Request Refill
              </strong>

              <small>
                Request a refill for an existing
                prescription.
              </small>
            </span>

            <Icon
              name="arrow"
              size={16}
            />
          </button>

          {/* VIEW PRESCRIPTIONS */}

          <button
            type="button"
            className="quick-action quick-action--purple"
            onClick={() =>
              navigate(
                "/patient/prescriptions"
              )
            }
          >
            <span className="quick-action__icon">
              <Icon
                name="pill"
                size={20}
              />
            </span>

            <span className="quick-action__text">
              <strong>
                View Prescriptions
              </strong>

              <small>
                View your medications and prescription
                details.
              </small>
            </span>

            <Icon
              name="arrow"
              size={16}
            />
          </button>

          {/* CONTACT PHARMACIST */}

          <button
            type="button"
            className="quick-action quick-action--orange"
            onClick={() =>
              navigate(
                "/patient/contact-pharmacist"
              )
            }
          >
            <span className="quick-action__icon">
              <Icon
                name="support"
                size={20}
              />
            </span>

            <span className="quick-action__text">
              <strong>
                Contact Pharmacist
              </strong>

              <small>
                Ask a pharmacist about medicines,
                prescriptions, or refills.
              </small>
            </span>

            <Icon
              name="arrow"
              size={16}
            />
          </button>
        </div>
      </section>

      {/* SECURITY */}

      <div className="dashboard-security">
        <span>
          <Icon
            name="shield"
            size={19}
          />
        </span>

        <div>
          <strong>
            Secure patient portal
          </strong>

          <small>
            Your pharmacy information is protected
            within your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboard;