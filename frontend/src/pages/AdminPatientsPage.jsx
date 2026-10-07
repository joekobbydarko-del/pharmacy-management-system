import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminPatient,
  getAdminPatients,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminPatientsPage.css";


function PatientIcon({
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
    users: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3 20a6 6 0 0 1 12 0" />

        <circle
          cx="17"
          cy="9"
          r="2"
        />

        <path d="M15 15a5 5 0 0 1 6 5" />
      </>
    ),

    monthly: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h3" />
        <path d="M13 14h3" />
      </>
    ),

    oneTime: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 7v5l3 2" />
      </>
    ),

    directory: (
      <>
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
        />

        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    search: (
      <>
        <circle
          cx="11"
          cy="11"
          r="7"
        />

        <path d="m20 20-4-4" />
      </>
    ),

    person: (
      <>
        <circle
          cx="12"
          cy="8"
          r="4"
        />

        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
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

    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

        <circle
          cx="12"
          cy="10"
          r="2.5"
        />
      </>
    ),

    condition: (
      <>
        <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11Z" />

        <path d="M8.5 12h2l1-2 1.5 4 1-2h2" />
      </>
    ),

    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

        <circle
          cx="12"
          cy="12"
          r="2.5"
        />
      </>
    ),

    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    orders: (
      <>
        <path d="M5 4h14v16H5Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    refill: (
      <>
        <path d="M4 12a8 8 0 1 0 3-6" />
        <path d="M4 4v5h5" />
      </>
    ),

    money: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M15 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .9-3 2.1s1.3 2 3 2.4 3 1.2 3 2.4-1.3 2.1-3 2.1c-1.2 0-2.3-.4-3-1.1" />

        <path d="M12 5v14" />
      </>
    ),

    units: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
        />

        <path d="M8 9h8" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.person}
    </svg>
  );
}


function PatientStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-patient-stat admin-patient-stat--${tone}`}
    >
      <span className="admin-patient-stat-accent" />

      <div className="admin-patient-stat-icon">
        <PatientIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-patient-stat-copy">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {note}
        </small>
      </div>
    </article>
  );
}


function money(
  value
) {
  return `GH₵${Number(
    value || 0
  ).toFixed(2)}`;
}


function displayValue(
  value,
  fallback = "—",
) {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;
}


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


  useEffect(() => {
    let cancelled =
      false;

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

        setError(
          ""
        );

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
          setLoading(
            false
          );
        }
      }
    }

    fetchPatients();

    return () => {
      cancelled = true;
    };
  }, []);


  async function refreshPatients() {
    const data =
      await getAdminPatients();

    setPatientsData(
      data
    );

    setError(
      ""
    );

    return data;
  }


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
              patient.phone,
              patient.location,
              patient.condition,
              patient.customer_type,
              patient.preferred_contact,
              patient.email,
              patient.doctor_email,
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


  async function handleViewPatient(
    patientId
  ) {
    try {
      setDetailsLoading(
        true
      );

      setSelectedPatient(
        {
          patient_id:
            patientId,

          full_name:
            "Loading...",
        }
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

      setSelectedPatient(
        null
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


  async function handleRetry() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      await refreshPatients();

    } catch (err) {
      setError(
        err?.message ||
        "Unable to load patients."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  if (loading) {
    return (
      <section className="admin-patients-page">
        <div className="admin-patients-state">
          <div className="admin-patients-state-icon">
            <PatientIcon
              name="users"
              size={28}
            />
          </div>

          <strong>
            Loading Patients
          </strong>

          <p>
            Retrieving live pharmacy patient records.
          </p>
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="admin-patients-page">
        <div className="admin-patients-state">
          <div className="admin-patients-state-icon">
            <PatientIcon
              name="users"
              size={28}
            />
          </div>

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
      <AdminPageIntro
        eyebrow="Patient Management"
        title="Patients"
        subtitle="View live pharmacy patients, contact information and medication activity."
        accent="teal"
      />


      <section className="admin-patient-stats">
        <PatientStat
          tone="teal"
          icon="users"
          label="Total Patients"
          value={
            patientsData?.total ??
            0
          }
          note="Registered pharmacy patients"
        />

        <PatientStat
          tone="green"
          icon="monthly"
          label="Monthly Patients"
          value={
            patientsData?.monthly ??
            0
          }
          note="Recurring monthly customers"
        />

        <PatientStat
          tone="orange"
          icon="oneTime"
          label="One-Time Patients"
          value={
            patientsData?.one_time ??
            0
          }
          note="One-time customers"
        />
      </section>


      <article className="admin-patients-panel">
        <div className="admin-patients-panel__header">
          <div className="admin-patient-directory-heading">
            <div className="admin-patient-directory-icon">
              <PatientIcon
                name="directory"
                size={21}
              />
            </div>

            <div>
              <span>
                Patient Directory
              </span>

              <h2>
                Pharmacy Patients
              </h2>

              <p>
                Live records from the connected Google Sheet.
              </p>
            </div>
          </div>


          <div className="admin-patient-search">
            <PatientIcon
              name="search"
              size={17}
            />

            <input
              type="search"
              placeholder="Search patient, phone, condition or location..."
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch(
                    ""
                  )
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>


          <div className="admin-patient-directory-count">
            <PatientIcon
              name="users"
              size={14}
            />

            <span>
              {
                filteredPatients.length
              }{" "}
              patients
            </span>
          </div>
        </div>


        <div className="admin-patient-table-wrap">
          <table className="admin-patient-table">
            <thead>
              <tr>
                <th>
                  Patient
                </th>

                <th>
                  Patient ID
                </th>

                <th>
                  Phone
                </th>

                <th>
                  Location
                </th>

                <th>
                  Condition
                </th>

                <th>
                  Type
                </th>

                <th>
                  Contact
                </th>

                <th>
                  Actions
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
                          {patient.full_name
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                            "P"}
                        </span>

                        <div>
                          <strong>
                            {
                              patient.full_name
                            }
                          </strong>

                          <small>
                            {
                              displayValue(
                                patient.email
                              )
                            }
                          </small>
                        </div>
                      </div>
                    </td>


                    <td>
                      <span className="admin-patient-id">
                        {
                          patient.patient_id
                        }
                      </span>
                    </td>


                    <td>
                      <div className="admin-patient-email">
                        <PatientIcon
                          name="phone"
                          size={14}
                        />

                        <span>
                          {
                            displayValue(
                              patient.phone
                            )
                          }
                        </span>
                      </div>
                    </td>


                    <td>
                      <div className="admin-patient-email">
                        <PatientIcon
                          name="location"
                          size={14}
                        />

                        <span>
                          {
                            displayValue(
                              patient.location
                            )
                          }
                        </span>
                      </div>
                    </td>


                    <td>
                      <span className="admin-patient-status active">
                        <PatientIcon
                          name="condition"
                          size={12}
                        />

                        {
                          displayValue(
                            patient.condition
                          )
                        }
                      </span>
                    </td>


                    <td>
                      <span className="admin-patient-id">
                        {
                          displayValue(
                            patient.customer_type
                          )
                        }
                      </span>
                    </td>


                    <td>
                      <span className="admin-patient-status active">
                        {
                          displayValue(
                            patient.preferred_contact
                          )
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
                          <PatientIcon
                            name="eye"
                            size={14}
                          />

                          <span>
                            View
                          </span>
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
              <div className="admin-patient-empty-icon">
                <PatientIcon
                  name="search"
                  size={27}
                />
              </div>

              <strong>
                No patients found
              </strong>

              <p>
                Try another name, patient ID, phone number,
                location or condition.
              </p>
            </div>
          )}
        </div>
      </article>


      {selectedPatient && (
        <div className="admin-patient-modal-backdrop">
          <article className="admin-patient-modal">
            <div className="admin-patient-modal__header">
              <div>
                <span>
                  Patient Profile
                </span>

                <h2>
                  {
                    selectedPatient.full_name
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
                <PatientIcon
                  name="close"
                  size={18}
                />
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
                      Patient ID
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.patient_id
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Customer Type
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.customer_type
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.phone
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Preferred Contact
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.preferred_contact
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.location
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Condition
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.condition
                        )
                      }
                    </strong>
                  </div>


                  <div className="wide">
                    <span>
                      Patient Email
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.patient_email ||
                          selectedPatient.email
                        )
                      }
                    </strong>
                  </div>


                  <div className="wide">
                    <span>
                      Doctor Email
                    </span>

                    <strong>
                      {
                        displayValue(
                          selectedPatient.doctor_email
                        )
                      }
                    </strong>
                  </div>
                </div>


                <h3>
                  Pharmacy Activity
                </h3>


                <div className="admin-patient-activity-grid">
                  <div className="admin-patient-activity-card admin-patient-activity-card--blue">
                    <PatientIcon
                      name="orders"
                      size={20}
                    />

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


                  <div className="admin-patient-activity-card admin-patient-activity-card--violet">
                    <PatientIcon
                      name="orders"
                      size={20}
                    />

                    <span>
                      Pending Orders
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.pending_orders ??
                        0
                      }
                    </strong>
                  </div>


                  <div className="admin-patient-activity-card admin-patient-activity-card--teal">
                    <PatientIcon
                      name="refill"
                      size={20}
                    />

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


                  <div className="admin-patient-activity-card admin-patient-activity-card--orange">
                    <PatientIcon
                      name="money"
                      size={20}
                    />

                    <span>
                      Total Value
                    </span>

                    <strong>
                      {
                        money(
                          selectedPatient
                            .activity
                            ?.total_order_value
                        )
                      }
                    </strong>
                  </div>


                  <div className="admin-patient-activity-card admin-patient-activity-card--blue">
                    <PatientIcon
                      name="units"
                      size={20}
                    />

                    <span>
                      Units Bought
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.units ??
                        0
                      }
                    </strong>
                  </div>


                  <div className="admin-patient-activity-card admin-patient-activity-card--teal">
                    <PatientIcon
                      name="refill"
                      size={20}
                    />

                    <span>
                      Confirmed Refills
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.confirmed_refills ??
                        0
                      }
                    </strong>
                  </div>


                  <div className="admin-patient-activity-card admin-patient-activity-card--violet">
                    <PatientIcon
                      name="refill"
                      size={20}
                    />

                    <span>
                      Due Soon
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.due_soon ??
                        0
                      }
                    </strong>
                  </div>


                  <div className="admin-patient-activity-card admin-patient-activity-card--orange">
                    <PatientIcon
                      name="refill"
                      size={20}
                    />

                    <span>
                      Overdue
                    </span>

                    <strong>
                      {
                        selectedPatient
                          .activity
                          ?.overdue ??
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