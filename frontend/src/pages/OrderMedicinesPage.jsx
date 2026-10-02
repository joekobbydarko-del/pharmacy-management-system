import { useMemo, useState } from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./OrderMedicinesPage.css";

function OrderMedicinesPage() {
  const userName =
    localStorage.getItem("user_name") || "Patient";

  const [search, setSearch] = useState("");
  const [selectedMedicine, setSelectedMedicine] =
    useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);

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

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const selectedMedicineData = medicines.find(
    (medicine) =>
      medicine.name === selectedMedicine
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedMedicine) return;

    setSubmitted(true);
  };

  const resetOrder = () => {
    setSelectedMedicine("");
    setQuantity(1);
    setSubmitted(false);
  };

  return (
    <section className="medicine-order-page">
      <div className="medicine-order-heading">
        <div>
          <span className="medicine-order-eyebrow">
            PATIENT MEDICINE ORDERS
          </span>

          <h1>Order Medicines</h1>

          <p>
            Browse available medicines and submit a
            pharmacy order from your patient account.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="medicine-summary-grid">
        <article className="medicine-summary-card">
          <span className="medicine-summary-icon medicine-summary-icon--teal">
            <PatientIcon
              name="medicine"
              size={23}
            />
          </span>

          <div>
            <span>AVAILABLE MEDICINES</span>
            <strong>{medicines.length}</strong>
            <small>
              Medicines currently listed
            </small>
          </div>
        </article>

        <article className="medicine-summary-card">
          <span className="medicine-summary-icon medicine-summary-icon--blue">
            <PatientIcon
              name="check"
              size={23}
            />
          </span>

          <div>
            <span>SELECTED ITEM</span>

            <strong>
              {selectedMedicine ? 1 : 0}
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
              size={23}
            />
          </span>

          <div>
            <span>ORDER QUANTITY</span>

            <strong>
              {selectedMedicine
                ? quantity
                : 0}
            </strong>

            <small>Requested units</small>
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

                <h2>Select Medicine</h2>
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

            {filteredMedicines.length === 0 ? (
              <div className="medicine-empty">
                <div className="medicine-empty-icon">
                  <PatientIcon
                    name="search"
                    size={27}
                  />
                </div>

                <h3>
                  No medicines found
                </h3>

                <p>
                  Try searching with a different
                  medicine name.
                </p>
              </div>
            ) : (
              <div className="medicine-list">
                {filteredMedicines.map(
                  (medicine) => {
                    const active =
                      selectedMedicine ===
                      medicine.name;

                    return (
                      <button
                        key={medicine.id}
                        type="button"
                        className={`medicine-item ${
                          active
                            ? "medicine-item--selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedMedicine(
                            medicine.name
                          );

                          setSubmitted(false);
                        }}
                      >
                        <span className="medicine-item-icon">
                          <PatientIcon
                            name="pill"
                            size={20}
                          />
                        </span>

                        <span className="medicine-item-info">
                          <strong>
                            {medicine.name}
                          </strong>

                          <small>
                            {medicine.category}
                          </small>
                        </span>

                        <span className="medicine-item-action">
                          <PatientIcon
                            name={
                              active
                                ? "check"
                                : "plus"
                            }
                            size={18}
                          />
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </article>

        <article className="medicine-panel medicine-order-summary">
          <div className="medicine-panel-header">
            <div className="medicine-panel-title">
              <span className="medicine-panel-icon">
                <PatientIcon
                  name="clipboard"
                  size={20}
                />
              </span>

              <div>
                <span className="medicine-section-eyebrow">
                  ORDER DETAILS
                </span>

                <h2>Order Summary</h2>
              </div>
            </div>
          </div>

          <div className="medicine-panel-body">
            {submitted ? (
              <div className="medicine-success">
                <div className="medicine-success-icon">
                  <PatientIcon
                    name="check"
                    size={27}
                  />
                </div>

                <h3>
                  Medicine request prepared
                </h3>

                <p>
                  Your medicine request has been
                  prepared for pharmacy processing.
                </p>

                <button
                  type="button"
                  onClick={resetOrder}
                >
                  Start Another Order
                </button>
              </div>
            ) : (
              <form
                className="medicine-order-form"
                onSubmit={handleSubmit}
              >
                <div className="medicine-order-detail">
                  <span>PATIENT</span>
                  <strong>{userName}</strong>
                </div>

                <div className="medicine-order-detail">
                  <span>
                    SELECTED MEDICINE
                  </span>

                  {selectedMedicineData ? (
                    <div className="medicine-selected-info">
                      <strong>
                        {
                          selectedMedicineData.name
                        }
                      </strong>

                      <small>
                        {
                          selectedMedicineData.category
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
                  <label htmlFor="medicine-quantity">
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
                      id="medicine-quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.max(
                            1,
                            Number(
                              event.target.value
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

                <div className="medicine-order-notice">
                  <span>
                    <PatientIcon
                      name="info"
                      size={17}
                    />
                  </span>

                  <p>
                    Medicine availability and final
                    pricing will be confirmed by the
                    pharmacy before the order is
                    processed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="medicine-submit-button"
                  disabled={!selectedMedicine}
                >
                  Submit Medicine Request

                  <PatientIcon
                    name="arrow"
                    size={16}
                  />
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
            size={20}
          />
        </span>

        <div>
          <strong>
            Secure medicine ordering
          </strong>

          <small>
            Your medicine requests are securely linked
            to your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default OrderMedicinesPage;