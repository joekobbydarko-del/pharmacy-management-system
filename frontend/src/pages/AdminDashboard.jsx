import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAdminDashboard,
} from "../api";

import "./AdminDashboard.css";


function AdminDashboard() {
  const navigate =
    useNavigate();


  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    let active = true;


    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAdminDashboard();

        if (active) {
          setDashboard(
            data
          );
        }
      }

      catch (err) {
        console.error(
          "Unable to load admin dashboard:",
          err
        );

        if (active) {
          setError(
            err?.message ||
            "Unable to load the administrator dashboard."
          );
        }
      }

      finally {
        if (active) {
          setLoading(false);
        }
      }
    }


    loadDashboard();


    return () => {
      active = false;
    };
  }, []);


  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const metrics =
    dashboard?.metrics ?? {};

  const recentOrders =
    dashboard?.recent_orders ?? [];


  /*
   * This array is intentionally calculated directly.
   *
   * There is no need for useMemo here because this is a
   * very small amount of work, and avoiding useMemo also
   * prevents unstable object dependency warnings.
   */
  const stats = [
    {
      label:
        "TOTAL PATIENTS",

      value:
        metrics.total_patients ??
        0,

      note:
        "Registered patient accounts",

      type:
        "purple",

      icon:
        "👥",
    },

    {
      label:
        "TOTAL ORDERS",

      value:
        metrics.total_orders ??
        0,

      note:
        "Medicine orders received",

      type:
        "orange",

      icon:
        "📦",
    },

    {
      label:
        "PENDING ORDERS",

      value:
        metrics.pending_orders ??
        0,

      note:
        "Awaiting pharmacy action",

      type:
        "blue",

      icon:
        "⌛",
    },

    {
      label:
        "PENDING REFILLS",

      value:
        metrics.pending_refills ??
        0,

      note:
        "Awaiting review",

      type:
        "teal",

      icon:
        "↻",
    },

    {
      label:
        "PENDING APPOINTMENTS",

      value:
        metrics.pending_appointments ??
        0,

      note:
        "Appointment requests",

      type:
        "red",

      icon:
        "!",
    },

    {
      label:
        "ACTIVE PRESCRIPTIONS",

      value:
        metrics.active_prescriptions ??
        0,

      note:
        "Current active prescriptions",

      type:
        "green",

      icon:
        "Rx",
    },
  ];


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="admin-dashboard">

        <div className="admin-dashboard-state">

          <span className="admin-dashboard-state__spinner" />

          <strong>
            Loading administrator dashboard...
          </strong>

          <p>
            Retrieving pharmacy data.
          </p>

        </div>

      </section>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <section className="admin-dashboard">

        <div className="admin-dashboard-state admin-dashboard-state--error">

          <strong>
            Dashboard could not be loaded
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }


  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <section className="admin-dashboard">


      {/* =====================================================
          HEADING
      ===================================================== */}

      <div className="admin-dashboard__heading">

        <div>

          <span>
            MANAGEMENT OVERVIEW
          </span>

          <h1>
            Administrator Dashboard
          </h1>

          <p>
            Monitor patients, medicine orders,
            refill requests, prescriptions and
            pharmacy operations from one place.
          </p>

        </div>


        <div className="admin-dashboard__date">

          <small>
            SIGNED IN AS
          </small>

          <strong>
            {
              dashboard
                ?.administrator
                ?.full_name
              ||
              "Administrator"
            }
          </strong>

        </div>

      </div>


      {/* =====================================================
          LIVE DATABASE STATS
      ===================================================== */}

      <div className="admin-stats-grid">

        {
          stats.map(
            (
              stat
            ) => (
              <article
                key={
                  stat.label
                }
                className="admin-stat-card"
              >

                <span
                  className={
                    `admin-stat-icon ${stat.type}`
                  }
                >
                  {stat.icon}
                </span>


                <div>

                  <span className="admin-stat-label">
                    {stat.label}
                  </span>

                  <strong>
                    {stat.value}
                  </strong>

                  <small>
                    {stat.note}
                  </small>

                </div>

              </article>
            )
          )
        }

      </div>


      {/* =====================================================
          OPERATIONS OVERVIEW
      ===================================================== */}

      <div className="admin-dashboard-grid">

        <article className="admin-panel admin-panel--wide">

          <div className="admin-panel__header">

            <div>

              <span>
                SALES PERFORMANCE
              </span>

              <h2>
                Pharmacy Sales
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/sales"
                )
              }
            >
              View Sales
            </button>

          </div>


          <div className="admin-module-placeholder">

            <span className="admin-module-placeholder__icon">
              ₵
            </span>

            <strong>
              Sales analytics are available
            </strong>

            <p>
              Review pharmacy revenue,
              transactions and medicine
              performance in the Sales module.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/sales"
                )
              }
            >
              Open Sales
            </button>

          </div>

        </article>


        <article className="admin-panel">

          <div className="admin-panel__header">

            <div>

              <span>
                MEDICINE PERFORMANCE
              </span>

              <h2>
                Top Selling Medicines
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/reports"
                )
              }
            >
              Reports
            </button>

          </div>


          <div className="admin-module-placeholder">

            <span className="admin-module-placeholder__icon">
              Rx
            </span>

            <strong>
              Medicine performance reporting
            </strong>

            <p>
              View rankings calculated
              from real POS sales and
              transaction records.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/reports"
                )
              }
            >
              View Reports
            </button>

          </div>

        </article>

      </div>


      {/* =====================================================
          OPERATIONS
      ===================================================== */}

      <div className="admin-dashboard-grid admin-dashboard-grid--bottom">


        {/* INVENTORY */}

        <article className="admin-panel">

          <div className="admin-panel__header">

            <div>

              <span>
                INVENTORY
              </span>

              <h2>
                Stock Monitoring
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/inventory"
                )
              }
            >
              Inventory
            </button>

          </div>


          <div className="admin-module-placeholder admin-module-placeholder--small">

            <span className="admin-module-placeholder__icon">
              📦
            </span>

            <strong>
              {
                metrics.inventory_items !==
                undefined
                  ? `${metrics.inventory_items} medicines tracked`
                  : "Inventory monitoring"
              }
            </strong>

            <p>
              {
                metrics.low_stock_items !==
                undefined
                  ? `${metrics.low_stock_items} medicines currently require low-stock attention.`
                  : "Monitor medicine stock quantities, reorder levels and availability."
              }
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/inventory"
                )
              }
            >
              Manage Inventory
            </button>

          </div>

        </article>


        {/* RECENT ORDERS */}

        <article className="admin-panel">

          <div className="admin-panel__header">

            <div>

              <span>
                ORDER ACTIVITY
              </span>

              <h2>
                Recent Medicine Orders
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin"
                )
              }
            >
              Recent
            </button>

          </div>


          <div className="admin-orders-list">

            {
              recentOrders.length >
              0
                ? (
                  recentOrders.map(
                    (
                      order
                    ) => {
                      const orderStatus =
                        String(
                          order.status ||
                          "pending"
                        )
                          .trim()
                          .toLowerCase();

                      const statusClass =
                        orderStatus
                          .replace(
                            /\s+/g,
                            "-"
                          );

                      return (
                        <div
                          key={
                            order.order_id
                          }
                          className="admin-order-item"
                        >

                          <div>

                            <strong>
                              #
                              {
                                order.order_id
                              }
                              {" "}
                              {
                                order.medicine_name
                              }
                            </strong>

                            <small>
                              {
                                order.patient_name
                              }

                              {" • Qty: "}

                              {
                                order.quantity
                              }
                            </small>

                          </div>


                          <strong className="admin-order-patient-id">
                            Patient #
                            {
                              order.patient_id
                            }
                          </strong>


                          <span
                            className={
                              `admin-order-status ${statusClass}`
                            }
                          >
                            {orderStatus}
                          </span>

                        </div>
                      );
                    }
                  )
                )
                : (
                  <div className="admin-empty-orders">

                    <strong>
                      No medicine orders yet
                    </strong>

                    <p>
                      Patient orders will appear
                      here when they are submitted.
                    </p>

                  </div>
                )
            }

          </div>

        </article>

      </div>


      {/* =====================================================
          LIVE SYSTEM SNAPSHOT
      ===================================================== */}

      <article className="admin-system-panel">

        <div>

          <span>
            LIVE SYSTEM SNAPSHOT
          </span>

          <h2>
            Pharmacy Activity
          </h2>

        </div>


        <div className="admin-system-grid">

          <div>

            <span>
              Patients
            </span>

            <strong>
              {
                metrics.total_patients ??
                0
              }
            </strong>

          </div>


          <div>

            <span>
              Orders Awaiting Action
            </span>

            <strong>
              {
                metrics.pending_orders ??
                0
              }
            </strong>

          </div>


          <div>

            <span>
              Refill Requests
            </span>

            <strong>
              {
                metrics.pending_refills ??
                0
              }
            </strong>

          </div>


          <div>

            <span>
              Appointment Requests
            </span>

            <strong>
              {
                metrics.pending_appointments ??
                0
              }
            </strong>

          </div>

        </div>

      </article>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <article className="admin-quick-panel">

        <div>

          <span>
            QUICK ACTIONS
          </span>

          <h2>
            Pharmacy Management
          </h2>

        </div>


        <div className="admin-quick-grid">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/pos"
              )
            }
          >

            <strong>
              Open POS
            </strong>

            <small>
              Start a pharmacy sale
            </small>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/inventory"
              )
            }
          >

            <strong>
              Inventory
            </strong>

            <small>
              Manage medicine stock
            </small>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/patients"
              )
            }
          >

            <strong>
              Patient Records
            </strong>

            <small>
              View registered patients
            </small>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/reports"
              )
            }
          >

            <strong>
              Reports
            </strong>

            <small>
              Review pharmacy analytics
            </small>

          </button>

        </div>

      </article>

    </section>
  );
}


export default AdminDashboard;