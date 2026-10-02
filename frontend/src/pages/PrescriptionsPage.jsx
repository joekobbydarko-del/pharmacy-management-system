import { useEffect, useState } from "react";

import {
  getUserPrescriptions,
  createRefillRequest,
} from "../api";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./PrescriptionsPage.css";

function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refillMessage, setRefillMessage] = useState("");
  const [refillLoadingId, setRefillLoadingId] =
    useState(null);

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    async function loadPrescriptions() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getUserPrescriptions(userId);

        const results = Array.isArray(data)
          ? data
          : data?.prescriptions ||
            data?.items ||
            data?.data ||
            [];

        setPrescriptions(results);
      } catch (err) {
        console.error(
          "Failed to load prescriptions:",
          err
        );

        setError(
          err?.message ||
            "We could not retrieve your prescriptions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPrescriptions();
  }, [userId]);

  async function handleRefill(prescription) {
    try {
      setRefillMessage("");

      setRefillLoadingId(
        prescription.prescription_id
      );

      await createRefillRequest(
        userId,
        prescription.prescription_id,
        `Please refill ${prescription.medicine_name}.`
      );

      setRefillMessage(
        `Refill request submitted for ${prescription.medicine_name}.`
      );
    } catch (err) {
      setRefillMessage(
        err?.message ||
          "Unable to submit refill request."
      );
    } finally {
      setRefillLoadingId(null);
    }
  }

  const activeCount = prescriptions.filter(
    (prescription) =>
      String(prescription.status || "")
        .toLowerCase()
        .trim() === "active"
  ).length;

  return (
    <section className="prescriptions-page">
      <div className="prescriptions-heading">
        <div>
          <span className="prescriptions-eyebrow">
            PATIENT MEDICATIONS
          </span>

          <h1>My Prescriptions</h1>

          <p>
            View your active prescriptions, dosage
            instructions, medication details, and refill
            information.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="prescriptions-summary-grid">
        <article className="prescriptions-summary-card">
          <span className="prescriptions-summary-icon prescriptions-summary-icon--teal">
            <PatientIcon
              name="pill"
              size={23}
            />
          </span>

          <div>
            <span>TOTAL PRESCRIPTIONS</span>
            <strong>{prescriptions.length}</strong>
            <small>Medication records</small>
          </div>
        </article>

        <article className="prescriptions-summary-card">
          <span className="prescriptions-summary-icon prescriptions-summary-icon--blue">
            <PatientIcon
              name="check"
              size={23}
            />
          </span>

          <div>
            <span>ACTIVE PRESCRIPTIONS</span>
            <strong>{activeCount}</strong>
            <small>Current medications</small>
          </div>
        </article>

        <article className="prescriptions-summary-card">
          <span className="prescriptions-summary-icon prescriptions-summary-icon--orange">
            <PatientIcon
              name="refresh"
              size={23}
            />
          </span>

          <div>
            <span>REFILL READY</span>
            <strong>{activeCount}</strong>
            <small>
              Eligible active prescriptions
            </small>
          </div>
        </article>
      </div>

      {refillMessage && (
        <div className="prescription-alert">
          <span>
            <PatientIcon
              name="check"
              size={18}
            />
          </span>

          <div>
            <strong>
              Prescription update
            </strong>

            <p>{refillMessage}</p>
          </div>
        </div>
      )}

      <article className="prescriptions-panel">
        <div className="prescriptions-panel-header">
          <div>
            <span className="prescriptions-panel-icon">
              <PatientIcon
                name="pill"
                size={21}
              />
            </span>

            <div>
              <span className="prescriptions-section-label">
                MEDICATION RECORD
              </span>

              <h2>Your Prescriptions</h2>
            </div>
          </div>

          {!loading && !error && (
            <span className="prescription-record-count">
              {prescriptions.length}{" "}
              {prescriptions.length === 1
                ? "Prescription"
                : "Prescriptions"}
            </span>
          )}
        </div>

        <div className="prescriptions-panel-body">
          {loading && (
            <div className="prescription-state">
              <div className="prescription-loading-spinner" />

              <h3>
                Loading prescriptions
              </h3>

              <p>
                Retrieving your medication records.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="prescription-state prescription-state--error">
              <div className="prescription-state-icon">
                <PatientIcon
                  name="info"
                  size={27}
                />
              </div>

              <span className="prescription-empty-eyebrow">
                MEDICATION RECORD
              </span>

              <h3>
                Prescriptions unavailable
              </h3>

              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            prescriptions.length === 0 && (
              <div className="prescription-state">
                <div className="prescription-state-icon">
                  <PatientIcon
                    name="pill"
                    size={30}
                  />
                </div>

                <span className="prescription-empty-eyebrow">
                  MEDICATION RECORD
                </span>

                <h3>
                  No prescriptions yet
                </h3>

                <p>
                  Your prescribed medicines will appear
                  here once they are added to your
                  pharmacy account.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            prescriptions.length > 0 && (
              <div className="prescription-grid">
                {prescriptions.map(
                  (prescription, index) => {
                    const id =
                      prescription.prescription_id ??
                      prescription.id ??
                      index;

                    const medicine =
                      prescription.medicine_name ||
                      prescription.medication_name ||
                      prescription.medicine ||
                      "Prescription Medication";

                    const dosage =
                      prescription.dosage ||
                      prescription.dose ||
                      "Not specified";

                    const frequency =
                      prescription.frequency ||
                      "Not specified";

                    const instructions =
                      prescription.instructions ||
                      "Follow your pharmacist's instructions.";

                    const status =
                      prescription.status ||
                      "Active";

                    const active =
                      String(status)
                        .toLowerCase()
                        .trim() === "active";

                    const isRefilling =
                      refillLoadingId ===
                      prescription.prescription_id;

                    return (
                      <article
                        className="prescription-card"
                        key={id}
                      >
                        <div className="prescription-card-header">
                          <div className="prescription-medicine">
                            <span className="prescription-medicine-icon">
                              <PatientIcon
                                name="medicine"
                                size={21}
                              />
                            </span>

                            <div>
                              <span>
                                PRESCRIPTION
                              </span>

                              <h3>
                                {medicine}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`prescription-status ${
                              active
                                ? "prescription-status--active"
                                : "prescription-status--inactive"
                            }`}
                          >
                            <i />
                            {status}
                          </span>
                        </div>

                        <div className="prescription-details-grid">
                          <div>
                            <span>Dosage</span>
                            <strong>
                              {dosage}
                            </strong>
                          </div>

                          <div>
                            <span>Frequency</span>
                            <strong>
                              {frequency}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Prescription ID
                            </span>

                            <strong>
                              #{id}
                            </strong>
                          </div>
                        </div>

                        <div className="prescription-instructions">
                          <span>
                            Instructions
                          </span>

                          <p>
                            {instructions}
                          </p>
                        </div>

                        <div className="prescription-card-footer">
                          <span>
                            Medication information is
                            linked to your patient
                            account.
                          </span>

                          {active && (
                            <button
                              type="button"
                              disabled={
                                isRefilling
                              }
                              onClick={() =>
                                handleRefill(
                                  prescription
                                )
                              }
                            >
                              {isRefilling
                                ? "Requesting..."
                                : "Request Refill"}

                              {!isRefilling && (
                                <PatientIcon
                                  name="arrow"
                                  size={15}
                                />
                              )}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </article>

      <div className="prescriptions-security">
        <span>
          <PatientIcon
            name="shield"
            size={20}
          />
        </span>

        <div>
          <strong>
            Prescription information protected
          </strong>

          <small>
            Your medication records are securely linked
            to your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default PrescriptionsPage;