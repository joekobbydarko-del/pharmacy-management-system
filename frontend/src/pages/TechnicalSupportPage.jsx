import { useState } from "react";

function TechnicalSupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      return;
    }

    // Backend connection will be added during integration.
    setSent(true);
  };

  return (
    <section
      style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <span
          style={{
            color: "#0f9f98",
            fontSize: "10px",
            fontWeight: "900",
            letterSpacing: "2px",
          }}
        >
          PATIENT SUPPORT
        </span>

        <h1
          style={{
            margin: "7px 0 8px",
            color: "#073b4c",
            fontSize: "38px",
          }}
        >
          Technical Support
        </h1>

        <p
          style={{
            margin: 0,
            color: "#7894a7",
          }}
        >
          Send a support request if you need help using your
          patient portal.
        </p>
      </div>

      <div
        style={{
          padding: "28px",
          border: "1px solid #d9e8ed",
          borderRadius: "18px",
          background: "#ffffff",
        }}
      >
        {sent ? (
          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "#effaf8",
              color: "#073b4c",
            }}
          >
            <strong>Support request prepared.</strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#7894a7",
              }}
            >
              We will connect this form to the backend during
              the integration stage.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                marginBottom: "18px",
              }}
            >
              <label
                htmlFor="support-subject"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#073b4c",
                  fontWeight: "800",
                  fontSize: "13px",
                }}
              >
                Subject
              </label>

              <input
                id="support-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="What do you need help with?"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  border: "1px solid #d9e8ed",
                  borderRadius: "10px",
                  outline: "none",
                }}
                required
              />
            </div>

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                htmlFor="support-message"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#073b4c",
                  fontWeight: "800",
                  fontSize: "13px",
                }}
              >
                Message
              </label>

              <textarea
                id="support-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Describe the problem you're having..."
                rows={7}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #d9e8ed",
                  borderRadius: "10px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                minHeight: "44px",
                padding: "0 18px",
                border: "none",
                borderRadius: "10px",
                background: "#0f9f98",
                color: "#ffffff",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Send Support Request →
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default TechnicalSupportPage;