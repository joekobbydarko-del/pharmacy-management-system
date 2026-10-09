
import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkoutAdminPOS,
  getAdminPatients,
  getAdminPOSProducts,
  getAdminPOSSales,
} from "../api";
import AdminPageIntro from "../components/AdminPageIntro";
import "./AdminPOSPage.css";

const PAYMENT_OPTIONS = [
  {
    value: "cash",
    label: "Cash",
    description: "Record payment received in cash",
    icon: "money",
  },
  {
    value: "mobile_money",
    label: "Mobile Money",
    description: "Record a mobile money payment",
    icon: "phone",
  },
  {
    value: "card",
    label: "Card",
    description: "Record a card payment",
    icon: "card",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Record payment by bank transfer",
    icon: "bank",
  },
];

function POSIcon({ name, size = 20 }) {
  const paths = {
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
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-2.5-2-5.2-1-5.2 1.1 0 2.8 5.7 1.3 5.7 4.3 0 2.1-3.6 2.8-6 1.1M12 6v12" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M10 5h4M11.5 18.5h1" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h3" />
      </>
    ),
    bank: (
      <>
        <path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5" />
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
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8 10h8M8 14h5" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.medicine}
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

  return normalized
    ? normalized
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "—";
}

function formatRecordStatus(value) {
  return formatPaymentMethod(value || "completed");
}

function getPatientId(patient) {
  return String(
    patient?.patient_id ??
      patient?.Patient_ID ??
      patient?.id ??
      ""
  ).trim();
}

function getPatientName(patient) {
  return String(
    patient?.full_name ??
      patient?.Full_Name ??
      patient?.patient_name ??
      patient?.name ??
      ""
  ).trim();
}

function getPatientCustomerType(patient) {
  return String(
    patient?.customer_type ??
      patient?.Customer_Type ??
      ""
  ).trim();
}

function isMonthlyPatient(patient) {
  return getPatientCustomerType(patient).toLowerCase() === "monthly";
}

function getProductPrice(product, patient) {
  if (!product) return 0;

  if (patient && isMonthlyPatient(patient)) {
    const monthlyPrice = Number(product.monthly_price || 0);

    if (Number.isFinite(monthlyPrice) && monthlyPrice > 0) {
      return monthlyPrice;
    }
  }

  const price = Number(
    product.one_time_price ?? product.price ?? 0
  );

  return Number.isFinite(price) ? price : 0;
}

function AdminPOSPage() {
  const [products, setProducts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [highlightedPatientIndex, setHighlightedPatientIndex] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const patientPickerRef = useRef(null);
  const paymentPickerRef = useRef(null);
  const checkoutLockRef = useRef(false);

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => getPatientId(patient) === selectedPatientId
      ) || null,
    [patients, selectedPatientId]
  );

  const selectedPayment = useMemo(
    () =>
      PAYMENT_OPTIONS.find(
        (option) => option.value === paymentMethod
      ) || PAYMENT_OPTIONS[0],
    [paymentMethod]
  );

  const sortedPatients = useMemo(
    () =>
      [...patients].sort((a, b) =>
        getPatientName(a).localeCompare(getPatientName(b))
      ),
    [patients]
  );

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    const matches = !term
      ? sortedPatients
      : sortedPatients.filter((patient) => {
          const name = getPatientName(patient).toLowerCase();
          const id = getPatientId(patient).toLowerCase();
          const type = getPatientCustomerType(patient).toLowerCase();

          return (
            name.includes(term) ||
            id.includes(term) ||
            type.includes(term)
          );
        });

    return matches.slice(0, 12);
  }, [patientSearch, sortedPatients]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter(
      (product) =>
        String(product.drug_name || "")
          .toLowerCase()
          .includes(term) ||
        String(product.drug_id || "")
          .toLowerCase()
          .includes(term) ||
        String(product.category || "")
          .toLowerCase()
          .includes(term)
    );
  }, [products, search]);

  const medicationTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          getProductPrice(item, selectedPatient) *
            Number(item.quantity || 0),
        0
      ),
    [cart, selectedPatient]
  );

  const totalMedicationUnits = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const paidValue = Number(amountPaid || 0);

  const balanceChange = Math.max(
    0,
    paidValue - medicationTotal
  );

  const remainingBalance = Math.max(
    0,
    medicationTotal - paidValue
  );

  const paymentIsValid =
    amountPaid.trim() !== "" &&
    Number.isFinite(paidValue) &&
    paidValue >= medicationTotal;

  const canCheckout =
    !processing &&
    !loading &&
    Boolean(selectedPatientId) &&
    cart.length > 0 &&
    paymentIsValid;

  useEffect(() => {
    let cancelled = false;

    async function loadPOS() {
      try {
        const [productData, salesData, patientData] =
          await Promise.all([
            getAdminPOSProducts(),
            getAdminPOSSales(),
            getAdminPatients(),
          ]);

        if (cancelled) return;

        setProducts(
          Array.isArray(productData?.products)
            ? productData.products
            : []
        );

        setSales(
          Array.isArray(salesData?.sales)
            ? salesData.sales
            : []
        );

        setPatients(
          Array.isArray(patientData?.patients)
            ? patientData.patients
            : Array.isArray(patientData)
              ? patientData
              : []
        );

        setError("");
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

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        patientPickerRef.current &&
        !patientPickerRef.current.contains(event.target)
      ) {
        setPatientDropdownOpen(false);
      }

      if (
        paymentPickerRef.current &&
        !paymentPickerRef.current.contains(event.target)
      ) {
        setPaymentDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function choosePatient(patient) {
    const id = getPatientId(patient);
    const name = getPatientName(patient);

    setSelectedPatientId(id);
    setPatientSearch(name ? `${name} • ${id}` : id);
    setPatientDropdownOpen(false);
    setHighlightedPatientIndex(0);
    setAmountPaid("");
    clearMessages();
  }

  function clearPatient() {
    setSelectedPatientId("");
    setPatientSearch("");
    setHighlightedPatientIndex(0);
    setAmountPaid("");
    setPatientDropdownOpen(true);
    clearMessages();
  }

  function handlePatientInputChange(event) {
    setPatientSearch(event.target.value);
    setSelectedPatientId("");
    setHighlightedPatientIndex(0);
    setPatientDropdownOpen(true);
    setAmountPaid("");
    clearMessages();
  }

  function handlePatientKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPatientDropdownOpen(true);
      setHighlightedPatientIndex((current) =>
        Math.min(
          current + 1,
          Math.max(filteredPatients.length - 1, 0)
        )
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedPatientIndex((current) =>
        Math.max(current - 1, 0)
      );
      return;
    }

    if (
      event.key === "Enter" &&
      patientDropdownOpen &&
      filteredPatients.length > 0
    ) {
      event.preventDefault();
      choosePatient(
        filteredPatients[
          Math.min(
            highlightedPatientIndex,
            filteredPatients.length - 1
          )
        ]
      );
      return;
    }

    if (event.key === "Escape") {
      setPatientDropdownOpen(false);
    }
  }

  function choosePaymentMethod(option) {
    setPaymentMethod(option.value);
    setPaymentDropdownOpen(false);
    clearMessages();
  }

  function addMedication(product) {
    clearMessages();

    if (!selectedPatient) {
      setError(
        "Select a registered patient before adding medicines."
      );
      return;
    }

    const stock = Number(product.stock_quantity || 0);

    if (stock <= 0) {
      setError(
        `${product.drug_name} is currently unavailable.`
      );
      return;
    }

    if (getProductPrice(product, selectedPatient) <= 0) {
      setError(
        `A valid price is not available for ${product.drug_name}.`
      );
      return;
    }

    const existing = cart.find(
      (item) => item.drug_id === product.drug_id
    );

    if (
      existing &&
      Number(existing.quantity) >= stock
    ) {
      setError(
        `Available stock limit reached for ${product.drug_name}.`
      );
      return;
    }

    setCart((current) => {
      const currentItem = current.find(
        (item) => item.drug_id === product.drug_id
      );

      if (currentItem) {
        return current.map((item) =>
          item.drug_id === product.drug_id
            ? {
                ...item,
                ...product,
                quantity: Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(drugId, nextQuantity) {
    clearMessages();

    setCart((current) =>
      current.map((item) => {
        if (item.drug_id !== drugId) return item;

        const stock = Math.max(
          1,
          Number(item.stock_quantity || 1)
        );

        return {
          ...item,
          quantity: Math.max(
            1,
            Math.min(Number(nextQuantity), stock)
          ),
        };
      })
    );
  }

  function removeMedication(drugId) {
    clearMessages();

    setCart((current) =>
      current.filter((item) => item.drug_id !== drugId)
    );
  }

  async function refreshPOSData() {
    const [refreshedProducts, refreshedSales] =
      await Promise.all([
        getAdminPOSProducts(),
        getAdminPOSSales(),
      ]);

    setProducts(
      Array.isArray(refreshedProducts?.products)
        ? refreshedProducts.products
        : []
    );

    setSales(
      Array.isArray(refreshedSales?.sales)
        ? refreshedSales.sales
        : []
    );
  }

  async function handleDispensing() {
    if (checkoutLockRef.current || processing) return;

    clearMessages();

    if (!selectedPatient || !selectedPatientId) {
      setError(
        "Select the registered patient receiving this order."
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "Select at least one medicine before completing dispensing."
      );
      return;
    }

    const invalidStockItem = cart.find(
      (item) =>
        Number(item.quantity || 0) >
        Number(item.stock_quantity || 0)
    );

    if (invalidStockItem) {
      setError(
        `Not enough stock is available for ${invalidStockItem.drug_name}.`
      );
      return;
    }

    if (!paymentIsValid) {
      setError(
        "Amount received is less than the medication total."
      );
      return;
    }

    checkoutLockRef.current = true;
    setProcessing(true);

    try {
      const result = await checkoutAdminPOS({
        patient_id: selectedPatientId,
        payment_method: paymentMethod,
        amount_paid: paidValue,
        items: cart.map((item) => ({
          drug_id: item.drug_id,
          quantity: Number(item.quantity),
        })),
      });

      const recordNumber =
        result?.sale?.sale_number ||
        result?.sale?.order_id ||
        "";

      // Clear the completed transaction before refreshing the display.
      // If the subsequent refresh fails, the sale must not be repeated.
      setCart([]);
      setAmountPaid("");
      setSearch("");

      setSuccess(
        recordNumber
          ? `Dispensing record ${recordNumber} completed successfully.`
          : "Medication dispensing completed successfully."
      );

      try {
        await refreshPOSData();
      } catch {
        setSuccess(
          recordNumber
            ? `Dispensing record ${recordNumber} completed. Refresh the page to update the medicine list.`
            : "Dispensing completed. Refresh the page to update the medicine list."
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to complete medication dispensing. Check recent records before trying again."
      );
    } finally {
      checkoutLockRef.current = false;
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-pos-page">
        <div className="admin-pos-loading">
          <div className="admin-pos-loading-icon">
            <POSIcon name="medicine" size={28} />
          </div>
          <strong>Loading Dispensing Workspace</strong>
          <span>
            Preparing patients, medicines and dispensing records...
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
        subtitle="Dispense medicines to registered patients using live pharmacy inventory and transaction data."
        accent="teal"
      />

      {(error || success) && (
        <div
          className={`admin-pos-message ${
            error
              ? "admin-pos-message--error"
              : "admin-pos-message--success"
          }`}
          role={error ? "alert" : "status"}
        >
          <div className="admin-pos-message__icon">
            <POSIcon
              name={error ? "alert" : "check"}
              size={22}
            />
          </div>

          <div className="admin-pos-message__content">
            <strong>
              {error
                ? "Dispensing Notice"
                : "Dispensing Successful"}
            </strong>
            <span>{error || success}</span>
          </div>

          <button
            type="button"
            className="admin-pos-message__close"
            onClick={clearMessages}
            aria-label="Dismiss notification"
            title="Dismiss notification"
          >
            <POSIcon name="close" size={18} />
          </button>
        </div>
      )}

      <section className="admin-pos-workspace">
        <div className="admin-pos-products admin-pos-card--medicines">
          <div className="admin-pos-panel-header">
            <div className="admin-pos-panel-heading">
              <div className="admin-pos-panel-icon">
                <POSIcon name="medicine" size={22} />
              </div>

              <div>
                <span className="admin-pos-panel-eyebrow">
                  Medicine Selection
                </span>
                <h2>Available Medicines</h2>
              </div>
            </div>

            <div className="admin-pos-product-count">
              <POSIcon name="medicine" size={15} />
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
              <POSIcon name="search" size={19} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search medicine, code or category..."
                aria-label="Search medicines"
              />

              {search && (
                <button
                  type="button"
                  className="admin-pos-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear medicine search"
                >
                  <POSIcon name="close" size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="admin-pos-product-list">
            {filteredProducts.length === 0 ? (
              <div className="admin-pos-empty-state">
                <POSIcon name="search" size={28} />
                <strong>No medicines found</strong>
                <span>
                  Try another medicine name, code or category.
                </span>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stock = Number(
                  product.stock_quantity || 0
                );

                const outOfStock = stock <= 0;

                const patientPrice = selectedPatient
                  ? getProductPrice(product, selectedPatient)
                  : 0;

                return (
                  <button
                    type="button"
                    key={product.drug_id}
                    className="admin-pos-product-card"
                    onClick={() => addMedication(product)}
                    disabled={outOfStock || processing}
                  >
                    <div className="admin-pos-product-icon">
                      <POSIcon name="medicine" size={20} />
                    </div>

                    <div className="admin-pos-product-main">
                      <strong>{product.drug_name}</strong>
                      <span>
                        {product.drug_id}
                        {product.category
                          ? ` • ${product.category}`
                          : ""}
                      </span>
                    </div>

                    <div className="admin-pos-product-meta">
                      <strong>
                        {selectedPatient
                          ? formatCurrency(patientPrice)
                          : "Select patient"}
                      </strong>

                      <span>
                        {outOfStock
                          ? "Unavailable"
                          : `${stock} available`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <aside className="admin-pos-dispensing admin-pos-card--dispensing">
          <div className="admin-pos-dispensing-header">
            <div className="admin-pos-dispensing-header__main">
              <div className="admin-pos-dispensing-icon">
                <POSIcon name="prescription" size={23} />
              </div>

              <div>
                <span>Dispensing Record</span>
                <h2>Current Dispensing</h2>
              </div>
            </div>

            <div className="admin-pos-dispensing-count">
              <strong>{totalMedicationUnits}</strong>
              <span>
                {totalMedicationUnits === 1
                  ? "unit"
                  : "units"}
              </span>
            </div>
          </div>

          <div className="admin-pos-recipient-section">
            <div className="admin-pos-field">
              <span className="admin-pos-field-label">
                Registered Patient
              </span>

              <div
                className="admin-pos-patient-picker"
                ref={patientPickerRef}
              >
                <div
                  className={`admin-pos-patient-input ${
                    patientDropdownOpen ? "is-open" : ""
                  } ${
                    selectedPatient ? "has-selection" : ""
                  }`}
                >
                  <POSIcon name="search" size={18} />

                  <input
                    type="text"
                    value={patientSearch}
                    onChange={handlePatientInputChange}
                    onFocus={() => {
                      setPatientDropdownOpen(true);
                      setHighlightedPatientIndex(0);
                    }}
                    onKeyDown={handlePatientKeyDown}
                    placeholder="Type patient name or ID..."
                    autoComplete="off"
                    aria-label="Registered patient"
                  />

                  <button
                    type="button"
                    className="admin-pos-patient-clear"
                    onClick={
                      patientSearch
                        ? clearPatient
                        : () =>
                            setPatientDropdownOpen(
                              (current) => !current
                            )
                    }
                    aria-label={
                      patientSearch
                        ? "Clear patient"
                        : "Open patient list"
                    }
                  >
                    <POSIcon
                      name={
                        patientSearch ? "close" : "chevron"
                      }
                      size={16}
                    />
                  </button>
                </div>

                {patientDropdownOpen && (
                  <div className="admin-pos-patient-dropdown">
                    <div className="admin-pos-patient-dropdown-top">
                      <span>Registered Patients</span>
                      <strong>{patients.length}</strong>
                    </div>

                    <div className="admin-pos-patient-results">
                      {filteredPatients.length === 0 ? (
                        <div className="admin-pos-patient-empty">
                          <POSIcon name="search" size={22} />
                          <strong>No patient found</strong>
                          <span>
                            Search by name or Patient ID.
                          </span>
                        </div>
                      ) : (
                        filteredPatients.map(
                          (patient, index) => {
                            const patientId =
                              getPatientId(patient);

                            const patientName =
                              getPatientName(patient);

                            const customerType =
                              getPatientCustomerType(patient);

                            return (
                              <button
                                type="button"
                                key={patientId}
                                className={`admin-pos-patient-option ${
                                  patientId === selectedPatientId
                                    ? "is-selected"
                                    : ""
                                } ${
                                  index ===
                                  highlightedPatientIndex
                                    ? "is-highlighted"
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setHighlightedPatientIndex(
                                    index
                                  )
                                }
                                onClick={() =>
                                  choosePatient(patient)
                                }
                              >
                                <span className="admin-pos-patient-option-icon">
                                  <POSIcon
                                    name="patient"
                                    size={16}
                                  />
                                </span>

                                <span className="admin-pos-patient-option-main">
                                  <strong>
                                    {patientName ||
                                      "Unnamed Patient"}
                                  </strong>
                                  <small>{patientId}</small>
                                </span>

                                <span className="admin-pos-patient-option-type">
                                  {customerType || "Patient"}
                                </span>
                              </button>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-pos-field">
              <span className="admin-pos-field-label">
                Payment Method
              </span>

              <div
                className="admin-pos-payment-picker"
                ref={paymentPickerRef}
              >
                <button
                  type="button"
                  className={`admin-pos-payment-trigger ${
                    paymentDropdownOpen ? "is-open" : ""
                  }`}
                  onClick={() =>
                    setPaymentDropdownOpen(
                      (current) => !current
                    )
                  }
                >
                  <span className="admin-pos-payment-trigger-icon">
                    <POSIcon
                      name={selectedPayment.icon}
                      size={18}
                    />
                  </span>

                  <span className="admin-pos-payment-trigger-text">
                    {selectedPayment.label}
                  </span>

                  <span className="admin-pos-payment-trigger-chevron">
                    <POSIcon name="chevron" size={17} />
                  </span>
                </button>

                {paymentDropdownOpen && (
                  <div className="admin-pos-payment-dropdown">
                    <div className="admin-pos-payment-dropdown-title">
                      Select Payment Method
                    </div>

                    <div className="admin-pos-payment-options">
                      {PAYMENT_OPTIONS.map((option) => {
                        const selected =
                          paymentMethod === option.value;

                        return (
                          <button
                            type="button"
                            key={option.value}
                            className={`admin-pos-payment-option ${
                              selected
                                ? "is-selected"
                                : ""
                            }`}
                            onClick={() =>
                              choosePaymentMethod(option)
                            }
                          >
                            <span className="admin-pos-payment-option-icon">
                              <POSIcon
                                name={option.icon}
                                size={19}
                              />
                            </span>

                            <span className="admin-pos-payment-option-copy">
                              <strong>{option.label}</strong>
                              <small>
                                {option.description}
                              </small>
                            </span>

                            <span className="admin-pos-payment-option-check">
                              {selected && (
                                <POSIcon
                                  name="check"
                                  size={17}
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedPatient && (
            <div className="admin-pos-patient-summary">
              <div className="admin-pos-patient-summary-avatar">
                <POSIcon name="patient" size={19} />
              </div>

              <div className="admin-pos-patient-summary-copy">
                <span className="admin-pos-patient-summary-label">
                  Selected Patient
                </span>

                <strong>
                  {getPatientName(selectedPatient)}
                </strong>

                <small>{selectedPatientId}</small>
              </div>

              <div className="admin-pos-patient-summary-plan">
                <span>
                  {getPatientCustomerType(selectedPatient) ||
                    "Registered"}
                </span>
                <small>Pricing plan</small>
              </div>

              <div className="admin-pos-patient-summary-check">
                <POSIcon name="check" size={16} />
              </div>
            </div>
          )}

          <div className="admin-pos-selected-heading">
            <strong>Selected Medicines</strong>
            <span className="admin-pos-selected-count">
              {cart.length} selected
            </span>
          </div>

          <div className="admin-pos-cart-items">
            {cart.length === 0 ? (
              <div className="admin-pos-cart-empty">
                <div className="admin-pos-cart-empty-icon">
                  <POSIcon name="medicine" size={28} />
                </div>

                <strong>No medicines selected</strong>

                <span>
                  Select a registered patient, then add
                  medicines to the dispensing order.
                </span>
              </div>
            ) : (
              cart.map((item) => {
                const unitPrice = getProductPrice(
                  item,
                  selectedPatient
                );

                return (
                  <article
                    key={item.drug_id}
                    className="admin-pos-cart-item"
                  >
                    <div className="admin-pos-cart-item-top">
                      <div className="admin-pos-cart-item-copy">
                        <strong>{item.drug_name}</strong>
                        <span>
                          {formatCurrency(unitPrice)} per
                          unit
                        </span>
                      </div>

                      <button
                        type="button"
                        className="admin-pos-remove-button"
                        onClick={() =>
                          removeMedication(item.drug_id)
                        }
                        disabled={processing}
                        aria-label={`Remove ${item.drug_name}`}
                      >
                        <POSIcon
                          name="trash"
                          size={16}
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
                              item.quantity - 1
                            )
                          }
                          disabled={
                            processing ||
                            item.quantity <= 1
                          }
                          aria-label={`Decrease ${item.drug_name} quantity`}
                        >
                          <POSIcon
                            name="minus"
                            size={15}
                          />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.drug_id,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            processing ||
                            item.quantity >=
                              Number(
                                item.stock_quantity || 0
                              )
                          }
                          aria-label={`Increase ${item.drug_name} quantity`}
                        >
                          <POSIcon
                            name="plus"
                            size={15}
                          />
                        </button>
                      </div>

                      <strong className="admin-pos-cart-line-total">
                        {formatCurrency(
                          unitPrice *
                            Number(item.quantity || 0)
                        )}
                      </strong>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="admin-pos-summary">
            <div className="admin-pos-summary-heading">
              <div>
                <span>Payment Summary</span>
                <strong>Complete Your Transaction</strong>
              </div>

              <POSIcon name="money" size={22} />
            </div>

            <div className="admin-pos-summary-row admin-pos-summary-row--total">
              <span>Medication Total</span>
              <strong>
                {formatCurrency(medicationTotal)}
              </strong>
            </div>

            <label className="admin-pos-amount-field">
              <span>Amount Received</span>

              <div className="admin-pos-input-wrap">
                <POSIcon name="money" size={19} />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(event) => {
                    setAmountPaid(event.target.value);
                    setError("");
                  }}
                  placeholder="0.00"
                  disabled={processing}
                  aria-label="Amount received"
                />
              </div>
            </label>

            <div className="admin-pos-payment-breakdown">
              <div className="admin-pos-summary-row">
                <span>Balance / Change</span>
                <strong>
                  {formatCurrency(balanceChange)}
                </strong>
              </div>

              {cart.length > 0 &&
                amountPaid !== "" &&
                remainingBalance > 0 && (
                  <div className="admin-pos-summary-row admin-pos-summary-row--remaining">
                    <span>Amount Still Required</span>
                    <strong>
                      {formatCurrency(remainingBalance)}
                    </strong>
                  </div>
                )}
            </div>

            <div className="admin-pos-checkout-area">
              <button
                type="button"
                className="admin-pos-checkout-button"
                onClick={handleDispensing}
                disabled={!canCheckout}
              >
                <POSIcon name="check" size={20} />
                <span>
                  {processing
                    ? "Completing Dispensing..."
                    : "Complete Dispensing"}
                </span>
              </button>

              <p className="admin-pos-checkout-help">
                {processing
                  ? "Please wait while your transaction is processed."
                  : !selectedPatient
                    ? "Select a registered patient to begin."
                    : cart.length === 0
                      ? "Add at least one medicine to continue."
                      : !paymentIsValid
                        ? "Enter the full payment amount to enable dispensing."
                        : "Review the details, then complete the transaction once."}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="admin-pos-recent-sales admin-pos-card--history">
        <div className="admin-pos-panel-header">
          <div className="admin-pos-panel-heading">
            <div className="admin-pos-panel-icon">
              <POSIcon name="history" size={22} />
            </div>

            <div>
              <span className="admin-pos-panel-eyebrow">
                Dispensing History
              </span>
              <h2>Recent Dispensing Records</h2>
            </div>
          </div>

          <div className="admin-pos-sales-count">
            <POSIcon name="clipboard" size={15} />
            <span>{sales.length} recorded</span>
          </div>
        </div>

        <div className="admin-pos-sales-table-wrap">
          <table className="admin-pos-sales-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Patient</th>
                <th>Payment</th>
                <th>Medication Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="admin-pos-empty-cell"
                  >
                    <div className="admin-pos-empty-state">
                      <POSIcon
                        name="clipboard"
                        size={29}
                      />

                      <strong>
                        No dispensing records yet
                      </strong>

                      <span>
                        Completed dispensing records will
                        appear here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                sales
                  .slice(0, 100)
                  .map((record, index) => (
                    <tr
                      key={
                        record.order_id ||
                        record.sale_number ||
                        record.id ||
                        index
                      }
                    >
                      <td>
                        <strong className="admin-pos-sale-number">
                          {record.sale_number ||
                            record.order_id ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-pos-patient-cell">
                          <span className="admin-pos-patient-cell__icon">
                            <POSIcon
                              name="patient"
                              size={15}
                            />
                          </span>

                          <span>
                            {record.customer_name ||
                              record.patient_name ||
                              record.patient_id ||
                              "Patient"}
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
                            size={13}
                          />

                          {formatRecordStatus(
                            record.order_status ||
                              record.status ||
                              record.payment_status
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminPOSPage;
