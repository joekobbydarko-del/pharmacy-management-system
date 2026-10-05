import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminPatient,
  getAdminPatients,
  updateAdminPatientStatus,
} from "../api";

import "./AdminPatientsPage.css";


function AdminPatientsPage() {
  const [
    patientsData,
    setPatientsData,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    let cancelled = false;


    async function fetchPatients() {
      try {
        const data =
          await getAdminPatients();


        if (cancelled) {
          return;
        }


        setPatientsData(
          data
        );

        setError("");
      } catch (err) {
        console.error(
          "Unable to load patients:",
          err
        );


        if (cancelled) {
          return;
        }


        setError(
          err?.message ||
            "Unable to load patients."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    fetchPatients();


    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================================================
     REFRESH PATIENT DATA
  ========================================================= */

  async function refreshPatients() {
    const data =
      await getAdminPatients();


    setPatientsData(
      data
    );

    setError("");


    return data;
  }


  /* =========================================================
     FILTERED PATIENTS
  ========================================================= */

  const filteredPatients =
    useMemo(
      () => {
        const patients =
          patientsData?.patients ??
          [];


        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return patients;
        }


        return patients.filter(
          (patient) => {
            const searchableText = [
              patient.patient_id,
              patient.full_name,
              patient.email,
              patient.is_active
                ? "active"
                : "inactive",
            ]
              .join(" ")
              .toLowerCase();


            return searchableText.includes(
              query
            );
          }
        );
      },
      [
        patientsData,
        search,
      ]
    );


  /* =========================================================
     VIEW PATIENT
  ========================================================= */

  async function handleViewPatient(
    patientId
  ) {
    try {
      setDetailsLoading(
        true
      );


      const data =
        await getAdminPatient(
          patientId
        );


      setSelectedPatient(
        data
      );
    } catch (err) {
      console.error(
        "Unable to load patient:",
        err
      );


      window.alert(
        err?.message ||
          "Unable to load patient details."
      );
    } finally {
      setDetailsLoading(
        false
      );
    }
  }


  /* =========================================================
     ACTIVATE / DEACTIVATE
  ========================================================= */

  async function handleStatusChange(
    patient
  ) {
    const nextStatus =
      !patient.is_active;


    const action =
      nextStatus
        ? "activate"
        : "deactivate";


    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${patient.full_name}'s account?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setUpdatingId(
        patient.patient_id
      );


      await updateAdminPatientStatus(
        patient.patient_id,
        nextStatus
      );


      await refreshPatients();


      if (
        selectedPatient?.patient_id ===
        patient.patient_id
      ) {
        const refreshedPatient =
          await getAdminPatient(
            patient.patient_id
          );


        setSelectedPatient(
          refreshedPatient
        );
      }
    } catch (err) {
      console.error(
        "Unable to update patient status:",
        err
      );


      window.alert(
        err?.message ||
          "Unable to update patient status."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  }


  /* =========================================================
     RETRY
  ========================================================= */

  async function handleRetry() {
    try {
      setLoading(true);
      setError("");


      await refreshPatients();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load patients."
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <section className="admin-patients-page">

        <div className="admin-patients-state">

          <strong>
            Loading patients...
          </strong>

          <p>
            Retrieving patient accounts.
          </p>

        </div>

      </section>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <section className="admin-patients-page">

        <div className="admin-patients-state">

          <strong>
            Unable to load patients
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              handleRetry
            }
          >
            Try Again
          </button>

        </div>

      </section>
    );
  }


  return (
    <section className="admin-patients-page">

      {/* =====================================================
          HEADING
      ===================================================== */}

      <div className="admin-patients-heading">

        <div>

          <span>
            CUSTOMER MANAGEMENT
          </span>

          <h1>
            Patients
          </h1>

          <p>
            View and manage registered
            patient accounts.
          </p>

        </div>

      </div>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="admin-patient-stats">

        <article>

          <span>
            TOTAL PATIENTS
          </span>

          <strong>
            {
              patientsData?.total ??
              0
            }
          </strong>

          <small>
            Registered accounts
          </small>

        </article>


        <article>

          <span>
            ACTIVE PATIENTS
          </span>

          <strong>
            {
              patientsData?.active ??
              0
            }
          </strong>

          <small>
            Can sign in
          </small>

        </article>


        <article>

          <span>
            INACTIVE PATIENTS
          </span>

          <strong>
            {
              patientsData?.inactive ??
              0
            }
          </strong>

          <small>
            Access disabled
          </small>

        </article>

      </div>


      {/* =====================================================
          DIRECTORY
      ===================================================== */}

      <article className="admin-patients-panel">

        <div className="admin-patients-panel__header">

          <div>

            <span>
              PATIENT DIRECTORY
            </span>

            <h2>
              Registered Patients
            </h2>

          </div>


          <div className="admin-patient-search">

            <span>
              ⌕
            </span>

            <input
              type="search"
              placeholder="Search patients..."
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />

          </div>

        </div>


        <div className="admin-patient-table-wrap">

          <table className="admin-patient-table">

            <thead>

              <tr>

                <th>
                  PATIENT
                </th>

                <th>
                  PATIENT ID
                </th>

                <th>
                  EMAIL
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTIONS
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredPatients.map(
                (patient) => (

                  <tr
                    key={
                      patient.patient_id
                    }
                  >

                    <td>

                      <div className="admin-patient-person">

                        <span>
                          {
                            patient
                              .full_name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            "P"
                          }
                        </span>

                        <strong>
                          {
                            patient.full_name
                          }
                        </strong>

                      </div>

                    </td>


                    <td>
                      #
                      {
                        patient.patient_id
                      }
                    </td>


                    <td>
                      {
                        patient.email
                      }
                    </td>


                    <td>

                      <span
                        className={`admin-patient-status ${
                          patient.is_active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {
                          patient.is_active
                            ? "Active"
                            : "Inactive"
                        }
                      </span>

                    </td>


                    <td>

                      <div className="admin-patient-actions">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewPatient(
                              patient.patient_id
                            )
                          }
                        >
                          View
                        </button>


                        <button
                          type="button"
                          className={
                            patient.is_active
                              ? "danger"
                              : "success"
                          }
                          disabled={
                            updatingId ===
                            patient.patient_id
                          }
                          onClick={() =>
                            handleStatusChange(
                              patient
                            )
                          }
                        >
                          {
                            updatingId ===
                            patient.patient_id
                              ? "Updating..."
                              : patient.is_active
                                ? "Deactivate"
                                : "Activate"
                          }
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>


          {filteredPatients.length ===
            0 && (

            <div className="admin-patient-empty">

              <strong>
                No patients found
              </strong>

              <p>
                Try a different search.
              </p>

            </div>

          )}

        </div>

      </article>


      {/* =====================================================
          PATIENT MODAL
      ===================================================== */}

      {selectedPatient && (

        <div className="admin-patient-modal-backdrop">

          <article className="admin-patient-modal">

            <div className="admin-patient-modal__header">

              <div>

                <span>
                  PATIENT PROFILE
                </span>

                <h2>
                  {
                    selectedPatient
                      .full_name
                  }
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedPatient(
                    null
                  )
                }
                aria-label="Close patient details"
              >
                ×
              </button>

            </div>


            {detailsLoading ? (

              <div className="admin-patient-modal__loading">
                Loading patient...
              </div>

            ) : (

              <div className="admin-patient-modal__body">

                <div className="admin-patient-detail-grid">

                  <div>

                    <span>
                      PATIENT ID
                    </span>

                    <strong>
                      #
                      {
                        selectedPatient
                          .patient_id
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      STATUS
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .is_active
                          ? "Active"
                          : "Inactive"
                      }
                    </strong>

                  </div>


                  <div className="wide">

                    <span>
                      EMAIL
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .email
                      }
                    </strong>

                  </div>

                </div>


                <h3>
                  Patient Activity
                </h3>


                <div className="admin-patient-activity-grid">

                  <div>

                    <span>
                      Orders
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.orders ??
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Prescriptions
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.prescriptions ??
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Refills
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.refills ??
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Appointments
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.appointments ??
                        0
                      }
                    </strong>

                  </div>

                </div>

              </div>

            )}

          </article>

        </div>

      )}

    </section>
  );
}


export default AdminPatientsPage;