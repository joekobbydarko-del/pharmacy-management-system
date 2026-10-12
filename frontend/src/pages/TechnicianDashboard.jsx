import { useEffect, useState } from "react";

import { getTechnicianMe } from "../api";

import "./TechnicianDashboard.css";


// ============================================================
// DR. EVANS PHARMACY
// PHARMACY TECHNICIAN PORTAL — TECHNICAL SUPPORT CENTER
//
// Desktop landing dashboard. Layout and styling mirror the
// Technical Support Center design, rebranded for Dr. Evans
// Pharmacy. All figures, tables and lists are hardcoded demo
// data for the UI build only; no backend logic is wired in.
//
// Access is confirmed via the role-guarded
// GET /staff/technician/me endpoint before the dashboard is
// shown. Route protection lives in App.jsx and is untouched.
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
    headphones: (
      <>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    server: (
      <>
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <path d="M6 6h.01M6 18h.01" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 4.3 2.1 18.5A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.5L13.7 4.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v5M12 17.5h.01" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    remote: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    megaphone: (
      <>
        <path d="m3 11 18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 6 10-6" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4.08 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </>
    ),
    code: (
      <>
        <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </>
    ),
    chevron: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.shield}
    </svg>
  );
}


// ---- Demo data (UI build only; no backend wiring) ----
const STAT_CARDS = [
  {
    key: "tickets",
    icon: "headphones",
    tone: "blue",
    label: "Open Tickets",
    value: "28",
    trend: "up",
    trendText: "12%",
    sub: "vs. last 7 days",
  },
  {
    key: "chats",
    icon: "chat",
    tone: "green",
    label: "Active Chats",
    value: "6",
    trend: "up",
    trendText: "33%",
    sub: "currently online",
  },
  {
    key: "uptime",
    icon: "server",
    tone: "purple",
    label: "System Uptime",
    value: "99.9%",
    status: "Operational",
    sub: "Last 30 days",
  },
  {
    key: "escalations",
    icon: "alert",
    tone: "red",
    label: "Pending Escalations",
    value: "4",
    trend: "up",
    trendText: "2 new",
    sub: "Requires attention",
  },
];

const DOCTOR_REQUESTS = [
  { date: "29 Sep 2026, 09:15 AM", doctor: "Dr. Sarah Mensah", dept: "Cardiology", issue: "E-Prescription not working", status: "open" },
  { date: "29 Sep 2026, 08:40 AM", doctor: "Dr. Kofi Antwi", dept: "General Practice", issue: "Cannot access patient records", status: "progress" },
  { date: "28 Sep 2026, 04:22 PM", doctor: "Dr. Ama Serwaa", dept: "Pediatrics", issue: "Lab results not displaying", status: "resolved" },
  { date: "28 Sep 2026, 11:10 AM", doctor: "Dr. Daniel Osei", dept: "Internal Medicine", issue: "Login issue", status: "open" },
  { date: "27 Sep 2026, 03:18 PM", doctor: "Dr. Linda Asare", dept: "Obstetrics / Gyn", issue: "Prescription printer not working", status: "resolved" },
];

const PATIENT_REQUESTS = [
  { date: "29 Sep 2026, 10:05 AM", patient: "Kwame Boateng", issue: "Cannot login to patient portal", status: "open" },
  { date: "29 Sep 2026, 09:20 AM", patient: "Abena Konadu", issue: "Refill prescription online", status: "progress" },
  { date: "28 Sep 2026, 06:45 PM", patient: "Kofi Mensah", issue: "Mobile app not working", status: "resolved" },
  { date: "28 Sep 2026, 02:30 PM", patient: "Akosuo Darko", issue: "Password reset request", status: "open" },
  { date: "27 Sep 2026, 10:12 AM", patient: "Yaw Frimpong", issue: "Cannot view test results", status: "resolved" },
];

