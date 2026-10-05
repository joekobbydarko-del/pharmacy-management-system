import {
  useEffect,
  useState,
} from "react";

import {
  getAdminAlerts,
} from "../api";

import "./AdminAlertsPage.css";


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
            data?.alerts
            ?? []
          );

          setCriticalCount(
            data?.critical_count
            ?? 0
          );

          setWarningCount(
            data?.warning_count
            ?? 0
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load alerts."
          );
        }
      }

      finally {
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


  if (loading) {
    return (
      <div className="admin-alerts-page">
        Loading alerts...
      </div>
    );
  }


  return (
    <div className="admin-alerts-page">

      <div className="admin-alerts-header">

        <p className="admin-alerts-eyebrow">
          Monitoring
        </p>

        <h1>
          Alerts
        </h1>

        <p>
          Review pharmacy stock,
          sales and purchase notifications.
        </p>

      </div>


      {
        error && (
          <div className="admin-alerts-error">
            {error}
          </div>
        )
      }


      <div className="admin-alerts-stats">

        <div className="admin-alert-stat">

          <span>
            Total Alerts
          </span>

          <strong>
            {
              alerts.length
            }
          </strong>

        </div>


        <div className="admin-alert-stat warning">

          <span>
            Warnings
          </span>

          <strong>
            {
              warningCount
            }
          </strong>

        </div>


        <div className="admin-alert-stat critical">

          <span>
            Critical
          </span>

          <strong>
            {
              criticalCount
            }
          </strong>

        </div>

      </div>


      <section className="admin-alerts-card">

        <div className="admin-alerts-card-header">

          <div>

            <h2>
              Notifications
            </h2>

            <span>
              {
                alerts.length
              } current alerts
            </span>

          </div>

        </div>


        <div className="admin-alerts-list">

          {
            alerts.length === 0
              ? (
                <div className="admin-alerts-empty">
                  No alerts at the moment.
                </div>
              )
              : (
                alerts.map(
                  (
                    alert,
                    index
                  ) => (
                    <div
                      key={
                        `${alert.type}-${index}`
                      }
                      className={`admin-alert-item ${alert.severity}`}
                    >

                      <div className="admin-alert-icon">

                        {
                          alert.severity
                            === "critical"
                            ? "!"
                            : alert.severity
                              === "warning"
                              ? "!"
                              : "i"
                        }

                      </div>


                      <div className="admin-alert-content">

                        <strong>
                          {
                            alert.title
                          }
                        </strong>

                        <p>
                          {
                            alert.message
                          }
                        </p>

                        {
                          alert.created_at && (
                            <small>
                              {
                                new Date(
                                  alert.created_at
                                ).toLocaleString()
                              }
                            </small>
                          )
                        }

                      </div>


                      <span
                        className={`admin-alert-badge ${alert.severity}`}
                      >
                        {
                          alert.severity
                        }
                      </span>

                    </div>
                  )
                )
              )
          }

        </div>

      </section>

    </div>
  );
}


export default AdminAlertsPage;
