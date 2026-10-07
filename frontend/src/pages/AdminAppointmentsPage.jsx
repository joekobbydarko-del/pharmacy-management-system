import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveAdminAppointment,
  completeAdminAppointment,
  getAdminAppointments,
  rejectAdminAppointment,
  rescheduleAdminAppointment,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminAppointmentsPage.css";


/* =========================================================
   SVG ICON SYSTEM
========================================================= */

function AppointmentIcon({
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
    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h3" />
        <path d="M8 17h6" />
      </>
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 7v5l3 2" />
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

    check: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    close: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 8A7 7 0 0 1 18 6l2 2" />
        <path d="M17.9 16A7 7 0 0 1 6 18l-2-2" />
      </>
    ),

    note: (
      <>
        <path d="M5 3h14v18H5Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    alert: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    clipboard: (
      <>
        <rect
          x="5"
          y="4"
          width="14"
          height="17"
          rx="2"
        />

        <path d="M9 4.5V3h6v1.5" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),

    mail: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="m4 7 8 6 8-6" />
      </>
    ),

    list: (
      <>
        <path d="M9 6h11" />
        <path d="M9 12h11" />
        <path d="M9 18h11" />
        <path d="M4 6h.01" />
        <path d="M4 12h.01" />
        <path d="M4 18h.01" />
      </>
    ),
  };


  return (
    <svg {...common}>
      {icons[name] || icons.calendar}
    </svg>
  );
}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
  value
) {
  const status =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (!status) {
    return "Pending";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}


/* =========================================================
   FILTER ICON
========================================================= */

function getFilterIcon(
  status
) {
  if (status === "pending") {
    return "clock";
  }

  if (status === "approved") {
    return "calendar";
  }

  if (status === "completed") {
    return "check";
  }

  if (status === "rejected") {
    return "close";
  }

  return "list";
}


/* =========================================================
   PAGE
========================================================= */

function AdminAppointmentsPage() {
  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("all");

  const [
    rescheduleAppointment,
    setRescheduleAppointment,
  ] = useState(null);

  const [
    rescheduleDate,
    setRescheduleDate,
  ] = useState("");

  const [
    rescheduleTime,
    setRescheduleTime,
  ] = useState("");


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const data =
          await getAdminAppointments();

        if (!active) {
          return;
        }

        setAppointments(
          Array.isArray(
            data?.appointments
          )
            ? data.appointments
            : []
        );

        setError("");
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load appointments."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);


  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshAppointments() {
    try {
      const data =
        await getAdminAppointments();

      setAppointments(
        Array.isArray(
          data?.appointments
        )
          ? data.appointments
          : []
      );

      setError("");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load appointments."
      );
    }
  }


  /* =======================================================
     COUNTS
  ======================================================= */

  const counts =
    useMemo(
      () => {
        const result = {
          all:
            appointments.length,

          pending:
            0,

          approved:
            0,

          completed:
            0,

          rejected:
            0,
        };

        appointments.forEach(
          (appointment) => {
            const status =
              String(
                appointment.status ||
                  ""
              )
                .trim()
                .toLowerCase();

            if (
              Object.prototype
                .hasOwnProperty
                .call(
                  result,
                  status
                )
            ) {
              result[
                status
              ] += 1;
            }
          }
        );

        return result;
      },
      [
        appointments,
      ]
    );


  /* =======================================================
     FILTERED DATA
  ======================================================= */

  const visibleAppointments =
    useMemo(
      () => {
        if (
          filter === "all"
        ) {
          return appointments;
        }

        return appointments.filter(
          (appointment) =>
            String(
              appointment.status ||
                ""
            )
              .trim()
              .toLowerCase() ===
            filter
        );
      },
      [
        appointments,
        filter,
      ]
    );


  /* =======================================================
     ADMIN ACTION
  ======================================================= */

  async function runAction(
    appointmentId,
    action
  ) {
    try {
      setProcessingId(
        appointmentId
      );

      setError("");
      setSuccess("");

      const result =
        await action(
          appointmentId
        );

      setSuccess(
        result?.message ||
          "Appointment updated successfully."
      );

      await refreshAppointments();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update appointment."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }


  /* =======================================================
     RESCHEDULE
  ======================================================= */

  function openReschedule(
    appointment
  ) {
    setRescheduleAppointment(
      appointment
    );

    setRescheduleDate(
      appointment.appointment_date ||
        ""
    );

    setRescheduleTime(
      appointment.appointment_time ||
        ""
    );

    setError("");
    setSuccess("");
  }


  function closeReschedule() {
    setRescheduleAppointment(
      null
    );

    setRescheduleDate("");
    setRescheduleTime("");
  }


  async function submitReschedule() {
    if (
      !rescheduleAppointment
    ) {
      return;
    }

    if (
      !rescheduleDate ||
      !rescheduleTime
    ) {
      setError(
        "Select a new date and time."
      );

      return;
    }

    try {
      const appointmentId =
        rescheduleAppointment
          .appointment_id;

      setProcessingId(
        appointmentId
      );

      setError("");
      setSuccess("");

      const result =
        await rescheduleAdminAppointment(
          appointmentId,
          rescheduleDate,
          rescheduleTime
        );

      setSuccess(
        result?.message ||
          "Appointment rescheduled successfully."
      );

      closeReschedule();

      await refreshAppointments();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reschedule appointment."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="admin-appointments-page">
        <div className="admin-appointments-loading">
          <span className="admin-appointments-loading-icon">
            <AppointmentIcon
              name="calendar"
              size={28}
            />
          </span>

          <strong>
            Loading Appointments
          </strong>

          <span>
            Preparing patient appointment requests...
          </span>
        </div>
      </div>
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="admin-appointments-page">

      <AdminPageIntro
        eyebrow="Patient Scheduling"
        title="Appointments"
        subtitle="Review patient appointment requests, approve visits, reschedule bookings and complete consultations."
        accent="teal"
      />


      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (
        <div className="admin-appointments-message error">
          <AppointmentIcon
            name="alert"
            size={17}
          />

          <span>
            {error}
          </span>
        </div>
      )}


      {success && (
        <div className="admin-appointments-message success">
          <AppointmentIcon
            name="check"
            size={17}
          />

          <span>
            {success}
          </span>
        </div>
      )}


      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <section className="admin-appointments-summary-grid">

        <article className="admin-appointments-summary-card pending">
          <div className="admin-appointments-summary-icon">
            <AppointmentIcon
              name="clock"
              size={24}
            />
          </div>

          <div>
            <span>
              PENDING REQUESTS
            </span>

            <strong>
              {counts.pending}
            </strong>

            <small>
              Awaiting review
            </small>
          </div>
        </article>


        <article className="admin-appointments-summary-card approved">
          <div className="admin-appointments-summary-icon">
            <AppointmentIcon
              name="calendar"
              size={24}
            />
          </div>

          <div>
            <span>
              APPROVED
            </span>

            <strong>
              {counts.approved}
            </strong>

            <small>
              Confirmed visits
            </small>
          </div>
        </article>


        <article className="admin-appointments-summary-card completed">
          <div className="admin-appointments-summary-icon">
            <AppointmentIcon
              name="check"
              size={24}
            />
          </div>

          <div>
            <span>
              COMPLETED
            </span>

            <strong>
              {counts.completed}
            </strong>

            <small>
              Finished consultations
            </small>
          </div>
        </article>


        <article className="admin-appointments-summary-card rejected">
          <div className="admin-appointments-summary-icon">
            <AppointmentIcon
              name="close"
              size={24}
            />
          </div>

          <div>
            <span>
              REJECTED
            </span>

            <strong>
              {counts.rejected}
            </strong>

            <small>
              Declined requests
            </small>
          </div>
        </article>

      </section>


      {/* ===================================================
          APPOINTMENT QUEUE
      =================================================== */}

      <section className="admin-appointments-card">

        <div className="admin-appointments-card-header">

          <div>
            <span className="admin-appointments-eyebrow">
              Appointment Queue
            </span>

            <h2>
              Patient Requests
            </h2>

            <p>
              Manage all pharmacy appointment bookings
            </p>
          </div>


          <button
            type="button"
            className="admin-appointments-refresh"
            onClick={
              refreshAppointments
            }
          >
            <AppointmentIcon
              name="refresh"
              size={16}
            />

            Refresh
          </button>

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="admin-appointments-filters">

          {[
            "all",
            "pending",
            "approved",
            "completed",
            "rejected",
          ].map(
            (item) => (
              <button
                type="button"
                key={
                  item
                }
                className={
                  filter === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter(
                    item
                  )
                }
              >
                <span className="admin-filter-icon">
                  <AppointmentIcon
                    name={
                      getFilterIcon(
                        item
                      )
                    }
                    size={15}
                  />
                </span>

                <span className="admin-filter-label">
                  {formatStatus(
                    item
                  )}
                </span>

                <span className="admin-filter-count">
                  {counts[item]}
                </span>
              </button>
            )
          )}

        </div>


        {/* =================================================
            EMPTY
        ================================================= */}

        {visibleAppointments.length ===
        0 ? (

          <div className="admin-appointments-empty">

            <span className="admin-appointments-empty-icon">
              <AppointmentIcon
                name="calendar"
                size={30}
              />
            </span>

            <strong>
              No appointments found
            </strong>

            <span>
              Appointment requests will appear here after patients submit them.
            </span>

          </div>

        ) : (

          /* ===============================================
             COMPACT CARD GRID
          =============================================== */

          <div className="admin-appointments-list">

            {visibleAppointments.map(
              (appointment) => {
                const status =
                  String(
                    appointment.status ||
                      "pending"
                  )
                    .trim()
                    .toLowerCase();

                const busy =
                  processingId ===
                  appointment
                    .appointment_id;

                const hasActions =
                  status ===
                    "pending" ||
                  status ===
                    "approved";


                return (
                  <article
                    key={
                      appointment
                        .appointment_id
                    }
                    className={`admin-appointment-item admin-appointment-item--${status}`}
                  >

                    {/* =====================================
                        CARD TOP
                    ===================================== */}

                    <div className="admin-appointment-card-top">

                      <div className="admin-appointment-patient">

                        <span className="admin-appointment-patient-icon">
                          <AppointmentIcon
                            name="user"
                            size={19}
                          />
                        </span>


                        <div>
                          <strong>
                            {appointment.patient_name ||
                              `Patient #${appointment.user_id}`}
                          </strong>

                          <span>
                            <AppointmentIcon
                              name="mail"
                              size={12}
                            />

                            {appointment.patient_email ||
                              "No email available"}
                          </span>
                        </div>

                      </div>


                      <span
                        className={`admin-appointment-status ${status}`}
                      >
                        {status ===
                          "pending" && (
                          <AppointmentIcon
                            name="clock"
                            size={12}
                          />
                        )}

                        {status ===
                          "approved" && (
                          <AppointmentIcon
                            name="calendar"
                            size={12}
                          />
                        )}

                        {status ===
                          "completed" && (
                          <AppointmentIcon
                            name="check"
                            size={12}
                          />
                        )}

                        {status ===
                          "rejected" && (
                          <AppointmentIcon
                            name="close"
                            size={12}
                          />
                        )}

                        {formatStatus(
                          status
                        )}
                      </span>

                    </div>


                    {/* =====================================
                        DATE / TIME
                    ===================================== */}

                    <div className="admin-appointment-schedule">

                      <div className="admin-appointment-schedule-item">
                        <span>
                          <AppointmentIcon
                            name="calendar"
                            size={17}
                          />
                        </span>

                        <div>
                          <small>
                            DATE
                          </small>

                          <strong>
                            {
                              appointment
                                .appointment_date
                            }
                          </strong>
                        </div>
                      </div>


                      <div className="admin-appointment-schedule-item">
                        <span>
                          <AppointmentIcon
                            name="clock"
                            size={17}
                          />
                        </span>

                        <div>
                          <small>
                            TIME
                          </small>

                          <strong>
                            {
                              appointment
                                .appointment_time
                            }
                          </strong>
                        </div>
                      </div>

                    </div>


                    {/* =====================================
                        APPOINTMENT TYPE
                    ===================================== */}

                    <div className="admin-appointment-service">

                      <div className="admin-appointment-service-heading">

                        <span>
                          <AppointmentIcon
                            name="clipboard"
                            size={16}
                          />
                        </span>

                        <div>
                          <small>
                            APPOINTMENT TYPE
                          </small>

                          <strong>
                            {
                              appointment
                                .appointment_type
                            }
                          </strong>
                        </div>

                      </div>


                      {appointment.note && (
                        <div className="admin-appointment-note">

                          <AppointmentIcon
                            name="note"
                            size={14}
                          />

                          <span>
                            {
                              appointment.note
                            }
                          </span>

                        </div>
                      )}

                    </div>


                    {/* =====================================
                        ACTIONS
                    ===================================== */}

                    {hasActions && (
                      <div className="admin-appointment-actions">

                        {status ===
                          "pending" && (
                          <>
                            <button
                              type="button"
                              className="approve"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                runAction(
                                  appointment
                                    .appointment_id,
                                  approveAdminAppointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="check"
                                size={15}
                              />

                              Approve
                            </button>


                            <button
                              type="button"
                              className="reschedule"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                openReschedule(
                                  appointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="clock"
                                size={15}
                              />

                              Reschedule
                            </button>


                            <button
                              type="button"
                              className="reject"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                runAction(
                                  appointment
                                    .appointment_id,
                                  rejectAdminAppointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="close"
                                size={15}
                              />

                              Reject
                            </button>
                          </>
                        )}


                        {status ===
                          "approved" && (
                          <>
                            <button
                              type="button"
                              className="complete"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                runAction(
                                  appointment
                                    .appointment_id,
                                  completeAdminAppointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="check"
                                size={15}
                              />

                              Complete
                            </button>


                            <button
                              type="button"
                              className="reschedule"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                openReschedule(
                                  appointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="clock"
                                size={15}
                              />

                              Reschedule
                            </button>


                            <button
                              type="button"
                              className="reject"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                runAction(
                                  appointment
                                    .appointment_id,
                                  rejectAdminAppointment
                                )
                              }
                            >
                              <AppointmentIcon
                                name="close"
                                size={15}
                              />

                              Reject
                            </button>
                          </>
                        )}


                        {busy && (
                          <span className="admin-appointment-processing">
                            Updating...
                          </span>
                        )}

                      </div>
                    )}


                    {/* =====================================
                        CLOSED STATE FOOTER
                    ===================================== */}

                    {!hasActions && (
                      <div className={`admin-appointment-closed-state ${status}`}>

                        <AppointmentIcon
                          name={
                            status ===
                            "completed"
                              ? "check"
                              : "close"
                          }
                          size={15}
                        />

                        <span>
                          {status ===
                          "completed"
                            ? "Consultation completed"
                            : "Appointment declined"}
                        </span>

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>


      {/* ===================================================
          RESCHEDULE MODAL
      =================================================== */}

      {rescheduleAppointment && (
        <div className="admin-appointments-modal-backdrop">

          <section className="admin-appointments-modal">

            <div className="admin-appointments-modal-header">

              <div>
                <span>
                  APPOINTMENT
                </span>

                <h3>
                  Reschedule Visit
                </h3>
              </div>


              <button
                type="button"
                onClick={
                  closeReschedule
                }
                aria-label="Close"
              >
                <AppointmentIcon
                  name="close"
                  size={18}
                />
              </button>

            </div>


            <div className="admin-appointments-modal-patient">

              <span>
                <AppointmentIcon
                  name="user"
                  size={18}
                />
              </span>

              <div>
                <strong>
                  {rescheduleAppointment.patient_name ||
                    `Patient #${rescheduleAppointment.user_id}`}
                </strong>

                <small>
                  {
                    rescheduleAppointment
                      .appointment_type
                  }
                </small>
              </div>

            </div>


            <label>
              <span>
                New Date
              </span>

              <input
                type="date"
                value={
                  rescheduleDate
                }
                onChange={
                  (event) =>
                    setRescheduleDate(
                      event.target
                        .value
                    )
                }
              />
            </label>


            <label>
              <span>
                New Time
              </span>

              <select
                value={
                  rescheduleTime
                }
                onChange={
                  (event) =>
                    setRescheduleTime(
                      event.target
                        .value
                    )
                }
              >
                <option value="">
                  Select time
                </option>

                <option value="09:00 AM">
                  09:00 AM
                </option>

                <option value="10:00 AM">
                  10:00 AM
                </option>

                <option value="11:00 AM">
                  11:00 AM
                </option>

                <option value="01:00 PM">
                  01:00 PM
                </option>

                <option value="02:00 PM">
                  02:00 PM
                </option>

                <option value="03:00 PM">
                  03:00 PM
                </option>
              </select>
            </label>


            <div className="admin-appointments-modal-actions">

              <button
                type="button"
                className="cancel"
                onClick={
                  closeReschedule
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="save"
                onClick={
                  submitReschedule
                }
              >
                Save New Schedule
              </button>

            </div>

          </section>

        </div>
      )}

    </div>
  );
}


export default AdminAppointmentsPage;