const ACTIVE_CHATS = [
  { initials: "KM", name: "Kwame Boateng", role: "Patient", snippet: "Hello, I'm unable to log in to my patient portal...", time: "10:24 AM", unread: 2, tone: "blue" },
  { initials: "SA", name: "Dr. Sarah Mensah", role: "Doctor", snippet: "The e-prescription module is showing an error...", time: "10:18 AM", unread: 1, tone: "purple" },
  { initials: "AK", name: "Abena Konadu", role: "Patient", snippet: "Can you help me reset my password?", time: "10:03 AM", unread: 0, tone: "teal" },
  { initials: "DO", name: "Dr. Daniel Osei", role: "Doctor", snippet: "My system keeps timing out after a few minutes...", time: "09:47 AM", unread: 0, tone: "purple" },
  { initials: "KF", name: "Kofi Frimpong", role: "Patient", snippet: "Thank you, it's working now!", time: "09:30 AM", unread: 0, tone: "blue" },
];

const QUICK_ACTIONS = [
  { key: "ticket", icon: "plus", tone: "blue", title: "Create Ticket", sub: "Report a technical issue" },
  { key: "chat", icon: "chat", tone: "green", title: "Start Live Chat", sub: "Chat with support now" },
  { key: "remote", icon: "remote", tone: "purple", title: "Remote Assist", sub: "Allow remote support" },
  { key: "update", icon: "megaphone", tone: "orange", title: "Send Update", sub: "Notify users / broadcast" },
];

const SYSTEM_HEALTH = [
  { key: "server", icon: "server", label: "Server Status", value: "99.9%" },
  { key: "database", icon: "database", label: "Database", value: "100%" },
  { key: "api", icon: "code", label: "API Services", value: "99.8%" },
  { key: "notifications", icon: "bell", label: "Notifications", value: "99.9%" },
];

const SUPPORT_CHANNELS = [
  { key: "email", icon: "mail", tone: "blue", title: "Email Support", value: "support@gkbpharma.com", sub: "Response within 1 hour" },
  { key: "phone", icon: "phone", tone: "green", title: "Phone Support", value: "+233 302 555 100", sub: "Mon - Fri, 8am - 6pm" },
  { key: "chat", icon: "chat", tone: "purple", title: "Live Chat", value: "Available now", sub: "Chat with our team" },
  { key: "help", icon: "book", tone: "orange", title: "Help Desk Portal", value: "support.gkbpharma.com", sub: "Submit and track tickets" },
];


function StatusPill({ status }) {
  const map = {
    open: { label: "Open", cls: "is-open" },
    progress: { label: "In Progress", cls: "is-progress" },
    resolved: { label: "Resolved", cls: "is-resolved" },
  };
  const item = map[status] || map.open;
  return (
    <span className={"tech-pill " + item.cls}>{item.label}</span>
  );
}


