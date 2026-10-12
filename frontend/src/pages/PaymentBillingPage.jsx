import PatientIcon from "../components/PatientIcon";

import "./PaymentBillingPage.css";


// ============================================================
// DR. EVANS PHARMACY
// PAYMENT & BILLING — PATIENT PORTAL
//
// Stage 1 foundation: navigation and route only.
// Full Mobile Money (Paystack) and Bank Transfer workflows,
// invoices, receipts and transaction history are added in a
// later stage. No financial data is displayed or fabricated
// on this page yet.
// ============================================================

function PaymentBillingPage() {
  const planned = [
    {
      icon: "orders",
      title: "Outstanding invoices",
      detail:
        "View each invoice, amount due and remaining balance in GHS. Pay one invoice at a time.",
    },
    {
      icon: "check",
      title: "Verified payments",
      detail:
        "Mobile Money and Bank Transfer payments confirmed by the pharmacy before a receipt is issued.",
    },
    {
      icon: "clipboard",
      title: "Invoices & receipts",
      detail:
        "View and download invoices, and download receipts only after a payment is verified.",
    },
    {
      icon: "clock",
      title: "Payment history",
      detail:
        "Searchable record of every transaction, method and verified status.",
    },
    {
      icon: "settings",
      title: "Payment preferences",
      detail:
        "Change your preferred payment method — Mobile Money or Bank Transfer — at any time.",
    },
  ];

  return (
    <section className="under-dev">

      <div className="under-dev__card">

        <span className="under-dev__icon under-dev__icon--teal">
          <PatientIcon
            name="orders"
            size={30}
          />
        </span>

        <span className="under-dev__badge">
          <PatientIcon
            name="clock"
            size={13}
          />
          Under development
        </span>

        <h1>Payment &amp; Billing</h1>

        <p className="under-dev__lead">
          Your pharmacy billing centre is being prepared. Soon you
          will be able to review invoices, pay securely by Mobile
          Money or Bank Transfer, and download verified receipts.
          All amounts are shown in Ghana cedis (GHS).
        </p>

        <div className="under-dev__list">
          {planned.map((item) => (
            <div
              key={item.title}
              className="under-dev__list-item"
            >
              <span className="under-dev__list-icon">
                <PatientIcon
                  name={item.icon}
                  size={18}
                />
              </span>

              <div>
                <strong>
                  {item.title}
                </strong>

                <small>
                  {item.detail}
                </small>
              </div>
            </div>
          ))}
        </div>

        <p className="under-dev__note">
          For billing questions in the meantime, please use
          Technical Support or contact the pharmacy directly.
        </p>

      </div>

    </section>
  );
}

export default PaymentBillingPage;
