import {
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./AppointmentsPage.css";

function AppointmentsPage() {
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

  const [note, setNote] =
    useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const appointments =
    useMemo(() => [], []);

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

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      !selectedType ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    setSubmitted(true);

    addPatientNotification({
      title:
        "Appointment request prepared",
      message:
        `${selectedType} requested for ` +
        `${selectedDate} at ${selectedTime}.`,
      icon: "calendar",
    });
  };

  const resetForm = () => {
    setSelectedType("");
    setSelectedDate("");
    setSelectedTime("");
    setNote("");
    setSubmitted(false);
  };

  return (
    <section className="appointments-page">
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

      <div className="appointments-summary-grid">
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
              {appointments.length}
            </strong>

            <small>
              Scheduled visits
            </small>
          </div>
        </article>

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
              0
            </strong>

            <small>
              Past appointments
            </small>
          </div>
        </article>
      </div>

      <div className="appointments-content-grid">
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
            {appointments.length ===
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
                {appointments.map(
                  (appointment) => (
                    <article
                      key={
                        appointment.id
                      }
                      className="appointment-item"
                    >
                      <div className="appointment-item-date">
                        <strong>
                          {
                            appointment.day
                          }
                        </strong>

                        <span>
                          {
                            appointment.month
                          }
                        </span>
                      </div>

                      <div className="appointment-item-info">
                        <span>
                          UPCOMING
                          APPOINTMENT
                        </span>

                        <h3>
                          {
                            appointment.type
                          }
                        </h3>

                        <p>
                          {
                            appointment.time
                          }
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </article>

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
                  prepared
                </h3>

                <p>
                  Your appointment request
                  has been prepared and a
                  notification has been
                  added to your patient
                  portal.
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
                        event.target
                          .value
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

                <div className="appointment-form-row">
                  <div className="appointment-field">
                    <label htmlFor="appointment-date">
                      Date
                    </label>

                    <input
                      id="appointment-date"
                      type="date"
                      value={
                        selectedDate
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedDate(
                          event.target
                            .value
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
                          event.target
                            .value
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
                            key={
                              time
                            }
                            value={
                              time
                            }
                          >
                            {time}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

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
                        event.target
                          .value
                      )
                    }
                    placeholder="Add any information for the pharmacist..."
                  />
                </div>

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

                <button
                  type="submit"
                  className="appointment-submit-button"
                >
                  Request Appointment

                  <PatientIcon
                    name="arrow"
                    size={16}
                  />
                </button>
              </form>
            )}
          </div>
        </article>
      </div>

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