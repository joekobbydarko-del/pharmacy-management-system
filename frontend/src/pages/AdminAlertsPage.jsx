import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clinicallyDeclineAdminRefill,
  getAdminAlerts,
  rescheduleAdminRefill,
  reviewAdminRefill,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminAlertsPage.css";


/* =========================================================
   ICONS
   ========================================================= */

function AlertIcon({
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
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),

    warning: (
      <>
        <path d="M12 3 2.8 20h18.4Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    critical: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 17h.01" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),

    sale: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-8" />
        <path d="M22 20H2" />
      </>
    ),

    purchase: (
      <>
        <path d="M4 5h16l-2 9H7Z" />
        <path d="M7 14 5 3H2" />
        <circle cx="9" cy="19" r="1" />
        <circle cx="17" cy="19" r="1" />
      </>
    ),

    stock: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
        <path d="M12 11v10" />
      </>
    ),

    refill: (
      <>
        <path d="M4 12a8 8 0 1 0 3-6" />
        <path d="M4 4v5h5" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </>
    ),

    appointment: (
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
        <path d="M9 14h6" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    pulse: (
      <>
        <path d="M3 12h4l2-5 4 10 2-5h6" />
      </>
    ),

    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),

    review: (
      <>
        <path d="M4 19.5V5a2 2 0 0 1 2-2h9l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.info}
    </svg>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeAlertText(
  alert
) {
  return `
    ${alert?.type || ""}
    ${alert?.title || ""}
    ${alert?.message || ""}
    ${alert?.refill_status || ""}
  `
    .toLowerCase()
    .trim();
}


function getAlertCategory(
  alert
) {
  const text =
    normalizeAlertText(
      alert
    );

  const refillStatus =
    String(
      alert?.refill_status ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    refillStatus ===
      "missed / expired" ||
    text.includes(
      "missed / expired"
    ) ||
    (
      text.includes(
        "missed"
      ) &&
      text.includes(
        "refill"
      )
    ) ||
    (
      text.includes(
        "expired"
      ) &&
      text.includes(
        "refill"
      )
    )
  ) {
    return "missed";
  }

  if (
    refillStatus ===
      "overdue" ||
    text.includes(
      "overdue"
    )
  ) {
    return "overdue";
  }

  if (
    refillStatus ===
      "due today" ||
    text.includes(
      "due today"
    )
  ) {
    return "today";
  }

  if (
    alert?.severity ===
      "critical" ||
    alert?.severity ===
      "warning"
  ) {
    return "action";
  }

  return "activity";
}


function getSeverity(
  alert
) {
  const category =
    getAlertCategory(
      alert
    );

  if (
    category ===
      "missed" ||
    category ===
      "overdue"
  ) {
    return "critical";
  }

  if (
    category ===
    "today"
  ) {
    return "warning";
  }

  return (
    alert?.severity ||
    "info"
  );
}


function getAlertIcon(
  alert
) {
  const text =
    normalizeAlertText(
      alert
    );

  if (
    text.includes(
      "missed"
    ) ||
    text.includes(
      "expired"
    )
  ) {
    return "review";
  }

  if (
    text.includes(
      "refill"
    )
  ) {
    return "refill";
  }

  if (
    text.includes(
      "appointment"
    )
  ) {
    return "appointment";
  }

  if (
    text.includes(
      "stock"
    ) ||
    text.includes(
      "inventory"
    ) ||
    text.includes(
      "reorder"
    )
  ) {
    return "stock";
  }

  if (
    text.includes(
      "purchase"
    ) ||
    text.includes(
      "supplier"
    )
  ) {
    return "purchase";
  }

  if (
    text.includes(
      "sale"
    ) ||
    text.includes(
      "dispens"
    )
  ) {
    return "sale";
  }

  if (
    alert?.severity ===
    "critical"
  ) {
    return "critical";
  }

  if (
    alert?.severity ===
    "warning"
  ) {
    return "warning";
  }

  return "info";
}


function formatAlertDate(
  value
) {
  if (!value) {
    return "";
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return String(
      value
    );
  }

  return parsed.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function formatAlertType(
  value
) {
  const text =
    String(
      value || ""
    )
      .trim()
      .replace(
        /[_-]+/g,
        " "
      );

  if (!text) {
    return "System";
  }

  return text
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}


function getReferenceValue(
  alert
) {
  return (
    alert?.purchase_id ||
    alert?.order_id ||
    alert?.refill_id ||
    alert?.appointment_id ||
    alert?.drug_id ||
    ""
  );
}


function getReferenceLabel(
  alert
) {
  if (
    alert?.purchase_id
  ) {
    return "Purchase ID";
  }

  if (
    alert?.order_id
  ) {
    return "Order ID";
  }

  if (
    alert?.refill_id
  ) {
    return "Refill ID";
  }

  if (
    alert?.appointment_id
  ) {
    return "Appointment ID";
  }

  if (
    alert?.drug_id
  ) {
    return "Drug ID";
  }

  return "Reference";
}


function todayDateInputValue() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


function getAlertKey(
  alert
) {
  if (!alert) {
    return "closed";
  }

  return [
    alert.type ||
      "alert",

    alert.refill_id ||
      alert.order_id ||
      alert.purchase_id ||
      alert.appointment_id ||
      alert.drug_id ||
      "",

    alert.created_at ||
      "",

    alert.title ||
      "",
  ].join("-");
}


/* =========================================================
   KPI
   ========================================================= */

function AlertStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={
        `admin-alert-stat admin-alert-stat--${tone}`
      }
    >
      <span
        className="admin-alert-stat-accent"
      />

      <div
        className="admin-alert-stat-icon"
      >
        <AlertIcon
          name={icon}
          size={22}
        />
      </div>

      <div
        className="admin-alert-stat-copy"
      >
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


/* =========================================================
   ALERT ITEM
   ========================================================= */

function AlertItem({
  alert,
  onOpenDetails,
}) {
  const severity =
    getSeverity(
      alert
    );

  const category =
    getAlertCategory(
      alert
    );

  const isInfo =
    severity ===
    "info";

  const isMissed =
    category ===
    "missed";

  return (
    <article
      className={
        `admin-alert-item admin-alert-item--${severity}`
      }
    >
      <span
        className="admin-alert-item-accent"
      />

      <div
        className={
          `admin-alert-icon admin-alert-icon--${severity}`
        }
      >
        <AlertIcon
          name={
            getAlertIcon(
              alert
            )
          }
          size={21}
        />
      </div>

      <div
        className="admin-alert-content"
      >
        <div
          className="admin-alert-title-row"
        >
          <div>
            <strong>
              {
                alert.title ||
                "System Notification"
              }
            </strong>

            {
              alert.created_at && (
                <small>
                  {
                    formatAlertDate(
                      alert.created_at
                    )
                  }
                </small>
              )
            }
          </div>

          {
            isMissed
              ? (
                <button
                  type="button"
                  className="admin-alert-badge admin-alert-badge--critical"
                  onClick={() =>
                    onOpenDetails(
                      alert
                    )
                  }
                  style={{
                    cursor:
                      "pointer",

                    fontFamily:
                      "inherit",
                  }}
                >
                  Review
                </button>
              )
              : isInfo
                ? (
                  <button
                    type="button"
                    className="admin-alert-badge admin-alert-badge--info"
                    onClick={() =>
                      onOpenDetails(
                        alert
                      )
                    }
                    style={{
                      cursor:
                        "pointer",

                      fontFamily:
                        "inherit",
                    }}
                  >
                    Info
                  </button>
                )
                : (
                  <span
                    className={
                      `admin-alert-badge admin-alert-badge--${severity}`
                    }
                  >
                    {severity}
                  </span>
                )
          }
        </div>

        <p>
          {alert.message}
        </p>
      </div>
    </article>
  );
}


/* =========================================================
   ALERT SECTION
   ========================================================= */

function AlertSection({
  tone,
  icon,
  eyebrow,
  title,
  subtitle,
  alerts,
  emptyTitle,
  emptyText,
  onOpenDetails,
}) {
  return (
    <section
      className={
        `admin-alerts-card admin-alerts-card--${tone}`
      }
    >
      <div
        className="admin-alerts-card-header"
      >
        <div
          className="admin-alerts-card-heading"
        >
          <div
            className="admin-alerts-card-icon"
          >
            <AlertIcon
              name={icon}
              size={21}
            />
          </div>

          <div>
            <span>
              {eyebrow}
            </span>

            <h2>
              {title}
            </h2>

            <p>
              {subtitle}
            </p>
          </div>
        </div>

        <div
          className="admin-alerts-count"
        >
          <AlertIcon
            name={icon}
            size={14}
          />

          <span>
            {alerts.length}
          </span>
        </div>
      </div>

      <div
        className="admin-alerts-list"
      >
        {
          alerts.length === 0
            ? (
              <div
                className="admin-alerts-empty"
              >
                <div
                  className="admin-alerts-empty-icon"
                >
                  <AlertIcon
                    name="check"
                    size={27}
                  />
                </div>

                <strong>
                  {emptyTitle}
                </strong>

                <span>
                  {emptyText}
                </span>
              </div>
            )
            : (
              alerts.map(
                (
                  alert,
                  index
                ) => (
                  <AlertItem
                    key={
                      `${getAlertKey(alert)}-${index}`
                    }
                    alert={
                      alert
                    }
                    onOpenDetails={
                      onOpenDetails
                    }
                  />
                )
              )
            )
        }
      </div>
    </section>
  );
}


/* =========================================================
   MODAL STYLES
   ========================================================= */

const modalStyles = {
  overlay: {
    position:
      "fixed",

    inset:
      0,

    zIndex:
      9999,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      "22px",

    background:
      "rgba(3, 14, 27, 0.76)",

    backdropFilter:
      "blur(8px)",
  },

  modal: {
    width:
      "min(640px, 100%)",

    maxHeight:
      "90vh",

    overflowY:
      "auto",

    scrollbarWidth:
      "none",

    border:
      "1px solid #39766c",

    borderRadius:
      "20px",

    background:
      "linear-gradient(180deg, #184d42 0%, #123f38 100%)",

    boxShadow:
      "0 28px 70px rgba(0, 0, 0, 0.42)",

    color:
      "#f4fbfc",
  },

  header: {
    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      "16px",

    padding:
      "20px 22px",

    borderBottom:
      "1px solid #36776a",

    background:
      "linear-gradient(110deg, #1b5a4d 0%, #174c43 58%, #14443d 100%)",
  },

  body: {
    padding:
      "20px 22px 22px",
  },

  closeButton: {
    width:
      "42px",

    height:
      "42px",

    flex:
      "0 0 42px",

    display:
      "grid",

    placeItems:
      "center",

    border:
      "1px solid #39766c",

    borderRadius:
      "12px",

    background:
      "#103c37",

    color:
      "#d8e8eb",

    cursor:
      "pointer",
  },

  infoCard: {
    padding:
      "14px 15px",

    border:
      "1px solid #39766c",

    borderRadius:
      "13px",

    background:
      "#195249",
  },

  input: {
    width:
      "100%",

    minHeight:
      "46px",

    boxSizing:
      "border-box",

    border:
      "1px solid #39766c",

    borderRadius:
      "11px",

    outline:
      "none",

    background:
      "#103c37",

    color:
      "#ffffff",

    padding:
      "11px 13px",

    fontFamily:
      "inherit",

    fontSize:
      "13px",

    fontWeight:
      700,
  },

  textarea: {
    width:
      "100%",

    minHeight:
      "105px",

    resize:
      "vertical",

    boxSizing:
      "border-box",

    border:
      "1px solid #39766c",

    borderRadius:
      "11px",

    outline:
      "none",

    background:
      "#103c37",

    color:
      "#ffffff",

    padding:
      "12px 13px",

    fontFamily:
      "inherit",

    fontSize:
      "13px",

    lineHeight:
      1.5,
  },

  label: {
    display:
      "block",

    marginBottom:
      "7px",

    color:
      "#b4d0cb",

    fontSize:
      "11px",

    fontWeight:
      900,

    letterSpacing:
      "0.6px",

    textTransform:
      "uppercase",
  },

  primaryButton: {
    minHeight:
      "45px",

    border:
      "1px solid #168f89",

    borderRadius:
      "11px",

    background:
      "linear-gradient(135deg, #087f7a, #18aaa5)",

    color:
      "#ffffff",

    padding:
      "10px 16px",

    fontFamily:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  dangerButton: {
    minHeight:
      "45px",

    border:
      "1px solid rgba(255, 126, 126, 0.45)",

    borderRadius:
      "11px",

    background:
      "rgba(180, 55, 55, 0.28)",

    color:
      "#ffd0d0",

    padding:
      "10px 16px",

    fontFamily:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      900,

    cursor:
      "pointer",
  },

  secondaryButton: {
    minHeight:
      "45px",

    border:
      "1px solid #39766c",

    borderRadius:
      "11px",

    background:
      "#103c37",

    color:
      "#dceeed",

    padding:
      "10px 16px",

    fontFamily:
      "inherit",

    fontSize:
      "12px",

    fontWeight:
      900,

    cursor:
      "pointer",
  },
};


/* =========================================================
   MODAL
   ========================================================= */

function NotificationDetailsModal({
  alert,
  onClose,
  onResolved,
}) {
  const [
    actionMode,
    setActionMode,
  ] = useState("");

  const [
    reviewNote,
    setReviewNote,
  ] = useState("");

  const [
    newRefillDate,
    setNewRefillDate,
  ] = useState("");

  const [
    clinicalReason,
    setClinicalReason,
  ] = useState("");

  const [
    clinicalNote,
    setClinicalNote,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState("");


  if (!alert) {
    return null;
  }


  const severity =
    getSeverity(
      alert
    );

  const category =
    getAlertCategory(
      alert
    );

  const isMissed =
    category ===
    "missed";

  const refillId =
    String(
      alert.refill_id ||
      ""
    ).trim();

  const reference =
    getReferenceValue(
      alert
    );

  const referenceLabel =
    getReferenceLabel(
      alert
    );


  const rows = [
    {
      label:
        "Notification",

      value:
        alert.title ||
        "System Notification",
    },

    {
      label:
        "Category",

      value:
        formatAlertType(
          alert.type
        ),
    },

    {
      label:
        "Severity",

      value:
        formatAlertType(
          severity
        ),
    },

    alert.refill_status
      ? {
          label:
            "Refill Status",

          value:
            alert.refill_status,
        }
      : null,

    alert.days_late !==
      undefined
      ? {
          label:
            "Days Late",

          value:
            String(
              alert.days_late
            ),
        }
      : null,

    alert.created_at
      ? {
          label:
            "Date / Time",

          value:
            formatAlertDate(
              alert.created_at
            ),
        }
      : null,

    reference
      ? {
          label:
            referenceLabel,

          value:
            reference,
        }
      : null,

    alert.patient_id
      ? {
          label:
            "Patient ID",

          value:
            alert.patient_id,
        }
      : null,

    alert.patient_name
      ? {
          label:
            "Patient",

          value:
            alert.patient_name,
        }
      : null,

    alert.drug_id
      ? {
          label:
            "Drug ID",

          value:
            alert.drug_id,
        }
      : null,

    alert.drug_name
      ? {
          label:
            "Medication",

          value:
            alert.drug_name,
        }
      : null,

    alert.next_refill_date
      ? {
          label:
            "Expected Refill",

          value:
            formatAlertDate(
              alert.next_refill_date
            ),
        }
      : null,

    alert.pharmacist_note
      ? {
          label:
            "Review Note",

          value:
            alert.pharmacist_note,
        }
      : null,

    alert.resolution_reason
      ? {
          label:
            "Resolution Reason",

          value:
            alert.resolution_reason,
        }
      : null,
  ].filter(Boolean);


  async function completeAction(
    request,
    successMessage,
    closeWhenDone
  ) {
    if (
      submitting
    ) {
      return;
    }

    setSubmitting(
      true
    );

    setActionError(
      ""
    );

    setActionSuccess(
      ""
    );

    try {
      const response =
        await request();

      setActionSuccess(
        response?.message ||
        successMessage
      );

      await onResolved();

      if (
        closeWhenDone
      ) {
        onClose();
      }

    } catch (error) {
      setActionError(
        error?.message ||
        "Unable to complete refill action."
      );

    } finally {
      setSubmitting(
        false
      );
    }
  }


  async function handleSaveReview() {
    const note =
      reviewNote.trim();

    if (!note) {
      setActionError(
        "Enter a pharmacist review note first."
      );

      return;
    }

    await completeAction(
      () =>
        reviewAdminRefill(
          refillId,
          note
        ),

      "Review note saved successfully.",

      false
    );
  }


  async function handleReschedule() {
    const dateValue =
      newRefillDate.trim();

    const note =
      reviewNote.trim();

    if (!dateValue) {
      setActionError(
        "Select a new refill date."
      );

      return;
    }

    if (!note) {
      setActionError(
        "Enter a reason or pharmacist note for the reschedule."
      );

      return;
    }

    await completeAction(
      () =>
        rescheduleAdminRefill(
          refillId,
          dateValue,
          note
        ),

      "Refill rescheduled successfully.",

      true
    );
  }


  async function handleClinicalDecline() {
    const reason =
      clinicalReason.trim();

    const note =
      clinicalNote.trim();

    if (!reason) {
      setActionError(
        "Enter the clinical reason for declining this refill."
      );

      return;
    }

    await completeAction(
      () =>
        clinicallyDeclineAdminRefill(
          refillId,
          reason,
          note
        ),

      "Clinical decline recorded successfully.",

      true
    );
  }


  return (
    <div
      role="presentation"
      style={
        modalStyles.overlay
      }
      onMouseDown={
        (event) => {
          if (
            event.target ===
              event.currentTarget &&
            !submitting
          ) {
            onClose();
          }
        }
      }
    >
      <section
        role="dialog"
        aria-modal="true"
        style={
          modalStyles.modal
        }
      >
        <div
          style={{
            ...modalStyles.header,

            background:
              isMissed
                ? "linear-gradient(110deg, #6b3434 0%, #503333 58%, #3d2c2c 100%)"
                : modalStyles.header.background,
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "13px",
            }}
          >
            <div
              style={{
                width:
                  "48px",

                height:
                  "48px",

                display:
                  "grid",

                placeItems:
                  "center",

                border:
                  "1px solid rgba(255,255,255,0.14)",

                borderRadius:
                  "14px",

                background:
                  "rgba(255,255,255,0.08)",

                color:
                  isMissed
                    ? "#ffb0b0"
                    : "#93c7ef",
              }}
            >
              <AlertIcon
                name={
                  getAlertIcon(
                    alert
                  )
                }
                size={22}
              />
            </div>

            <div>
              <span
                style={{
                  display:
                    "block",

                  marginBottom:
                    "4px",

                  color:
                    isMissed
                      ? "#ffb0b0"
                      : "#93c7ef",

                  fontSize:
                    "11px",

                  fontWeight:
                    900,

                  textTransform:
                    "uppercase",
                }}
              >
                {
                  isMissed
                    ? "Pharmacist Review Required"
                    : "Notification Details"
                }
              </span>

              <h2
                style={{
                  margin:
                    0,

                  color:
                    "#ffffff",

                  fontSize:
                    "22px",

                  fontWeight:
                    900,
                }}
              >
                {
                  alert.title ||
                  "System Notification"
                }
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              submitting
            }
            style={
              modalStyles.closeButton
            }
          >
            <AlertIcon
              name="close"
              size={20}
            />
          </button>
        </div>


        <div
          style={
            modalStyles.body
          }
        >
          <div
            style={{
              ...modalStyles.infoCard,

              marginBottom:
                "16px",
            }}
          >
            <span
              style={{
                display:
                  "block",

                marginBottom:
                  "5px",

                color:
                  "#a9c8c2",

                fontSize:
                  "11px",

                fontWeight:
                  900,

                textTransform:
                  "uppercase",
              }}
            >
              Summary
            </span>

            <p
              style={{
                margin:
                  0,

                color:
                  "#ffffff",

                fontSize:
                  "13px",

                fontWeight:
                  700,

                lineHeight:
                  1.55,
              }}
            >
              {
                alert.message ||
                "No additional information is available."
              }
            </p>
          </div>


          <div
            style={{
              display:
                "grid",

              gap:
                "8px",
            }}
          >
            {
              rows.map(
                (
                  row,
                  index
                ) => (
                  <div
                    key={
                      `${row.label}-${index}`
                    }
                    style={{
                      ...modalStyles.infoCard,

                      display:
                        "grid",

                      gridTemplateColumns:
                        "145px minmax(0, 1fr)",

                      gap:
                        "12px",

                      alignItems:
                        "center",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#a9c8c2",

                        fontSize:
                          "10px",

                        fontWeight:
                          900,

                        textTransform:
                          "uppercase",
                      }}
                    >
                      {row.label}
                    </span>

                    <strong
                      style={{
                        color:
                          "#ffffff",

                        fontSize:
                          "12px",

                        textAlign:
                          "right",
                      }}
                    >
                      {row.value}
                    </strong>
                  </div>
                )
              )
            }
          </div>


          {
            isMissed && (
              <div
                style={{
                  marginTop:
                    "20px",

                  paddingTop:
                    "18px",

                  borderTop:
                    "1px solid #39766c",
                }}
              >
                <span
                  style={{
                    display:
                      "block",

                    color:
                      "#ffb0b0",

                    fontSize:
                      "11px",

                    fontWeight:
                      900,

                    textTransform:
                      "uppercase",
                  }}
                >
                  Resolve Refill
                </span>

                <h3
                  style={{
                    margin:
                      "4px 0 13px",

                    color:
                      "#ffffff",

                    fontSize:
                      "17px",

                    fontWeight:
                      900,
                  }}
                >
                  Choose the pharmacist action
                </h3>


                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",

                    gap:
                      "9px",

                    marginBottom:
                      "16px",
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() => {
                      setActionMode(
                        "review"
                      );

                      setActionError(
                        ""
                      );

                      setActionSuccess(
                        ""
                      );
                    }}
                    style={
                      actionMode ===
                      "review"
                        ? modalStyles.primaryButton
                        : modalStyles.secondaryButton
                    }
                  >
                    Save Review Note
                  </button>


                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() => {
                      setActionMode(
                        "reschedule"
                      );

                      setActionError(
                        ""
                      );

                      setActionSuccess(
                        ""
                      );
                    }}
                    style={
                      actionMode ===
                      "reschedule"
                        ? modalStyles.primaryButton
                        : modalStyles.secondaryButton
                    }
                  >
                    Reschedule
                  </button>


                  <button
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() => {
                      setActionMode(
                        "clinical-decline"
                      );

                      setActionError(
                        ""
                      );

                      setActionSuccess(
                        ""
                      );
                    }}
                    style={
                      actionMode ===
                      "clinical-decline"
                        ? modalStyles.dangerButton
                        : modalStyles.secondaryButton
                    }
                  >
                    Clinically Declined
                  </button>
                </div>


                {
                  actionMode ===
                    "review" && (
                    <div>
                      <label
                        style={
                          modalStyles.label
                        }
                      >
                        Pharmacist Review Note
                      </label>

                      <textarea
                        value={
                          reviewNote
                        }
                        onChange={
                          (event) =>
                            setReviewNote(
                              event.target.value
                            )
                        }
                        placeholder="Enter the pharmacist's review note..."
                        style={
                          modalStyles.textarea
                        }
                      />

                      <button
                        type="button"
                        onClick={
                          handleSaveReview
                        }
                        disabled={
                          submitting
                        }
                        style={{
                          ...modalStyles.primaryButton,

                          width:
                            "100%",

                          marginTop:
                            "10px",
                        }}
                      >
                        {
                          submitting
                            ? "Saving..."
                            : "Save Review Note"
                        }
                      </button>

                      <p
                        style={{
                          margin:
                            "9px 0 0",

                          color:
                            "#abc9c4",

                          fontSize:
                            "11px",
                        }}
                      >
                        Saving a review note does not close the alert.
                        A final action is still required.
                      </p>
                    </div>
                  )
                }


                {
                  actionMode ===
                    "reschedule" && (
                    <div>
                      <div
                        style={{
                          marginBottom:
                            "12px",
                        }}
                      >
                        <label
                          style={
                            modalStyles.label
                          }
                        >
                          New Refill Date
                        </label>

                        <input
                          type="date"
                          min={
                            todayDateInputValue()
                          }
                          value={
                            newRefillDate
                          }
                          onChange={
                            (event) =>
                              setNewRefillDate(
                                event.target.value
                              )
                          }
                          style={
                            modalStyles.input
                          }
                        />
                      </div>

                      <label
                        style={
                          modalStyles.label
                        }
                      >
                        Reason / Pharmacist Note
                      </label>

                      <textarea
                        value={
                          reviewNote
                        }
                        onChange={
                          (event) =>
                            setReviewNote(
                              event.target.value
                            )
                        }
                        placeholder="Why is this refill being rescheduled?"
                        style={
                          modalStyles.textarea
                        }
                      />

                      <button
                        type="button"
                        onClick={
                          handleReschedule
                        }
                        disabled={
                          submitting
                        }
                        style={{
                          ...modalStyles.primaryButton,

                          width:
                            "100%",

                          marginTop:
                            "10px",
                        }}
                      >
                        {
                          submitting
                            ? "Rescheduling..."
                            : "Confirm Reschedule"
                        }
                      </button>
                    </div>
                  )
                }


                {
                  actionMode ===
                    "clinical-decline" && (
                    <div>
                      <div
                        style={{
                          marginBottom:
                            "10px",

                          padding:
                            "12px 13px",

                          border:
                            "1px solid rgba(255, 160, 160, 0.26)",

                          borderRadius:
                            "11px",

                          background:
                            "rgba(171, 58, 58, 0.13)",

                          color:
                            "#ffd4d4",

                          fontSize:
                            "12px",

                          lineHeight:
                            1.5,
                        }}
                      >
                        This records a decision made after review by the
                        responsible pharmacist or clinician.
                      </div>

                      <div
                        style={{
                          marginBottom:
                            "12px",
                        }}
                      >
                        <label
                          style={
                            modalStyles.label
                          }
                        >
                          Clinical Reason
                        </label>

                        <textarea
                          value={
                            clinicalReason
                          }
                          onChange={
                            (event) =>
                              setClinicalReason(
                                event.target.value
                              )
                          }
                          placeholder="Enter the clinical reason..."
                          style={
                            modalStyles.textarea
                          }
                        />
                      </div>

                      <label
                        style={
                          modalStyles.label
                        }
                      >
                        Additional Clinical Note
                      </label>

                      <textarea
                        value={
                          clinicalNote
                        }
                        onChange={
                          (event) =>
                            setClinicalNote(
                              event.target.value
                            )
                        }
                        placeholder="Optional additional note..."
                        style={
                          modalStyles.textarea
                        }
                      />

                      <button
                        type="button"
                        onClick={
                          handleClinicalDecline
                        }
                        disabled={
                          submitting
                        }
                        style={{
                          ...modalStyles.dangerButton,

                          width:
                            "100%",

                          marginTop:
                            "10px",
                        }}
                      >
                        {
                          submitting
                            ? "Recording..."
                            : "Confirm Clinical Decline"
                        }
                      </button>
                    </div>
                  )
                }


                {
                  actionError && (
                    <div
                      style={{
                        marginTop:
                          "12px",

                        padding:
                          "11px 13px",

                        border:
                          "1px solid rgba(255, 131, 131, 0.35)",

                        borderRadius:
                          "10px",

                        background:
                          "rgba(182, 52, 52, 0.18)",

                        color:
                          "#ffc9c9",

                        fontSize:
                          "12px",

                        fontWeight:
                          800,
                      }}
                    >
                      {actionError}
                    </div>
                  )
                }


                {
                  actionSuccess && (
                    <div
                      style={{
                        marginTop:
                          "12px",

                        padding:
                          "11px 13px",

                        border:
                          "1px solid rgba(98, 220, 178, 0.36)",

                        borderRadius:
                          "10px",

                        background:
                          "rgba(50, 147, 112, 0.18)",

                        color:
                          "#c7ffe9",

                        fontSize:
                          "12px",

                        fontWeight:
                          800,
                      }}
                    >
                      {actionSuccess}
                    </div>
                  )
                }
              </div>
            )
          }


          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              onClose
            }
            style={{
              ...modalStyles.secondaryButton,

              width:
                "100%",

              marginTop:
                "18px",
            }}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

function AdminAlertsPage() {
  const [
    alerts,
    setAlerts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    selectedAlert,
    setSelectedAlert,
  ] = useState(null);


  const loadAlerts =
    useCallback(
      async ({
        showLoading = false,
      } = {}) => {
        if (
          showLoading
        ) {
          setLoading(
            true
          );
        }

        try {
          const data =
            await getAdminAlerts();

          setAlerts(
            Array.isArray(
              data?.alerts
            )
              ? data.alerts
              : []
          );

          setError("");

        } catch (err) {
          setError(
            err?.message ||
            "Unable to load alerts."
          );

        } finally {
          if (
            showLoading
          ) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );


  useEffect(
    () => {
      let active =
        true;

      async function fetchAlerts() {
        try {
          const data =
            await getAdminAlerts();

          if (!active) {
            return;
          }

          setAlerts(
            Array.isArray(
              data?.alerts
            )
              ? data.alerts
              : []
          );

          setError("");

        } catch (err) {
          if (!active) {
            return;
          }

          setError(
            err?.message ||
            "Unable to load alerts."
          );

        } finally {
          if (
            active
          ) {
            setLoading(
              false
            );
          }
        }
      }

      fetchAlerts();

      return () => {
        active =
          false;
      };
    },
    []
  );


  useEffect(
    () => {
      if (
        !selectedAlert
      ) {
        return undefined;
      }

      function handleKeyDown(
        event
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setSelectedAlert(
            null
          );
        }
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        "hidden";

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      selectedAlert,
    ]
  );


  const handleRefillResolved =
    useCallback(
      async () => {
        await loadAlerts();

        setSuccessMessage(
          "Refill updated successfully. Active alert totals have been refreshed."
        );
      },
      [
        loadAlerts,
      ]
    );


  const groupedAlerts =
    useMemo(
      () => {
        const action =
          [];

        const today =
          [];

        const overdue =
          [];

        const missed =
          [];

        const activity =
          [];

        alerts.forEach(
          (alert) => {
            const category =
              getAlertCategory(
                alert
              );

            if (
              category ===
              "missed"
            ) {
              missed.push(
                alert
              );

              return;
            }

            if (
              category ===
              "overdue"
            ) {
              overdue.push(
                alert
              );

              return;
            }

            if (
              category ===
              "today"
            ) {
              today.push(
                alert
              );

              return;
            }

            if (
              category ===
              "action"
            ) {
              action.push(
                alert
              );

              return;
            }

            activity.push(
              alert
            );
          }
        );

        return {
          action,
          today,
          overdue,
          missed,
          activity,
        };
      },
      [
        alerts,
      ]
    );


  const attentionCount =
    groupedAlerts
      .action
      .length +
    groupedAlerts
      .today
      .length +
    groupedAlerts
      .overdue
      .length +
    groupedAlerts
      .missed
      .length;


  const warningCount =
    useMemo(
      () =>
        alerts.filter(
          (alert) =>
            getSeverity(
              alert
            ) ===
            "warning"
        ).length,
      [
        alerts,
      ]
    );


  const criticalCount =
    useMemo(
      () =>
        alerts.filter(
          (alert) =>
            getSeverity(
              alert
            ) ===
            "critical"
        ).length,
      [
        alerts,
      ]
    );


  if (
    loading
  ) {
    return (
      <div
        className="admin-alerts-page"
      >
        <div
          className="admin-alerts-loading"
        >
          <div
            className="admin-alerts-loading-icon"
          >
            <AlertIcon
              name="pulse"
              size={28}
            />
          </div>

          <strong>
            Monitoring Pharmacy Operations
          </strong>

          <span>
            Checking alerts, due items and system activity...
          </span>
        </div>
      </div>
    );
  }


  return (
    <>
      <div
        className="admin-alerts-page"
      >
        <AdminPageIntro
          eyebrow="Operational Monitoring"
          title="Alerts"
          subtitle="Prioritize pharmacy actions, due items and important operational notifications."
          accent="red"
        />


        {
          error && (
            <div
              className="admin-alerts-error"
            >
              <AlertIcon
                name="critical"
                size={18}
              />

              <span>
                {error}
              </span>
            </div>
          )
        }


        {
          successMessage && (
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "10px",

                marginBottom:
                  "16px",

                padding:
                  "13px 15px",

                border:
                  "1px solid rgba(87, 209, 167, 0.35)",

                borderRadius:
                  "12px",

                background:
                  "rgba(41, 132, 100, 0.16)",

                color:
                  "#caffea",

                fontSize:
                  "12px",

                fontWeight:
                  800,
              }}
            >
              <AlertIcon
                name="check"
                size={18}
              />

              <span>
                {successMessage}
              </span>
            </div>
          )
        }


        <section
          className="admin-alerts-stats"
        >
          <AlertStat
            tone="red"
            icon="critical"
            label="Action Required"
            value={
              attentionCount
            }
            note="Unresolved pharmacy alerts"
          />

          <AlertStat
            tone="orange"
            icon="clock"
            label="Due Today"
            value={
              groupedAlerts
                .today
                .length
            }
            note="Time-sensitive items"
          />

          <AlertStat
            tone="violet"
            icon="warning"
            label="Overdue"
            value={
              groupedAlerts
                .overdue
                .length
            }
            note="1–7 days late"
          />

          <AlertStat
            tone="red"
            icon="review"
            label="Missed / Expired"
            value={
              groupedAlerts
                .missed
                .length
            }
            note="Pharmacist review required"
          />

          <AlertStat
            tone="blue"
            icon="bell"
            label="Warnings"
            value={
              warningCount
            }
            note="Require monitoring"
          />

          <AlertStat
            tone="green"
            icon="critical"
            label="Critical"
            value={
              criticalCount
            }
            note="High-priority unresolved alerts"
          />
        </section>


        <section
          className="admin-alerts-command-grid"
        >
          <AlertSection
            tone="critical"
            icon="critical"
            eyebrow="Priority Queue"
            title="Action Required"
            subtitle="Warnings and critical pharmacy items requiring review."
            alerts={
              groupedAlerts.action
            }
            emptyTitle="No immediate action required"
            emptyText="There are no unresolved warning or critical alerts in this queue."
            onOpenDetails={
              setSelectedAlert
            }
          />

          <AlertSection
            tone="today"
            icon="appointment"
            eyebrow="Time Sensitive"
            title="Due Today"
            subtitle="Refills and appointments identified as due today."
            alerts={
              groupedAlerts.today
            }
            emptyTitle="Nothing due today"
            emptyText="No refill or appointment alerts are currently marked as due today."
            onOpenDetails={
              setSelectedAlert
            }
          />
        </section>


        <AlertSection
          tone="overdue"
          icon="refill"
          eyebrow="Follow-Up Queue"
          title="Overdue Items"
          subtitle="Refills and appointments that are 1–7 days late and still require follow-up."
          alerts={
            groupedAlerts.overdue
          }
          emptyTitle="No overdue items"
          emptyText="There are currently no active items between 1 and 7 days overdue."
          onOpenDetails={
            setSelectedAlert
          }
        />


        <AlertSection
          tone="critical"
          icon="review"
          eyebrow="Pharmacist Review Queue"
          title="Missed / Expired Refills"
          subtitle="Refills more than 7 days late. Review, reschedule or clinically decline after pharmacist review."
          alerts={
            groupedAlerts.missed
          }
          emptyTitle="No missed or expired refills"
          emptyText="There are currently no missed or expired refills waiting for pharmacist review."
          onOpenDetails={
            setSelectedAlert
          }
        />


        <AlertSection
          tone="activity"
          icon="pulse"
          eyebrow="Operational Activity"
          title="Recent Notifications"
          subtitle="Sales, purchases, stock activity and other pharmacy system updates."
          alerts={
            groupedAlerts.activity
          }
          emptyTitle="No recent notifications"
          emptyText="New system activity will appear here when available."
          onOpenDetails={
            setSelectedAlert
          }
        />
      </div>


      <NotificationDetailsModal
        key={
          getAlertKey(
            selectedAlert
          )
        }
        alert={
          selectedAlert
        }
        onClose={() =>
          setSelectedAlert(
            null
          )
        }
        onResolved={
          handleRefillResolved
        }
      />
    </>
  );
}


export default AdminAlertsPage;