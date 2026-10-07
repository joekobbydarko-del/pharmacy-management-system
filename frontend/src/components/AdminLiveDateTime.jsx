import { useEffect, useState } from "react";

import "./AdminLiveDateTime.css";

function CalendarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h2M12 14h2M16 14h1M8 17h2M12 17h2" />
    </svg>
  );
}

function AdminLiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const formattedDate = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="admin-live-date-time">
      <span className="admin-live-date-time__icon">
        <CalendarIcon />
      </span>

      <div className="admin-live-date-time__copy">
        <strong>{formattedDate}</strong>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}

export default AdminLiveDateTime;