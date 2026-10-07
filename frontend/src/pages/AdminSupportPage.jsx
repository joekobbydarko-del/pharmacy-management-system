import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminSupportPage.css";


const API_BASE =
  `http://${window.location.hostname}:8000`;


/* =========================================================
   ICONS
   ========================================================= */

function SupportIcon({
  name,
  size = 22,
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
    support: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M8.5 9a3.5 3.5 0 1 1 5.8 2.6c-1.2 1-2.3 1.4-2.3 3" />

        <path d="M12 18h.01" />
      </>
    ),

    ticket: (
      <>
        <path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4Z" />

        <path d="M13 8h3M13 12h3M13 16h2" />
      </>
    ),

    monitor: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
        />

        <path d="M8 21h8M12 17v4" />
      </>
    ),

    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),

    alert: (
      <>
        <path d="M12 3 2.5 20h19Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),

    category: (
      <>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </>
    ),

    priority: (
      <>
        <path d="M5 21V4" />
        <path d="M5 5h11l-2 4 2 4H5" />
      </>
    ),

    subject: (
      <>
        <path d="M4 5h16v14H4Z" />
        <path d="M7 9h10M7 13h7" />
      </>
    ),

    message: (
      <>
        <path d="M4 4h16v13H8l-4 4Z" />
        <path d="M8 8h8M8 12h6" />
      </>
    ),

    response: (
      <>
        <path d="M4 4h16v12H9l-5 5Z" />
        <path d="m9 10 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.support}
    </svg>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function cleanTicket(
  ticket
) {
  const rawSubject =
    String(
      ticket?.subject ||
        ""
    );

  const match =
    rawSubject.match(
      /^\[([^|]+)\|([^\]]+)\]\s*(.*)$/
    );

  return {
    ...ticket,

    category:
      match?.[1] ||
      "General",

    priority:
      match?.[2] ||
      "Normal",

    cleanSubject:
      match?.[3] ||
      rawSubject,

    status:
      String(
        ticket?.status ||
          "Pending"
      ),
  };
}


async function fetchSupportTickets(
  userId,
  token
) {
  if (!userId) {
    throw new Error(
      "Administrator account ID could not be found."
    );
  }

  const response =
    await fetch(
      `${API_BASE}/support-requests/${userId}`,
      {
        headers:
          token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {},
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        "Unable to load support requests."
    );
  }

  const rows =
    Array.isArray(data)
      ? data
      : data?.requests ||
        data?.support_requests ||
        [];

  return rows.map(
    cleanTicket
  );
}


function getStatusClass(
  value
) {
  return String(
    value ||
      "Pending"
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    );
}


function getPriorityClass(
  value
) {
  return String(
    value ||
      "Normal"
  )
    .trim()
    .toLowerCase();
}


/* =========================================================
   STAT CARD
   ========================================================= */

function SupportStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-support-stat admin-support-stat--${tone}`}
    >
      <span className="admin-support-stat-accent" />

      <div className="admin-support-stat-icon">
        <SupportIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-support-stat-copy">
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
   PAGE
   ========================================================= */

function AdminSupportPage() {
  const userId =
    Number(
      localStorage.getItem(
        "user_id"
      )
    );

  const token =
    localStorage.getItem(
      "access_token"
    ) ||
    localStorage.getItem(
      "token"
    ) ||
    "";


  const [
    tickets,
    setTickets,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState({
    category: "System",
    priority: "Normal",
    subject: "",
    message: "",
  });


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    let active = true;

    async function initialiseTickets() {
      try {
        const rows =
          await fetchSupportTickets(
            userId,
            token
          );

        if (!active) {
          return;
        }

        setTickets(
          rows
        );

        setError("");
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load support requests."
        );
      } finally {
        if (active) {
          setLoading(
            false
          );
        }
      }
    }

    initialiseTickets();

    return () => {
      active = false;
    };
  }, [
    token,
    userId,
  ]);


  /* =======================================================
     STATISTICS
     ======================================================= */

  const stats =
    useMemo(
      () => {
        const pending =
          tickets.filter(
            (
              ticket
            ) => {
              const status =
                ticket.status
                  .trim()
                  .toLowerCase();

              return (
                status ===
                  "pending" ||
                status ===
                  "open" ||
                status ===
                  "in progress"
              );
            }
          ).length;

        const resolved =
          tickets.filter(
            (
              ticket
            ) =>
              ticket.status
                .trim()
                .toLowerCase() ===
              "resolved"
          ).length;

        return {
          total:
            tickets.length,

          pending,

          resolved,
        };
      },
      [
        tickets,
      ]
    );


  /* =======================================================
     FORM
     ======================================================= */

  function updateField(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (
        current
      ) => ({
        ...current,

        [name]:
          value,
      })
    );

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }


  /* =======================================================
     SUBMIT SUPPORT REQUEST
     ======================================================= */

  async function submitTicket(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!userId) {
      setError(
        "Administrator account ID could not be found."
      );

      return;
    }

    const subject =
      form.subject.trim();

    const message =
      form.message.trim();

    if (!subject) {
      setError(
        "Enter a subject for the support request."
      );

      return;
    }

    if (!message) {
      setError(
        "Describe the problem before submitting."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      const storedSubject =
        `[${form.category}|${form.priority}] ${subject}`;

      const response =
        await fetch(
          `${API_BASE}/support-requests`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                user_id:
                  userId,

                subject:
                  storedSubject,

                message,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Support request could not be submitted."
        );
      }

      setForm({
        category:
          "System",

        priority:
          "Normal",

        subject:
          "",

        message:
          "",
      });

      const refreshedTickets =
        await fetchSupportTickets(
          userId,
          token
        );

      setTickets(
        refreshedTickets
      );

      setSuccess(
        "Support request submitted successfully."
      );
    } catch (err) {
      setError(
        err?.message ||
          "Support request could not be submitted."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }


  /* =======================================================
     UI
     ======================================================= */

  return (
    <section className="admin-support-page">
      <AdminPageIntro
        eyebrow="Administration Support"
        title="Technical Support"
        subtitle="Report system issues and follow technical support requests for Dr. Evans Pharmacy."
        accent="blue"
      />


      {/* ===================================================
          SUMMARY
          =================================================== */}

      <section className="admin-support-stats">
        <SupportStat
          tone="teal"
          icon="ticket"
          label="Total Requests"
          value={
            stats.total
          }
          note="All submitted tickets"
        />

        <SupportStat
          tone="orange"
          icon="history"
          label="Active Requests"
          value={
            stats.pending
          }
          note="Awaiting resolution"
        />

        <SupportStat
          tone="green"
          icon="check"
          label="Resolved"
          value={
            stats.resolved
          }
          note="Completed requests"
        />
      </section>


      {/* ===================================================
          MESSAGES
          =================================================== */}

      {error && (
        <div className="admin-support-message admin-support-message--error">
          <SupportIcon
            name="alert"
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}


      {success && (
        <div className="admin-support-message admin-support-message--success">
          <SupportIcon
            name="check"
            size={18}
          />

          <span>
            {success}
          </span>
        </div>
      )}


      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <section className="admin-support-layout">
        {/* ===============================================
            NEW REQUEST
            =============================================== */}

        <article className="admin-support-card admin-support-card--form">
          <div className="admin-support-card__heading">
            <div className="admin-support-card__heading-main">
              <span className="admin-support-card__icon">
                <SupportIcon
                  name="send"
                  size={21}
                />
              </span>

              <div>
                <small>
                  New Request
                </small>

                <h2>
                  Submit Support Ticket
                </h2>

                <p>
                  Send a technical issue directly to the support team.
                </p>
              </div>
            </div>

            <span className="admin-support-card__badge">
              Support
            </span>
          </div>


          <form
            className="admin-support-form"
            onSubmit={
              submitTicket
            }
          >
            <div className="admin-support-form__row">
              <label>
                <span>
                  Category
                </span>

                <div className="admin-support-field">
                  <SupportIcon
                    name="category"
                    size={16}
                  />

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      updateField
                    }
                  >
                    <option value="System">
                      System
                    </option>

                    <option value="POS">
                      POS
                    </option>

                    <option value="Inventory">
                      Inventory
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="Reports">
                      Reports
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>
              </label>


              <label>
                <span>
                  Priority
                </span>

                <div className="admin-support-field">
                  <SupportIcon
                    name="priority"
                    size={16}
                  />

                  <select
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      updateField
                    }
                  >
                    <option value="Low">
                      Low
                    </option>

                    <option value="Normal">
                      Normal
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>
                </div>
              </label>
            </div>


            <label>
              <span>
                Subject
              </span>

              <div className="admin-support-field">
                <SupportIcon
                  name="subject"
                  size={16}
                />

                <input
                  type="text"
                  name="subject"
                  value={
                    form.subject
                  }
                  onChange={
                    updateField
                  }
                  maxLength={80}
                  placeholder="Briefly describe the problem"
                  autoComplete="off"
                />
              </div>
            </label>


            <label>
              <span>
                Problem Description
              </span>

              <div className="admin-support-field admin-support-field--textarea">
                <SupportIcon
                  name="message"
                  size={16}
                />

                <textarea
                  name="message"
                  value={
                    form.message
                  }
                  onChange={
                    updateField
                  }
                  maxLength={900}
                  rows={7}
                  placeholder="Explain what happened, what page you were using and any error message you saw."
                />
              </div>

              <small className="admin-support-counter">
                {
                  form.message.length
                }
                /900
              </small>
            </label>


            <button
              type="submit"
              className="admin-support-submit"
              disabled={
                submitting
              }
            >
              <SupportIcon
                name="send"
                size={18}
              />

              <span>
                {submitting
                  ? "Submitting..."
                  : "Submit Support Request"}
              </span>
            </button>
          </form>
        </article>


        {/* ===============================================
            REQUEST HISTORY
            =============================================== */}

        <article className="admin-support-card admin-support-card--history">
          <div className="admin-support-card__heading">
            <div className="admin-support-card__heading-main">
              <span className="admin-support-card__icon">
                <SupportIcon
                  name="history"
                  size={21}
                />
              </span>

              <div>
                <small>
                  Request History
                </small>

                <h2>
                  Support Tickets
                </h2>

                <p>
                  Track previous requests and technical support responses.
                </p>
              </div>
            </div>

            <span className="admin-support-card__badge">
              {tickets.length}{" "}
              tickets
            </span>
          </div>


          <div className="admin-support-ticket-list">
            {loading ? (
              <div className="admin-support-empty">
                <span className="admin-support-empty-icon">
                  <SupportIcon
                    name="history"
                    size={28}
                  />
                </span>

                <strong>
                  Loading support requests...
                </strong>

                <p>
                  Retrieving your support history.
                </p>
              </div>
            ) : tickets.length ===
              0 ? (
              <div className="admin-support-empty">
                <span className="admin-support-empty-icon">
                  <SupportIcon
                    name="monitor"
                    size={28}
                  />
                </span>

                <strong>
                  No support requests yet
                </strong>

                <p>
                  Submitted technical issues will appear here.
                </p>
              </div>
            ) : (
              tickets.map(
                (
                  ticket
                ) => {
                  const statusClass =
                    getStatusClass(
                      ticket.status
                    );

                  const priorityClass =
                    getPriorityClass(
                      ticket.priority
                    );

                  return (
                    <article
                      key={
                        ticket.id
                      }
                      className="admin-support-ticket"
                    >
                      <span className="admin-support-ticket__accent" />

                      <div className="admin-support-ticket__top">
                        <div className="admin-support-ticket__title">
                          <small>
                            Ticket #
                            {
                              ticket.id
                            }
                          </small>

                          <strong>
                            {ticket.cleanSubject ||
                              "Support Request"}
                          </strong>
                        </div>

                        <span
                          className={`admin-support-status admin-support-status--${statusClass}`}
                        >
                          {
                            ticket.status
                          }
                        </span>
                      </div>


                      <div className="admin-support-ticket__meta">
                        <span className="admin-support-ticket__category">
                          {
                            ticket.category
                          }
                        </span>

                        <span
                          className={`admin-support-ticket__priority admin-support-ticket__priority--${priorityClass}`}
                        >
                          {
                            ticket.priority
                          }
                        </span>

                        {ticket.created_at && (
                          <span className="admin-support-ticket__date">
                            {new Date(
                              ticket.created_at
                            )
                              .toLocaleDateString(
                                "en-GB",
                                {
                                  day:
                                    "numeric",

                                  month:
                                    "short",

                                  year:
                                    "numeric",
                                }
                              )}
                          </span>
                        )}
                      </div>


                      <div className="admin-support-ticket-description-box">
                        <span className="admin-support-ticket-description-label">
                          Problem Description
                        </span>

                        <p>
                          {
                            ticket.message
                          }
                        </p>
                      </div>


                      {ticket.support_response ? (
                        <div className="admin-support-response">
                          <div className="admin-support-response__heading">
                            <SupportIcon
                              name="response"
                              size={17}
                            />

                            <strong>
                              Technical Support Response
                            </strong>
                          </div>

                          <p>
                            {
                              ticket.support_response
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="admin-support-awaiting-text">
                          <SupportIcon
                            name="history"
                            size={15}
                          />

                          <span>
                            Awaiting technical support response
                          </span>
                        </div>
                      )}
                    </article>
                  );
                }
              )
            )}
          </div>
        </article>
      </section>
    </section>
  );
}


export default AdminSupportPage;