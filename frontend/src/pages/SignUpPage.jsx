import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api";
import "./SignUpPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@#$!]/.test(password),
  };

  const passwordIsValid =
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.number &&
    passwordRequirements.special;

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!passwordIsValid) {
      setError(
        "Please make sure your password meets all the requirements."
      );
      return;
    }

    try {
      setLoading(true);

      await signup(
        fullName.trim(),
        email.trim(),
        password
      );

      setSuccess(
        "Your patient account has been created successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <section className="signup-brand-panel">

        <div className="signup-brand-content">

          <div className="signup-logo-wrap">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
              className="signup-logo"
            />
          </div>

          <div className="signup-brand-label">
            DR. EVANS PHARMACY
          </div>

          <div className="signup-slogan">
            Smart Pharmacy, Bettering Lives.
          </div>

          <h1>
            Better care
            <br />
            starts here.
          </h1>

          <p className="signup-brand-description">
            Create your secure patient account and get
            convenient access to your pharmacy services,
            prescriptions, medicine orders, and refill requests.
          </p>

          <div className="signup-benefits">

            <div className="signup-benefit">
              <span className="signup-benefit-icon">
                ✓
              </span>

              <div>
                <strong>Manage prescriptions</strong>
                <span>
                  View your medications and prescription information.
                </span>
              </div>
            </div>

            <div className="signup-benefit">
              <span className="signup-benefit-icon">
                +
              </span>

              <div>
                <strong>Order medicines</strong>
                <span>
                  Request medicines conveniently through your portal.
                </span>
              </div>
            </div>

            <div className="signup-benefit">
              <span className="signup-benefit-icon">
                ↻
              </span>

              <div>
                <strong>Request refills</strong>
                <span>
                  Submit refill requests without visiting the pharmacy.
                </span>
              </div>
            </div>

          </div>

        </div>

        <div className="signup-brand-footer">
          <span>DR. EVANS PHARMACY</span>
          <span>Patient Care Portal</span>
        </div>

      </section>


      {/* =====================================================
          RIGHT SIGN UP PANEL
          ===================================================== */}

      <section className="signup-form-panel">

        <div className="signup-form-container">

          <div className="signup-mobile-logo">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />
          </div>


          <div className="signup-heading">

            <span className="signup-eyebrow">
              PATIENT REGISTRATION
            </span>

            <h2>
              Create your account
            </h2>

            <p>
              Join Dr. Evans Pharmacy and securely manage
              your pharmacy services online.
            </p>

          </div>


          {error && (
            <div className="signup-message signup-error">

              <span className="signup-message-icon">
                !
              </span>

              <div>
                <strong>
                  Account could not be created
                </strong>

                <span>
                  {error}
                </span>
              </div>

            </div>
          )}


          {success && (
            <div className="signup-message signup-success">

              <span className="signup-message-icon">
                ✓
              </span>

              <div>
                <strong>
                  Account created
                </strong>

                <span>
                  {success}
                </span>
              </div>

            </div>
          )}


          <form
            className="signup-form"
            onSubmit={handleSignup}
          >

            {/* FULL NAME */}

            <div className="signup-field">

              <label htmlFor="fullName">
                Full name
              </label>

              <div className="signup-input-wrapper">

                <span className="signup-input-icon">
                  Aa
                </span>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="signup-field">

              <label htmlFor="signupEmail">
                Email address
              </label>

              <div className="signup-input-wrapper">

                <span className="signup-input-icon">
                  @
                </span>

                <input
                  id="signupEmail"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="signup-field">

              <label htmlFor="signupPassword">
                Password
              </label>

              <div className="signup-input-wrapper">

                <span className="signup-input-icon">
                  •
                </span>

                <input
                  id="signupPassword"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* PASSWORD REQUIREMENTS */}

            <div className="password-requirements">

              <div className="requirements-heading">
                Password requirements
              </div>

              <div className="requirements-grid">

                <div
                  className={
                    passwordRequirements.length
                      ? "requirement valid"
                      : "requirement"
                  }
                >
                  <span>
                    {passwordRequirements.length ? "✓" : "○"}
                  </span>
                  At least 8 characters
                </div>

                <div
                  className={
                    passwordRequirements.uppercase
                      ? "requirement valid"
                      : "requirement"
                  }
                >
                  <span>
                    {passwordRequirements.uppercase ? "✓" : "○"}
                  </span>
                  One uppercase letter
                </div>

                <div
                  className={
                    passwordRequirements.number
                      ? "requirement valid"
                      : "requirement"
                  }
                >
                  <span>
                    {passwordRequirements.number ? "✓" : "○"}
                  </span>
                  One number
                </div>

                <div
                  className={
                    passwordRequirements.special
                      ? "requirement valid"
                      : "requirement"
                  }
                >
                  <span>
                    {passwordRequirements.special ? "✓" : "○"}
                  </span>
                  One special character
                </div>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="signup-submit"
              disabled={loading || Boolean(success)}
            >
              {loading ? (
                <>
                  <span className="signup-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create patient account
                  <span className="signup-arrow">
                    →
                  </span>
                </>
              )}
            </button>

          </form>


          {/* LOGIN LINK */}

          <div className="signup-login-section">

            <span>
              Already have a patient account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Sign in
            </button>

          </div>


          {/* SECURITY */}

          <div className="signup-security">

            <span className="signup-security-icon">
              ✓
            </span>

            <div>
              <strong>
                Secure patient registration
              </strong>

              <span>
                Your account information is protected
                and securely managed.
              </span>
            </div>

          </div>


          <p className="signup-copyright">
            © {new Date().getFullYear()} Dr. Evans Pharmacy.
            All rights reserved.
          </p>

        </div>

      </section>

    </div>
  );
}

export default SignUpPage;