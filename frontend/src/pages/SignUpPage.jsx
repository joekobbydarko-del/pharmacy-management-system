import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  signup,
} from "../api";

import "./SignUpPage.css";


function SignUpPage() {
  const navigate = useNavigate();

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  const passwordChecks =
    useMemo(
      () => ({
        minLength:
          password.length >= 8,

        hasNumber:
          /\d/.test(password),

        hasUppercase:
          /[A-Z]/.test(
            password
          ),

        hasSpecial:
          /[^A-Za-z0-9]/.test(
            password
          ),
      }),
      [password]
    );


  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.hasNumber &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasSpecial;


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const cleanedName =
        fullName.trim();

      const cleanedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanedName ||
        !cleanedEmail ||
        !password
      ) {
        setError(
          "Please fill in all required fields."
        );

        return;
      }

      if (!isPasswordStrong) {
        setError(
          "Your password must meet all the password requirements."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const data =
          await signup(
            cleanedName,
            cleanedEmail,
            password
          );

        setSuccess(
          data?.message ||
            "Patient account created successfully."
        );

        setFullName("");
        setEmail("");
        setPassword("");

        window.setTimeout(
          () => {
            navigate(
              "/login",
              {
                replace: true,
              }
            );
          },
          1200
        );
      } catch (err) {
        console.error(
          "Signup failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to create your account right now."
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <main className="signup-page">

      <section className="signup-brand-panel">

        <div className="signup-brand-panel__circle signup-brand-panel__circle--one" />

        <div className="signup-brand-panel__circle signup-brand-panel__circle--two" />


        <div className="signup-brand-panel__content">

          <div className="signup-logo-box">

            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />

          </div>


          <span className="signup-brand-eyebrow">
            DR. EVANS PHARMACY
          </span>


          <strong className="signup-brand-tagline">
            Smarter Pharmacy, Bettering Lives.
          </strong>


          <h1>
            Better care
            <br />
            starts here.
          </h1>


          <p>
            Create your secure patient
            account and get convenient
            access to your pharmacy
            services, prescriptions,
            medicine orders, and refill
            requests.
          </p>


          <div className="signup-brand-features">

            <div className="signup-brand-feature">

              <span>
                ✓
              </span>

              <div>

                <strong>
                  Manage prescriptions
                </strong>

                <small>
                  View your medications
                  and prescription
                  information.
                </small>

              </div>

            </div>


            <div className="signup-brand-feature">

              <span>
                +
              </span>

              <div>

                <strong>
                  Order medicines
                </strong>

                <small>
                  Request medicines
                  conveniently through
                  your portal.
                </small>

              </div>

            </div>


            <div className="signup-brand-feature">

              <span>
                ↻
              </span>

              <div>

                <strong>
                  Request refills
                </strong>

                <small>
                  Submit refill requests
                  without visiting the
                  pharmacy.
                </small>

              </div>

            </div>

          </div>

        </div>


        <div className="signup-brand-footer">

          <span>
            DR. EVANS PHARMACY
          </span>

          <span>
            Patient Care Portal
          </span>

        </div>

      </section>


      <section className="signup-form-panel">

        <div className="signup-form-card">

          <div className="signup-form-header">

            <span className="signup-form-eyebrow">
              PATIENT REGISTRATION
            </span>

            <h2>
              Create your account
            </h2>

            <p>
              Join Dr. Evans Pharmacy and
              securely manage your pharmacy
              services online.
            </p>

          </div>


          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >

            {error && (

              <div className="signup-alert signup-alert--error">

                <strong>
                  Unable to create account
                </strong>

                <p>
                  {error}
                </p>

              </div>

            )}


            {success && (

              <div className="signup-alert signup-alert--success">

                <strong>
                  Account created
                </strong>

                <p>
                  {success}
                </p>

              </div>

            )}


            <div className="signup-field">

              <label htmlFor="fullName">
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />

            </div>


            <div className="signup-field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
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
              />

            </div>


            <div className="signup-field">

              <label htmlFor="password">
                Password
              </label>


              <div className="signup-password-wrap">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  disabled={loading}
                />


                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={loading}
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            <div className="signup-password-rules">

              <strong>
                Password requirements
              </strong>


              <div className="signup-password-rules__grid">

                <span
                  className={
                    passwordChecks.minLength
                      ? "is-valid"
                      : ""
                  }
                >
                  ○ At least 8 characters
                </span>


                <span
                  className={
                    passwordChecks.hasUppercase
                      ? "is-valid"
                      : ""
                  }
                >
                  ○ One uppercase letter
                </span>


                <span
                  className={
                    passwordChecks.hasNumber
                      ? "is-valid"
                      : ""
                  }
                >
                  ○ One number
                </span>


                <span
                  className={
                    passwordChecks.hasSpecial
                      ? "is-valid"
                      : ""
                  }
                >
                  ○ One special character
                </span>

              </div>

            </div>


            <button
              type="submit"
              className="signup-submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create patient account"}

              {!loading && (
                <span>
                  →
                </span>
              )}
            </button>

          </form>


          <div className="signup-signin-link">

            <span>
              Already have a patient account?
            </span>

            <Link to="/login">
              Sign in
            </Link>

          </div>


          <div className="signup-security-note">

            <span>
              ✓
            </span>

            <div>

              <strong>
                Secure patient registration
              </strong>

              <p>
                Your account information
                is protected and securely
                managed.
              </p>

            </div>

          </div>


          <p className="signup-copyright">
            © 2026 Dr. Evans Pharmacy.
            All rights reserved.
          </p>

        </div>

      </section>

    </main>
  );
}


export default SignUpPage;