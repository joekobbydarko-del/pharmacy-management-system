import {
  useEffect,
  useState,
} from "react";

import PatientIcon from "./PatientIcon";

import {
  clearUserNotifications,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api";

import "./Notifications.css";


function Notifications() {
  const userId =
    localStorage.getItem(
      "user_id"
    );


  const [
    open,
    setOpen,
  ] = useState(false);


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }


    const date =
      new Date(createdAt);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }


    return new Intl.DateTimeFormat(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  };


  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;


    const loadNotifications =
      async () => {
        if (!userId) {
          if (!cancelled) {
            setNotifications([]);
            setLoading(false);
          }

          return;
        }


        try {
          const data =
            await getUserNotifications(
              userId
            );


          if (!cancelled) {
            setNotifications(
              Array.isArray(data)
                ? data
                : []
            );
          }
        } catch (error) {
          console.error(
            "Unable to load notifications:",
            error
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };


    /*
      Run initial loading asynchronously.

      This avoids React's warning about
      synchronously triggering state updates
      directly inside the effect.
    */

    const initialLoad =
      window.setTimeout(
        () => {
          loadNotifications();
        },
        0
      );


    const handleUpdate = () => {
      loadNotifications();
    };


    window.addEventListener(
      "patient-notifications-updated",
      handleUpdate
    );


    return () => {
      cancelled = true;

      window.clearTimeout(
        initialLoad
      );


      window.removeEventListener(
        "patient-notifications-updated",
        handleUpdate
      );
    };
  }, [userId]);


  /* =========================================================
     UNREAD COUNT
  ========================================================= */

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;


  /* =========================================================
     MARK ONE AS READ
  ========================================================= */

  const markAsRead =
    async (id) => {
      const notification =
        notifications.find(
          (item) =>
            item.id === id
        );


      if (
        !notification ||
        notification.read
      ) {
        return;
      }


      try {
        await markNotificationRead(
          id
        );


        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id === id
                  ? {
                      ...item,
                      read: true,
                    }
                  : item
            )
        );
      } catch (error) {
        console.error(
          "Unable to mark notification as read:",
          error
        );
      }
    };


  /* =========================================================
     MARK ALL AS READ
  ========================================================= */

  const markAllAsRead =
    async () => {
      if (!userId) {
        return;
      }


      try {
        await markAllNotificationsRead(
          userId
        );


        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Unable to mark all notifications as read:",
          error
        );
      }
    };


  /* =========================================================
     CLEAR ALL
  ========================================================= */

  const clearNotifications =
    async () => {
      if (!userId) {
        return;
      }


      try {
        await clearUserNotifications(
          userId
        );


        setNotifications([]);
      } catch (error) {
        console.error(
          "Unable to clear notifications:",
          error
        );
      }
    };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="patient-notifications">

      {/* BELL */}

      <button
        type="button"
        className="patient-notifications__trigger"
        onClick={() =>
          setOpen(
            (current) =>
              !current
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


      {/* DROPDOWN */}

      {open && (

        <div className="patient-notifications__menu">

          {/* HEADER */}

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


          {/* ACTIONS */}

          {notifications.length > 0 && (

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


          {/* BODY */}

          <div className="patient-notifications__body">

            {loading ? (

              <div className="patient-notifications__empty">

                <span className="patient-notifications__empty-icon">

                  <PatientIcon
                    name="bell"
                    size={25}
                  />

                </span>


                <h4>
                  Loading notifications
                </h4>


                <p>
                  Please wait while your
                  patient updates are
                  loaded.
                </p>

              </div>

            ) : notifications.length ===
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

                      {/* ICON */}

                      <span className="patient-notification-item__icon">

                        <PatientIcon
                          name={
                            notification.icon ||
                            "bell"
                          }
                          size={18}
                        />

                      </span>


                      {/* CONTENT */}

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


                        {notification.created_at && (

                          <small>

                            {formatTime(
                              notification.created_at
                            )}

                          </small>

                        )}

                      </span>


                      {/* UNREAD DOT */}

                      {!notification.read && (

                        <span className="patient-notification-item__dot" />

                      )}

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* FOOTER */}

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