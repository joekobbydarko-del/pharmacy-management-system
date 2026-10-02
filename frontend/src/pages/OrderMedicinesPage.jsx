import {
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  createMedicineOrder,
} from "../api";

import {
  addPatientNotification,
} from "../utils/patientNotifications";

import "./OrderMedicinesPage.css";

function OrderMedicinesPage() {
  const userId =
    localStorage.getItem("user_id");

  const [search, setSearch] =
    useState("");

  const [
    selectedMedicine,
    setSelectedMedicine,
  ] = useState(null);

  const [quantity, setQuantity] =
    useState(1);

  const [notes, setNotes] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const medicines = useMemo(
    () => [
      {
        id: 1,
        name: "Paracetamol",
        category: "Pain Relief",
      },
      {
        id: 2,
        name: "Amoxicillin",
        category: "Antibiotic",
      },
      {
        id: 3,
        name: "Vitamin C",
        category: "Supplement",
      },
      {
        id: 4,
        name: "Ibuprofen",
        category: "Pain Relief",
      },
    ],
    []
  );

  const filteredMedicines =
    medicines.filter((medicine) => {
      const query =
        search.toLowerCase();

      return (
        medicine.name
          .toLowerCase()
          .includes(query) ||
        medicine.category
          .toLowerCase()
          .includes(query)
      );
    });

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !userId ||
        !selectedMedicine
      ) {
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        await createMedicineOrder(
          userId,
          selectedMedicine.name,
          quantity,
          notes.trim() || null
        );

        addPatientNotification({
          title:
            "Medicine order submitted",

          message:
            `Your order for ${quantity} × ${selectedMedicine.name} has been sent to the pharmacy.`,

          icon: "package",
        });

        setSubmitted(true);
      } catch (err) {
        setError(
          err.message ||
            "Unable to submit medicine order."
        );
      } finally {
        setSubmitting(false);
      }
    };

  const resetOrder = () => {
    setSelectedMedicine(null);
    setQuantity(1);
    setNotes("");
    setError("");
    setSubmitted(false);
  };

  return (
    <section className="medicine-order-page">
      <div className="medicine-order-heading">
        <div>
          <span className="medicine-order-eyebrow">
            PATIENT MEDICINE ORDERS
          </span>

          <h1>
            Order Medicines
          </h1>

          <p>
            Browse available medicines
            and submit a pharmacy order
            from your patient account.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="medicine-summary-grid">
        <article className="medicine-summary-card">
          <span className="medicine-summary-icon medicine-summary-icon--teal">
            <PatientIcon
              name="medicine"
              size={22}
            />
          </span>

          <div>
            <span>
              AVAILABLE MEDICINES
            </span>

            <strong>
              {medicines.length}
            </strong>

            <small>
              Medicines currently listed
            </small>
          </div>
        </article>

        <article className="medicine-summary-card">
          <span className="medicine-summary-icon medicine-summary-icon--blue">
            <PatientIcon
              name="check"
              size={22}
            />
          </span>

          <div>
            <span>
              SELECTED ITEM
            </span>

            <strong>
              {selectedMedicine
                ? 1
                : 0}
            </strong>

            <small>
              Medicine selected for order
            </small>
          </div>
        </article>

        <article className="medicine-summary-card">
          <span className="medicine-summary-icon medicine-summary-icon--orange">
            <PatientIcon
              name="package"
              size={22}
            />
          </span>

          <div>
            <span>
              ORDER QUANTITY
            </span>

            <strong>
              {selectedMedicine
                ? quantity
                : 0}
            </strong>

            <small>
              Requested units
            </small>
          </div>
        </article>
      </div>

      <div className="medicine-order-grid">
        <article className="medicine-panel">
          <div className="medicine-panel-header">
            <div className="medicine-panel-title">
              <span className="medicine-panel-icon">
                <PatientIcon
                  name="medicine"
                  size={20}
                />
              </span>

              <div>
                <span className="medicine-section-eyebrow">
                  PHARMACY CATALOGUE
                </span>

                <h2>
                  Select Medicine
                </h2>
              </div>
            </div>
          </div>

          <div className="medicine-panel-body">
            <div className="medicine-search-box">
              <span>
                <PatientIcon
                  name="search"
                  size={18}
                />
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search available medicines..."
              />
            </div>

            <div className="medicine-list">
              {filteredMedicines.map(
                (medicine) => (
                  <button
                    key={medicine.id}
                    type="button"
                    className={`medicine-item ${
                      selectedMedicine?.id ===
                      medicine.id
                        ? "medicine-item--selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMedicine(
                        medicine
                      )
                    }
                  >
                    <span className="medicine-item-icon">
                      <PatientIcon
                        name="pill"
                        size={19}
                      />
                    </span>

                    <span className="medicine-item-info">
                      <strong>
                        {medicine.name}
                      </strong>

                      <small>
                        {
                          medicine.category
                        }
                      </small>
                    </span>

                    <span className="medicine-item-action">
                      <PatientIcon
                        name="plus"
                        size={16}
                      />
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </article>

        <article className="medicine-panel medicine-order-summary">
          <div className="medicine-panel-header">
            <div className="medicine-panel-title">
              <span className="medicine-panel-icon">
                <PatientIcon
                  name="package"
                  size={20}
                />
              </span>

              <div>
                <span className="medicine-section-eyebrow">
                  ORDER DETAILS
                </span>

                <h2>
                  Order Summary
                </h2>
              </div>
            </div>
          </div>

          <div className="medicine-panel-body">
            {submitted ? (
              <div className="medicine-success">
                <div className="medicine-success-icon">
                  <PatientIcon
                    name="check"
                    size={28}
                  />
                </div>

                <h3>
                  Medicine order sent
                </h3>

                <p>
                  Your medicine order was
                  submitted successfully
                  and is now awaiting
                  pharmacy review.
                </p>

                <button
                  type="button"
                  onClick={resetOrder}
                >
                  Place Another Order
                </button>
              </div>
            ) : (
              <form
                className="medicine-order-form"
                onSubmit={
                  handleSubmit
                }
              >
                <div className="medicine-order-detail">
                  <span>
                    PATIENT
                  </span>

                  <strong>
                    {localStorage.getItem(
                      "user_name"
                    ) || "Patient"}
                  </strong>
                </div>

                <div className="medicine-order-detail">
                  <span>
                    SELECTED MEDICINE
                  </span>

                  {selectedMedicine ? (
                    <div className="medicine-selected-info">
                      <strong>
                        {
                          selectedMedicine.name
                        }
                      </strong>

                      <small>
                        {
                          selectedMedicine.category
                        }
                      </small>
                    </div>
                  ) : (
                    <strong className="medicine-not-selected">
                      No medicine selected
                    </strong>
                  )}
                </div>

                <div className="medicine-order-field">
                  <label>
                    Quantity
                  </label>

                  <div className="medicine-quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (current) =>
                            Math.max(
                              1,
                              current - 1
                            )
                        )
                      }
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.max(
                            1,
                            Number(
                              event.target
                                .value
                            ) || 1
                          )
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (current) =>
                            current + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="medicine-order-field">
                  <label htmlFor="medicine-notes">
                    Additional note
                  </label>

                  <textarea
                    id="medicine-notes"
                    rows="4"
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    placeholder="Optional message for the pharmacy..."
                  />
                </div>

                <div className="medicine-order-notice">
                  <span>
                    <PatientIcon
                      name="info"
                      size={16}
                    />
                  </span>

                  <p>
                    Medicine availability
                    and final pricing will
                    be confirmed by the
                    pharmacy before the
                    order is processed.
                  </p>
                </div>

                {error && (
                  <div className="medicine-order-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="medicine-submit-button"
                  disabled={
                    !selectedMedicine ||
                    submitting
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Medicine Request"}

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
      </div>

      <div className="medicine-security">
        <span>
          <PatientIcon
            name="shield"
            size={19}
          />
        </span>

        <div>
          <strong>
            Secure medicine ordering
          </strong>

          <small>
            Your medicine requests are
            securely linked to your
            patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default OrderMedicinesPage;