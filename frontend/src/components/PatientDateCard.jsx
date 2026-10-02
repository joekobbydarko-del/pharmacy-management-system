import "./PatientDateCard.css";

function PatientDateCard() {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="patient-date-card">
      <div className="patient-date-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15.5"
            rx="2.2"
          />

          <path d="M8 3v4M16 3v4M3.5 9.5h17" />

          <path d="M8 13h.01M12 13h.01M16 13h.01" />

          <path d="M8 17h.01M12 17h.01M16 17h.01" />
        </svg>
      </div>

      <div className="patient-date-info">
        <strong>{today}</strong>
        <span>Today</span>
      </div>
    </div>
  );
}

export default PatientDateCard;