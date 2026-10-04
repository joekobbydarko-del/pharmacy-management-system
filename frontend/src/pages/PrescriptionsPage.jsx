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
  getUserPrescriptions,
} from "../api";

import "./PrescriptionsPage.css";


function PrescriptionsPage() {
  const navigate = useNavigate();

  const userId =
    localStorage.getItem("user_id");

  const [
    prescriptions,
    setPrescriptions,
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
     LOAD PRESCRIPTIONS
  ========================================================= */

  useEffect(() => {
    async function loadPrescriptions() {
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
          await getUserPrescriptions(
            userId
          );

        setPrescriptions(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load prescriptions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPrescriptions();
  }, [userId]);


  /* =========================================================
     COUNTS
  ========================================================= */

  const activePrescriptions =
    useMemo(() => {
      return prescriptions.filter(
        (prescription) =>
          String(
            prescription.status || ""
          ).toLowerCase() ===
          "active"
      );
    }, [prescriptions]);


  const refillReady =
    useMemo(() => {
      return activePrescriptions.length;
    }, [activePrescriptions]);


  /* =========================================================
     HELPERS
  ========================================================= */

  const getStatusClass = (
    status
  ) => {
    const normalized =
      String(
        status || "active"
      ).toLowerCase();

    return normalized;
  };


  return (
    <section className="prescriptions-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="prescriptions-page-header">

        <div>

          <span className="prescriptions-eyebrow">
            PATIENT MEDICATIONS
          </span>

          <h1>
            My Prescriptions
          </h1>

          <p>
            View your active prescriptions,
            dosage instructions,
            medication details, and refill
            information.
          </p>

        </div>

        <PatientDateCard />

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="prescriptions-error">

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
          SUMMARY CARDS
      ===================================================== */}

      <div className="prescriptions-summary-grid">

        <article className="prescriptions-summary-card">

          <span className="prescriptions-summary-icon prescriptions-summary-icon--teal">

            <PatientIcon
              name="pill"
              size={23}
            />

          </span>

          <div>

            <span>
              TOTAL PRESCRIPTIONS
            </span>

            <strong>
              {loading
                ? "..."
                : prescriptions.length}
            </strong>

            <small>
              Medication records
            </small>

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


        <article className="prescriptions-summary-card">

          <span className="prescriptions-summary-icon prescriptions-summary-icon--orange">

            <PatientIcon
              name="refresh"
              size={23}
            />

          </span>

          <div>

            <span>
              REFILL READY
            </span>

            <strong>
              {loading
                ? "..."
                : refillReady}
            </strong>

            <small>
              Eligible active prescriptions
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          PRESCRIPTION PANEL
      ===================================================== */}

      <article className="prescriptions-panel">

        <div className="prescriptions-panel-header">

          <div>

            <span className="prescriptions-panel-icon">

              <PatientIcon
                name="pill"
                size={20}
              />

            </span>

            <div>

              <span className="prescriptions-section-label">
                MEDICATION RECORD
              </span>

              <h2>
                Your Prescriptions
              </h2>

            </div>

          </div>

          {!loading && (
            <span className="prescriptions-count">
              {prescriptions.length}{" "}
              {prescriptions.length === 1
                ? "Prescription"
                : "Prescriptions"}
            </span>
          )}

        </div>


        <div className="prescriptions-panel-body">

          {loading ? (

            <div className="prescriptions-empty">

              <span>

                <PatientIcon
                  name="refresh"
                  size={28}
                />

              </span>

              <h3>
                Loading prescriptions
              </h3>

              <p>
                Please wait while we load
                your medication records.
              </p>

            </div>

          ) : prescriptions.length ===
            0 ? (

            <div className="prescriptions-empty">

              <span>

                <PatientIcon
                  name="pill"
                  size={28}
                />

              </span>

              <h3>
                No prescriptions yet
              </h3>

              <p>
                Your prescribed medicines
                will appear here once they
                are added to your pharmacy
                account.
              </p>

            </div>

          ) : (

            <div className="prescriptions-list">

              {prescriptions.map(
                (prescription) => (

                  <article
                    key={
                      prescription.prescription_id
                    }
                    className="prescription-card"
                  >

                    {/* TOP ROW */}

                    <div className="prescription-card-top">

                      <div className="prescription-card-main">

                        <span className="prescription-card-icon">

                          <PatientIcon
                            name="medicine"
                            size={22}
                          />

                        </span>


                        <div className="prescription-card-title">

                          <span>
                            PRESCRIPTION
                          </span>

                          <h3>
                            {
                              prescription.medicine_name
                            }
                          </h3>

                        </div>

                      </div>


                      <span
                        className={`prescription-status prescription-status--${getStatusClass(
                          prescription.status
                        )}`}
                      >
                        {
                          prescription.status ||
                          "active"
                        }
                      </span>

                    </div>


                    {/* MEDICATION DETAILS */}

                    <div className="prescription-details-grid">

                      <div className="prescription-detail">

                        <span>
                          DOSAGE
                        </span>

                        <strong>
                          {
                            prescription.dosage ||
                            "—"
                          }
                        </strong>

                      </div>


                      <div className="prescription-detail">

                        <span>
                          FREQUENCY
                        </span>

                        <strong>
                          {
                            prescription.frequency ||
                            "—"
                          }
                        </strong>

                      </div>


                      <div className="prescription-detail">

                        <span>
                          PRESCRIPTION ID
                        </span>

                        <strong>
                          #
                          {
                            prescription.prescription_id
                          }
                        </strong>

                      </div>

                    </div>


                    {/* BOTTOM ROW */}

                    <div className="prescription-card-bottom">

                      <div className="prescription-instructions">

                        <span className="prescription-instructions-icon">

                          <PatientIcon
                            name="info"
                            size={17}
                          />

                        </span>

                        <div>

                          <span>
                            INSTRUCTIONS
                          </span>

                          <p>
                            {
                              prescription.instructions ||
                              "No additional instructions."
                            }
                          </p>

                        </div>

                      </div>


                      {String(
                        prescription.status ||
                          ""
                      ).toLowerCase() ===
                        "active" && (

                        <button
                          type="button"
                          className="prescription-refill-button"
                          onClick={() =>
                            navigate(
                              "/patient/refills"
                            )
                          }
                        >

                          Request Refill

                          <PatientIcon
                            name="arrow"
                            size={15}
                          />

                        </button>

                      )}

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </div>

      </article>


      {/* =====================================================
          SECURITY
      ===================================================== */}

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
            Your medication records are
            securely linked to your patient
            account.
          </small>

        </div>

      </div>

    </section>
  );
}

export default PrescriptionsPage;