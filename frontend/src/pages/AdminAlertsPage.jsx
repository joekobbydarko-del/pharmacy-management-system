import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminAlerts,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminAlertsPage.css";


function AlertIcon({
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
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    warning: (
      <>
        <path d="M12 3 2.8 20h18.4Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    critical: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 17h.01" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    sale: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-8" />
        <path d="M22 20H2" />
      </>
    ),

    purchase: (
      <>
        <path d="M4 5h16l-2 9H7Z" />
        <path d="M7 14 5 3H2" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </>
    ),

    stock: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
        <path d="M12 11v10" />
      </>
    ),

    refill: (
      <>
        <path d="M4 12a8 8 0 1 0 3-6" />
        <path d="M4 4v5h5" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </>
    ),

    appointment: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M3 10h18" />
        <path d="M9 14h6" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    pulse: (
      <>
        <path d="M3 12h4l2-5 4 10 2-5h6" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.info}
    </svg>
  );
}


function normalizeAlertText(
  alert
) {
  return `${alert?.type || ""} ${alert?.title || ""} ${alert?.message || ""}`
    .toLowerCase();
}


function getAlertIcon(
  alert
) {
  const text =
    normalizeAlertText(
      alert
    );

  if (
    text.includes("refill")
  ) {
    return "refill";
  }

  if (
    text.includes("appointment")
  ) {
    return "appointment";
  }

  if (
    text.includes("stock") ||
    text.includes("inventory") ||
    text.includes("reorder")
  ) {
    return "stock";
  }

  if (
    text.includes("purchase") ||
    text.includes("supplier")
  ) {
    return "purchase";
  }

  if (
    text.includes("sale") ||
    text.includes("dispens")
  ) {
    return "sale";
  }

  if (
    alert?.severity ===
    "critical"
  ) {
    return "critical";
  }

  if (
    alert?.severity ===
    "warning"
  ) {
    return "warning";
  }

  return "info";
}


function getAlertCategory(
  alert
) {
  const text =
    normalizeAlertText(
      alert
    );

  if (
    text.includes("overdue")
  ) {
    return "overdue";
  }

  if (
    text.includes("due today") ||
    text.includes("today")
  ) {
    if (
      text.includes("refill") ||
      text.includes("appointment")
    ) {
      return "today";
    }
  }

  if (
    alert?.severity ===
      "critical" ||
    alert?.severity ===
      "warning"
  ) {
    return "action";
  }

  return "activity";
}


function getSeverity(
  alert
) {
  const text =
    normalizeAlertText(
      alert
    );

  if (
    text.includes("overdue")
  ) {
    return "critical";
  }

  if (
    text.includes("due today")
  ) {
    return "warning";
  }

  return (
    alert?.severity ||
    "info"
  );
}


function formatAlertDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function AlertStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-alert-stat admin-alert-stat--${tone}`}
    >
      <span className="admin-alert-stat-accent" />

      <div className="admin-alert-stat-icon">
        <AlertIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-alert-stat-copy">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {note}
        </small>
      </div>
    </article>
  );
}


function AlertItem({
  alert,
}) {
  const severity =
    getSeverity(
      alert
    );

  return (
    <article
      className={`admin-alert-item admin-alert-item--${severity}`}
    >
      <span className="admin-alert-item-accent" />

      <div
        className={`admin-alert-icon admin-alert-icon--${severity}`}
      >
        <AlertIcon
          name={
            getAlertIcon(
              alert
            )
          }
          size={21}
        />
      </div>

      <div className="admin-alert-content">
        <div className="admin-alert-title-row">
          <div>
            <strong>
              {alert.title ||
                "System Notification"}
            </strong>

            {alert.created_at && (
              <small>
                {formatAlertDate(
                  alert.created_at
                )}
              </small>
            )}
          </div>

          <span
            className={`admin-alert-badge admin-alert-badge--${severity}`}
          >
            {severity}
          </span>
        </div>

        <p>
          {alert.message}
        </p>
      </div>
    </article>
  );
}


function AlertSection({
  tone,
  icon,
  eyebrow,
  title,
  subtitle,
  alerts,
  emptyTitle,
  emptyText,
}) {
  return (
    <section
      className={`admin-alerts-card admin-alerts-card--${tone}`}
    >
      <div className="admin-alerts-card-header">
        <div className="admin-alerts-card-heading">
          <div className="admin-alerts-card-icon">
            <AlertIcon
              name={icon}
              size={21}
            />
          </div>

          <div>
            <span>
              {eyebrow}
            </span>

            <h2>
              {title}
            </h2>

            <p>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="admin-alerts-count">
          <AlertIcon
            name={icon}
            size={14}
          />

          <span>
            {alerts.length}
          </span>
        </div>
      </div>

      <div className="admin-alerts-list">
        {alerts.length === 0 ? (
          <div className="admin-alerts-empty">
            <div className="admin-alerts-empty-icon">
              <AlertIcon
                name="check"
                size={27}
              />
            </div>

            <strong>
              {emptyTitle}
            </strong>

            <span>
              {emptyText}
            </span>
          </div>
        ) : (
          alerts.map(
            (
              alert,
              index
            ) => (
              <AlertItem
                key={`${alert.type || "alert"}-${alert.created_at || index}-${index}`}
                alert={alert}
              />
            )
          )
        )}
      </div>
    </section>
  );
}


function AdminAlertsPage() {
  const [
    alerts,
    setAlerts,
  ] = useState([]);

  const [
    criticalCount,
    setCriticalCount,
  ] = useState(0);

  const [
    warningCount,
    setWarningCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const data =
          await getAdminAlerts();

        if (!cancelled) {
          setAlerts(
            data?.alerts ??
              []
          );

          setCriticalCount(
            data?.critical_count ??
              0
          );

          setWarningCount(
            data?.warning_count ??
              0
          );

          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load alerts."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);


  const groupedAlerts =
    useMemo(
      () => {
        const action = [];
        const today = [];
        const overdue = [];
        const activity = [];

        alerts.forEach(
          (alert) => {
            const category =
              getAlertCategory(
                alert
              );

            if (
              category ===
              "overdue"
            ) {
              overdue.push(
                alert
              );

              return;
            }

            if (
              category ===
              "today"
            ) {
              today.push(
                alert
              );

              return;
            }

            if (
              category ===
              "action"
            ) {
              action.push(
                alert
              );

              return;
            }

            activity.push(
              alert
            );
          }
        );

        return {
          action,
          today,
          overdue,
          activity,
        };
      },
      [
        alerts,
      ]
    );


  const attentionCount =
    groupedAlerts.action.length +
    groupedAlerts.today.length +
    groupedAlerts.overdue.length;


  if (loading) {
    return (
      <div className="admin-alerts-page">
        <div className="admin-alerts-loading">
          <div className="admin-alerts-loading-icon">
            <AlertIcon
              name="pulse"
              size={28}
            />
          </div>

          <strong>
            Monitoring Pharmacy Operations
          </strong>

          <span>
            Checking alerts, due items and system activity...
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="admin-alerts-page">
      <AdminPageIntro
        eyebrow="Operational Monitoring"
        title="Alerts"
        subtitle="Prioritize pharmacy actions, due items and important operational notifications."
        accent="red"
      />


      {error && (
        <div className="admin-alerts-error">
          <AlertIcon
            name="critical"
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}


      <section className="admin-alerts-stats">
        <AlertStat
          tone="red"
          icon="critical"
          label="Action Required"
          value={
            attentionCount
          }
          note="Needs pharmacy attention"
        />

        <AlertStat
          tone="orange"
          icon="clock"
          label="Due Today"
          value={
            groupedAlerts.today
              .length
          }
          note="Time-sensitive items"
        />

        <AlertStat
          tone="violet"
          icon="warning"
          label="Overdue"
          value={
            groupedAlerts.overdue
              .length
          }
          note="Follow-up required"
        />

        <AlertStat
          tone="blue"
          icon="bell"
          label="Warnings"
          value={
            warningCount
          }
          note="Require monitoring"
        />

        <AlertStat
          tone="teal"
          icon="info"
          label="All Notifications"
          value={
            alerts.length
          }
          note="Current system alerts"
        />

        <AlertStat
          tone="green"
          icon="check"
          label="Critical"
          value={
            criticalCount
          }
          note="High-priority alerts"
        />
      </section>


      <section className="admin-alerts-command-grid">
        <AlertSection
          tone="critical"
          icon="critical"
          eyebrow="Priority Queue"
          title="Action Required"
          subtitle="Warnings and critical pharmacy items requiring review."
          alerts={
            groupedAlerts.action
          }
          emptyTitle="No immediate action required"
          emptyText="There are no unresolved warning or critical alerts in this queue."
        />

        <AlertSection
          tone="today"
          icon="appointment"
          eyebrow="Time Sensitive"
          title="Due Today"
          subtitle="Refills and appointments identified as due today."
          alerts={
            groupedAlerts.today
          }
          emptyTitle="Nothing due today"
          emptyText="No refill or appointment alerts are currently marked as due today."
        />
      </section>


      <AlertSection
        tone="overdue"
        icon="refill"
        eyebrow="Follow-Up Queue"
        title="Overdue Items"
        subtitle="Items that have passed their expected refill or appointment time."
        alerts={
          groupedAlerts.overdue
        }
        emptyTitle="No overdue items"
        emptyText="There are currently no alerts identified as overdue."
      />


      <AlertSection
        tone="activity"
        icon="pulse"
        eyebrow="Operational Activity"
        title="Recent Notifications"
        subtitle="Sales, purchases, stock activity and other pharmacy system updates."
        alerts={
          groupedAlerts.activity
        }
        emptyTitle="No recent notifications"
        emptyText="New system activity will appear here when available."
      />
    </div>
  );
}

export default AdminAlertsPage;