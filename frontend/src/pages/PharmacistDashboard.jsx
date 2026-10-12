import { useEffect, useState } from "react";

import { getPharmacistMe } from "../api";

import "./PharmacistDashboard.css";


// ============================================================
// DR. EVANS PHARMACY
// PHARMACIST PORTAL — LANDING PAGE
//
// Empty landing page only. No clinical or operational features
// are implemented. These will be added once the doctors provide
// their requirements.
//
// The page confirms the signed-in pharmacist via the secure,
// role-guarded /staff/pharmacist/me endpoint. Only then is the
// landing page shown; otherwise an access message is displayed.
// ============================================================


function Icon({ name, size = 20 }) {
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
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 4.3 2.1 18.5A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.5L13.7 4.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v5M12 17.5h.01" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.shield}
    </svg>
  );
}


function PharmacistDashboard() {
  const [status, setStatus] = useState("loading");
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const data = await getPharmacistMe();
        if (cancelled) return;
        setIdentity(data || null);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.message ||
            "Pharmacist access could not be confirmed."
        );
        setStatus("error");
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="pharm-gate">
        <span className="pharm-gate__spinner" />
        <p>Confirming pharmacist access…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="pharm-gate" role="alert">
        <Icon name="alert" size={34} />
        <strong>Access unavailable</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="pharm-landing">
      <div className="pharm-landing__card">
        <div className="pharm-landing__emblem">
          <Icon name="shield" size={38} />
        </div>

        <span className="pharm-landing__eyebrow">
          Pharmacist Portal
        </span>

        <h2>Welcome, {identity?.full_name || "Pharmacist"}</h2>

        <p>
          Your pharmacist workspace is being prepared.
          Clinical and operational tools will be enabled once
          the doctors’ requirements are provided.
        </p>

        <div className="pharm-landing__status">
          <Icon name="clock" size={16} />
          Features pending doctors’ requirements
        </div>

        <p className="pharm-landing__note">
          You are securely signed in with the pharmacist role.
          This landing page is intentionally empty until the
          required functionality is defined.
        </p>
      </div>
    </div>
  );
}

export default PharmacistDashboard;
