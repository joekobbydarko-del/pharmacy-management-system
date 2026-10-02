import { useState } from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./ContactPharmacistPage.css";

function ContactPharmacistPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      return;
    }

    setSent(true);
  };

  const handleReset = () => {
    setSubject("");
    setMessage("");
    setSent(false);
  };

  return (
    <section className="pharmacist-page">
      {/* PAGE HEADER */}

      <div className="pharmacist-page__header">
        <div>
          <span className="pharmacist-page__eyebrow">
            PHARMACY COMMUNICATION
          </span>

          <h1>Contact Pharmacist</h1>

          <p>
            Send a secure message to the pharmacy team
            about your medicines, prescriptions, refill
            requests, or other pharmacy services.
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
            <span>MEDICATION SUPPORT</span>
            <strong>Medicines</strong>
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
            <span>PRESCRIPTION HELP</span>
            <strong>Prescriptions</strong>
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
            <span>REFILL SUPPORT</span>
            <strong>Refills</strong>
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
                  MESSAGE READY
                </span>

                <h3>
                  Your message has been prepared
                </h3>

                <p>
                  The pharmacist messaging interface is
                  working correctly. Backend message
                  delivery will be connected during the
                  integration stage.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                className="pharmacist-form"
                onSubmit={handleSubmit}
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
                      Do not use this form for urgent or
                      emergency medical situations.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="pharmacist-submit"
                >
                  Send Message

                  <PatientIcon
                    name="arrow"
                    size={16}
                  />
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
              Include enough information about your
              pharmacy question so the pharmacist can
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
                  Select the most relevant message topic.
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
                  Mention the medicine or prescription
                  involved when relevant.
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
                  Keep your message clear and specific.
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
                Message review
              </strong>

              <p>
                Pharmacy responses will appear in the
                patient portal once messaging is
                connected to the backend.
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
            Your pharmacy messages are linked securely to
            your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default ContactPharmacistPage;