function TechnicianDashboard() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        await getTechnicianMe();
        if (cancelled) return;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.message ||
            "Technician access could not be confirmed."
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
      <div className="techd-gate">
        <span className="techd-gate__spinner" />
        <p>Confirming technician access…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="techd-gate" role="alert">
        <Icon name="alert" size={34} />
        <strong>Access unavailable</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="techd">
      {/* Title row */}
      <div className="techd-title">
        <div>
          <h1>Technical Support Center</h1>
          <p>Support for Doctors, Patients and Healthcare Professionals</p>
        </div>
        <button type="button" className="techd-datebtn">
          <Icon name="calendar" size={18} />
          <span>Today, 29 Sep 2026</span>
          <Icon name="chevron" size={16} />
        </button>
      </div>

      {/* Summary statistic cards */}
      <div className="techd-stats">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="techd-stat">
            <span className={"techd-stat__icon tone-" + card.tone}>
              <Icon name={card.icon} size={24} />
            </span>
            <div className="techd-stat__body">
              <span className="techd-stat__label">{card.label}</span>
              <span className="techd-stat__value">{card.value}</span>
              <div className="techd-stat__meta">

      {/* Two request tables side by side */}
      <div className="techd-tables">
        <section className="techd-card techd-reqcard">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-blue">
              <Icon name="user" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>Doctor Support Requests</h2>
              <p>Technical support requests from doctors and clinical staff</p>
            </div>
            <button type="button" className="techd-viewall">
              View all <Icon name="arrow" size={16} />
            </button>
          </header>

          <table className="techd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Issue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {DOCTOR_REQUESTS.map((row) => (
                <tr key={row.doctor}>
                  <td className="techd-td-date">{row.date}</td>
                  <td className="techd-td-strong">{row.doctor}</td>
                  <td>{row.dept}</td>
                  <td>{row.issue}</td>
                  <td><StatusPill status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="techd-card techd-reqcard">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-red">
              <Icon name="users" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>Patient Support Requests</h2>
              <p>Technical support requests from patients</p>
            </div>
            <button type="button" className="techd-viewall">
              View all <Icon name="arrow" size={16} />
            </button>
          </header>

          <table className="techd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Issue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PATIENT_REQUESTS.map((row) => (
                <tr key={row.patient}>
                  <td className="techd-td-date">{row.date}</td>
                  <td className="techd-td-strong">{row.patient}</td>
                  <td>{row.issue}</td>
                  <td><StatusPill status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

                {card.trend ? (
                  <span className="techd-stat__trend">
                    ↑ {card.trendText}
                  </span>
                ) : (
                  <span className="techd-stat__dot" />
                )}
                <span className="techd-stat__sub">{card.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Lower dashboard sections */}
      <div className="techd-lower">
        <section className="techd-card techd-chat">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-green">
              <Icon name="chat" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>Live Support Chat</h2>
              <p>Currently 6 active chats</p>
            </div>
            <button type="button" className="techd-viewall">
              View all <Icon name="arrow" size={16} />
            </button>
          </header>

          <ul className="techd-chatlist">
            {ACTIVE_CHATS.map((chat) => (
              <li key={chat.name} className="techd-chatrow">
                <span className={"techd-chatrow__avatar tone-" + chat.tone}>
                  {chat.initials}
                </span>
                <div className="techd-chatrow__body">
                  <div className="techd-chatrow__top">
                    <strong>{chat.name}</strong>
                    <span className="techd-chatrow__role">({chat.role})</span>
                    <span className="techd-chatrow__time">{chat.time}</span>
                  </div>
                  <p>{chat.snippet}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="techd-chatrow__unread">
                    {chat.unread}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="techd-card techd-quick">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-blue">
              <Icon name="clock" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>Quick Actions</h2>
            </div>
          </header>

          <div className="techd-quickgrid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                type="button"
                className={"techd-quickbtn tone-" + action.tone}
              >
                <span className="techd-quickbtn__icon">
                  <Icon name={action.icon} size={22} />
                </span>
                <strong>{action.title}</strong>
                <span>{action.sub}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="techd-card techd-health">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-green">
              <Icon name="activity" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>System Health</h2>
            </div>
            <button type="button" className="techd-viewall">
              View details <Icon name="arrow" size={16} />
            </button>
          </header>

          <ul className="techd-healthlist">
            {SYSTEM_HEALTH.map((item) => (
              <li key={item.key} className="techd-healthrow">
                <span className="techd-healthrow__icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="techd-healthrow__label">
                  {item.label}
                </span>
                <span className="techd-healthrow__status">
                  <span className="techd-healthrow__dot" />
                  Operational
                </span>
                <span className="techd-healthrow__value">
                  {item.value}
                </span>
                <Icon name="chevron" size={16} />
              </li>
            ))}
          </ul>
        </section>

        <section className="techd-card techd-channels">
          <header className="techd-card__head">
            <span className="techd-card__icon tone-blue">
              <Icon name="headphones" size={20} />
            </span>
            <div className="techd-card__heading">
              <h2>Support Channels</h2>
              <p>Multiple ways to get technical support</p>
            </div>
          </header>

          <div className="techd-channelsgrid">
            {SUPPORT_CHANNELS.map((channel) => (
              <div
                key={channel.key}
                className={"techd-channel tone-" + channel.tone}
              >
                <span className="techd-channel__icon">
                  <Icon name={channel.icon} size={20} />
                </span>
                <div className="techd-channel__body">
                  <strong>{channel.title}</strong>
                  <span className="techd-channel__value">
                    {channel.value}
                  </span>
                  <span className="techd-channel__sub">
                    {channel.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TechnicianDashboard;

