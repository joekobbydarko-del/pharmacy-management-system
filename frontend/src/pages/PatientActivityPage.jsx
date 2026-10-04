import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  getUserOrders,
  getUserPrescriptions,
  getUserRefillRequests,
} from "../api";

import "./PatientActivityPage.css";


function PatientActivityPage() {
  const userId =
    localStorage.getItem("user_id");

  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);

  const [
    refillRequests,
    setRefillRequests,
  ] = useState([]);

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    filter,
    setFilter,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     LOAD ACTIVITY DATA
  ========================================================= */

  useEffect(() => {
    async function loadActivity() {
      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          prescriptionData,
          refillData,
          orderData,
        ] = await Promise.all([
          getUserPrescriptions(userId),
          getUserRefillRequests(userId),
          getUserOrders(userId),
        ]);

        setPrescriptions(
          Array.isArray(
            prescriptionData
          )
            ? prescriptionData
            : []
        );

        setRefillRequests(
          Array.isArray(
            refillData
          )
            ? refillData
            : []
        );

        setOrders(
          Array.isArray(
            orderData
          )
            ? orderData
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load patient activity."
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [userId]);


  /* =========================================================
     BUILD ACTIVITY HISTORY
  ========================================================= */

  const activities =
    useMemo(() => {
      const items = [];

      orders.forEach((order) => {
        items.push({
          id:
            `order-${order.order_id}`,

          type:
            "order",

          icon:
            "package",

          category:
            "Medicine Order",

          title:
            "Medicine order submitted",

          description:
            `${order.medicine_name} • Quantity ${order.quantity}`,

          status:
            order.status ||
            "pending",

          sortValue:
            Number(
              order.order_id || 0
            ),
        });
      });


      refillRequests.forEach(
        (request) => {
          const prescription =
            prescriptions.find(
              (item) =>
                Number(
                  item.prescription_id
                ) ===
                Number(
                  request.prescription_id
                )
            );

          items.push({
            id:
              `refill-${request.request_id}`,

            type:
              "refill",

            icon:
              "refresh",

            category:
              "Refill Request",

            title:
              "Refill request submitted",

            description:
              prescription?.medicine_name ||
              `Prescription #${request.prescription_id}`,

            status:
              request.status ||
              "pending",

            sortValue:
              Number(
                request.request_id || 0
              ),
          });
        }
      );


      return items.sort(
        (a, b) =>
          b.sortValue -
          a.sortValue
      );
    }, [
      orders,
      refillRequests,
      prescriptions,
    ]);


  const filteredActivities =
    useMemo(() => {
      if (filter === "all") {
        return activities;
      }

      return activities.filter(
        (activity) =>
          activity.type === filter
      );
    }, [
      activities,
      filter,
    ]);


  const pendingCount =
    activities.filter(
      (activity) =>
        String(
          activity.status
        ).toLowerCase() ===
        "pending"
    ).length;


  return (
    <section className="activity-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="activity-page-header">

        <div>

          <span className="activity-eyebrow">
            PATIENT ACTIVITY
          </span>

          <h1>
            Activity History
          </h1>

          <p>
            Review recent activity from
            your prescriptions, refill
            requests, medicine orders,
            and other pharmacy services.
          </p>

        </div>

        <PatientDateCard />

      </div>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="activity-summary-grid">

        <article className="activity-summary-card">

          <span className="activity-summary-icon activity-summary-icon--teal">

            <PatientIcon
              name="clock"
              size={23}
            />

          </span>

          <div>

            <span>
              TOTAL ACTIVITY
            </span>

            <strong>
              {loading
                ? "..."
                : activities.length}
            </strong>

            <small>
              Recorded patient actions
            </small>

          </div>

        </article>


        <article className="activity-summary-card">

          <span className="activity-summary-icon activity-summary-icon--blue">

            <PatientIcon
              name="package"
              size={23}
            />

          </span>

          <div>

            <span>
              MEDICINE ORDERS
            </span>

            <strong>
              {loading
                ? "..."
                : orders.length}
            </strong>

            <small>
              Orders submitted
            </small>

          </div>

        </article>


        <article className="activity-summary-card">

          <span className="activity-summary-icon activity-summary-icon--orange">

            <PatientIcon
              name="refresh"
              size={23}
            />

          </span>

          <div>

            <span>
              REFILL REQUESTS
            </span>

            <strong>
              {loading
                ? "..."
                : refillRequests.length}
            </strong>

            <small>
              Refill requests submitted
            </small>

          </div>

        </article>


        <article className="activity-summary-card">

          <span className="activity-summary-icon activity-summary-icon--purple">

            <PatientIcon
              name="bell"
              size={23}
            />

          </span>

          <div>

            <span>
              PENDING
            </span>

            <strong>
              {loading
                ? "..."
                : pendingCount}
            </strong>

            <small>
              Awaiting pharmacy review
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          ACTIVITY PANEL
      ===================================================== */}

      <article className="activity-panel">

        <div className="activity-panel-header">

          <div className="activity-panel-title">

            <span className="activity-panel-icon">

              <PatientIcon
                name="clock"
                size={20}
              />

            </span>

            <div>

              <span>
                PATIENT HISTORY
              </span>

              <h2>
                Recent Activity
              </h2>

            </div>

          </div>


          <div className="activity-filters">

            <button
              type="button"
              className={
                filter === "all"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
            </button>


            <button
              type="button"
              className={
                filter === "order"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setFilter("order")
              }
            >
              Orders
            </button>


            <button
              type="button"
              className={
                filter === "refill"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setFilter("refill")
              }
            >
              Refills
            </button>

          </div>

        </div>


        <div className="activity-panel-body">

          {loading ? (

            <div className="activity-empty">

              <span>

                <PatientIcon
                  name="refresh"
                  size={28}
                />

              </span>

              <h3>
                Loading activity
              </h3>

              <p>
                Please wait while we load
                your patient activity.
              </p>

            </div>

          ) : error ? (

            <div className="activity-empty activity-empty--error">

              <span>

                <PatientIcon
                  name="info"
                  size={28}
                />

              </span>

              <h3>
                Unable to load activity
              </h3>

              <p>
                {error}
              </p>

            </div>

          ) : filteredActivities.length ===
            0 ? (

            <div className="activity-empty">

              <span>

                <PatientIcon
                  name="clock"
                  size={28}
                />

              </span>

              <h3>
                No activity found
              </h3>

              <p>
                Patient activity will
                appear here as you use
                the pharmacy portal.
              </p>

            </div>

          ) : (

            <div className="activity-list">

              {filteredActivities.map(
                (activity) => (

                  <article
                    key={
                      activity.id
                    }
                    className="activity-item"
                  >

                    <span className="activity-item-icon">

                      <PatientIcon
                        name={
                          activity.icon
                        }
                        size={21}
                      />

                    </span>


                    <div className="activity-item-content">

                      <span className="activity-item-category">
                        {
                          activity.category
                        }
                      </span>

                      <strong>
                        {
                          activity.title
                        }
                      </strong>

                      <small>
                        {
                          activity.description
                        }
                      </small>

                    </div>


                    <span
                      className={`activity-status activity-status--${String(
                        activity.status
                      ).toLowerCase()}`}
                    >
                      {
                        activity.status
                      }
                    </span>

                  </article>

                )
              )}

            </div>

          )}

        </div>

      </article>


      {/* =====================================================
          INFO
      ===================================================== */}

      <div className="activity-info">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>

        <div>

          <strong>
            Secure patient activity
          </strong>

          <small>
            Your activity history is
            securely linked to your
            patient account.
          </small>

        </div>

      </div>

    </section>
  );
}

export default PatientActivityPage;