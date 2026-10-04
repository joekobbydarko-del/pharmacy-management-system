import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  forgotPassword,
} from "../api";

import "./ForgotPasswordPage.css";


function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    developmentResetUrl,
    setDevelopmentResetUrl,
  ] = useState("");


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const cleanedEmail =
        email
          .trim()
          .toLowerCase();

      if (!cleanedEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");
        setMessage("");
        setDevelopmentResetUrl("");

        const data =
          await forgotPassword(
            cleanedEmail
          );

        setMessage(
          data?.message ||
            "Password reset instructions have been prepared."
        );

        if (
          data?.development_reset_url
        ) {
          setDevelopmentResetUrl(
            data.development_reset_url
          );
        }
      } catch (err) {
        console.error(
          "Forgot password failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to start the password reset process."
        );
      } finally {
        setLoading(false);
      }
    };


  const handleContinueReset =
    () => {
      if (!developmentResetUrl) {
        return;
      }

      window.location.href =
        developmentResetUrl;
    };


  return (
    <main className="forgot-password-page">

      <section className="forgot-password-brand">

        <div className="forgot-password-brand__circle forgot-password-brand__circle--one" />

        <div className="forgot-password-brand__circle forgot-password-brand__circle--two" />


        <div className="forgot-password-brand__content">

          <div className="forgot-password-logo">

            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />

          </div>


          <span className="forgot-password-brand-name">
            DR. EVANS PHARMACY
          </span>


          <strong className="forgot-password-brand-tagline">
            Smarter Pharmacy, Bettering Lives.
          </strong>


          <h1>
            Recover your
            <br />
            pharmacy
            <br />
            account.
          </h1>


          <p>
            Enter the email address
            connected to your patient
            account and we’ll prepare
            secure password reset
            instructions.
          </p>

        </div>


        <div className="forgot-password-brand__footer">
          Secure Patient Care Portal
        </div>

      </section>


      <section className="forgot-password-content">

        <div className="forgot-password-card">

          <div className="forgot-password-heading">

            <span className="forgot-password-eyebrow">
              ACCOUNT RECOVERY
            </span>

            <h2>
              Forgot your password?
            </h2>

            <p>
              Enter your account email
              address below to continue.
            </p>

          </div>


          <form
            className="forgot-password-form"
            onSubmit={handleSubmit}
          >

            {error && (

              <div className="forgot-password-alert forgot-password-alert--error">

                <strong>
                  Unable to continue
                </strong>

                <p>
                  {error}
                </p>

              </div>

            )}


            {message && (

              <div className="forgot-password-alert forgot-password-alert--success">

                <strong>
                  Request received
                </strong>

                <p>
                  {message}
                </p>

              </div>

            )}


            <div className="forgot-password-field">

              <label htmlFor="forgot-email">
                Email address
              </label>

              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                required
              />

            </div>


            <div className="forgot-password-actions">

              <button
                type="button"
                className="forgot-password-secondary"
                onClick={() =>
                  navigate(
                    "/login"
                  )
                }
                disabled={loading}
              >

                <span className="forgot-password-secondary__icon">
                  ←
                </span>

                <span>
                  Back to sign in
                </span>

              </button>


              <button
                type="submit"
                className="forgot-password-submit"
                disabled={loading}
              >
                {loading
                  ? "Preparing reset..."
                  : "Continue"}
              </button>

            </div>

          </form>


          {developmentResetUrl && (

            <div className="forgot-password-development">

              <span>
                DEVELOPMENT MODE
              </span>

              <p>
                Email sending is not
                connected yet, so use
                the button below to test
                the secure reset link.
              </p>

              <button
                type="button"
                onClick={
                  handleContinueReset
                }
              >
                Continue to reset password
                <span>
                  →
                </span>
              </button>

            </div>

          )}


          <div className="forgot-password-security">

            <span>
              ✓
            </span>

            <div>

              <strong>
                Secure password recovery
              </strong>

              <p>
                Reset links expire after
                15 minutes and stop
                working after your
                password changes.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}


export default ForgotPasswordPage;