import { useMemo, useState } from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./RefillRequestsPage.css";

function RefillRequestsPage() {
  const [selectedPrescription, setSelectedPrescription] =
    useState("");

  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const prescriptions = useMemo(() => [], []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedPrescription) return;

    setSubmitted(true);
  };

  const resetForm = () => {
    setSelectedPrescription("");
    setNote("");
    setSubmitted(false);
  };

  return (
    <section className="refill-page">
      <div className="refill-page-header">
        <div>
          <span className="refill-eyebrow">
            PATIENT REFILLS
          </span>

          <h1>Refill Requests</h1>

          <p>
            Request a refill for one of your active
            prescriptions and monitor your medication
            refill needs.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="refill-summary-grid">
        <article className="refill-summary-card">
          <div className="refill-summary-icon teal">
            <PatientIcon
              name="refresh"
              size={23}
            />
          </div>

          <div>
            <span>PENDING REQUESTS</span>
            <strong>0</strong>
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
              {prescriptions.length}
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
            <span>REFILL REMINDERS</span>
            <strong>0</strong>
            <small>
              No refill reminders
            </small>
          </div>
        </article>
      </div>

      <div className="refill-content-grid">
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
            {submitted ? (
              <div className="refill-success">
                <div className="refill-success-icon">
                  <PatientIcon
                    name="check"
                    size={27}
                  />
                </div>

                <h3>
                  Refill request prepared
                </h3>

                <p>
                  Your refill request has been prepared
                  for pharmacy review.
                </p>

                <button
                  type="button"
                  onClick={resetForm}
                >
                  Make Another Request
                </button>
              </div>
            ) : prescriptions.length === 0 ? (
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
                  Active prescriptions eligible for a
                  refill will appear here.
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
                    onChange={(event) =>
                      setSelectedPrescription(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select a prescription
                    </option>

                    {prescriptions.map(
                      (prescription) => (
                        <option
                          key={
                            prescription.id
                          }
                          value={
                            prescription.id
                          }
                        >
                          {
                            prescription.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="refill-field">
                  <label htmlFor="refill-note">
                    Additional note
                  </label>

                  <textarea
                    id="refill-note"
                    rows="5"
                    value={note}
                    onChange={(event) =>
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
                >
                  Submit Refill Request

                  <PatientIcon
                    name="arrow"
                    size={16}
                  />
                </button>
              </form>
            )}
          </div>
        </article>

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
                Refill reminders will appear here when
                medication requires your attention.
              </p>
            </div>
          </div>
        </article>
      </div>

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
            Your refill information is protected within
            your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default RefillRequestsPage;