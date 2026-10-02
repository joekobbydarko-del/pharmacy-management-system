import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./PatientProfilePage.css";

function PatientProfilePage() {
  const userName =
    localStorage.getItem("user_name") || "Patient";

  const userId =
    localStorage.getItem("user_id") || "Not available";

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P";

  return (
    <section className="patient-profile-page">
      <div className="patient-profile-header">
        <div>
          <span className="patient-profile-eyebrow">
            PATIENT ACCOUNT
          </span>

          <h1>My Profile</h1>

          <p>
            View your patient account information and
            personal pharmacy profile.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="patient-profile-grid">
        <article className="patient-profile-card patient-profile-card--identity">
          <div className="patient-profile-avatar">
            {initials}
          </div>

          <span className="patient-profile-role">
            PATIENT ACCOUNT
          </span>

          <h2>{userName}</h2>

          <p>
            Dr. Evans Pharmacy Patient Portal
          </p>

          <div className="patient-profile-status">
            <span>
              <PatientIcon
                name="check"
                size={16}
              />
            </span>

            Active patient account
          </div>
        </article>

        <article className="patient-profile-card patient-profile-card--details">
          <div className="patient-profile-card-header">
            <span className="patient-profile-card-icon">
              <PatientIcon
                name="medicine"
                size={20}
              />
            </span>

            <div>
              <span>ACCOUNT INFORMATION</span>
              <h2>Patient Details</h2>
            </div>
          </div>

          <div className="patient-profile-details">
            <div className="patient-profile-detail">
              <span>Full Name</span>
              <strong>{userName}</strong>
            </div>

            <div className="patient-profile-detail">
              <span>Patient ID</span>
              <strong>{userId}</strong>
            </div>

            <div className="patient-profile-detail">
              <span>Account Type</span>
              <strong>Patient</strong>
            </div>

            <div className="patient-profile-detail">
              <span>Pharmacy</span>
              <strong>
                Dr. Evans Pharmacy
              </strong>
            </div>
          </div>
        </article>
      </div>

      <article className="patient-profile-info-panel">
        <div className="patient-profile-info-heading">
          <span>
            <PatientIcon
              name="info"
              size={20}
            />
          </span>

          <div>
            <span>
              PROFILE MANAGEMENT
            </span>

            <h2>
              Personal Information
            </h2>
          </div>
        </div>

        <div className="patient-profile-empty-info">
          <span>
            <PatientIcon
              name="medicine"
              size={27}
            />
          </span>

          <h3>
            Additional patient information
          </h3>

          <p>
            Contact details, address, date of birth,
            and other patient information will appear
            here when profile data is connected to the
            backend.
          </p>
        </div>
      </article>

      <div className="patient-profile-security">
        <span>
          <PatientIcon
            name="shield"
            size={20}
          />
        </span>

        <div>
          <strong>
            Secure patient profile
          </strong>

          <small>
            Your account information is protected within
            the Dr. Evans Pharmacy patient portal.
          </small>
        </div>
      </div>
    </section>
  );
}

export default PatientProfilePage;