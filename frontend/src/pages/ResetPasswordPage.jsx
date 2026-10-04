import {
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  resetPassword,
} from "../api";

import "./ResetPasswordPage.css";


function ResetPasswordPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const token =
    searchParams.get("token") || "";


  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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
  ] = useState(false);


  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");


      if (!token) {
        setError(
          "This password reset link is missing its security token."
        );

        return;
      }


      if (
        password.length < 8
      ) {
        setError(
          "Password must be at least 8 characters long."
        );

        return;
      }


      if (
        !/[A-Za-z]/.test(
          password
        )
      ) {
        setError(
          "Password must contain at least one letter."
        );

        return;
      }


      if (
        !/[0-9]/.test(
          password
        )
      ) {
        setError(
          "Password must contain at least one number."
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {
        setError(
          "The passwords do not match."
        );

        return;
      }


      try {
        setLoading(true);

        await resetPassword(
          token,
          password
        );

        setSuccess(true);

        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        console.error(
          "Password reset failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to reset your password."
        );
      } finally {
        setLoading(false);
      }
    };


  if (success) {
    return (
      <main className="reset-password-page">

        <section className="reset-password-success">

          <div className="reset-password-success__icon">
            ✓
          </div>

          <span>
            PASSWORD UPDATED
          </span>

          <h1>
            Your password has been reset.
          </h1>

          <p>
            You can now sign in to
            Dr. Evans Pharmacy using
            your new password.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/login",
                {
                  replace: true,
                }
              )
            }
          >
            Return to sign in
            <span>
              →
            </span>
          </button>

        </section>

      </main>
    );
  }


  return (
    <main className="reset-password-page">

      <section className="reset-password-card">

        <div className="reset-password-logo">

          <img
            src="/dr-evans-logo.png"
            alt="Dr. Evans Pharmacy"
          />

        </div>


        <span className="reset-password-eyebrow">
          DR. EVANS PHARMACY
        </span>

        <h1>
          Create a new password
        </h1>

        <p className="reset-password-description">
          Choose a secure new password
          for your pharmacy account.
        </p>


        {!token && (

          <div className="reset-password-error">
            This reset link is invalid.
            Please request a new one.
          </div>

        )}


        {error && (

          <div className="reset-password-error">
            {error}
          </div>

        )}


        <form
          className="reset-password-form"
          onSubmit={handleSubmit}
        >

          <div className="reset-password-field">

            <label htmlFor="new-password">
              New password
            </label>

            <div className="reset-password-input-wrap">

              <input
                id="new-password"
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
                placeholder="Enter a new password"
                autoComplete="new-password"
                disabled={
                  loading ||
                  !token
                }
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          <div className="reset-password-field">

            <label htmlFor="confirm-password">
              Confirm new password
            </label>

            <input
              id="confirm-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              disabled={
                loading ||
                !token
              }
              required
            />

          </div>


          <div className="reset-password-rules">

            <strong>
              Your password must contain:
            </strong>

            <span>
              At least 8 characters
            </span>

            <span>
              At least one letter
            </span>

            <span>
              At least one number
            </span>

          </div>


          <button
            type="submit"
            className="reset-password-submit"
            disabled={
              loading ||
              !token
            }
          >
            {loading
              ? "Updating password..."
              : "Reset password"}
          </button>

        </form>


        <button
          type="button"
          className="reset-password-back"
          onClick={() =>
            navigate("/login")
          }
        >
          Back to sign in
        </button>

      </section>

    </main>
  );
}


export default ResetPasswordPage;