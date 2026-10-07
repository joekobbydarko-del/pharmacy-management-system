import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkoutAdminPOS,
  getAdminPOSProducts,
  getAdminPOSSales,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminPOSPage.css";

function POSIcon({
  name,
  size = 20,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    medicine: (
      <>
        <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    patient: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    prescription: (
      <>
        <rect
          x="5"
          y="3"
          width="14"
          height="18"
          rx="2"
        />

        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),

    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
        <path d="M16 10h4" />
        <circle cx="16" cy="13" r=".8" />
      </>
    ),

    money: (
      <>
        <circle cx="12" cy="12" r="9" />

        <path d="M15 8.5c-.7-.5-1.6-.8-2.6-.8-1.5 0-2.6.7-2.6 1.8 0 2.8 5.7 1.3 5.7 4.3 0 1.2-1.1 2.1-2.9 2.1-1.2 0-2.3-.4-3.1-1" />

        <path d="M12 6v12" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    minus: (
      <>
        <path d="M5 12h14" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    clipboard: (
      <>
        <rect
          x="5"
          y="4"
          width="14"
          height="17"
          rx="2"
        />

        <path d="M9 4.5V3h6v1.5" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.medicine}
    </svg>
  );
}

function formatCurrency(value) {
  return `GHS ${Number(value || 0).toFixed(2)}`;
}

function formatPaymentMethod(value) {
  const normalized = String(value || "")
    .replaceAll("_", " ")
    .trim();

  if (!normalized) {
    return "—";
  }

  return normalized
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatRecordStatus(value) {
  const normalized = String(
    value || "completed"
  )
    .replaceAll("_", " ")
    .trim();

  return normalized
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function AdminPOSPage() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    sales,
    setSales,
  ] = useState([]);

  const [
    cart,
    setCart,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    patientName,
    setPatientName,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("cash");

  const [
    amountPaid,
    setAmountPaid,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPOS() {
      try {
        const [
          productData,
          salesData,
        ] = await Promise.all([
          getAdminPOSProducts(),
          getAdminPOSSales(),
        ]);

        if (!cancelled) {
          setProducts(
            productData?.products ?? []
          );

          setSales(
            salesData?.sales ?? []
          );

          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load medication dispensing data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPOS();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return products;
      }

      return products.filter(
        (product) =>
          product.drug_name
            ?.toLowerCase()
            .includes(term) ||
          product.drug_id
            ?.toLowerCase()
            .includes(term) ||
          product.category
            ?.toLowerCase()
            .includes(term)
      );
    },
    [
      products,
      search,
    ]
  );

  const medicationTotal = useMemo(
    () => {
      return cart.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.price || 0
          ) *
            Number(
              item.quantity || 0
            ),
        0
      );
    },
    [cart]
  );

  const totalMedicationUnits = useMemo(
    () => {
      return cart.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );
    },
    [cart]
  );

  const balanceChange = Math.max(
    0,
    Number(
      amountPaid || 0
    ) - medicationTotal
  );

  function addMedication(product) {
    setSuccess("");
    setError("");

    if (
      Number(
        product.stock_quantity || 0
      ) <= 0
    ) {
      setError(
        `${product.drug_name} is currently unavailable.`
      );

      return;
    }

    const existing = cart.find(
      (item) =>
        item.drug_id ===
        product.drug_id
    );

    if (
      existing &&
      existing.quantity >=
        product.stock_quantity
    ) {
      setError(
        `Available stock limit reached for ${product.drug_name}.`
      );

      return;
    }

    setCart(
      (current) => {
        const currentItem =
          current.find(
            (item) =>
              item.drug_id ===
              product.drug_id
          );

        if (currentItem) {
          return current.map(
            (item) =>
              item.drug_id ===
              product.drug_id
                ? {
                    ...item,
                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          );
        }

        return [
          ...current,
          {
            ...product,
            quantity: 1,
          },
        ];
      }
    );
  }

  function updateQuantity(
    drugId,
    nextQuantity
  ) {
    setCart(
      (current) =>
        current.map(
          (item) => {
            if (
              item.drug_id !==
              drugId
            ) {
              return item;
            }

            const safeQuantity =
              Math.max(
                1,
                Math.min(
                  nextQuantity,
                  Number(
                    item.stock_quantity ||
                      1
                  )
                )
              );

            return {
              ...item,
              quantity:
                safeQuantity,
            };
          }
        )
    );
  }

  function removeMedication(
    drugId
  ) {
    setCart(
      (current) =>
        current.filter(
          (item) =>
            item.drug_id !==
            drugId
        )
    );
  }

  async function handleDispensing() {
    setError("");
    setSuccess("");

    if (
      cart.length === 0
    ) {
      setError(
        "Select at least one medicine before completing dispensing."
      );

      return;
    }

    if (
      Number(
        amountPaid || 0
      ) < medicationTotal
    ) {
      setError(
        "Amount received is less than the medication total."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await checkoutAdminPOS(
          {
            customer_name:
              patientName.trim() ||
              "Patient / Recipient",

            customer_type:
              "walk_in",

            patient_id:
              null,

            payment_method:
              paymentMethod,

            amount_paid:
              Number(
                amountPaid
              ),

            items:
              cart.map(
                (item) => ({
                  drug_id:
                    item.drug_id,

                  quantity:
                    item.quantity,
                })
              ),
          }
        );

      const [
        refreshedProducts,
        refreshedSales,
      ] = await Promise.all([
        getAdminPOSProducts(),
        getAdminPOSSales(),
      ]);

      setProducts(
        refreshedProducts?.products ??
          []
      );

      setSales(
        refreshedSales?.sales ??
          []
      );

      setCart([]);
      setPatientName("");
      setAmountPaid("");

      setSuccess(
        `Dispensing record ${
          result?.sale
            ?.sale_number ?? ""
        } completed successfully.`
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to complete medication dispensing."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-pos-page">
        <div className="admin-pos-loading">
          <div className="admin-pos-loading-icon">
            <POSIcon
              name="medicine"
              size={27}
            />
          </div>

          <strong>
            Loading Dispensing Workspace
          </strong>

          <span>
            Preparing medicines and
            dispensing records...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-pos-page">
      <AdminPageIntro
        eyebrow="Medication Services"
        title="Medication Dispensing"
        subtitle="Dispense medicines securely and manage pharmacy transactions from one workspace."
        accent="teal"
      />

      {error && (
        <div className="admin-pos-message admin-pos-message--error">
          <POSIcon
            name="alert"
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="admin-pos-message admin-pos-message--success">
          <POSIcon
            name="check"
            size={18}
          />

          <span>
            {success}
          </span>
        </div>
      )}

      <section className="admin-pos-workspace">
        <div className="admin-pos-products admin-pos-card--medicines">
          <div className="admin-pos-panel-header">
            <div className="admin-pos-panel-heading">
              <div className="admin-pos-panel-icon">
                <POSIcon
                  name="medicine"
                  size={21}
                />
              </div>

              <div>
                <span className="admin-pos-panel-eyebrow">
                  Medicine Selection
                </span>

                <h2>
                  Available Medicines
                </h2>
              </div>
            </div>

            <div className="admin-pos-product-count">
              <POSIcon
                name="medicine"
                size={14}
              />

              <span>
                {products.length}{" "}
                {products.length === 1
                  ? "medicine"
                  : "medicines"}
              </span>
            </div>
          </div>

          <div className="admin-pos-product-search-row">
            <div className="admin-pos-search">
              <POSIcon
                name="search"
                size={18}
              />

              <input
                type="search"
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target
                        .value
                    )
                }
                placeholder="Search medicine, code or category..."
              />

              {search && (
                <button
                  type="button"
                  className="admin-pos-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear medicine search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="admin-pos-product-list">
            {filteredProducts.length ===
            0 ? (
              <div className="admin-pos-empty-state">
                <POSIcon
                  name="search"
                  size={29}
                />

                <strong>
                  No medicines found
                </strong>

                <span>
                  Try another medicine
                  name, code or
                  category.
                </span>
              </div>
            ) : (
              filteredProducts.map(
                (product) => {
                  const outOfStock =
                    Number(
                      product.stock_quantity ||
                        0
                    ) <= 0;

                  return (
                    <button
                      type="button"
                      key={
                        product.drug_id
                      }
                      className="admin-pos-product-card"
                      onClick={() =>
                        addMedication(
                          product
                        )
                      }
                      disabled={
                        outOfStock
                      }
                    >
                      <div className="admin-pos-product-icon">
                        <POSIcon
                          name="medicine"
                          size={19}
                        />
                      </div>

                      <div className="admin-pos-product-main">
                        <strong>
                          {
                            product.drug_name
                          }
                        </strong>

                        <span>
                          {
                            product.drug_id
                          }

                          {product.category
                            ? ` • ${product.category}`
                            : ""}
                        </span>
                      </div>

                      <div className="admin-pos-product-meta">
                        <strong>
                          {formatCurrency(
                            product.price
                          )}
                        </strong>

                        <span
                          className={
                            outOfStock
                              ? "out"
                              : ""
                          }
                        >
                          {outOfStock
                            ? "Unavailable"
                            : `${product.stock_quantity} available`}
                        </span>
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>

        <aside className="admin-pos-dispensing admin-pos-card--dispensing">
          <div className="admin-pos-dispensing-header">
            <div className="admin-pos-dispensing-header__main">
              <div className="admin-pos-dispensing-icon">
                <POSIcon
                  name="prescription"
                  size={23}
                />
              </div>

              <div>
                <span>
                  Dispensing Record
                </span>

                <h2>
                  Current Dispensing
                </h2>
              </div>
            </div>

            <div className="admin-pos-dispensing-count">
              <strong>
                {
                  totalMedicationUnits
                }
              </strong>

              <span>
                {totalMedicationUnits ===
                1
                  ? "unit"
                  : "units"}
              </span>
            </div>
          </div>

          <div className="admin-pos-recipient-section">
            <label className="admin-pos-field">
              <span>
                Patient / Recipient
              </span>

              <div className="admin-pos-input-wrap">
                <POSIcon
                  name="patient"
                  size={17}
                />

                <input
                  type="text"
                  value={
                    patientName
                  }
                  onChange={
                    (event) =>
                      setPatientName(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter patient or recipient name"
                />
              </div>
            </label>

            <label className="admin-pos-field">
              <span>
                Payment Method
              </span>

              <div className="admin-pos-input-wrap">
                <POSIcon
                  name="wallet"
                  size={17}
                />

                <select
                  value={
                    paymentMethod
                  }
                  onChange={
                    (event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                  }
                >
                  <option value="cash">
                    Cash
                  </option>

                  <option value="mobile_money">
                    Mobile Money
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>
                </select>
              </div>
            </label>
          </div>

          <div className="admin-pos-selected-heading">
            <div>
              <strong>
                Selected Medicines
              </strong>
            </div>

            <span className="admin-pos-selected-count">
              {cart.length} selected
            </span>
          </div>

          <div className="admin-pos-cart-items">
            {cart.length === 0 ? (
              <div className="admin-pos-cart-empty">
                <div className="admin-pos-cart-empty-icon">
                  <POSIcon
                    name="medicine"
                    size={26}
                  />
                </div>

                <strong>
                  No medicines selected
                </strong>

                <span>
                  Select a medicine from
                  the list to begin
                  dispensing.
                </span>
              </div>
            ) : (
              cart.map(
                (item) => (
                  <article
                    key={
                      item.drug_id
                    }
                    className="admin-pos-cart-item"
                  >
                    <div className="admin-pos-cart-item-top">
                      <div className="admin-pos-cart-item-copy">
                        <strong>
                          {
                            item.drug_name
                          }
                        </strong>

                        <span>
                          {formatCurrency(
                            item.price
                          )}{" "}
                          per unit
                        </span>
                      </div>

                      <button
                        type="button"
                        className="admin-pos-remove-button"
                        onClick={() =>
                          removeMedication(
                            item.drug_id
                          )
                        }
                        aria-label={`Remove ${item.drug_name}`}
                      >
                        <POSIcon
                          name="trash"
                          size={15}
                        />
                      </button>
                    </div>

                    <div className="admin-pos-cart-item-bottom">
                      <div className="admin-pos-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.drug_id,
                              item.quantity -
                                1
                            )
                          }
                          aria-label="Reduce quantity"
                        >
                          <POSIcon
                            name="minus"
                            size={14}
                          />
                        </button>

                        <span>
                          {
                            item.quantity
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.drug_id,
                              item.quantity +
                                1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <POSIcon
                            name="plus"
                            size={14}
                          />
                        </button>
                      </div>

                      <strong className="admin-pos-cart-line-total">
                        {formatCurrency(
                          Number(
                            item.price
                          ) *
                            item.quantity
                        )}
                      </strong>
                    </div>
                  </article>
                )
              )
            )}
          </div>

          <div className="admin-pos-summary">
            <div className="admin-pos-summary-row">
              <span>
                Medication Total
              </span>

              <strong>
                {formatCurrency(
                  medicationTotal
                )}
              </strong>
            </div>

            <label className="admin-pos-amount-field">
              <span>
                Amount Received
              </span>

              <div className="admin-pos-input-wrap">
                <POSIcon
                  name="money"
                  size={17}
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    amountPaid
                  }
                  onChange={
                    (event) =>
                      setAmountPaid(
                        event.target
                          .value
                      )
                  }
                  placeholder="0.00"
                />
              </div>
            </label>

            <div className="admin-pos-summary-row admin-pos-summary-row--change">
              <span>
                Balance / Change
              </span>

              <strong>
                {formatCurrency(
                  balanceChange
                )}
              </strong>
            </div>

            <button
              type="button"
              className="admin-pos-checkout-button"
              onClick={
                handleDispensing
              }
              disabled={
                processing ||
                cart.length === 0
              }
            >
              <POSIcon
                name="check"
                size={18}
              />

              <span>
                {processing
                  ? "Completing..."
                  : "Complete Dispensing"}
              </span>
            </button>
          </div>
        </aside>
      </section>

      <section className="admin-pos-recent-sales admin-pos-card--history">
        <div className="admin-pos-panel-header">
          <div className="admin-pos-panel-heading">
            <div className="admin-pos-panel-icon">
              <POSIcon
                name="history"
                size={21}
              />
            </div>

            <div>
              <span className="admin-pos-panel-eyebrow">
                Dispensing History
              </span>

              <h2>
                Recent Dispensing Records
              </h2>
            </div>
          </div>

          <div className="admin-pos-sales-count">
            <POSIcon
              name="clipboard"
              size={14}
            />

            <span>
              {sales.length} recorded
            </span>
          </div>
        </div>

        <div className="admin-pos-sales-table-wrap">
          <table className="admin-pos-sales-table">
            <thead>
              <tr>
                <th>
                  Record
                </th>

                <th>
                  Patient / Recipient
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Medication Total
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="admin-pos-empty-cell"
                  >
                    <div className="admin-pos-empty-state">
                      <POSIcon
                        name="clipboard"
                        size={29}
                      />

                      <strong>
                        No dispensing
                        records yet
                      </strong>

                      <span>
                        Completed dispensing
                        records will appear
                        here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                sales
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td>
                          <strong className="admin-pos-sale-number">
                            {
                              record.sale_number
                            }
                          </strong>
                        </td>

                        <td>
                          <div className="admin-pos-patient-cell">
                            <span className="admin-pos-patient-cell__icon">
                              <POSIcon
                                name="patient"
                                size={14}
                              />
                            </span>

                            <span>
                              {record.customer_name ||
                                "Patient / Recipient"}
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatPaymentMethod(
                            record.payment_method
                          )}
                        </td>

                        <td>
                          <strong className="admin-pos-sale-total">
                            {formatCurrency(
                              record.total_amount
                            )}
                          </strong>
                        </td>

                        <td>
                          <span className="admin-pos-status">
                            <POSIcon
                              name="check"
                              size={12}
                            />

                            {formatRecordStatus(
                              record.status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPOSPage;