import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createAppointment,
  getUserAppointments,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./AppointmentsPage.css";


function AppointmentsPage() {
  const userId =
    localStorage.getItem(
      "user_id"
    );


  const [
    selectedType,
    setSelectedType,
  ] = useState("");


  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");


  const [
    selectedTime,
    setSelectedTime,
  ] = useState("");


  const [
    note,
    setNote,
  ] = useState("");


  const [
    appointments,
    setAppointments,
  ] = useState([]);


  const [
    submitted,
    setSubmitted,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const appointmentTypes = [
    "Medication Consultation",
    "Prescription Review",
    "Refill Consultation",
    "Pharmacist Consultation",
    "General Pharmacy Support",
  ];


  const availableTimes = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
  ];


  /* =========================================================
     TODAY
  ========================================================= */

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  /* =========================================================
     LOAD APPOINTMENTS
  ========================================================= */

  useEffect(() => {
    async function loadAppointments() {
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


        const data =
          await getUserAppointments(
            userId
          );


        setAppointments(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            (
              "Unable to load " +
              "appointments."
            )
        );
      } finally {
        setLoading(false);
      }
    }


    loadAppointments();
  }, [userId]);


  /* =========================================================
     UPCOMING APPOINTMENTS
  ========================================================= */

  const upcomingAppointments =
    useMemo(() => {
      return appointments.filter(
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
      );
    }, [appointments]);


  /* =========================================================
     COMPLETED APPOINTMENTS
  ========================================================= */

  const completedAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) =>
          String(
            appointment.status ||
              ""
          ).toLowerCase() ===
          "completed"
      );
    }, [appointments]);


  /* =========================================================
     DATE FORMATTER
  ========================================================= */

  const formatAppointmentDate = (
    dateString
  ) => {
    if (!dateString) {
      return {
        day: "--",
        month: "---",
      };
    }


    const date =
      new Date(
        `${dateString}T00:00:00`
      );


    return {
      day:
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        ),

      month:
        date
          .toLocaleDateString(
            "en-GB",
            {
              month: "short",
            }
          )
          .toUpperCase(),
    };
  };


  /* =========================================================
     SUBMIT APPOINTMENT
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      if (
        !selectedType ||
        !selectedDate ||
        !selectedTime
      ) {
        setError(
          "Please complete all required appointment fields."
        );

        return;
      }


      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        return;
      }


      try {
        setSubmitting(true);
        setError("");


        const newAppointment =
          await createAppointment(
            userId,
            selectedType,
            selectedDate,
            selectedTime,
            note.trim() || null
          );


        setAppointments(
          (current) => [
            newAppointment,
            ...current,
          ]
        );


        addPatientNotification({
          title:
            "Appointment request submitted",

          message:
            `${selectedType} requested for ${selectedDate} at ${selectedTime}.`,

          icon:
            "calendar",
        });


        setSubmitted(true);
      } catch (err) {
        setError(
          err.message ||
            (
              "Unable to submit " +
              "appointment request."
            )
        );
      } finally {
        setSubmitting(false);
      }
    };


  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setSelectedType("");
    setSelectedDate("");
    setSelectedTime("");
    setNote("");
    setError("");
    setSubmitted(false);
  };


  return (
    <section className="appointments-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="appointments-heading">

        <div>

          <span className="appointments-eyebrow">
            PATIENT APPOINTMENTS
          </span>


          <h1>
            Appointments
          </h1>


          <p>
            View your upcoming pharmacy
            appointments and schedule a
            new appointment with Dr. Evans
            Pharmacy.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="appointment-notice">

          <span>

            <PatientIcon
              name="info"
              size={16}
            />

          </span>

          <p>
            {error}
          </p>

        </div>
      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="appointments-summary-grid">

        {/* UPCOMING */}

        <article className="appointments-summary-card">

          <span className="appointments-summary-icon appointments-summary-icon--blue">

            <PatientIcon
              name="calendar"
              size={23}
            />

          </span>


          <div>

            <span>
              UPCOMING APPOINTMENTS
            </span>


            <strong>
              {loading
                ? "..."
                : upcomingAppointments.length}
            </strong>


            <small>
              Scheduled visits
            </small>

          </div>

        </article>


        {/* SERVICES */}

        <article className="appointments-summary-card">

          <span className="appointments-summary-icon appointments-summary-icon--teal">

            <PatientIcon
              name="plus"
              size={23}
            />

          </span>


          <div>

            <span>
              AVAILABLE SERVICES
            </span>


            <strong>
              {
                appointmentTypes.length
              }
            </strong>


            <small>
              Pharmacy appointment types
            </small>

          </div>

        </article>


        {/* COMPLETED */}

        <article className="appointments-summary-card">

          <span className="appointments-summary-icon appointments-summary-icon--orange">

            <PatientIcon
              name="check"
              size={23}
            />

          </span>


          <div>

            <span>
              COMPLETED
            </span>


            <strong>
              {loading
                ? "..."
                : completedAppointments.length}
            </strong>


            <small>
              Past appointments
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="appointments-content-grid">

        {/* ===================================================
            UPCOMING APPOINTMENTS
        =================================================== */}

        <article className="appointments-panel">

          <div className="appointments-panel-header">

            <div>

              <span className="appointments-panel-icon">

                <PatientIcon
                  name="calendar"
                  size={20}
                />

              </span>


              <div>

                <span className="appointments-section-label">
                  YOUR SCHEDULE
                </span>


                <h2>
                  Upcoming Appointments
                </h2>

              </div>

            </div>

          </div>


          <div className="appointments-panel-body">

            {loading ? (

              <div className="appointments-empty">

                <div className="appointments-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={27}
                  />

                </div>


                <h3>
                  Loading appointments
                </h3>


                <p>
                  Please wait while we
                  load your appointment
                  schedule.
                </p>

              </div>

            ) : upcomingAppointments.length ===
              0 ? (

              <div className="appointments-empty">

                <div className="appointments-empty-icon">

                  <PatientIcon
                    name="calendar"
                    size={27}
                  />

                </div>


                <h3>
                  No appointments
                  scheduled
                </h3>


                <p>
                  Your upcoming pharmacy
                  appointments will appear
                  here after you schedule
                  a visit.
                </p>

              </div>

            ) : (

              <div className="appointments-list">

                {upcomingAppointments.map(
                  (appointment) => {
                    const formattedDate =
                      formatAppointmentDate(
                        appointment.appointment_date
                      );


                    return (
                      <article
                        key={
                          appointment.appointment_id
                        }
                        className="appointment-item"
                      >

                        <div className="appointment-item-date">

                          <strong>
                            {
                              formattedDate.day
                            }
                          </strong>


                          <span>
                            {
                              formattedDate.month
                            }
                          </span>

                        </div>


                        <div className="appointment-item-info">

                          <span>
                            {
                              String(
                                appointment.status ||
                                  "pending"
                              ).toUpperCase()
                            }
                          </span>


                          <h3>
                            {
                              appointment.appointment_type
                            }
                          </h3>


                          <p>
                            {
                              appointment.appointment_time
                            }
                          </p>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </article>


        {/* ===================================================
            BOOK APPOINTMENT
        =================================================== */}

        <article className="appointments-panel">

          <div className="appointments-panel-header">

            <div>

              <span className="appointments-panel-icon">

                <PatientIcon
                  name="plus"
                  size={20}
                />

              </span>


              <div>

                <span className="appointments-section-label">
                  PHARMACY SERVICE
                </span>


                <h2>
                  Book Appointment
                </h2>

              </div>

            </div>

          </div>


          <div className="appointments-panel-body">

            {submitted ? (

              <div className="appointment-success">

                <div className="appointment-success-icon">

                  <PatientIcon
                    name="check"
                    size={27}
                  />

                </div>


                <h3>
                  Appointment request
                  submitted
                </h3>


                <p>
                  Your appointment request
                  has been saved and is
                  now awaiting pharmacy
                  confirmation.
                </p>


                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                >
                  Book Another
                  Appointment
                </button>

              </div>

            ) : (

              <form
                className="appointment-form"
                onSubmit={
                  handleSubmit
                }
              >

                {/* TYPE */}

                <div className="appointment-field">

                  <label htmlFor="appointment-type">
                    Appointment Type
                  </label>


                  <select
                    id="appointment-type"
                    value={
                      selectedType
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedType(
                        event.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select appointment
                      type
                    </option>


                    {appointmentTypes.map(
                      (type) => (

                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* DATE + TIME */}

                <div className="appointment-form-row">

                  <div className="appointment-field">

                    <label htmlFor="appointment-date">
                      Date
                    </label>


                    <input
                      id="appointment-date"
                      type="date"
                      min={today}
                      value={
                        selectedDate
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedDate(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>


                  <div className="appointment-field">

                    <label htmlFor="appointment-time">
                      Time
                    </label>


                    <select
                      id="appointment-time"
                      value={
                        selectedTime
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedTime(
                          event.target.value
                        )
                      }
                      required
                    >

                      <option value="">
                        Select time
                      </option>


                      {availableTimes.map(
                        (time) => (

                          <option
                            key={time}
                            value={time}
                          >
                            {time}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>


                {/* NOTE */}

                <div className="appointment-field">

                  <label htmlFor="appointment-note">
                    Additional Note
                  </label>


                  <textarea
                    id="appointment-note"
                    rows="4"
                    value={note}
                    onChange={(
                      event
                    ) =>
                      setNote(
                        event.target.value
                      )
                    }
                    placeholder="Add any information for the pharmacist..."
                  />

                </div>


                {/* NOTICE */}

                <div className="appointment-notice">

                  <span>

                    <PatientIcon
                      name="info"
                      size={16}
                    />

                  </span>


                  <p>
                    Appointment
                    availability will be
                    confirmed by the
                    pharmacy before the
                    booking is finalized.
                  </p>

                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  className="appointment-submit-button"
                  disabled={
                    submitting
                  }
                >

                  {submitting
                    ? "Submitting..."
                    : "Request Appointment"}


                  {!submitting && (
                    <PatientIcon
                      name="arrow"
                      size={16}
                    />
                  )}

                </button>

              </form>

            )}

          </div>

        </article>

      </div>


      {/* =====================================================
          SECURITY
      ===================================================== */}

      <div className="appointments-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure appointment
            scheduling
          </strong>


          <small>
            Your appointment
            information is securely
            linked to your patient
            account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default AppointmentsPage;