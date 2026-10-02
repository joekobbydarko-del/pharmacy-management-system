import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await login(
        email.trim(),
        password
      );

      if (data?.user_id) {
        localStorage.setItem(
          "user_id",
          String(data.user_id)
        );
      }

      if (data?.user_name) {
        localStorage.setItem(
          "user_name",
          data.user_name
        );
      } else if (data?.name) {
        localStorage.setItem(
          "user_name",
          data.name
        );
      }

      if (data?.role) {
        localStorage.setItem(
          "role",
          data.role
        );
      }

      if (data?.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      if (data?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/patient");
      }
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err?.message ||
          "Unable to sign in. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {/* LEFT BRAND PANEL */}

      <section className="login-brand">
        <div className="login-brand__decor login-brand__decor--top" />
        <div className="login-brand__decor login-brand__decor--bottom" />

        <div className="login-brand__content">
          <div className="login-brand__logo">
            <img
              src="/dr-evans-logo.png"
              alt="Dr. Evans Pharmacy"
            />
          </div>

          <span className="login-brand__eyebrow">
            DR. EVANS PHARMACY
          </span>

          <h1>
            Your health.
            <br />
            Our care.
          </h1>

          <p className="login-brand__description">
            A secure digital pharmacy experience designed
            to help you manage prescriptions, medicines,
            refills, and your healthcare needs with
            confidence.
          </p>

          <div className="login-benefits">
            <div className="login-benefit">
              <span className="login-benefit__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m7.2 16.8 9.6-9.6" />
                  <path d="M6.3 18a4.45 4.45 0 0 1 0-6.3l5.4-5.4a4.45 4.45 0 1 1 6.3 6.3L12.6 18a4.45 4.45 0 0 1-6.3 0Z" />
                  <path d="m9.2 9.2 5.6 5.6" />
                </svg>
              </span>

              <div>
                <strong>
                  Prescription Care
                </strong>

                <p>
                  Keep track of your medications and
                  instructions.
                </p>
              </div>
            </div>

            <div className="login-benefit">
              <span className="login-benefit__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>

              <div>
                <strong>
                  Convenient Pharmacy Services
                </strong>

                <p>
                  Manage medicine orders and refill
                  requests online.
                </p>
              </div>
            </div>

            <div className="login-benefit">
              <span className="login-benefit__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>

              <div>
                <strong>
                  Secure Patient Portal
                </strong>

                <p>
                  Your account is protected by secure
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="login-brand__footer">
          <span>
            DR. EVANS PHARMACY
          </span>

          <span>
            Patient Care Portal
          </span>
        </footer>
      </section>

      {/* RIGHT LOGIN PANEL */}

      <section className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-heading">
            <span className="login-form-eyebrow">
              PATIENT PORTAL
            </span>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to securely access your pharmacy
              account.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="login-error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-password-field">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
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

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}

              {!loading && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h13" />
                  <path d="m13 7 5 5-5 5" />
                </svg>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />

            <p>
              NEW TO DR. EVANS PHARMACY?
            </p>

            <span />
          </div>

          <button
            type="button"
            className="login-create-account"
            onClick={() =>
              navigate("/signup")
            }
          >
            Create a patient account
          </button>

          <div className="login-security">
            <span className="login-security__icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>

            <div>
              <strong>
                Secure patient access
              </strong>

              <p>
                Your account information is protected.
              </p>
            </div>
          </div>

          <p className="login-copyright">
            © 2026 Dr. Evans Pharmacy. All rights
            reserved.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;