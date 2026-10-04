import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createRefillRequest,
  getUserPrescriptions,
  getUserRefillRequests,
  getUserReminders,
  markReminderComplete,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./RefillRequestsPage.css";


function RefillRequestsPage() {
  const location = useLocation();

  const userId =
    localStorage.getItem("user_id");

  const requestedPrescriptionId =
    location.state?.prescriptionId;


  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);


  const [
    refillRequests,
    setRefillRequests,
  ] = useState([]);


  const [
    reminders,
    setReminders,
  ] = useState([]);


  const [
    selectedPrescription,
    setSelectedPrescription,
  ] = useState(() => {
    return requestedPrescriptionId
      ? String(requestedPrescriptionId)
      : "";
  });


  const [
    note,
    setNote,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    completingReminderId,
    setCompletingReminderId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    submitted,
    setSubmitted,
  ] = useState(false);


  /* =========================================================
     LOAD PAGE DATA
  ========================================================= */

  useEffect(() => {
    let cancelled = false;


    async function loadRefillData() {
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
        if (!cancelled) {
          setLoading(true);
          setError("");
        }


        const [
          prescriptionData,
          refillData,
          reminderData,
        ] = await Promise.all([
          getUserPrescriptions(
            userId
          ),

          getUserRefillRequests(
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


        setReminders(
          Array.isArray(
            reminderData
          )
            ? reminderData
            : []
        );
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Unable to load refill page:",
            err
          );

          setError(
            err?.message ||
              "Unable to load refill information."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    loadRefillData();


    return () => {
      cancelled = true;
    };
  }, [userId]);


  /* =========================================================
     ACTIVE PRESCRIPTIONS
  ========================================================= */

  const activePrescriptions =
    useMemo(() => {
      return prescriptions.filter(
        (prescription) => {
          const status =
            String(
              prescription.status || ""
            ).toLowerCase();


          return (
            !status ||
            status === "active"
          );
        }
      );
    }, [prescriptions]);


  /* =========================================================
     PENDING REFILL REQUESTS
  ========================================================= */

  const pendingRequests =
    useMemo(() => {
      return refillRequests.filter(
        (request) => {
          const status =
            String(
              request.status || ""
            ).toLowerCase();


          return (
            status === "pending" ||
            status === "processing" ||
            status === "requested"
          );
        }
      );
    }, [refillRequests]);


  /* =========================================================
     REFILL REMINDERS
  ========================================================= */

  const refillReminders =
    useMemo(() => {
      return reminders
        .filter((reminder) => {
          const completed =
            reminder.is_completed === true ||
            reminder.completed === true ||
            String(
              reminder.status || ""
            ).toLowerCase() ===
              "completed";


          if (completed) {
            return false;
          }


          const searchableText =
            `${reminder.title || ""} ${
              reminder.message || ""
            }`.toLowerCase();


          return (
            searchableText.includes(
              "refill"
            ) ||
            searchableText.includes(
              "medication"
            ) ||
            searchableText.includes(
              "medicine"
            )
          );
        })
        .sort((a, b) => {
          const firstDate =
            new Date(
              a.reminder_date ||
                a.due_date ||
                a.date ||
                0
            ).getTime();

          const secondDate =
            new Date(
              b.reminder_date ||
                b.due_date ||
                b.date ||
                0
            ).getTime();


          return firstDate - secondDate;
        });
    }, [reminders]);


  /* =========================================================
     SELECTED PRESCRIPTION
  ========================================================= */

  const selectedPrescriptionData =
    useMemo(() => {
      return activePrescriptions.find(
        (prescription) =>
          String(
            prescription.prescription_id
          ) ===
          String(
            selectedPrescription
          )
      );
    }, [
      activePrescriptions,
      selectedPrescription,
    ]);


  const getPrescriptionName = (
    prescription
  ) => {
    return (
      prescription.medicine_name ||
      "Prescription"
    );
  };


  /* =========================================================
     FORMAT REMINDER DATE
  ========================================================= */

  const formatReminderDate = (
    reminder
  ) => {
    const rawDate =
      reminder.reminder_date ||
      reminder.due_date ||
      reminder.date;


    if (!rawDate) {
      return "Reminder pending";
    }


    const date =
      new Date(rawDate);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(rawDate);
    }


    return date.toLocaleDateString(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  /* =========================================================
     SUBMIT REFILL REQUEST
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        return;
      }


      if (!selectedPrescription) {
        setError(
          "Please select a prescription."
        );

        return;
      }


      try {
        setSubmitting(true);
        setError("");


        const newRequest =
          await createRefillRequest(
            userId,
            selectedPrescription,
            note.trim() || null
          );


        setRefillRequests(
          (current) => [
            newRequest,
            ...current,
          ]
        );


        setSubmitted(true);


        addPatientNotification({
          title:
            "Refill request submitted",

          message:
            selectedPrescriptionData
              ? `Your refill request for ${getPrescriptionName(
                  selectedPrescriptionData
                )} has been sent to the pharmacy.`
              : "Your refill request has been sent to the pharmacy.",

          icon:
            "refresh",
        });
      } catch (err) {
        setError(
          err?.message ||
            "Unable to submit refill request."
        );
      } finally {
        setSubmitting(false);
      }
    };


  /* =========================================================
     COMPLETE REMINDER
  ========================================================= */

  const handleCompleteReminder =
    async (reminder) => {
      const reminderId =
        reminder.reminder_id ??
        reminder.id;


      if (!reminderId) {
        setError(
          "This reminder could not be updated."
        );

        return;
      }


      try {
        setCompletingReminderId(
          reminderId
        );

        setError("");


        await markReminderComplete(
          reminderId
        );


        setReminders(
          (current) =>
            current.map(
              (item) => {
                const itemId =
                  item.reminder_id ??
                  item.id;


                if (
                  String(itemId) !==
                  String(reminderId)
                ) {
                  return item;
                }


                return {
                  ...item,
                  is_completed: true,
                  completed: true,
                  status:
                    "completed",
                };
              }
            )
        );


        addPatientNotification({
          title:
            "Reminder completed",

          message:
            reminder.title ||
            "Your refill reminder was marked as completed.",

          icon:
            "check",
        });
      } catch (err) {
        console.error(
          "Unable to complete reminder:",
          err
        );

        setError(
          err?.message ||
            "Unable to mark this reminder as completed."
        );
      } finally {
        setCompletingReminderId(
          null
        );
      }
    };


  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setSelectedPrescription(
      ""
    );

    setNote("");

    setSubmitted(false);

    setError("");
  };


  return (
    <section className="refill-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="refill-page-header">

        <div>

          <span className="refill-eyebrow">
            PATIENT REFILLS
          </span>


          <h1>
            Refill Requests
          </h1>


          <p>
            Request a refill for one of
            your active prescriptions
            and monitor your medication
            refill needs.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error &&
        !submitted && (

          <div className="refill-error">

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
          SUMMARY
      ===================================================== */}

      <div className="refill-summary-grid">

        <article className="refill-summary-card">

          <div className="refill-summary-icon teal">

            <PatientIcon
              name="refresh"
              size={23}
            />

          </div>


          <div>

            <span>
              PENDING REQUESTS
            </span>

            <strong>
              {loading
                ? "..."
                : pendingRequests.length}
            </strong>

            <small>
              Requests awaiting review
            </small>

          </div>

        </article>


        <article className="refill-summary-card">

          <div className="refill-summary-icon blue">

            <PatientIcon
              name="pill"
              size={23}
            />

          </div>


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
              Available for refill
            </small>

          </div>

        </article>


        <article className="refill-summary-card">

          <div className="refill-summary-icon orange">

            <PatientIcon
              name="bell"
              size={23}
            />

          </div>


          <div>

            <span>
              REFILL REMINDERS
            </span>

            <strong>
              {loading
                ? "..."
                : refillReminders.length}
            </strong>

            <small>
              {loading
                ? "Loading reminders"
                : refillReminders.length ===
                    0
                  ? "No refill reminders"
                  : refillReminders.length ===
                      1
                    ? "Reminder needs attention"
                    : "Reminders need attention"}
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="refill-content-grid">

        {/* ===================================================
            REQUEST REFILL
        =================================================== */}

        <article className="refill-panel">

          <div className="refill-panel-header">

            <div>

              <span className="refill-panel-icon">

                <PatientIcon
                  name="refresh"
                  size={20}
                />

              </span>


              <div>

                <span className="refill-section-label">
                  MEDICATION SERVICE
                </span>

                <h2>
                  Request a Refill
                </h2>

              </div>

            </div>

          </div>


          <div className="refill-panel-body">

            {loading ? (

              <div className="refill-empty">

                <div className="refill-empty-icon">

                  <PatientIcon
                    name="refresh"
                    size={28}
                  />

                </div>

                <h3>
                  Loading prescriptions
                </h3>

                <p>
                  Please wait while we
                  load your medication
                  information.
                </p>

              </div>

            ) : submitted ? (

              <div className="refill-success">

                <div className="refill-success-icon">

                  <PatientIcon
                    name="check"
                    size={27}
                  />

                </div>

                <h3>
                  Refill request sent
                </h3>

                <p>
                  Your refill request
                  was successfully sent
                  to Dr. Evans Pharmacy
                  and is now awaiting
                  review.
                </p>

                <button
                  type="button"
                  onClick={resetForm}
                >
                  Make Another Request
                </button>

              </div>

            ) : activePrescriptions.length ===
              0 ? (

              <div className="refill-empty">

                <div className="refill-empty-icon">

                  <PatientIcon
                    name="pill"
                    size={28}
                  />

                </div>

                <h3>
                  No prescriptions available
                </h3>

                <p>
                  Active prescriptions
                  eligible for a refill
                  will appear here.
                </p>

              </div>

            ) : (

              <form
                className="refill-form"
                onSubmit={handleSubmit}
              >

                <div className="refill-field">

                  <label htmlFor="prescription">
                    Prescription
                  </label>

                  <select
                    id="prescription"
                    value={
                      selectedPrescription
                    }
                    onChange={(event) => {
                      setSelectedPrescription(
                        event.target.value
                      );

                      setError("");
                    }}
                    required
                  >

                    <option value="">
                      Select a prescription
                    </option>

                    {activePrescriptions.map(
                      (
                        prescription
                      ) => (

                        <option
                          key={
                            prescription.prescription_id
                          }
                          value={
                            String(
                              prescription.prescription_id
                            )
                          }
                        >
                          {
                            prescription.medicine_name
                          }{" "}
                          —{" "}
                          {
                            prescription.dosage
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                {selectedPrescriptionData && (

                  <div className="refill-prescription-preview">

                    <div>

                      <span>
                        MEDICINE
                      </span>

                      <strong>
                        {
                          selectedPrescriptionData.medicine_name
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        DOSAGE
                      </span>

                      <strong>
                        {
                          selectedPrescriptionData.dosage ||
                          "—"
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        FREQUENCY
                      </span>

                      <strong>
                        {
                          selectedPrescriptionData.frequency ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>

                )}


                <div className="refill-field">

                  <label htmlFor="refill-note">
                    Additional note
                  </label>

                  <textarea
                    id="refill-note"
                    rows="5"
                    value={note}
                    onChange={(
                      event
                    ) =>
                      setNote(
                        event.target.value
                      )
                    }
                    placeholder="Add any message for the pharmacist..."
                  />

                </div>


                <button
                  type="submit"
                  className="refill-submit-button"
                  disabled={
                    submitting ||
                    !selectedPrescription
                  }
                >

                  {submitting
                    ? "Submitting..."
                    : "Submit Refill Request"}


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


        {/* ===================================================
            REFILL REMINDERS
        =================================================== */}

        <article className="refill-panel">

          <div className="refill-panel-header">

            <div>

              <span className="refill-panel-icon">

                <PatientIcon
                  name="bell"
                  size={20}
                />

              </span>


              <div>

                <span className="refill-section-label">
                  MEDICATION REMINDERS
                </span>

                <h2>
                  Refill Reminders
                </h2>

              </div>

            </div>

          </div>


          <div className="refill-panel-body">

            {loading ? (

              <div className="refill-empty smaller">

                <div className="refill-empty-icon">

                  <PatientIcon
                    name="bell"
                    size={27}
                  />

                </div>

                <h3>
                  Loading reminders
                </h3>

                <p>
                  Please wait while your
                  refill reminders are
                  loaded.
                </p>

              </div>

            ) : refillReminders.length ===
              0 ? (

              <div className="refill-empty smaller">

                <div className="refill-empty-icon">

                  <PatientIcon
                    name="check"
                    size={27}
                  />

                </div>

                <h3>
                  No refill reminders
                </h3>

                <p>
                  You currently have no
                  pending medication
                  refill reminders.
                </p>

              </div>

            ) : (

              <div className="refill-reminder-list">

                {refillReminders.map(
                  (reminder) => {
                    const reminderId =
                      reminder.reminder_id ??
                      reminder.id;


                    const isCompleting =
                      String(
                        completingReminderId
                      ) ===
                      String(
                        reminderId
                      );


                    return (

                      <div
                        className="refill-reminder-item"
                        key={
                          reminderId ??
                          `${reminder.title}-${reminder.reminder_date}`
                        }
                      >

                        <div className="refill-reminder-item__icon">

                          <PatientIcon
                            name="bell"
                            size={18}
                          />

                        </div>


                        <div className="refill-reminder-item__content">

                          <span className="refill-reminder-item__label">
                            REFILL REMINDER
                          </span>


                          <h3>
                            {
                              reminder.title ||
                              "Medication Refill Reminder"
                            }
                          </h3>


                          {reminder.message && (

                            <p>
                              {
                                reminder.message
                              }
                            </p>

                          )}


                          <small>
                            {
                              formatReminderDate(
                                reminder
                              )
                            }
                          </small>

                        </div>


                        <button
                          type="button"
                          className="refill-reminder-complete"
                          onClick={() =>
                            handleCompleteReminder(
                              reminder
                            )
                          }
                          disabled={
                            isCompleting
                          }
                        >

                          <PatientIcon
                            name="check"
                            size={14}
                          />

                          <span>
                            {isCompleting
                              ? "Updating..."
                              : "Mark complete"}
                          </span>

                        </button>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </article>

      </div>


      {/* =====================================================
          SECURITY
      ===================================================== */}

      <div className="refill-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure refill requests
          </strong>

          <small>
            Your refill information is
            protected within your
            patient account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default RefillRequestsPage;