import { useState } from "react";
import "./Notifications.css";

function BellIcon({ size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function PrescriptionIcon() {
  return (
    <span className="notification-type-icon prescription">
      ✓
    </span>
  );
}

function RefillIcon() {
  return (
    <span className="notification-type-icon refill">
      ↻
    </span>
  );
}

function AppointmentIcon() {
  return (
    <span className="notification-type-icon appointment">
      ●
    </span>
  );
}

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "prescription",
      title: "Prescription update",
      message: "Your prescription information has been updated.",
      time: "10 minutes ago",
      unread: true,
    },
    {
      id: 2,
      type: "refill",
      title: "Refill request",
      message: "Your refill request is waiting for review.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      type: "appointment",
      title: "Appointment reminder",
      message: "You have an upcoming pharmacy appointment.",
      time: "Yesterday",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  return (
    <div className="notifications-wrapper">

      <button
        type="button"
        className={`notification-button ${
          isOpen ? "is-open" : ""
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <BellIcon size={21} />

        {unreadCount > 0 && (
          <span className="notification-dot">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-panel">

          <div className="notifications-header">
            <div>
              <span className="notifications-eyebrow">
                PHARMACY UPDATES
              </span>

              <h2>Notifications</h2>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list">

            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  <BellIcon size={25} />
                </div>

                <h3>No notifications</h3>

                <p>
                  You're all caught up. New pharmacy
                  updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item ${
                    notification.unread ? "unread" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {notification.type === "prescription" && (
                    <PrescriptionIcon />
                  )}

                  {notification.type === "refill" && (
                    <RefillIcon />
                  )}

                  {notification.type === "appointment" && (
                    <AppointmentIcon />
                  )}

                  <span className="notification-content">
                    <strong>
                      {notification.title}
                    </strong>

                    <span>
                      {notification.message}
                    </span>

                    <small>
                      {notification.time}
                    </small>
                  </span>

                  {notification.unread && (
                    <span className="notification-unread-dot" />
                  )}
                </button>
              ))
            )}

          </div>

          <div className="notifications-footer">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

        </div>
      )}

    </div>
  );
}