import { useEffect, useState } from "react";

import PatientIcon from "./PatientIcon";

import {
  getPatientNotifications,
} from "../utils/patientNotifications";

import "./Notifications.css";

const STORAGE_KEY =
  "patient_notifications";

function Notifications() {
  const [open, setOpen] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState(() =>
    getPatientNotifications()
  );

  const refreshNotifications = () => {
    setNotifications(
      getPatientNotifications()
    );
  };

  useEffect(() => {
    window.addEventListener(
      "patient-notifications-updated",
      refreshNotifications
    );

    window.addEventListener(
      "storage",
      refreshNotifications
    );

    return () => {
      window.removeEventListener(
        "patient-notifications-updated",
        refreshNotifications
      );

      window.removeEventListener(
        "storage",
        refreshNotifications
      );
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map(
        (notification) => ({
          ...notification,
          read: true,
        })
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="patient-notifications">
      <button
        type="button"
        className="patient-notifications__trigger"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        aria-label="Notifications"
        aria-expanded={open}
      >
        <PatientIcon
          name="bell"
          size={20}
        />

        {unreadCount > 0 && (
          <span className="patient-notifications__badge">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="patient-notifications__menu">
          <div className="patient-notifications__header">
            <div>
              <span>
                PATIENT UPDATES
              </span>

              <h3>
                Notifications
              </h3>
            </div>

            {unreadCount > 0 && (
              <span className="patient-notifications__unread">
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length >
            0 && (
            <div className="patient-notifications__actions">
              <button
                type="button"
                onClick={
                  markAllAsRead
                }
                disabled={
                  unreadCount === 0
                }
              >
                Mark all as read
              </button>

              <button
                type="button"
                className="patient-notifications__clear"
                onClick={
                  clearNotifications
                }
              >
                Clear all
              </button>
            </div>
          )}

          <div className="patient-notifications__body">
            {notifications.length ===
            0 ? (
              <div className="patient-notifications__empty">
                <span className="patient-notifications__empty-icon">
                  <PatientIcon
                    name="bell"
                    size={25}
                  />
                </span>

                <h4>
                  You’re all caught up
                </h4>

                <p>
                  Appointment reminders,
                  refill updates,
                  prescription
                  notifications, and
                  pharmacy messages will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="patient-notifications__list">
                {notifications.map(
                  (notification) => (
                    <button
                      key={
                        notification.id
                      }
                      type="button"
                      className={`patient-notification-item ${
                        notification.read
                          ? ""
                          : "is-unread"
                      }`}
                      onClick={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                    >
                      <span className="patient-notification-item__icon">
                        <PatientIcon
                          name={
                            notification.icon ||
                            "bell"
                          }
                          size={18}
                        />
                      </span>

                      <span className="patient-notification-item__content">
                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        <p>
                          {
                            notification.message
                          }
                        </p>

                        {notification.time && (
                          <small>
                            {
                              notification.time
                            }
                          </small>
                        )}
                      </span>

                      {!notification.read && (
                        <span className="patient-notification-item__dot" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <div className="patient-notifications__footer">
            <PatientIcon
              name="shield"
              size={15}
            />

            <span>
              Secure patient notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;