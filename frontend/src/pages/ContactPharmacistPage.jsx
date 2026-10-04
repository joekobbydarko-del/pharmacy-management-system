import {
  useEffect,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createPharmacistMessage,
  getUserPharmacistMessages,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./ContactPharmacistPage.css";


function ContactPharmacistPage() {
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
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(true);


  const [
    previousMessages,
    setPreviousMessages,
  ] = useState([]);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================================
     LOAD EXISTING MESSAGES
  ========================================================= */

  useEffect(() => {
    async function loadMessages() {
      if (!userId) {
        setLoadingMessages(false);
        return;
      }


      try {
        setLoadingMessages(true);

        const data =
          await getUserPharmacistMessages(
            userId
          );


        setPreviousMessages(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Unable to load pharmacist messages:",
          err
        );
      } finally {
        setLoadingMessages(false);
      }
    }


    loadMessages();
  }, [userId]);


  /* =========================================================
     SUBMIT MESSAGE
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();


      if (
        !subject.trim() ||
        !message.trim()
      ) {
        setError(
          "Please select a topic and enter your message."
        );

        return;
      }


      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        return;
      }


      try {
        setSubmitting(true);
        setError("");


        const newMessage =
          await createPharmacistMessage(
            userId,
            subject,
            message.trim()
          );


        setPreviousMessages(
          (current) => [
            newMessage,
            ...current,
          ]
        );


        addPatientNotification({
          title:
            "Message sent to pharmacist",

          message:
            `${subject} has been sent to the pharmacy team.`,

          icon:
            "message",
        });


        setSent(true);
      } catch (err) {
        setError(
          err.message ||
            "Unable to send your message."
        );
      } finally {
        setSubmitting(false);
      }
    };


  /* =========================================================
     RESET
  ========================================================= */

  const handleReset = () => {
    setSubject("");
    setMessage("");
    setError("");
    setSent(false);
  };


  /* =========================================================
     LATEST MESSAGE
  ========================================================= */

  const latestMessage =
    previousMessages.length > 0
      ? previousMessages[0]
      : null;


  return (
    <section className="pharmacist-page">

      {/* PAGE HEADER */}

      <div className="pharmacist-page__header">

        <div>

          <span className="pharmacist-page__eyebrow">
            PHARMACY COMMUNICATION
          </span>

          <h1>
            Contact Pharmacist
          </h1>

          <p>
            Send a secure message to the
            pharmacy team about your medicines,
            prescriptions, refill requests,
            or other pharmacy services.
          </p>

        </div>


        <PatientDateCard />

      </div>


      {/* SUMMARY CARDS */}

      <div className="pharmacist-summary">

        <article className="pharmacist-summary__card">

          <span className="pharmacist-summary__icon pharmacist-summary__icon--teal">

            <PatientIcon
              name="pill"
              size={23}
            />

          </span>


          <div>

            <span>
              MEDICATION SUPPORT
            </span>

            <strong>
              Medicines
            </strong>

            <small>
              Ask about your medication
            </small>

          </div>

        </article>


        <article className="pharmacist-summary__card">

          <span className="pharmacist-summary__icon pharmacist-summary__icon--blue">

            <PatientIcon
              name="medicine"
              size={23}
            />

          </span>


          <div>

            <span>
              PRESCRIPTION HELP
            </span>

            <strong>
              Prescriptions
            </strong>

            <small>
              Get prescription assistance
            </small>

          </div>

        </article>


        <article className="pharmacist-summary__card">

          <span className="pharmacist-summary__icon pharmacist-summary__icon--orange">

            <PatientIcon
              name="refresh"
              size={23}
            />

          </span>


          <div>

            <span>
              REFILL SUPPORT
            </span>

            <strong>
              Refills
            </strong>

            <small>
              Questions about refill requests
            </small>

          </div>

        </article>

      </div>


      {/* MAIN AREA */}

      <div className="pharmacist-layout">

        {/* MESSAGE FORM */}

        <article className="pharmacist-panel pharmacist-panel--form">

          <div className="pharmacist-panel__header">

            <div className="pharmacist-panel__title">

              <span className="pharmacist-panel__icon">

                <PatientIcon
                  name="medicine"
                  size={20}
                />

              </span>


              <div>

                <span>
                  PHARMACIST MESSAGE
                </span>

                <h2>
                  Send a Message
                </h2>

              </div>

            </div>

          </div>


          <div className="pharmacist-panel__body">

            {sent ? (

              <div className="pharmacist-success">

                <div className="pharmacist-success__icon">

                  <PatientIcon
                    name="check"
                    size={30}
                  />

                </div>


                <span>
                  MESSAGE SENT
                </span>


                <h3>
                  Your message has been sent
                </h3>


                <p>
                  Your message has been saved
                  securely and sent to the
                  pharmacy team for review.
                </p>


                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                >
                  Send Another Message
                </button>

              </div>

            ) : (

              <form
                className="pharmacist-form"
                onSubmit={
                  handleSubmit
                }
              >

                <div className="pharmacist-field">

                  <label htmlFor="pharmacist-subject">
                    What can we help you with?
                  </label>


                  <select
                    id="pharmacist-subject"
                    value={subject}
                    onChange={(event) =>
                      setSubject(
                        event.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select a topic
                    </option>

                    <option value="Medication question">
                      Medication question
                    </option>

                    <option value="Prescription question">
                      Prescription question
                    </option>

                    <option value="Refill question">
                      Refill question
                    </option>

                    <option value="Medicine order question">
                      Medicine order question
                    </option>

                    <option value="Dosage question">
                      Dosage or instructions
                    </option>

                    <option value="Other pharmacy question">
                      Other pharmacy question
                    </option>

                  </select>

                </div>


                <div className="pharmacist-field">

                  <div className="pharmacist-field__label-row">

                    <label htmlFor="pharmacist-message">
                      Your message
                    </label>


                    <span>
                      {message.length}/1000
                    </span>

                  </div>


                  <textarea
                    id="pharmacist-message"
                    rows="8"
                    maxLength="1000"
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    placeholder="Write your message clearly so the pharmacist can understand how to assist you..."
                    required
                  />

                </div>


                <div className="pharmacist-notice">

                  <span>

                    <PatientIcon
                      name="info"
                      size={18}
                    />

                  </span>


                  <div>

                    <strong>
                      General pharmacy support only
                    </strong>

                    <p>
                      Do not use this form for
                      urgent or emergency medical
                      situations.
                    </p>

                  </div>

                </div>


                {error && (
                  <div className="pharmacist-notice">

                    <span>

                      <PatientIcon
                        name="info"
                        size={18}
                      />

                    </span>

                    <div>

                      <strong>
                        Message could not be sent
                      </strong>

                      <p>
                        {error}
                      </p>

                    </div>

                  </div>
                )}


                <button
                  type="submit"
                  className="pharmacist-submit"
                  disabled={submitting}
                >

                  {submitting
                    ? "Sending..."
                    : "Send Message"}

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


        {/* INFORMATION PANEL */}

        <aside className="pharmacist-side">

          <article className="pharmacist-help-card">

            <div className="pharmacist-help-card__icon">

              <PatientIcon
                name="info"
                size={22}
              />

            </div>


            <span>
              BEFORE YOU SEND
            </span>


            <h3>
              Help us assist you faster
            </h3>


            <p>
              Include enough information
              about your pharmacy question
              so the pharmacist can
              understand what you need.
            </p>


            <div className="pharmacist-help-list">

              <div>

                <span>

                  <PatientIcon
                    name="check"
                    size={16}
                  />

                </span>

                <p>
                  Select the most relevant
                  message topic.
                </p>

              </div>


              <div>

                <span>

                  <PatientIcon
                    name="check"
                    size={16}
                  />

                </span>

                <p>
                  Mention the medicine or
                  prescription involved when
                  relevant.
                </p>

              </div>


              <div>

                <span>

                  <PatientIcon
                    name="check"
                    size={16}
                  />

                </span>

                <p>
                  Keep your message clear and
                  specific.
                </p>

              </div>

            </div>

          </article>


          <article className="pharmacist-response-card">

            <span className="pharmacist-response-card__icon">

              <PatientIcon
                name="clock"
                size={21}
              />

            </span>


            <div>

              <span>
                PHARMACY RESPONSE
              </span>


              <strong>
                {loadingMessages
                  ? "Checking messages..."
                  : latestMessage
                    ? latestMessage.status ===
                      "responded"
                      ? "Response received"
                      : "Awaiting review"
                    : "No messages yet"}
              </strong>


              <p>
                {loadingMessages
                  ? "Loading your pharmacy message status."
                  : latestMessage
                    ? latestMessage.pharmacist_response ||
                      "Your latest message has been received and is awaiting pharmacy review."
                    : "Messages you send to the pharmacist will appear here once submitted."}
              </p>

            </div>

          </article>

        </aside>

      </div>


      {/* SECURITY */}

      <div className="pharmacist-security">

        <span>

          <PatientIcon
            name="shield"
            size={20}
          />

        </span>


        <div>

          <strong>
            Secure pharmacist communication
          </strong>

          <small>
            Your pharmacy messages are
            linked securely to your
            patient account.
          </small>

        </div>

      </div>

    </section>
  );
}


export default ContactPharmacistPage;