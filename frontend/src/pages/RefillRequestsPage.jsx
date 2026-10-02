import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createRefillRequest,
  getUserPrescriptions,
  getUserRefillRequests,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./RefillRequestsPage.css";

function RefillRequestsPage() {
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
    selectedPrescription,
    setSelectedPrescription,
  ] = useState("");

  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  /* =========================================================
     LOAD PRESCRIPTIONS + REFILL REQUESTS
  ========================================================= */

  useEffect(() => {
    async function loadRefillData() {
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
        ] = await Promise.all([
          getUserPrescriptions(userId),
          getUserRefillRequests(userId),
        ]);

        const normalizedPrescriptions =
          Array.isArray(
            prescriptionData
          )
            ? prescriptionData
            : [];

        const normalizedRefills =
          Array.isArray(refillData)
            ? refillData
            : [];

        setPrescriptions(
          normalizedPrescriptions
        );

        setRefillRequests(
          normalizedRefills
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load refill information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRefillData();
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
     PENDING REQUESTS
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
     CURRENT PRESCRIPTION
  ========================================================= */

  const selectedPrescriptionData =
    activePrescriptions.find(
      (prescription) =>
        String(
          prescription.prescription_id
        ) ===
        String(
          selectedPrescription
        )
    );

  const getPrescriptionName = (
    prescription
  ) => {
    return (
      prescription.medicine_name ||
      "Prescription"
    );
  };

  /* =========================================================
     SUBMIT REFILL REQUEST
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !userId ||
        !selectedPrescription
      ) {
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

          icon: "refresh",
        });
      } catch (err) {
        setError(
          err.message ||
            "Unable to submit refill request."
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = () => {
    setSelectedPrescription("");
    setNote("");
    setSubmitted(false);
    setError("");
  };

  return (
    <section className="refill-page">
      {/* =====================================================
          PAGE HEADER
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
          SUMMARY CARDS
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
              {
                pendingRequests.length
              }
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
              {
                activePrescriptions.length
              }
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
              0
            </strong>

            <small>
              No refill reminders
            </small>
          </div>
        </article>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="refill-content-grid">
        {/* REQUEST PANEL */}

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
            {/* LOADING */}

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
              /* SUCCESS */

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
                  onClick={
                    resetForm
                  }
                >
                  Make Another Request
                </button>
              </div>
            ) : activePrescriptions.length ===
              0 ? (
              /* EMPTY */

              <div className="refill-empty">
                <div className="refill-empty-icon">
                  <PatientIcon
                    name="pill"
                    size={28}
                  />
                </div>

                <h3>
                  No prescriptions
                  available
                </h3>

                <p>
                  Active prescriptions
                  eligible for a refill
                  will appear here.
                </p>
              </div>
            ) : (
              /* FORM */

              <form
                className="refill-form"
                onSubmit={
                  handleSubmit
                }
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
                    onChange={(
                      event
                    ) =>
                      setSelectedPrescription(
                        event.target
                          .value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select a
                      prescription
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
                            prescription.prescription_id
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

                {/* SELECTED PRESCRIPTION INFO */}

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
                          selectedPrescriptionData.dosage
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        FREQUENCY
                      </span>

                      <strong>
                        {
                          selectedPrescriptionData.frequency
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
                        event.target
                          .value
                      )
                    }
                    placeholder="Add any message for the pharmacist..."
                  />
                </div>

                {error && (
                  <div className="refill-error">
                    {error}
                  </div>
                )}

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
            REMINDERS
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
                Refill reminders will
                appear here when
                medication requires
                your attention.
              </p>
            </div>
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