import PatientIcon from "../components/PatientIcon";

import "./DeliveryTrackingPage.css";


// ============================================================
// DR. EVANS PHARMACY
// DELIVERY TRACKING — PATIENT PORTAL
//
// Stage 1 foundation: navigation and route only.
// Live delivery status, rider information and any GPS tracking
// are added in a later stage, once an authorised delivery
// provider or rider system is connected. No delivery or rider
// data is displayed or fabricated on this page yet.
// ============================================================

function DeliveryTrackingPage() {
  const planned = [
    {
      icon: "package",
      title: "Delivery status",
      detail:
        "Follow each order from confirmed and preparing through to dispatched, out for delivery and delivered.",
    },
    {
      icon: "user",
      title: "Rider information",
      detail:
        "See your assigned rider and delivery provider once an order is dispatched, where available.",
    },
    {
      icon: "clock",
      title: "Live location",
      detail:
        "Authorised, privacy-safe rider location and estimated arrival will appear only when real GPS data is connected.",
    },
    {
      icon: "message",
      title: "Delivery updates",
      detail:
        "Quick, order-linked messages for active deliveries. Your medical details stay private.",
    },
  ];

  return (
    <section className="under-dev">

      <div className="under-dev__card">

        <span className="under-dev__icon under-dev__icon--navy">
          <PatientIcon
            name="package"
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

        <h1>Delivery Tracking</h1>

        <p className="under-dev__lead">
          Delivery tracking is being prepared. Soon you will be able
          to follow your medicine orders in real time and see your
          delivery progress. Until an authorised delivery provider
          is connected, this page will clearly show when live
          tracking is unavailable.
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
          Tracking will only show genuine, authorised delivery
          information — never an estimated or simulated location.
        </p>

      </div>

    </section>
  );
}

export default DeliveryTrackingPage;
