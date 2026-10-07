import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { getAdminAlerts } from "../api";

import "./AdminNotificationCenter.css";

const READ_STORAGE_KEY =
  "dr_evans_admin_read_notifications";


/* =========================================================
   ICONS
   ========================================================= */

function NotificationIcon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "inventory") {
    return (
      <svg {...common}>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </svg>
    );
  }

  if (type === "order") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    );
  }

  if (type === "refill") {
    return (
      <svg {...common}>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 8A7 7 0 0 1 18 6l2 2" />
        <path d="M17.9 16A7 7 0 0 1 6 18l-2-2" />
      </svg>
    );
  }

  if (type === "support") {
    return (
      <svg {...common}>
        <path d="M4 5.5h16v11H8l-4 3z" />
        <path d="M8 9h8M8 12.5h5" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg {...common}>
        <path d="M12 3 2.8 20h18.4z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}


/* =========================================================
   NORMALIZE ALERT DATA
   ========================================================= */

function normalizeAlert(alert, index) {
  const source =
    alert && typeof alert === "object"
      ? alert
      : {
          message: String(alert ?? ""),
        };

  const title =
    source.title ||
    source.subject ||
    source.alert_title ||
    source.name ||
    source.type ||
    source.category ||
    "Pharmacy notification";

  const message =
    source.message ||
    source.description ||
    source.detail ||
    source.alert_message ||
    source.note ||
    source.text ||
    "";

  const rawType = String(
    source.type ||
      source.category ||
      source.alert_type ||
      `${title} ${message}`
  )
    .trim()
    .toLowerCase();

  let type = "system";

  if (
    rawType.includes("stock") ||
    rawType.includes("inventory") ||
    rawType.includes("medicine")
  ) {
    type = "inventory";
  } else if (
    rawType.includes("order") ||
    rawType.includes("sale") ||
    rawType.includes("purchase")
  ) {
    type = "order";
  } else if (
    rawType.includes("refill") ||
    rawType.includes("prescription")
  ) {
    type = "refill";
  } else if (
    rawType.includes("support") ||
    rawType.includes("ticket") ||
    rawType.includes("technical")
  ) {
    type = "support";
  } else if (
    rawType.includes("critical") ||
    rawType.includes("warning") ||
    rawType.includes("urgent") ||
    rawType.includes("low") ||
    rawType.includes("overdue")
  ) {
    type = "warning";
  }

  const id = String(
    source.id ??
      source.alert_id ??
      source.notification_id ??
      `${title}-${message}-${index}`
  );

  return {
    id,
    title: String(title),
    message: String(message),
    type,
    severity: String(
      source.severity ||
        source.priority ||
        source.level ||
        ""
    )
      .trim()
      .toLowerCase(),

    createdAt:
      source.created_at ||
      source.timestamp ||
      source.date ||
      source.createdAt ||
      "",

    raw: source,
  };
}


/* =========================================================
   EXTRACT ALERT ARRAY
   ========================================================= */

function extractNotifications(data) {
  const rawAlerts = Array.isArray(data)
    ? data
    : Array.isArray(data?.alerts)
      ? data.alerts
      : Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.items)
          ? data.items
          : [];

  return rawAlerts
    .map(normalizeAlert)
    .slice(0, 10);
}


/* =========================================================
   ROUTING
   ========================================================= */

function getNotificationRoute(notification) {
  const text =
    `${notification.type} ${notification.title} ${notification.message}`
      .toLowerCase();

  if (
    text.includes("support") ||
    text.includes("ticket") ||
    text.includes("technical")
  ) {
    return "/admin/support";
  }

  if (
    text.includes("stock") ||
    text.includes("inventory") ||
    text.includes("medicine")
  ) {
    return "/admin/inventory";
  }

  if (
    text.includes("purchase") ||
    text.includes("supplier")
  ) {
    return "/admin/purchases";
  }

  if (
    text.includes("sale") ||
    text.includes("payment") ||
    text.includes("transaction")
  ) {
    return "/admin/sales";
  }

  if (text.includes("order")) {
    return "/admin/pos";
  }

  if (
    text.includes("patient") ||
    text.includes("refill") ||
    text.includes("prescription") ||
    text.includes("appointment")
  ) {
    return "/admin/patients";
  }

  return "/admin/alerts";
}


/* =========================================================
   TIME FORMATTER
   ========================================================= */

function formatNotificationTime(value) {
  if (!value) {
    return "Recent";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const diff =
    Date.now() - date.getTime();

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (
    diff >= 0 &&
    diff < minute
  ) {
    return "Just now";
  }

  if (
    diff >= minute &&
    diff < hour
  ) {
    const minutes =
      Math.floor(
        diff / minute
      );

    return `${minutes} min ago`;
  }

  if (
    diff >= hour &&
    diff < day
  ) {
    const hours =
      Math.floor(
        diff / hour
      );

    return `${hours}h ago`;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
    }
  ).format(date);
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function readStoredIds() {
  try {
    const stored =
      JSON.parse(
        localStorage.getItem(
          READ_STORAGE_KEY
        ) || "[]"
      );

    return Array.isArray(stored)
      ? stored.map(String)
      : [];
  } catch {
    return [];
  }
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminNotificationCenter({
  initialCount = 0,
}) {
  const navigate =
    useNavigate();

  const wrapRef =
    useRef(null);

  const [open, setOpen] =
    useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    readIds,
    setReadIds,
  ] = useState(
    readStoredIds
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     MANUAL LOAD
     Used when the user opens/retries the notification inbox.
     This is allowed to set loading immediately because it is
     called from an event handler, not from an effect.
     ======================================================= */

  const loadNotifications =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await getAdminAlerts();

          setNotifications(
            extractNotifications(
              data
            )
          );
        } catch (err) {
          console.error(
            "Unable to load notifications:",
            err
          );

          setError(
            "Notifications could not be loaded."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  /* =======================================================
     BACKGROUND POLLING

     IMPORTANT:
     This function does NOT synchronously call setState before
     the awaited API request.

     That fixes:
     "Calling setState synchronously within an effect..."
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function pollNotifications() {
      try {
        const data =
          await getAdminAlerts();

        if (cancelled) {
          return;
        }

        setNotifications(
          extractNotifications(
            data
          )
        );

        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Unable to refresh notifications:",
          err
        );
      }
    }

    /*
     * Start the first API request.
     * No synchronous setState occurs here.
     */
    pollNotifications();

    const timer =
      window.setInterval(
        pollNotifications,
        60000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        timer
      );
    };
  }, []);


  /* =======================================================
     CLICK OUTSIDE
     ======================================================= */

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  /* =======================================================
     UNREAD COUNT
     ======================================================= */

  const unreadCount =
    useMemo(
      () => {
        if (
          notifications.length ===
          0
        ) {
          const fallback =
            Number(
              initialCount
            );

          return Number.isFinite(
            fallback
          )
            ? fallback
            : 0;
        }

        return notifications.filter(
          (item) =>
            !readIds.includes(
              item.id
            )
        ).length;
      },
      [
        notifications,
        readIds,
        initialCount,
      ]
    );


  /* =======================================================
     READ STATE
     ======================================================= */

  function saveReadIds(ids) {
    const next = [
      ...new Set(
        ids.map(String)
      ),
    ];

    setReadIds(next);

    localStorage.setItem(
      READ_STORAGE_KEY,
      JSON.stringify(next)
    );
  }


  function markRead(id) {
    if (
      readIds.includes(id)
    ) {
      return;
    }

    saveReadIds([
      ...readIds,
      id,
    ]);
  }


  function markAllRead() {
    saveReadIds([
      ...readIds,
      ...notifications.map(
        (item) =>
          item.id
      ),
    ]);
  }


  /* =======================================================
     NAVIGATION
     ======================================================= */

  function openNotification(item) {
    markRead(
      item.id
    );

    setOpen(false);

    navigate(
      getNotificationRoute(
        item
      )
    );
  }


  function openAllAlerts() {
    setOpen(false);

    navigate(
      "/admin/alerts"
    );
  }


  /* =======================================================
     BELL CLICK
     ======================================================= */

  function handleBellClick() {
    const nextOpen =
      !open;

    setOpen(nextOpen);

    if (nextOpen) {
      loadNotifications();
    }
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className="admin-notification-center"
      ref={wrapRef}
    >
      {/* ===================================================
          NOTIFICATION INBOX BUTTON
          =================================================== */}

      <button
        type="button"
        className={`admin-notification-trigger ${
          open
            ? "is-open"
            : ""
        }`}
        onClick={
          handleBellClick
        }
        aria-label={
          unreadCount > 0
            ? `Open notification inbox. ${unreadCount} unread notifications.`
            : "Open notification inbox"
        }
        aria-expanded={open}
      >
        <span className="admin-notification-trigger__icon">
          <BellIcon />
        </span>

        {unreadCount > 0 && (
          <span className="admin-notification-dot">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>


      {/* ===================================================
          NOTIFICATION POPOVER
          =================================================== */}

      {open && (
        <div className="admin-notification-popover">
          {/* ===============================================
              HEADER
              =============================================== */}

          <div className="admin-notification-header">
            <div className="admin-notification-header__main">
              <span className="admin-notification-header__icon">
                <BellIcon />
              </span>

              <div>
                <span className="admin-notification-eyebrow">
                  Notification Inbox
                </span>

                <h3>
                  Notifications
                </h3>

                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1
                          ? ""
                          : "s"
                      }`
                    : "You're all caught up"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="admin-notification-close"
              onClick={() =>
                setOpen(false)
              }
              aria-label="Close notifications"
            >
              <CloseIcon />
            </button>
          </div>


          {/* ===============================================
              TOOLBAR
              =============================================== */}

          <div className="admin-notification-toolbar">
            <div>
              <span className="admin-notification-toolbar__pulse" />

              <span>
                Recent pharmacy activity
              </span>
            </div>

            {notifications.length >
              0 &&
              unreadCount >
                0 && (
                <button
                  type="button"
                  onClick={
                    markAllRead
                  }
                >
                  Mark all read
                </button>
              )}
          </div>


          {/* ===============================================
              CONTENT
              =============================================== */}

          <div className="admin-notification-list">
            {loading &&
              notifications.length ===
                0 && (
                <div className="admin-notification-state">
                  <span className="admin-notification-loader" />

                  <strong>
                    Loading notifications
                  </strong>

                  <small>
                    Checking recent pharmacy activity...
                  </small>
                </div>
              )}


            {!loading &&
              error &&
              notifications.length ===
                0 && (
                <div className="admin-notification-state">
                  <span className="admin-notification-state-icon admin-notification-state-icon--error">
                    <NotificationIcon
                      type="warning"
                    />
                  </span>

                  <strong>
                    Unable to load notifications
                  </strong>

                  <small>
                    {error}
                  </small>

                  <button
                    type="button"
                    onClick={
                      loadNotifications
                    }
                  >
                    Try again
                  </button>
                </div>
              )}


            {!loading &&
              !error &&
              notifications.length ===
                0 && (
                <div className="admin-notification-state">
                  <span className="admin-notification-empty-icon">
                    <BellIcon />
                  </span>

                  <strong>
                    No new notifications
                  </strong>

                  <small>
                    New pharmacy activity will appear here.
                  </small>
                </div>
              )}


            {notifications.map(
              (item) => {
                const unread =
                  !readIds.includes(
                    item.id
                  );

                return (
                  <button
                    type="button"
                    className={`admin-notification-item ${
                      unread
                        ? "is-unread"
                        : ""
                    }`}
                    key={item.id}
                    onClick={() =>
                      openNotification(
                        item
                      )
                    }
                  >
                    <span
                      className={`admin-notification-type admin-notification-type--${item.type}`}
                    >
                      <NotificationIcon
                        type={
                          item.type
                        }
                      />
                    </span>

                    <span className="admin-notification-copy">
                      <span className="admin-notification-title-row">
                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        {unread && (
                          <span className="admin-notification-unread-dot" />
                        )}
                      </span>

                      {item.message && (
                        <span className="admin-notification-message">
                          {
                            item.message
                          }
                        </span>
                      )}

                      <span className="admin-notification-time">
                        {formatNotificationTime(
                          item.createdAt
                        )}
                      </span>
                    </span>

                    <span className="admin-notification-item-arrow">
                      <ArrowIcon />
                    </span>
                  </button>
                );
              }
            )}
          </div>


          {/* ===============================================
              FOOTER
              =============================================== */}

          <button
            type="button"
            className="admin-notification-footer"
            onClick={
              openAllAlerts
            }
          >
            <span>
              Open Alerts Centre
            </span>

            <ArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}