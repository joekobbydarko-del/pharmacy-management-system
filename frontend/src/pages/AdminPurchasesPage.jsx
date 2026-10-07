import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAdminPurchase,
  getAdminPurchaseDrugs,
  getAdminPurchases,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminPurchasesPage.css";


function PurchaseIcon({
  name,
  size = 20,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
        <path d="M12 11v10" />
      </>
    ),

    supplier: (
      <>
        <path d="M3 21V8l6-3v16" />
        <path d="M9 21V3l12 5v13" />
        <path d="M13 9h2" />
        <path d="M17 9h2" />
        <path d="M13 13h2" />
        <path d="M17 13h2" />
      </>
    ),

    reference: (
      <>
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
        />

        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
        <path d="M16 10h4" />
      </>
    ),

    medicine: (
      <>
        <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </>
    ),

    quantity: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),

    money: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

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

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 1 13h8l1-13" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </>
    ),

    stock: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 17 8 4 8-4" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    alert: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.package}
    </svg>
  );
}


function formatCurrency(value) {
  return `GHS ${Number(
    value || 0
  ).toFixed(2)}`;
}


function formatWords(value) {
  const text = String(
    value || ""
  )
    .replaceAll("_", " ")
    .trim();

  if (!text) {
    return "—";
  }

  return text
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}


