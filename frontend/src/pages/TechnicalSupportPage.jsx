import {
  useEffect,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createSupportRequest,
  getUserSupportRequests,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./TechnicalSupportPage.css";


const quickSupportIssues = [
  {
    id: "login",

    icon: "user",

    title:
      "Login or account access",

    description:
      "Report trouble signing in, account access issues, or profile problems.",

    subject:
      "Login or account access issue",

    message:
      "I am having trouble with login or accessing my patient account. Please help me resolve the issue.",
  },

  {
    id: "notifications",

    icon: "bell",

    title:
      "Notification problems",

    description:
      "Let support know if patient notifications are not appearing correctly.",

    subject:
      "Notification problem",

    message:
      "I am having a problem with notifications in my patient portal. Notifications are not appearing or working correctly.",
  },

  {
    id: "portal",

    icon: "medicine",

    title:
      "Portal feature issues",

    description:
      "Report problems with prescriptions, refills, medicine orders, or appointments.",

    subject:
      "Patient portal feature issue",

    message:
      "I am having trouble using one of the patient portal features, such as prescriptions, refill requests, medicine orders, or appointments.",
  },

  {
    id: "settings",

    icon: "settings",

    title:
      "Settings and display",

    description:
      "Get help with account settings, dark mode, or portal display problems.",

    subject:
      "Settings or display issue",

    message:
      "I am having a problem with my patient portal settings, display, or theme. Please help me resolve the issue.",
  },
];


function TechnicalSupportPage() {
  const userId =
    localStorage.getItem(
      "user_id"
    );


  const [
    subject,
    setSubject,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    sent,
    setSent,
  ] = useState(false);


  const [
    requestType,
    setRequestType,
  ] = useState("");


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(true);


  const [
    supportRequests,
    setSupportRequests,
  ] = useState([]);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     LOAD PREVIOUS SUPPORT REQUESTS
  ========================================================= */

  useEffect(() => {
    async function loadRequests() {
      if (!userId) {
        setLoadingRequests(false);
        return;
      }


      try {
        setLoadingRequests(true);

        const data =
          await getUserSupportRequests(
            userId
          );


        setSupportRequests(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Unable to load support requests:",
          err
        );
      } finally {
        setLoadingRequests(false);
      }
    }


    loadRequests();
  }, [userId]);


  /* =========================================================
     SEND SUPPORT REQUEST
  ========================================================= */

  const sendSupportRequest =
    async (
      requestSubject,
      requestMessage,
      displayType
    ) => {
      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        return;
      }


      try {
        setSubmitting(true);
        setError("");


        const newRequest =
          await createSupportRequest(
            userId,
            requestSubject,
            requestMessage
          );


        setSupportRequests(
          (current) => [
            newRequest,
            ...current,
          ]
        );


        setRequestType(
          displayType ||
            requestSubject
        );


        addPatientNotification({
          title:
            "Support request submitted",

          message:
            `${requestSubject} has been sent to technical support.`,

          icon:
            "support",
        });


        setSent(true);
      } catch (err) {
        setError(
          err.message ||
            (
              "Unable to submit " +
              "your support request."
            )
        );
      } finally {
        setSubmitting(false);
      }
    };


  /* =========================================================
     NORMAL FORM
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      if (
        !subject.trim() ||
        !message.trim()
      ) {
        setError(
          "Please enter a subject and message."
        );

        return;
      }


      await sendSupportRequest(
        subject.trim(),
        message.trim(),
        subject.trim()
      );
    };


  /* =========================================================
     QUICK SUPPORT
  ========================================================= */

  const handleQuickRequest =
    async (issue) => {
      setSubject(
        issue.subject
      );

      setMessage(
        issue.message
      );


      await sendSupportRequest(
        issue.subject,
        issue.message,
        issue.title
      );
    };


  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setRequestType("");
    setError("");
    setSent(false);
  };


  /* =========================================================
     LATEST REQUEST
  ========================================================= */

  const latestRequest =
    supportRequests.length > 0
      ? supportRequests[0]
      : null;


  return (
    <section className="support-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="support-page-header">

        <div>

          <span className="support-eyebrow">
            PATIENT SUPPORT
          </span>


          <h1>
            Technical Support
          </h1>


          <p>
            Get help with login issues,
            portal access, account settings,
            notifications, or other technical
            problems.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="support-summary-grid">

        <article className="support-summary-card">

          <div className="support-summary-icon teal">

            <PatientIcon
              name="support"
              size={23}
            />

          </div>


          <div>

            <span>
              PORTAL SUPPORT
            </span>

            <strong>
              Help
            </strong>

            <small>
              Assistance with your patient portal
            </small>

          </div>

        </article>


        <article className="support-summary-card">

          <div className="support-summary-icon blue">

            <PatientIcon
              name="user"
              size={23}
            />

          </div>


          <div>

            <span>
              ACCOUNT ACCESS
            </span>

            <strong>
              Secure
            </strong>

            <small>
              Help with login and account access
            </small>

          </div>

        </article>


        <article className="support-summary-card">

          <div className="support-summary-icon orange">

            <PatientIcon
              name="clock"
              size={23}
            />

          </div>


          <div>

            <span>
              SUPPORT REQUEST
            </span>

            <strong>
              {latestRequest
                ? "Submitted"
                : "Ready"}
            </strong>

            <small>
              Submit a technical issue for review
            </small>

          </div>

        </article>

      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="support-content-grid">

        {/* SUPPORT FORM */}

        <article className="support-panel">

          <div className="support-panel-header">

            <div>

              <span className="support-panel-icon">

                <PatientIcon
                  name="support"
                  size={20}
                />

              </span>


              <div>

                <span className="support-section-label">
                  TECHNICAL ASSISTANCE
                </span>

                <h2>
                  Send Support Request
                </h2>

              </div>

            </div>

          </div>


          <div className="support-panel-body">

            {sent ? (

              <div className="support-success">

                <div className="support-success-icon">

                  <PatientIcon
                    name="check"
                    size={28}
                  />

                </div>


                <span className="support-success-label">
                  SUPPORT REQUEST SENT
                </span>


                <h3>
                  Support request submitted
                </h3>


                {requestType && (

                  <strong className="support-success-subject">
                    {requestType}
                  </strong>

                )}


                <p>
                  Your technical support request
                  has been saved securely and is
                  awaiting review by the support
                  team.
                </p>


                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                >
                  Send Another Request
                </button>

              </div>

            ) : (

              <form
                className="support-form"
                onSubmit={
                  handleSubmit
                }
              >

                <div className="support-field">

                  <label htmlFor="support-subject">
                    Subject
                  </label>


                  <input
                    id="support-subject"
                    type="text"
                    value={subject}
                    onChange={(
                      event
                    ) =>
                      setSubject(
                        event.target.value
                      )
                    }
                    placeholder="What do you need help with?"
                    maxLength={120}
                    required
                  />

                </div>


                <div className="support-field">

                  <label htmlFor="support-message">
                    Message
                  </label>


                  <textarea
                    id="support-message"
                    value={message}
                    onChange={(
                      event
                    ) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    placeholder="Describe the problem you're having..."
                    rows={7}
                    maxLength={1000}
                    required
                  />


                  <small className="support-character-count">
                    {message.length}/1000
                  </small>

                </div>


                <div className="support-notice">

                  <span>

                    <PatientIcon
                      name="info"
                      size={17}
                    />

                  </span>


                  <p>
                    Do not include passwords or
                    other sensitive login
                    information in your support
                    message.
                  </p>

                </div>


                {error && (

                  <div className="support-notice">

                    <span>

                      <PatientIcon
                        name="info"
                        size={17}
                      />

                    </span>


                    <p>
                      {error}
                    </p>

                  </div>

                )}


                <button
                  type="submit"
                  className="support-submit-button"
                  disabled={
                    submitting
                  }
                >

                  {submitting
                    ? "Sending..."
                    : "Send Support Request"}


                  {!submitting && (

                    <PatientIcon
                      name="arrow"
                      size={16}
                    />

                  )}

                </button>

              </form>

            )}

          </div>

        </article>


        {/* QUICK SUPPORT */}

        <article className="support-panel">

          <div className="support-panel-header">

            <div>

              <span className="support-panel-icon">

                <PatientIcon
                  name="info"
                  size={20}
                />

              </span>


              <div>

                <span className="support-section-label">
                  QUICK SUPPORT
                </span>

                <h2>
                  Common Support Issues
                </h2>

              </div>

            </div>

          </div>


          <div className="support-panel-body">

            <p className="support-quick-intro">
              Select a common issue to
              send a support request
              instantly.
            </p>


            <div className="support-tips">

              {quickSupportIssues.map(
                (issue) => (

                  <button
                    key={
                      issue.id
                    }
                    type="button"
                    className="support-tip support-tip--clickable"
                    onClick={() =>
                      handleQuickRequest(
                        issue
                      )
                    }
                    disabled={
                      submitting
                    }
                  >

                    <span>

                      <PatientIcon
                        name={
                          issue.icon
                        }
                        size={18}
                      />

                    </span>


                    <div>

                      <strong>
                        {issue.title}
                      </strong>

                      <p>
                        {
                          issue.description
                        }
                      </p>

                    </div>


                    <span className="support-tip-arrow">

                      <PatientIcon
                        name="arrow"
                        size={16}
                      />

                    </span>

                  </button>

                )
              )}

            </div>


            <div className="support-response-card">

              <span>

                <PatientIcon
                  name="clock"
                  size={20}
                />

              </span>


              <div>

                <strong>
                  {loadingRequests
                    ? "Checking support status"
                    : latestRequest
                      ? latestRequest.status ===
                        "responded"
                        ? "Support response received"
                        : "Awaiting support review"
                      : "Support response"}
                </strong>


                <p>
                  {loadingRequests
                    ? "Loading your technical support requests."
                    : latestRequest
                      ? latestRequest.support_response ||
                        "Your latest support request has been received and is awaiting review."
                      : "Technical support requests you submit will appear here."}
                </p>

              </div>

            </div>

          </div>

        </article>

      </div>


      {/* =====================================================
          SECURITY
      ===================================================== */}

      <div className="support-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure technical support
          </strong>

          <small>
            Support requests are linked
            securely to your patient portal
            account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default TechnicalSupportPage;