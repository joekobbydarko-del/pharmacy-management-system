import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
} from "../api";

import "./AdminOrdersPage.css";

const TIMEZONE = "Africa/Accra";

const STATUS_ORDER = [
  "Pending",
  "Approved",
  "Processing",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const STATUS_KEYS = {
  Pending: "pending",
  Approved: "approved",
  Processing: "processing",
  Ready: "ready",
  "Out for Delivery": "outForDelivery",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  processing: "Processing",
  ready: "Ready",
  "out for delivery": "Out for Delivery",
  delivered: "Delivered",
  completed: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

const SUMMARY_ITEMS = [
  {
    key: "total",
    label: "Total Orders",
    icon: "orders",
    caption: "Orders recorded",
  },
  {
    key: "pending",
    label: "Pending",
    icon: "clock",
    caption: "Awaiting review",
  },
  {
    key: "approved",
    label: "Approved",
    icon: "check",
    caption: "Approved requests",
  },
  {
    key: "processing",
    label: "Processing",
    icon: "settings",
    caption: "Being prepared",
  },
  {
    key: "ready",
    label: "Ready",
    icon: "package",
    caption: "Ready for fulfilment",
  },
  {
    key: "outForDelivery",
    label: "Out for Delivery",
    icon: "truck",
    caption: "Orders in transit",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "check-circle",
    caption: "Recorded as delivered",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: "close-circle",
    caption: "Cancelled requests",
  },
];

/* =========================================================
   ICON SYSTEM
   ========================================================= */

function OrdersIcon({
  name,
  size = 20,
  className = "",
}) {
  const paths = {
    orders: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    "check-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),

    "close-circle": (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l-2 2M7 17l-2 2" />
      </>
    ),

    package: (
      <>
        <path d="m3 7 9-4 9 4-9 4-9-4Z" />
        <path d="M3 7v10l9 4 9-4V7M12 11v10" />
      </>
    ),

    truck: (
      <>
        <path d="M3 6h11v12H3Z" />
        <path d="M14 10h4l3 4v4h-7Z" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="17" cy="19" r="2" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14-5L4 8" />
        <path d="M4 3v5h5" />
        <path d="M4 13a8 8 0 0 0 14 5l2-2" />
        <path d="M20 21v-5h-5" />
      </>
    ),

    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),

    chevron: <path d="m6 9 6 6 6-6" />,

    close: <path d="M5 5l14 14M19 5 5 19" />,

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    medicine: (
      <>
        <rect
          x="4"
          y="8"
          width="16"
          height="8"
          rx="4"
          transform="rotate(-45 12 12)"
        />
        <path d="m8.5 8.5 7 7" />
      </>
    ),

    shield: (
      <>
        <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    alert: (
      <>
        <path d="m12 3 10 18H2Z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] || paths.orders}
    </svg>
  );
}

/* =========================================================
   DATA HELPERS
   ========================================================= */

function getValue(object, keys, fallback = "") {
  if (!object || typeof object !== "object") {
    return fallback;
  }

  for (const key of keys) {
    const value = object[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function normalizeStatus(value) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return STATUS_LABELS[key] || String(value || "Unknown");
}

function normalizeOrder(source) {
  const order = source || {};

  return {
    ...order,

    order_id: String(
      getValue(order, ["order_id", "Order_ID", "id"])
    ),

    patient_name: String(
      getValue(
        order,
        [
          "patient_name",
          "Patient_Name",
          "full_name",
          "Full_Name",
        ],
        "Unknown patient"
      )
    ),

    patient_id: String(
      getValue(order, ["patient_id", "Patient_ID"])
    ),

    patient_phone: String(
      getValue(order, [
        "patient_phone",
        "Patient_Phone",
        "phone",
      ])
    ),

    patient_location: String(
      getValue(order, [
        "patient_location",
        "Patient_Location",
        "location",
      ])
    ),

    order_status: normalizeStatus(
      getValue(
        order,
        ["order_status", "Order_Status", "status"],
        "Pending"
      )
    ),

    payment_status: String(
      getValue(
        order,
        ["payment_status", "Payment_Status"],
        "Pending"
      )
    ),

    payment_method: String(
      getValue(order, [
        "payment_method",
        "Payment_Method",
      ])
    ),

    total_amount:
      Number(
        getValue(
          order,
          [
            "total_amount",
            "Total_Amount",
            "total",
            "amount",
          ],
          0
        )
      ) || 0,

    order_date: getValue(order, [
      "order_date",
      "Order_Date",
      "created_at",
      "date",
    ]),

    medicine_name: String(
      getValue(order, [
        "medicine_name",
        "drug_name",
        "Drug_Name",
      ])
    ),

    items: Array.isArray(order.items)
      ? order.items
      : [],

    allowed_next_statuses: Array.isArray(
      order.allowed_next_statuses
    )
      ? order.allowed_next_statuses
      : [],
  };
}

function extractOrders(payload) {
  const records = Array.isArray(payload)
    ? payload
    : payload?.orders ||
      payload?.data?.orders ||
      payload?.data ||
      [];

  return Array.isArray(records)
    ? records.map(normalizeOrder)
    : [];
}

function extractOrderDetail(payload) {
  const record =
    payload?.order ||
    payload?.data?.order ||
    payload?.data ||
    payload;

  return normalizeOrder(record);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GH", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status) {
  return normalizeStatus(status)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   CLEAN LIVE DATE AND TIME
   DATE FIRST, TIME SECOND
   ========================================================= */

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const currentDate = new Intl.DateTimeFormat("en-GH", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const currentTime = new Intl.DateTimeFormat("en-GH", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  return (
    <div
      className="orders-datetime-card"
      aria-label={`${currentDate}, ${currentTime}`}
    >
      <span className="orders-datetime-icon">
        <OrdersIcon name="calendar" size={22} />
      </span>

      <div className="orders-datetime-copy">
        <span className="orders-datetime-date">
          {currentDate}
        </span>

        <strong className="orders-datetime-time">
          {currentTime}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM STATUS FILTER
   ========================================================= */

function StatusFilterDropdown({
  value,
  onChange,
  counts,
}) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  const options = useMemo(
    () => [
      {
        value: "All",
        label: "All Statuses",
        count: counts.total,
      },

      ...STATUS_ORDER.map((status) => ({
        value: status,
        label: status,
        count: counts[STATUS_KEYS[status]],
      })),
    ],
    [counts]
  );

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  function openDropdown() {
    setFocusedIndex(selectedIndex);
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectOption(option) {
    if (!option) return;

    onChange(option.value);
    closeDropdown();
  }

  function handleTriggerKeyDown(event) {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault();
      openDropdown();
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleMenuKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setFocusedIndex(
        (current) => (current + 1) % options.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setFocusedIndex(
        (current) =>
          (current - 1 + options.length) % options.length
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setFocusedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setFocusedIndex(options.length - 1);
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      selectOption(options[focusedIndex]);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`orders-custom-select ${
        open ? "is-open" : ""
      }`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="orders-custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="orders-custom-select-value">
          <OrdersIcon name="settings" size={16} />

          <span>
            {value === "All" ? "All Statuses" : value}
          </span>
        </span>

        <OrdersIcon
          name="chevron"
          size={17}
          className={`orders-select-chevron ${
            open ? "is-open" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="orders-custom-select-menu"
          role="listbox"
          aria-label="Filter orders by status"
          onKeyDown={handleMenuKeyDown}
        >
          <div className="orders-custom-select-heading">
            FILTER BY STATUS
          </div>

          <div className="orders-custom-select-options">
            {options.map((option, index) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  className={`orders-custom-select-option ${
                    selected ? "is-selected" : ""
                  }`}
                  onMouseEnter={() => {
                    setFocusedIndex(index);
                  }}
                  onClick={() => selectOption(option)}
                >
                  <span className="orders-select-option-left">
                    <span
                      className={`orders-option-indicator orders-option-${statusClass(
                        option.value
                      )}`}
                    />

                    {option.label}
                  </span>

                  <span className="orders-select-option-right">
                    <span className="orders-select-option-count">
                      {option.count ?? 0}
                    </span>

                    {selected && (
                      <OrdersIcon name="check" size={15} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status,
  payment = false,
}) {
  return (
    <span
      className={[
        "orders-status",
        payment
          ? "orders-payment-status"
          : "orders-order-status",
        `orders-status--${statusClass(status)}`,
      ].join(" ")}
    >
      <span className="orders-status-dot" />

      {normalizeStatus(status)}
    </span>
  );
}

/* =========================================================
   ORDER DETAIL MODAL
   ========================================================= */

function OrderDetails({
  order,
  onClose,
  onChangeStatus,
  updating,
  loading,
  detailError,
}) {
  const nextStatuses = (
    order.allowed_next_statuses || []
  )
    .map(normalizeStatus)
    .filter((status) => STATUS_ORDER.includes(status));

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !updating) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [onClose, updating]);

  return (
    <div
      className="orders-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="orders-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-detail-heading"
      >
        <header className="orders-modal-header">
          <div>
            <span className="orders-eyebrow">
              ORDER MANAGEMENT
            </span>

            <h2 id="orders-detail-heading">
              Order {order.order_id}
            </h2>

            <p>
              Review patient information, medicine
              details and fulfilment progress.
            </p>
          </div>

          <button
            type="button"
            className="orders-close-button"
            onClick={onClose}
            disabled={updating}
            aria-label="Close order details"
          >
            <OrdersIcon name="close" size={19} />
          </button>
        </header>

        {loading ? (
          <div className="orders-loading orders-modal-loading">
            <OrdersIcon
              name="refresh"
              size={25}
              className="orders-spinning"
            />

            <span>Retrieving order details...</span>
          </div>
        ) : (
          <div className="orders-modal-body">
            {detailError && (
              <div className="orders-error" role="alert">
                <OrdersIcon name="alert" size={18} />
                <span>{detailError}</span>
              </div>
            )}

            <div className="orders-detail-statuses">
              <div>
                <small>Order Status</small>
                <StatusBadge status={order.order_status} />
              </div>

              <div>
                <small>Payment Status</small>
                <StatusBadge
                  status={order.payment_status}
                  payment
                />
              </div>
            </div>

            <div className="orders-detail-section">
              <h3 className="orders-detail-title">
                <OrdersIcon name="user" size={18} />
                Patient & Order Information
              </h3>

              <div className="orders-detail-grid">
                {[
                  ["Patient Name", order.patient_name],
                  ["Patient ID", order.patient_id],
                  ["Order Date", formatDate(order.order_date)],
                  ["Order Total", formatMoney(order.total_amount)],
                  ["Payment Method", order.payment_method],
                  ["Patient Location", order.patient_location],
                  ["Contact Number", order.patient_phone],
                ].map(([label, value]) => (
                  <div
                    className="orders-detail-field"
                    key={label}
                  >
                    <small>{label}</small>
                    <strong>{value || "—"}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="orders-detail-section">
              <h3 className="orders-detail-title">
                <OrdersIcon name="medicine" size={18} />
                Medicines Requested
              </h3>

              {order.items.length > 0 ? (
                <div className="orders-medicine-list">
                  {order.items.map((item, index) => {
                    const medicine = getValue(
                      item,
                      [
                        "drug_name",
                        "medicine_name",
                        "Drug_Name",
                        "name",
                      ],
                      "Medicine"
                    );

                    const quantity = getValue(
                      item,
                      ["quantity", "Quantity"],
                      1
                    );

                    const amount = getValue(
                      item,
                      [
                        "total_amount",
                        "Total_Amount",
                        "line_total",
                      ],
                      null
                    );

                    return (
                      <div
                        className="orders-medicine-item"
                        key={`${index}-${medicine}`}
                      >
                        <span className="orders-medicine-icon">
                          <OrdersIcon
                            name="medicine"
                            size={19}
                          />
                        </span>

                        <div className="orders-medicine-information">
                          <strong>{medicine}</strong>
                          <small>Quantity: {quantity}</small>
                        </div>

                        {amount !== null && (
                          <strong className="orders-medicine-amount">
                            {formatMoney(amount)}
                          </strong>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="orders-muted">
                  {order.medicine_name ||
                    "No medicine details were returned."}
                </p>
              )}
            </div>

            <div className="orders-detail-section">
              <h3 className="orders-detail-title">
                <OrdersIcon name="shield" size={18} />
                Order Management Actions
              </h3>

              {detailError ? (
                <p className="orders-muted">
                  Order actions are unavailable until
                  the latest details can be retrieved.
                </p>
              ) : nextStatuses.length > 0 ? (
                <div className="orders-action-buttons">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating}
                      className={
                        status === "Cancelled"
                          ? "orders-button orders-button-danger"
                          : "orders-button orders-button-primary"
                      }
                      onClick={() =>
                        onChangeStatus(
                          order.order_id,
                          status
                        )
                      }
                    >
                      <OrdersIcon
                        name={
                          status === "Cancelled"
                            ? "close-circle"
                            : "check-circle"
                        }
                        size={16}
                      />

                      {updating
                        ? "Updating Order..."
                        : status === "Cancelled"
                          ? "Cancel Order"
                          : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="orders-muted">
                  No further status changes are
                  available for this order.
                </p>
              )}

              <div className="orders-management-note">
                <OrdersIcon name="shield" size={17} />

                <span>
                  Order status updates are recorded
                  separately from payments and
                  medication dispensing.
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   MAIN ORDERS PAGE
   ========================================================= */

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [lastSynced, setLastSynced] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");

  const selectedOrderRef = useRef(null);
  const refreshInProgressRef = useRef(false);

  /* =====================================================
     INITIAL LOAD
     ===================================================== */

  useEffect(() => {
    let active = true;

    async function fetchInitialOrders() {
      try {
        const response = await getAdminOrders();

        if (!active) return;

        setOrders(extractOrders(response));
        setLastSynced(new Date());
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err?.message ||
            "Unable to retrieve pharmacy orders."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchInitialOrders();

    return () => {
      active = false;
    };
  }, []);

  /* =====================================================
     SYNC ORDERS
     ===================================================== */

  const loadOrders = useCallback(
    async (silent = false) => {
      if (refreshInProgressRef.current) {
        return false;
      }

      refreshInProgressRef.current = true;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSyncMessage("");

      try {
        const response = await getAdminOrders();

        setOrders(extractOrders(response));
        setLastSynced(new Date());

        if (silent) {
          setSyncMessage(
            "Order records are up to date."
          );
        }

        return true;
      } catch (err) {
        setError(
          err?.message ||
            "Unable to retrieve pharmacy orders."
        );

        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
        refreshInProgressRef.current = false;
      }
    },
    []
  );

  /* =====================================================
     OPEN / CLOSE ORDER
     ===================================================== */

  async function openOrder(order) {
    const requestedId = order.order_id;

    selectedOrderRef.current = requestedId;

    setSelectedOrder(order);
    setDetailLoading(true);
    setDetailError("");
    setActionError("");
    setActionMessage("");

    try {
      const response = await getAdminOrder(requestedId);

      if (selectedOrderRef.current !== requestedId) {
        return;
      }

      setSelectedOrder(extractOrderDetail(response));
    } catch (err) {
      if (selectedOrderRef.current !== requestedId) {
        return;
      }

      setDetailError(
        err?.message ||
          "Unable to retrieve complete order details."
      );
    } finally {
      if (selectedOrderRef.current === requestedId) {
        setDetailLoading(false);
      }
    }
  }

  function closeOrder() {
    if (updating) return;

    selectedOrderRef.current = null;

    setSelectedOrder(null);
    setDetailError("");
    setActionError("");
    setActionMessage("");
  }

  /* =====================================================
     UPDATE ORDER STATUS
     ===================================================== */

  async function changeOrderStatus(orderId, status) {
    if (updating) return;

    const message =
      status === "Cancelled"
        ? `Cancel order ${orderId}?`
        : `Change order ${orderId} to ${status}?`;

    if (!window.confirm(message)) {
      return;
    }

    setUpdating(true);
    setActionError("");
    setActionMessage("");

    let statusSubmitted = false;

    try {
      await updateAdminOrderStatus(orderId, status);
      statusSubmitted = true;

      const detail = await getAdminOrder(orderId);

      if (selectedOrderRef.current === orderId) {
        setSelectedOrder(extractOrderDetail(detail));
      }
    } catch (err) {
      setActionError(
        statusSubmitted
          ? "The status was submitted, but the latest order details could not be retrieved. Please synchronize to confirm."
          : err?.message || "Unable to update order status."
      );
    } finally {
      setUpdating(false);
    }

    if (statusSubmitted) {
      const refreshed = await loadOrders(true);

      if (refreshed) {
        setActionError("");
        setActionMessage(
          `Order ${orderId} updated successfully.`
        );
      } else {
        setActionError(
          "The status update was submitted, but the order list could not be refreshed. Synchronize again to confirm."
        );
      }
    }
  }

  /* =====================================================
     STATISTICS
     ===================================================== */

  const summary = useMemo(() => {
    const result = {
      total: orders.length,
      pending: 0,
      approved: 0,
      processing: 0,
      ready: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      const key = STATUS_KEYS[order.order_status];

      if (key) {
        result[key]++;
      }
    }

    return result;
  }, [orders]);

  /* =====================================================
     FILTERED ORDERS
     ===================================================== */

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" ||
        order.order_status === statusFilter;

      const content = [
        order.order_id,
        order.patient_name,
        order.patient_id,
        order.medicine_name,

        ...order.items.map((item) =>
          getValue(
            item,
            [
              "drug_name",
              "medicine_name",
              "Drug_Name",
              "name",
            ],
            ""
          )
        ),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || content.includes(query))
      );
    });
  }, [orders, search, statusFilter]);

  const formattedSyncTime = lastSynced
    ? new Intl.DateTimeFormat("en-GH", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(lastSynced)
    : null;

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <main className="admin-orders-page">
      <header className="orders-page-header">
        <div className="orders-header-copy">
          <span className="orders-eyebrow">
            DR. EVANS PHARMACY
          </span>

          <h1>Orders</h1>

          <p>
            Patient medicine orders, prescription
            review, fulfilment and delivery tracking.
          </p>
        </div>

        <LiveDateTime />
      </header>

      {/* SUMMARY CARDS */}

      <section
        className="orders-summary-grid"
        aria-label="Order statistics"
      >
        {SUMMARY_ITEMS.map((item) => (
          <article
            key={item.key}
            className={`orders-summary-card orders-summary-${
              item.key === "outForDelivery"
                ? "out-for-delivery"
                : item.key
            }`}
          >
            <div className="orders-summary-top">
              <span className="orders-summary-label">
                {item.label}
              </span>

              <span className="orders-summary-icon">
                <OrdersIcon
                  name={item.icon}
                  size={21}
                />
              </span>
            </div>

            <div className="orders-summary-bottom">
              <strong className="orders-summary-number">
                {summary[item.key]}
              </strong>

              <span className="orders-summary-caption">
                {item.caption}
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* PATIENT ORDERS PANEL */}

      <section className="orders-main-card">
        <div className="orders-section-heading">
          <div className="orders-section-copy">
            <span className="orders-section-eyebrow">
              ORDER OPERATIONS
            </span>

            <h2>Patient Orders</h2>

            <p>
              Review incoming medicine requests
              and track every stage of fulfilment.
            </p>
          </div>

          <span className="orders-result-count">
            <OrdersIcon name="orders" size={15} />
            {filteredOrders.length} Orders
          </span>
        </div>

        {/* SYNCHRONIZATION BAR */}

        <div className="orders-sync-bar">
          <div className="orders-sync-information">
            <span className="orders-sync-indicator">
              <span className="orders-sync-dot" />

              {lastSynced
                ? "ORDERS CONNECTED"
                : "ORDERS CONNECTION"}
            </span>

            <span className="orders-sync-description">
              {loading
                ? "Retrieving the latest order records..."
                : formattedSyncTime
                  ? `Last updated at ${formattedSyncTime}`
                  : "Awaiting successful synchronization."}
            </span>

            {syncMessage && (
              <span
                className="orders-sync-feedback is-success"
                role="status"
              >
                {syncMessage}
              </span>
            )}
          </div>

          <button
            type="button"
            className={`orders-button orders-button-sync ${
              refreshing ? "is-syncing" : ""
            }`}
            onClick={() => loadOrders(true)}
            disabled={loading || refreshing}
          >
            <OrdersIcon
              name="refresh"
              size={17}
              className={
                refreshing ? "orders-spinning" : ""
              }
            />

            {refreshing
              ? "Synchronizing..."
              : "Sync Latest Orders"}
          </button>
        </div>

        {/* SEARCH AND FILTER */}

        <div className="orders-toolbar">
          <label className="orders-search-field">
            <OrdersIcon
              name="search"
              size={18}
              className="orders-search-icon"
            />

            <input
              type="search"
              className="orders-search-input"
              placeholder="Search order ID, patient or medicine..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Search patient orders"
            />

            {search && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <OrdersIcon name="close" size={15} />
              </button>
            )}
          </label>

          <StatusFilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            counts={summary}
          />
        </div>

        {error && (
          <div className="orders-error" role="alert">
            <OrdersIcon name="alert" size={19} />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadOrders()}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="orders-loading">
            <OrdersIcon
              name="refresh"
              size={27}
              className="orders-spinning"
            />

            <strong>Loading Patient Orders</strong>

            <span>
              Retrieving the latest records...
            </span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <span className="orders-empty-icon">
              <OrdersIcon name="orders" size={28} />
            </span>

            <h3>No Orders Found</h3>

            <p>
              {error
                ? "The latest records could not be loaded."
                : "No orders match the selected criteria."}
            </p>

            {(search || statusFilter !== "All") && (
              <button
                type="button"
                className="orders-button orders-button-outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="orders-table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient</th>
                  <th>Order Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>
                      <strong className="orders-order-id">
                        {order.order_id}
                      </strong>
                    </td>

                    <td>
                      <span className="orders-patient-name">
                        {order.patient_name}
                      </span>

                      <small className="orders-patient-id">
                        {order.patient_id}
                      </small>
                    </td>

                    <td className="orders-date-cell">
                      {formatDate(order.order_date)}
                    </td>

                    <td className="orders-amount">
                      {formatMoney(order.total_amount)}
                    </td>

                    <td>
                      <StatusBadge
                        status={order.payment_status}
                        payment
                      />
                    </td>

                    <td>
                      <StatusBadge
                        status={order.order_status}
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="orders-button orders-button-outline orders-view-button"
                        onClick={() => openOrder(order)}
                      >
                        <OrdersIcon name="eye" size={16} />
                        View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredOrders.length > 15 && !loading && (
          <div className="orders-table-footer">
            Showing up to 15 orders at a time.
            Scroll inside the table to view the rest.
          </div>
        )}
      </section>

      {/* ORDER DETAILS */}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          loading={detailLoading}
          detailError={detailError}
          updating={updating}
          onClose={closeOrder}
          onChangeStatus={changeOrderStatus}
        />
      )}

      {selectedOrder &&
        (actionError || actionMessage) && (
          <div
            className={
              actionError
                ? "orders-action-toast orders-action-toast-error"
                : "orders-action-toast"
            }
            role={actionError ? "alert" : "status"}
          >
            <OrdersIcon
              name={actionError ? "alert" : "check-circle"}
              size={18}
            />

            <span>
              {actionError || actionMessage}
            </span>
          </div>
        )}
    </main>
  );
}