function AdminPurchasesPage() {
  const [
    drugs,
    setDrugs,
  ] = useState([]);

  const [
    purchases,
    setPurchases,
  ] = useState([]);

  const [
    suppliers,
    setSuppliers,
  ] = useState([]);

  const [
    supplierId,
    setSupplierId,
  ] = useState("");

  const [
    referenceNumber,
    setReferenceNumber,
  ] = useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("paid");

  const [
    selectedDrugId,
    setSelectedDrugId,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    unitCost,
    setUnitCost,
  ] = useState("");

  const [
    cart,
    setCart,
  ] = useState([]);

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


  async function loadPurchaseData() {
    const [
      drugsData,
      purchasesData,
    ] = await Promise.all([
      getAdminPurchaseDrugs(),
      getAdminPurchases(),
    ]);

    setDrugs(
      drugsData?.drugs ??
        []
    );

    setPurchases(
      purchasesData?.purchases ??
        []
    );

    setSuppliers(
      (
        purchasesData?.suppliers ??
        []
      ).filter(
        (supplier) =>
          supplier?.is_active !== false
      )
    );
  }


  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [
          drugsData,
          purchasesData,
        ] = await Promise.all([
          getAdminPurchaseDrugs(),
          getAdminPurchases(),
        ]);

        if (cancelled) {
          return;
        }

        setDrugs(
          drugsData?.drugs ??
            []
        );

        setPurchases(
          purchasesData?.purchases ??
            []
        );

        setSuppliers(
          (
            purchasesData?.suppliers ??
            []
          ).filter(
            (supplier) =>
              supplier?.is_active !==
              false
          )
        );

        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load medicine receiving data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);


  const selectedDrug =
    useMemo(
      () => {
        return drugs.find(
          (drug) =>
            drug.drug_id ===
            selectedDrugId
        );
      },
      [
        drugs,
        selectedDrugId,
      ]
    );


  const selectedSupplier =
    useMemo(
      () => {
        return suppliers.find(
          (supplier) =>
            supplier.supplier_id ===
            supplierId
        );
      },
      [
        suppliers,
        supplierId,
      ]
    );


  const total =
    useMemo(
      () => {
        return cart.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.total_cost ||
                0
            ),
          0
        );
      },
      [
        cart,
      ]
    );


  const totalUnits =
    useMemo(
      () => {
        return cart.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.quantity ||
                0
            ),
          0
        );
      },
      [
        cart,
      ]
    );


  function handleDrugChange(
    drugId
  ) {
    setSelectedDrugId(
      drugId
    );

    const drug =
      drugs.find(
        (item) =>
          item.drug_id ===
          drugId
      );

    if (drug) {
      setUnitCost(
        String(
          drug.cost_price ??
            ""
        )
      );
    } else {
      setUnitCost("");
    }
  }


  function addItem() {
    setError("");
    setSuccess("");

    if (!selectedDrug) {
      setError(
        "Select a medicine first."
      );

      return;
    }

    const safeQuantity =
      Number(quantity);

    const safeUnitCost =
      Number(unitCost);

    if (
      !safeQuantity ||
      safeQuantity < 1
    ) {
      setError(
        "Quantity must be at least 1."
      );

      return;
    }

    if (
      Number.isNaN(
        safeUnitCost
      ) ||
      safeUnitCost < 0
    ) {
      setError(
        "Enter a valid unit cost."
      );

      return;
    }

    setCart(
      (current) => {
        const existing =
          current.find(
            (item) =>
              item.drug_id ===
              selectedDrug.drug_id
          );

        if (existing) {
          return current.map(
            (item) => {
              if (
                item.drug_id !==
                selectedDrug.drug_id
              ) {
                return item;
              }

              const nextQuantity =
                item.quantity +
                safeQuantity;

              return {
                ...item,

                quantity:
                  nextQuantity,

                unit_cost:
                  safeUnitCost,

                total_cost:
                  nextQuantity *
                  safeUnitCost,
              };
            }
          );
        }

        return [
          ...current,

          {
            drug_id:
              selectedDrug.drug_id,

            drug_name:
              selectedDrug.drug_name,

            quantity:
              safeQuantity,

            unit_cost:
              safeUnitCost,

            total_cost:
              safeQuantity *
              safeUnitCost,
          },
        ];
      }
    );

    setQuantity(1);
  }


  function removeItem(
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


  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (!supplierId) {
      setError(
        "Select the supplier that delivered these medicines."
      );

      return;
    }

    if (!selectedSupplier) {
      setError(
        "Selected supplier is not available. Refresh the page and try again."
      );

      return;
    }

    if (
      cart.length === 0
    ) {
      setError(
        "Add at least one medicine."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await createAdminPurchase(
          {
            supplier_id:
              supplierId,

            reference_number:
              referenceNumber.trim() ||
              null,

            payment_status:
              paymentStatus,

            items:
              cart.map(
                (item) => ({
                  drug_id:
                    item.drug_id,

                  quantity:
                    item.quantity,

                  unit_cost:
                    item.unit_cost,
                })
              ),
          }
        );

      await loadPurchaseData();

      setSupplierId("");
      setReferenceNumber("");
      setSelectedDrugId("");
      setUnitCost("");
      setQuantity(1);
      setCart([]);

      setSuccess(
        `Purchase ${
          result?.purchase
            ?.purchase_number ??
          ""
        } recorded successfully.`
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to record purchase."
      );
    } finally {
      setProcessing(false);
    }
  }


  if (loading) {
    return (
      <div className="admin-purchases-page">
        <div className="admin-purchases-loading">
          <div className="admin-purchases-loading-icon">
            <PurchaseIcon
              name="package"
              size={28}
            />
          </div>

          <strong>
            Loading Stock Receiving
          </strong>

          <span>
            Preparing suppliers, medicines and purchase records...
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="admin-purchases-page">
      <AdminPageIntro
        eyebrow="Inventory Receiving"
        title="Purchases"
        subtitle="Record medicines received from approved suppliers and update pharmacy inventory securely."
        accent="teal"
      />


      {error && (
        <div className="admin-purchases-message error">
          <PurchaseIcon
            name="alert"
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}


      {success && (
        <div className="admin-purchases-message success">
          <PurchaseIcon
            name="check"
            size={18}
          />

          <span>
            {success}
          </span>
        </div>
      )}


      <section className="admin-purchases-grid">
        <article className="admin-purchases-card admin-purchases-entry-card">
          <div className="admin-purchases-card-header">
            <div className="admin-purchases-card-heading">
              <div className="admin-purchases-card-icon">
                <PurchaseIcon
                  name="package"
                  size={21}
                />
              </div>

              <div>
                <span className="admin-purchases-card-eyebrow">
                  Stock Intake
                </span>

                <h2>
                  Receive Medicines
                </h2>

                <p>
                  Record stock delivered by a registered supplier
                </p>
              </div>
            </div>

            <div className="admin-purchases-unit-chip">
              <PurchaseIcon
                name="medicine"
                size={14}
              />

              <span>
                {totalUnits} units
              </span>
            </div>
          </div>


          <div className="admin-purchases-form">
            <label>
              <span>
                Supplier
              </span>

              <div className="admin-purchases-input-wrap">
                <PurchaseIcon
                  name="supplier"
                  size={17}
                />

                <select
                  value={
                    supplierId
                  }
                  onChange={
                    (event) =>
                      setSupplierId(
                        event.target
                          .value
                      )
                  }
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={
                          supplier.supplier_id
                        }
                        value={
                          supplier.supplier_id
                        }
                      >
                        {`${supplier.supplier_name} — ${supplier.supplier_code || supplier.supplier_id}`}
                      </option>
                    )
                  )}
                </select>
              </div>

              {suppliers.length ===
                0 && (
                <small>
                  No active suppliers available. Add a supplier from the Suppliers page first.
                </small>
              )}
            </label>


            <label>
              <span>
                Reference Number
              </span>

              <div className="admin-purchases-input-wrap">
                <PurchaseIcon
                  name="reference"
                  size={17}
                />

                <input
                  type="text"
                  value={
                    referenceNumber
                  }
                  onChange={
                    (event) =>
                      setReferenceNumber(
                        event.target
                          .value
                      )
                  }
                  placeholder="Invoice or delivery reference"
                />
              </div>
            </label>


            <label>
              <span>
                Payment Status
              </span>

              <div className="admin-purchases-input-wrap">
                <PurchaseIcon
                  name="wallet"
                  size={17}
                />

                <select
                  value={
                    paymentStatus
                  }
                  onChange={
                    (event) =>
                      setPaymentStatus(
                        event.target
                          .value
                      )
                  }
                >
                  <option value="paid">
                    Paid
                  </option>

                  <option value="pending">
                    Pending
                  </option>
                </select>
              </div>
            </label>
          </div>


          <div className="admin-purchases-builder">
            <div className="admin-purchases-builder-heading">
              <strong>
                Add Medicine
              </strong>
            </div>


            <div className="admin-purchases-item-builder">
              <label className="admin-purchases-medicine-field">
                <span>
                  Medicine
                </span>

                <div className="admin-purchases-input-wrap">
                  <PurchaseIcon
                    name="medicine"
                    size={17}
                  />

                  <select
                    value={
                      selectedDrugId
                    }
                    onChange={
                      (event) =>
                        handleDrugChange(
                          event.target
                            .value
                        )
                    }
                  >
                    <option value="">
                      Select medicine
                    </option>

                    {drugs.map(
                      (drug) => (
                        <option
                          key={
                            drug.drug_id
                          }
                          value={
                            drug.drug_id
                          }
                        >
                          {`${drug.drug_name} — Stock ${drug.current_stock}`}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </label>


              <label>
                <span>
                  Quantity
                </span>

                <div className="admin-purchases-input-wrap">
                  <PurchaseIcon
                    name="quantity"
                    size={17}
                  />

                  <input
                    type="number"
                    min="1"
                    value={
                      quantity
                    }
                    onChange={
                      (event) =>
                        setQuantity(
                          event.target
                            .value
                        )
                    }
                  />
                </div>
              </label>


              <label>
                <span>
                  Unit Cost
                </span>

                <div className="admin-purchases-input-wrap">
                  <PurchaseIcon
                    name="money"
                    size={17}
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      unitCost
                    }
                    onChange={
                      (event) =>
                        setUnitCost(
                          event.target
                            .value
                        )
                    }
                    placeholder="0.00"
                  />
                </div>
              </label>


              <button
                type="button"
                className="admin-purchases-add-button"
                onClick={
                  addItem
                }
              >
                <PurchaseIcon
                  name="plus"
                  size={17}
                />

                <span>
                  Add
                </span>
              </button>
            </div>
          </div>


          <div className="admin-purchases-cart">
            {cart.length === 0 ? (
              <div className="admin-purchases-cart-empty">
                <div className="admin-purchases-empty-icon">
                  <PurchaseIcon
                    name="medicine"
                    size={26}
                  />
                </div>

                <strong>
                  No medicines added
                </strong>

                <span>
                  Add medicines above to build this receiving record.
                </span>
              </div>
            ) : (
              cart.map(
                (item) => (
                  <div
                    className="admin-purchases-cart-row"
                    key={
                      item.drug_id
                    }
                  >
                    <div className="admin-purchases-cart-main">
                      <div className="admin-purchases-cart-icon">
                        <PurchaseIcon
                          name="medicine"
                          size={16}
                        />
                      </div>

                      <div>
                        <strong>
                          {
                            item.drug_name
                          }
                        </strong>

                        <span>
                          {`${item.quantity} × ${formatCurrency(
                            item.unit_cost
                          )}`}
                        </span>
                      </div>
                    </div>

                    <div className="admin-purchases-cart-total">
                      <strong>
                        {formatCurrency(
                          item.total_cost
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(
                            item.drug_id
                          )
                        }
                        aria-label={`Remove ${item.drug_name}`}
                      >
                        <PurchaseIcon
                          name="trash"
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>


          <div className="admin-purchases-total">
            <div>
              <span>
                Purchase Total
              </span>

              <small>
                {cart.length} medicine types
              </small>
            </div>

            <strong>
              {formatCurrency(
                total
              )}
            </strong>
          </div>


          <button
            type="button"
            className="admin-purchases-submit-button"
            disabled={
              processing ||
              cart.length === 0 ||
              !supplierId
            }
            onClick={
              handleSubmit
            }
          >
            <PurchaseIcon
              name="check"
              size={18}
            />

            <span>
              {processing
                ? "Recording..."
                : "Record Purchase"}
            </span>
          </button>
        </article>


        <article className="admin-purchases-card admin-purchases-stock-card">
          <div className="admin-purchases-card-header">
            <div className="admin-purchases-card-heading">
              <div className="admin-purchases-card-icon">
                <PurchaseIcon
                  name="stock"
                  size={21}
                />
              </div>

              <div>
                <span className="admin-purchases-card-eyebrow">
                  Inventory Reference
                </span>

                <h2>
                  Current Stock
                </h2>

                <p>
                  Medicine quantities before receiving
                </p>
              </div>
            </div>

            <div className="admin-purchases-stock-count">
              {drugs.length}
            </div>
          </div>


          <div className="admin-purchases-stock-list">
            {drugs.map(
              (drug) => (
                <div
                  className="admin-purchases-stock-row"
                  key={
                    drug.drug_id
                  }
                >
                  <div className="admin-purchases-stock-main">
                    <div className="admin-purchases-stock-icon">
                      <PurchaseIcon
                        name="medicine"
                        size={16}
                      />
                    </div>

                    <div>
                      <strong>
                        {
                          drug.drug_name
                        }
                      </strong>

                      <span>
                        {drug.drug_id}

                        {drug.category
                          ? ` • ${drug.category}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="admin-purchases-stock-value">
                    <strong>
                      {
                        drug.current_stock
                      }
                    </strong>

                    <span>
                      {formatCurrency(
                        drug.cost_price
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </article>
      </section>


      <section className="admin-purchases-card admin-purchases-history">
        <div className="admin-purchases-history-header">
          <div className="admin-purchases-card-heading">
            <div className="admin-purchases-card-icon">
              <PurchaseIcon
                name="history"
                size={21}
              />
            </div>

            <div>
              <span className="admin-purchases-card-eyebrow">
                Receiving History
              </span>

              <h2>
                Purchase Records
              </h2>

              <p>
                Medicines received from registered suppliers
              </p>
            </div>
          </div>

          <div className="admin-purchases-history-count">
            <PurchaseIcon
              name="reference"
              size={14}
            />

            <span>
              {purchases.length} records
            </span>
          </div>
        </div>


        <div className="admin-purchases-table-wrap">
          <table className="admin-purchases-table">
            <thead>
              <tr>
                <th>
                  Purchase
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Reference
                </th>

                <th>
                  Items
                </th>

                <th>
                  Total
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {purchases.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="admin-purchases-empty-cell"
                  >
                    <div className="admin-purchases-cart-empty">
                      <div className="admin-purchases-empty-icon">
                        <PurchaseIcon
                          name="history"
                          size={27}
                        />
                      </div>

                      <strong>
                        No purchase records yet
                      </strong>

                      <span>
                        Recorded supplier deliveries will appear here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map(
                  (purchase) => (
                    <tr
                      key={
                        purchase.id
                      }
                    >
                      <td>
                        <strong className="admin-purchases-number">
                          {
                            purchase.purchase_number
                          }
                        </strong>
                      </td>

                      <td>
                        <div className="admin-purchases-supplier-cell">
                          <span>
                            <PurchaseIcon
                              name="supplier"
                              size={14}
                            />
                          </span>

                          <div>
                            <strong>
                              {
                                purchase.supplier_name
                              }
                            </strong>

                            {purchase.supplier_id && (
                              <small>
                                {
                                  purchase.supplier_id
                                }
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {purchase.reference_number ||
                          "—"}
                      </td>

                      <td>
                        {
                          purchase.item_count
                        }
                      </td>

                      <td>
                        <strong className="admin-purchases-money">
                          {formatCurrency(
                            purchase.total_amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`admin-purchases-payment ${
                            purchase.payment_status ===
                            "paid"
                              ? "paid"
                              : "pending"
                          }`}
                        >
                          {formatWords(
                            purchase.payment_status
                          )}
                        </span>
                      </td>

                      <td>
                        <span className="admin-purchases-status">
                          <PurchaseIcon
                            name="check"
                            size={12}
                          />

                          {formatWords(
                            purchase.status
                          )}
                        </span>
                      </td>

                      <td className="admin-purchases-date">
                        {purchase.created_at
                          ? new Date(
                              purchase.created_at
                            ).toLocaleString(
                              undefined,
                              {
                                dateStyle:
                                  "medium",

                                timeStyle:
                                  "short",
                              }
                            )
                          : "—"}
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


export default AdminPurchasesPage;