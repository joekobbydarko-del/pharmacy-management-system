import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  getUserAppointments,
  getUserLabResults,
  getUserOrders,
  getUserPrescriptions,
  getUserRefillRequests,
  getUserReminders,
} from "../api";

import "./PatientDashboard.css";


function PatientDashboard() {
  const navigate =
    useNavigate();


  const userId =
    localStorage.getItem(
      "user_id"
    );


  const userName =
    localStorage.getItem(
      "user_name"
    ) || "Patient";


  const firstName =
    userName
      .trim()
      .split(/\s+/)[0] ||
    "Patient";


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
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    labResults,
    setLabResults,
  ] = useState([]);


  const [
    reminders,
    setReminders,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    let cancelled = false;


    async function loadDashboardData() {
      if (!userId) {
        if (!cancelled) {
          setError(
            "Patient information could not be found."
          );

          setLoading(false);
        }

        return;
      }


      try {
        const [
          prescriptionData,
          refillData,
          orderData,
          appointmentData,
          labResultData,
          reminderData,
        ] = await Promise.all([
          getUserPrescriptions(
            userId
          ),

          getUserRefillRequests(
            userId
          ),

          getUserOrders(
            userId
          ),

          getUserAppointments(
            userId
          ),

          getUserLabResults(
            userId
          ),

          getUserReminders(
            userId
          ),
        ]);


        if (cancelled) {
          return;
        }


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


        setAppointments(
          Array.isArray(
            appointmentData
          )
            ? appointmentData
            : []
        );


        setLabResults(
          Array.isArray(
            labResultData
          )
            ? labResultData
            : []
        );


        setReminders(
          Array.isArray(
            reminderData
          )
            ? reminderData
            : []
        );


        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load dashboard information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    const timer =
      window.setTimeout(
        () => {
          loadDashboardData();
        },
        0
      );


    return () => {
      cancelled = true;

      window.clearTimeout(
        timer
      );
    };
  }, [userId]);


  /* =========================================================
     ACTIVE PRESCRIPTIONS
  ========================================================= */

  const activePrescriptions =
    useMemo(() => {
      return prescriptions.filter(
        (prescription) =>
          String(
            prescription.status ||
              ""
          ).toLowerCase() ===
          "active"
      );
    }, [prescriptions]);


  const recentPrescriptions =
    useMemo(() => {
      return activePrescriptions.slice(
        0,
        3
      );
    }, [activePrescriptions]);


  /* =========================================================
     UPCOMING APPOINTMENTS
  ========================================================= */

  const upcomingAppointments =
    useMemo(() => {
      return appointments
        .filter(
          (appointment) => {
            const status =
              String(
                appointment.status ||
                  ""
              ).toLowerCase();


            return ![
              "completed",
              "cancelled",
              "rejected",
            ].includes(status);
          }
        )
        .sort(
          (a, b) => {
            const dateA =
              new Date(
                `${a.appointment_date}T00:00:00`
              );


            const dateB =
              new Date(
                `${b.appointment_date}T00:00:00`
              );


            return dateA - dateB;
          }
        );
    }, [appointments]);


  const nextAppointment =
    upcomingAppointments[0] ||
    null;


  /* =========================================================
     LAB RESULTS
  ========================================================= */

  const recentLabResults =
    useMemo(() => {
      return labResults.slice(
        0,
        3
      );
    }, [labResults]);


  /* =========================================================
     REMINDERS
  ========================================================= */

  const pendingReminders =
    useMemo(() => {
      return reminders
        .filter(
          (reminder) =>
            !reminder.completed
        )
        .sort(
          (a, b) => {
            const dateA =
              new Date(
                a.reminder_date
              );

            const dateB =
              new Date(
                b.reminder_date
              );

            return dateA - dateB;
          }
        );
    }, [reminders]);


  const nextReminder =
    pendingReminders[0] ||
    null;


  /* =========================================================
     FORMATTERS
  ========================================================= */

  const formatAppointmentDate = (
    dateString
  ) => {
    if (!dateString) {
      return "";
    }


    const date =
      new Date(
        `${dateString}T00:00:00`
      );


    return date.toLocaleDateString(
      "en-GB",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };


  const formatGeneralDate = (
    dateString
  ) => {
    if (!dateString) {
      return "";
    }


    const date =
      new Date(dateString);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }


    return date.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* =========================================================
     RECENT ACTIVITY
  ========================================================= */

  const recentActivity =
    useMemo(() => {
      const activities = [];


      orders.forEach(
        (order) => {
          activities.push({
            id:
              `order-${order.order_id}`,

            icon:
              "package",

            title:
              "Medicine order submitted",

            description:
              `${order.medicine_name} • Quantity ${order.quantity}`,

            status:
              order.status ||
              "pending",

            sortValue:
              Number(
                order.order_id ||
                  0
              ) * 5,
          });
        }
      );


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


          activities.push({
            id:
              `refill-${request.request_id}`,

            icon:
              "refresh",

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
                request.request_id ||
                  0
              ) * 5 + 1,
          });
        }
      );


      appointments.forEach(
        (appointment) => {
          activities.push({
            id:
              `appointment-${appointment.appointment_id}`,

            icon:
              "calendar",

            title:
              "Appointment request submitted",

            description:
              `${appointment.appointment_type} • ${formatAppointmentDate(
                appointment.appointment_date
              )} • ${appointment.appointment_time}`,

            status:
              appointment.status ||
              "pending",

            sortValue:
              Number(
                appointment.appointment_id ||
                  0
              ) * 5 + 2,
          });
        }
      );


      labResults.forEach(
        (result) => {
          activities.push({
            id:
              `lab-${result.lab_result_id}`,

            icon:
              "medicine",

            title:
              "Lab result available",

            description:
              `${result.test_name} • ${result.result_value}${
                result.unit
                  ? ` ${result.unit}`
                  : ""
              }`,

            status:
              result.status ||
              "available",

            sortValue:
              Number(
                result.lab_result_id ||
                  0
              ) * 5 + 3,
          });
        }
      );


      reminders.forEach(
        (reminder) => {
          activities.push({
            id:
              `reminder-${reminder.reminder_id}`,

            icon:
              "bell",

            title:
              reminder.title ||
              "Patient reminder",

            description:
              reminder.message,

            status:
              reminder.completed
                ? "completed"
                : "pending",

            sortValue:
              Number(
                reminder.reminder_id ||
                  0
              ) * 5 + 4,
          });
        }
      );


      return activities
        .sort(
          (a, b) =>
            b.sortValue -
            a.sortValue
        )
        .slice(
          0,
          4
        );
    }, [
      orders,
      refillRequests,
      prescriptions,
      appointments,
      labResults,
      reminders,
    ]);


  /* =========================================================
     PRESCRIPTION META
  ========================================================= */

  const getPrescriptionMeta = (
    prescription
  ) => {
    const details = [
      prescription.dosage,
      prescription.frequency,
    ].filter(Boolean);


    return details.join(
      " • "
    );
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <section className="patient-dashboard">

      {/* HERO */}

      <div className="dashboard-hero">

        <div className="dashboard-hero__content">

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
            Manage your prescriptions,
            medicine orders, refill
            requests, appointments, and
            pharmacy services from one
            secure place.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* ERROR */}

      {error && (

        <div className="dashboard-error">

          <PatientIcon
            name="info"
            size={18}
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="dashboard-stats-grid">

        {/* APPOINTMENTS */}

        <article className="dashboard-stat-card">

          <span className="dashboard-stat-icon dashboard-stat-icon--blue">

            <PatientIcon
              name="calendar"
              size={23}
            />

          </span>


          <div>

            <span>
              UPCOMING APPOINTMENT
            </span>


            <strong>
              {loading
                ? "..."
                : upcomingAppointments.length}
            </strong>


            <small>
              {nextAppointment
                ? nextAppointment.appointment_type
                : "No upcoming appointment"}
            </small>

          </div>

        </article>


        {/* PRESCRIPTIONS */}

        <article className="dashboard-stat-card">

          <span className="dashboard-stat-icon dashboard-stat-icon--teal">

            <PatientIcon
              name="pill"
              size={23}
            />

          </span>


          <div>

            <span>
              ACTIVE PRESCRIPTIONS
            </span>


            <strong>
              {loading
                ? "..."
                : activePrescriptions.length}
            </strong>


            <small>
              Current medications
            </small>

          </div>

        </article>


        {/* LAB RESULTS */}

        <article className="dashboard-stat-card">

          <span className="dashboard-stat-icon dashboard-stat-icon--purple">

            <PatientIcon
              name="medicine"
              size={23}
            />

          </span>


          <div>

            <span>
              LAB RESULTS
            </span>


            <strong>
              {loading
                ? "..."
                : labResults.length}
            </strong>


            <small>
              {labResults.length > 0
                ? `${labResults.length} result${
                    labResults.length === 1
                      ? ""
                      : "s"
                  } available`
                : "No new results"}
            </small>

          </div>

        </article>


        {/* REMINDERS */}

        <article className="dashboard-stat-card">

          <span className="dashboard-stat-icon dashboard-stat-icon--orange">

            <PatientIcon
              name="bell"
              size={23}
            />

          </span>


          <div>

            <span>
              PENDING REMINDERS
            </span>


            <strong>
              {loading
                ? "..."
                : pendingReminders.length}
            </strong>


            <small>
              {nextReminder
                ? nextReminder.title
                : "You are all caught up"}
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="dashboard-main-grid">

        {/* UPCOMING APPOINTMENT */}

        <article className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>

              <span className="dashboard-panel-icon">

                <PatientIcon
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
              onClick={() =>
                navigate(
                  "/patient/appointments"
                )
              }
            >
              View All →
            </button>

          </div>


          <div className="dashboard-panel-body">

            {loading ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={27}
                  />

                </span>

                <h3>
                  Loading appointment
                </h3>

              </div>

            ) : nextAppointment ? (

              <div className="dashboard-upcoming-appointment">

                <div className="dashboard-upcoming-icon">

                  <PatientIcon
                    name="calendar"
                    size={24}
                  />

                </div>


                <div className="dashboard-upcoming-content">

                  <span>
                    NEXT APPOINTMENT
                  </span>


                  <h3>
                    {
                      nextAppointment.appointment_type
                    }
                  </h3>


                  <p>
                    {formatAppointmentDate(
                      nextAppointment.appointment_date
                    )}

                    {" • "}

                    {
                      nextAppointment.appointment_time
                    }
                  </p>

                </div>


                <span className="dashboard-upcoming-status">

                  {
                    nextAppointment.status ||
                    "pending"
                  }

                </span>

              </div>

            ) : (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="calendar"
                    size={27}
                  />

                </span>


                <h3>
                  No upcoming appointment
                </h3>


                <p>
                  Your upcoming appointments
                  will appear here when they
                  are scheduled.
                </p>


                <button
                  type="button"
                  className="dashboard-empty-action"
                  onClick={() =>
                    navigate(
                      "/patient/appointments"
                    )
                  }
                >
                  Book an appointment →
                </button>

              </div>

            )}

          </div>

        </article>


        {/* LAB RESULTS */}

        <article className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>

              <span className="dashboard-panel-icon">

                <PatientIcon
                  name="medicine"
                  size={20}
                />

              </span>


              <h2>
                Recent Lab Results
              </h2>

            </div>


            <span className="dashboard-panel-label">

              {loading
                ? "Loading"
                : labResults.length > 0
                  ? `${labResults.length} result${
                      labResults.length === 1
                        ? ""
                        : "s"
                    }`
                  : "No results"}

            </span>

          </div>


          <div className="dashboard-panel-body">

            {loading ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={27}
                  />

                </span>


                <h3>
                  Loading lab results
                </h3>

              </div>

            ) : recentLabResults.length ===
              0 ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="medicine"
                    size={27}
                  />

                </span>


                <h3>
                  No recent lab results
                </h3>


                <p>
                  Your recent laboratory
                  results will appear here
                  when they become
                  available.
                </p>

              </div>

            ) : (

              <div className="dashboard-prescription-list">

                {recentLabResults.map(
                  (result) => (

                    <div
                      key={
                        result.lab_result_id
                      }
                      className="dashboard-prescription-item"
                    >

                      <span className="dashboard-prescription-icon">

                        <PatientIcon
                          name="medicine"
                          size={19}
                        />

                      </span>


                      <div className="dashboard-prescription-info">

                        <strong>
                          {result.test_name}
                        </strong>


                        <small>

                          {result.result_value}

                          {result.unit
                            ? ` ${result.unit}`
                            : ""}

                          {result.result_date
                            ? ` • ${formatGeneralDate(
                                result.result_date
                              )}`
                            : ""}

                        </small>

                      </div>


                      <span
                        className={`dashboard-activity-status dashboard-activity-status--${String(
                          result.status ||
                            "normal"
                        ).toLowerCase()}`}
                      >
                        {result.status ||
                          "normal"}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </article>


        {/* PRESCRIPTIONS */}

        <article className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>

              <span className="dashboard-panel-icon">

                <PatientIcon
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
              onClick={() =>
                navigate(
                  "/patient/prescriptions"
                )
              }
            >
              View All →
            </button>

          </div>


          <div className="dashboard-panel-body">

            {loading ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={26}
                  />

                </span>


                <h3>
                  Loading prescriptions
                </h3>

              </div>

            ) : recentPrescriptions.length ===
              0 ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="pill"
                    size={27}
                  />

                </span>


                <h3>
                  No prescriptions yet
                </h3>


                <p>
                  Your active prescriptions
                  will appear here once they
                  are available.
                </p>

              </div>

            ) : (

              <div className="dashboard-prescription-list">

                {recentPrescriptions.map(
                  (prescription) => (

                    <div
                      key={
                        prescription.prescription_id
                      }
                      className="dashboard-prescription-item"
                    >

                      <span className="dashboard-prescription-icon">

                        <PatientIcon
                          name="pill"
                          size={19}
                        />

                      </span>


                      <div className="dashboard-prescription-info">

                        <strong>
                          {
                            prescription.medicine_name
                          }
                        </strong>


                        <small>
                          {getPrescriptionMeta(
                            prescription
                          )}
                        </small>

                      </div>


                      <span className="dashboard-prescription-status">
                        Active
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </article>


        {/* RECENT ACTIVITY */}

        <article className="dashboard-panel">

          <div className="dashboard-panel-header">

            <div>

              <span className="dashboard-panel-icon">

                <PatientIcon
                  name="clock"
                  size={20}
                />

              </span>


              <h2>
                Recent Activity
              </h2>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/patient/activity"
                )
              }
            >
              View Activity →
            </button>

          </div>


          <div className="dashboard-panel-body">

            {loading ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={26}
                  />

                </span>


                <h3>
                  Loading activity
                </h3>

              </div>

            ) : recentActivity.length ===
              0 ? (

              <div className="dashboard-empty-state">

                <span className="dashboard-empty-icon">

                  <PatientIcon
                    name="clock"
                    size={27}
                  />

                </span>


                <h3>
                  No recent activity
                </h3>


                <p>
                  Your pharmacy activity
                  will appear here as you
                  use the patient portal.
                </p>

              </div>

            ) : (

              <div className="dashboard-activity-list">

                {recentActivity.map(
                  (activity) => (

                    <div
                      key={
                        activity.id
                      }
                      className="dashboard-activity-item"
                    >

                      <span className="dashboard-activity-icon">

                        <PatientIcon
                          name={
                            activity.icon
                          }
                          size={19}
                        />

                      </span>


                      <div className="dashboard-activity-content">

                        <strong>
                          {activity.title}
                        </strong>


                        <small>
                          {
                            activity.description
                          }
                        </small>

                      </div>


                      <span
                        className={`dashboard-activity-status dashboard-activity-status--${String(
                          activity.status
                        ).toLowerCase()}`}
                      >
                        {activity.status}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </article>

      </div>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="dashboard-quick-section">

        <div className="dashboard-quick-header">

          <div>

            <span>
              QUICK ACCESS
            </span>

            <h2>
              Quick Actions
            </h2>

          </div>

        </div>


        <div className="dashboard-quick-grid">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/patient/appointments"
              )
            }
          >

            <span>

              <PatientIcon
                name="calendar"
                size={21}
              />

            </span>


            <div>

              <strong>
                Book Appointment
              </strong>

              <small>
                Schedule a pharmacy visit
              </small>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/patient/refills"
              )
            }
          >

            <span>

              <PatientIcon
                name="refresh"
                size={21}
              />

            </span>


            <div>

              <strong>
                Request Refill
              </strong>

              <small>
                Request medication refills
              </small>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/patient/prescriptions"
              )
            }
          >

            <span>

              <PatientIcon
                name="pill"
                size={21}
              />

            </span>


            <div>

              <strong>
                View Prescriptions
              </strong>

              <small>
                Review your medications
              </small>

            </div>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/patient/contact-pharmacist"
              )
            }
          >

            <span>

              <PatientIcon
                name="message"
                size={21}
              />

            </span>


            <div>

              <strong>
                Contact Pharmacist
              </strong>

              <small>
                Send a pharmacy message
              </small>

            </div>

          </button>

        </div>

      </section>


      {/* SECURITY */}

      <div className="dashboard-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure patient portal
          </strong>

          <small>
            Your pharmacy information
            is securely linked to your
            patient account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default PatientDashboard;