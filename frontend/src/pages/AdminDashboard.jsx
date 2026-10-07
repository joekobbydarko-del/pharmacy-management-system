import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getAdminDashboard,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminDashboard.css";


function DashboardIcon({
  name,
  size = 22,
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
    patients: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2" />
        <path d="M16 14a5 5 0 0 1 5 5" />
      </>
    ),

    orders: (
      <>
        <path d="m4 7 8-4 8 4-8 4Z" />
        <path d="m4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),

    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    refill: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 8A7 7 0 0 1 18 6l2 6" />
        <path d="M17.9 16A7 7 0 0 1 6 18l-2-6" />
      </>
    ),

    sales: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12" />
        <path d="M15.5 8.5c-.8-.7-2-1-3.5-1-2 0-3.5 1-3.5 2.5 0 1.6 1.5 2.2 3.5 2.5 2 .3 3.5.9 3.5 2.5 0 1.5-1.5 2.5-3.5 2.5-1.5 0-2.8-.4-3.7-1.2" />
      </>
    ),

    profit: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    trend: (
      <>
        <path d="M3 17l6-6 4 4 8-9" />
        <path d="M16 6h5v5" />
      </>
    ),

    inventory: (
      <>
        <path d="m4 7 8-4 8 4-8 4Z" />
        <path d="m4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),

    recent: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h6M8 17h4" />
      </>
    ),

    snapshot: (
      <>
        <path d="M4 18V9" />
        <path d="M10 18V5" />
        <path d="M16 18v-7" />
        <path d="M22 18V3" />
      </>
    ),

    quick: (
      <>
        <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
      </>
    ),

    pos: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h4M15 12h2M7 16h2M13 16h4" />
      </>
    ),

    reports: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    payment: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
  };


  return (
    <svg {...common}>
      {
        icons[name] ||
        icons.inventory
      }
    </svg>
  );
}


function SectionTitle({
  icon,
  eyebrow,
  title,
}) {
  return (
    <div className="admin-section-title">
      <span className="admin-section-title__icon">
        <DashboardIcon
          name={icon}
          size={21}
        />
      </span>

      <div>
        <span>
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>
      </div>
    </div>
  );
}


function ActivityMetric({
  icon,
  tone,
  label,
  value,
  onClick,
}) {
  const clickable =
    Boolean(
      onClick
    );


  function handleKeyDown(
    event
  ) {
    if (!clickable) {
      return;
    }


    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onClick();
    }
  }


  return (
    <div
      className={
        `admin-activity-metric admin-activity-metric--${tone}`
      }
      role={
        clickable
          ? "button"
          : undefined
      }
      tabIndex={
        clickable
          ? 0
          : undefined
      }
      onClick={
        onClick
      }
      onKeyDown={
        handleKeyDown
      }
      style={
        clickable
          ? {
              cursor: "pointer",
            }
          : undefined
      }
    >
      <span className="admin-activity-metric__icon">
        <DashboardIcon
          name={icon}
          size={22}
        />
      </span>

      <div className="admin-activity-metric__copy">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}


function formatCurrency(
  value
) {
  const numericValue =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "en-GH",
    {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0
  );
}


function formatCompactCurrency(
  value
) {
  const numericValue =
    Number(
      value || 0
    );


  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return "GH₵0";
  }


  const absoluteValue =
    Math.abs(
      numericValue
    );


  if (
    absoluteValue >=
    1000000
  ) {
    return `GH₵${(
      numericValue /
      1000000
    ).toFixed(1)}M`;
  }


  if (
    absoluteValue >=
    1000
  ) {
    return `GH₵${(
      numericValue /
      1000
    ).toFixed(1)}K`;
  }


  return `GH₵${numericValue.toFixed(0)}`;
}


function formatNumber(
  value
) {
  const numericValue =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "en-GB"
  ).format(
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0
  );
}


function formatMonth(
  value
) {
  if (!value) {
    return "—";
  }


  const parts =
    String(
      value
    ).split("-");


  if (
    parts.length !== 2
  ) {
    return value;
  }


  const year =
    Number(
      parts[0]
    );


  const month =
    Number(
      parts[1]
    );


  if (
    !year ||
    !month
  ) {
    return value;
  }


  return new Intl.DateTimeFormat(
    "en-GB",
    {
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(
      year,
      month - 1,
      1
    )
  );
}


function AdminDashboard() {
  const navigate =
    useNavigate();


  const [
    dashboard,
    setDashboard,
  ] = useState(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true
  );


  const [
    error,
    setError,
  ] = useState(
    ""
  );


  useEffect(
    () => {
      let active =
        true;


      async function loadDashboard() {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );


          const data =
            await getAdminDashboard();


          if (active) {
            setDashboard(
              data
            );
          }

        } catch (err) {

          if (active) {
            setError(
              err?.message ||
                "Unable to load the administrator dashboard."
            );
          }

        } finally {

          if (active) {
            setLoading(
              false
            );
          }
        }
      }


      loadDashboard();


      return () => {
        active =
          false;
      };
    },
    []
  );


  const metrics =
    dashboard?.metrics ||
    {};


  const recentOrders =
    Array.isArray(
      dashboard?.recent_orders
    )
      ? dashboard.recent_orders
      : [];


  const topMedicines =
    Array.isArray(
      dashboard?.top_medicines
    )
      ? dashboard.top_medicines
      : [];


  const salesTrend =
    Array.isArray(
      dashboard?.sales_trend
    )
      ? dashboard.sales_trend
      : [];


  const refillSummary =
    dashboard?.refill_summary ||
    {};


  const paymentSummary =
    dashboard?.payment_summary ||
    {};


  const inventorySummary =
    dashboard?.inventory_summary ||
    {};


  const stats = [
    {
      label:
        "TOTAL PATIENTS",

      value:
        formatNumber(
          metrics.total_patients
        ),

      note:
        "Registered pharmacy patients",

      type:
        "violet",

      icon:
        "patients",

      route:
        "/admin/patients",
    },

    {
      label:
        "TOTAL ORDERS",

      value:
        formatNumber(
          metrics.total_orders
        ),

      note:
        "Medicine orders received",

      type:
        "amber",

      icon:
        "orders",

      route:
        "/admin/sales",
    },

    {
      label:
        "PENDING ORDERS",

      value:
        formatNumber(
          metrics.pending_orders
        ),

      note:
        "Awaiting pharmacy action",

      type:
        "blue",

      icon:
        "pending",

      route:
        "/admin/alerts",
    },

    {
      label:
        "PENDING REFILLS",

      value:
        formatNumber(
          metrics.pending_refills
        ),

      note:
        "Awaiting patient confirmation",

      type:
        "teal",

      icon:
        "refill",

      route:
        "/admin/alerts",
    },

    {
      label:
        "TOTAL SALES",

      value:
        formatCurrency(
          metrics.total_sales
        ),

      note:
        "Revenue from medicine sales",

      type:
        "rose",

      icon:
        "sales",

      route:
        "/admin/sales",
    },

    {
      label:
        "TOTAL PROFIT",

      value:
        formatCurrency(
          metrics.total_profit
        ),

      note:
        "Gross pharmacy profit",

      type:
        "green",

      icon:
        "profit",

      route:
        "/admin/reports",
    },
  ];


  const trendValues =
    salesTrend.map(
      item =>
        Number(
          item?.sales ||
          0
        )
    );


  const maxTrendSales =
    Math.max(
      ...trendValues,
      1
    );


  if (loading) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard-state">
          <span className="admin-dashboard-state__spinner" />

          <strong>
            Loading administrator dashboard...
          </strong>

          <span>
            Preparing live pharmacy data.
          </span>
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard-state admin-dashboard-state--error">
          <strong>
            Dashboard could not be loaded
          </strong>

          <p>
            {error}
          </p>
        </div>
      </section>
    );
  }


  return (
    <section className="admin-dashboard">
      <AdminPageIntro
        eyebrow="Management Overview"
        title="Administrator Dashboard"
        subtitle="Monitor live pharmacy operations, sales, patients, orders and inventory from one workspace."
        accent="teal"
      />


      <div className="admin-stats-grid">
        {
          stats.map(
            stat => (
              <article
                key={
                  stat.label
                }
                className={
                  `admin-stat-card admin-stat-card--${stat.type}`
                }
                role="button"
                tabIndex={0}
                onClick={
                  () =>
                    navigate(
                      stat.route
                    )
                }
                onKeyDown={
                  event => {

                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();

                      navigate(
                        stat.route
                      );
                    }
                  }
                }
                style={{
                  cursor:
                    "pointer",
                }}
              >
                <span
                  className={
                    `admin-stat-icon ${stat.type}`
                  }
                >
                  <DashboardIcon
                    name={
                      stat.icon
                    }
                  />
                </span>


                <div className="admin-stat-card__content">
                  <span className="admin-stat-label">
                    {
                      stat.label
                    }
                  </span>

                  <strong>
                    {
                      stat.value
                    }
                  </strong>

                  <small>
                    {
                      stat.note
                    }
                  </small>
                </div>
              </article>
            )
          )
        }
      </div>


      <div className="admin-dashboard-grid">
        <article className="admin-panel admin-panel--sales">
          <div className="admin-panel__header">
            <SectionTitle
              icon="sales"
              eyebrow="SALES PERFORMANCE"
              title="Pharmacy Sales"
            />

            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/admin/sales"
                  )
              }
            >
              View Sales
            </button>
          </div>


          <div
            style={{
              padding:
                "22px",
              display:
                "grid",
              gap:
                "18px",
            }}
          >
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap:
                  "12px",
              }}
            >
              <div className="admin-activity-metric admin-activity-metric--teal">
                <span className="admin-activity-metric__icon">
                  <DashboardIcon
                    name="sales"
                    size={21}
                  />
                </span>

                <div className="admin-activity-metric__copy">
                  <span>
                    Revenue
                  </span>

                  <strong>
                    {
                      formatCompactCurrency(
                        metrics.total_sales
                      )
                    }
                  </strong>
                </div>
              </div>


              <div className="admin-activity-metric admin-activity-metric--violet">
                <span className="admin-activity-metric__icon">
                  <DashboardIcon
                    name="profit"
                    size={21}
                  />
                </span>

                <div className="admin-activity-metric__copy">
                  <span>
                    Profit
                  </span>

                  <strong>
                    {
                      formatCompactCurrency(
                        metrics.total_profit
                      )
                    }
                  </strong>
                </div>
              </div>


              <div className="admin-activity-metric admin-activity-metric--amber">
                <span className="admin-activity-metric__icon">
                  <DashboardIcon
                    name="orders"
                    size={21}
                  />
                </span>

                <div className="admin-activity-metric__copy">
                  <span>
                    Units Sold
                  </span>

                  <strong>
                    {
                      formatNumber(
                        metrics.units_sold
                      )
                    }
                  </strong>
                </div>
              </div>
            </div>


            {
              salesTrend.length >
              0 ? (
                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >
                  {
                    salesTrend
                      .slice(
                        -6
                      )
                      .map(
                        item => {

                          const sales =
                            Number(
                              item?.sales ||
                              0
                            );


                          const width =
                            Math.max(
                              4,
                              Math.min(
                                100,
                                (
                                  sales /
                                  maxTrendSales
                                ) *
                                  100
                              )
                            );


                          return (
                            <div
                              key={
                                item.month
                              }
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "90px minmax(0, 1fr) 100px",
                                alignItems:
                                  "center",
                                gap:
                                  "12px",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize:
                                    "12px",
                                }}
                              >
                                {
                                  formatMonth(
                                    item.month
                                  )
                                }
                              </strong>


                              <div
                                style={{
                                  height:
                                    "9px",
                                  borderRadius:
                                    "999px",
                                  background:
                                    "rgba(255,255,255,.12)",
                                  overflow:
                                    "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width:
                                      `${width}%`,
                                    height:
                                      "100%",
                                    borderRadius:
                                      "inherit",
                                    background:
                                      "currentColor",
                                  }}
                                />
                              </div>


                              <strong
                                style={{
                                  textAlign:
                                    "right",
                                  fontSize:
                                    "12px",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {
                                  formatCompactCurrency(
                                    sales
                                  )
                                }
                              </strong>
                            </div>
                          );
                        }
                      )
                  }
                </div>
              ) : (
                <div className="admin-module-placeholder">
                  <strong>
                    No sales trend available yet
                  </strong>

                  <p>
                    Monthly sales will appear here as order data is recorded.
                  </p>
                </div>
              )
            }
          </div>
        </article>


        <article className="admin-panel admin-panel--medicine">
          <div className="admin-panel__header">
            <SectionTitle
              icon="trend"
              eyebrow="MEDICINE PERFORMANCE"
              title="Top Selling Medicines"
            />

            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/admin/reports"
                  )
              }
            >
              Reports
            </button>
          </div>


          <div
            style={{
              padding:
                "18px",
              display:
                "grid",
              gap:
                "10px",
            }}
          >
            {
              topMedicines.length >
              0 ? (
                topMedicines
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      medicine,
                      index
                    ) => (
                      <div
                        key={
                          medicine.drug_id ||
                          `${medicine.drug_name}-${index}`
                        }
                        className="admin-order-item"
                      >
                        <div
                          style={{
                            minWidth:
                              0,
                          }}
                        >
                          <strong>
                            #
                            {
                              index +
                              1
                            }{" "}
                            {
                              medicine.drug_name
                            }
                          </strong>

                          <small>
                            {
                              formatNumber(
                                medicine.quantity_sold
                              )
                            }{" "}
                            units •{" "}
                            {
                              medicine.category ||
                              "Medicine"
                            }
                          </small>
                        </div>


                        <strong
                          className="admin-order-patient-id"
                          style={{
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          {
                            formatCurrency(
                              medicine.sales
                            )
                          }
                        </strong>


                        <span className="admin-order-status completed">
                          {
                            formatCurrency(
                              medicine.profit
                            )
                          }{" "}
                          profit
                        </span>
                      </div>
                    )
                  )
              ) : (
                <div className="admin-module-placeholder">
                  <strong>
                    No medicine sales yet
                  </strong>

                  <p>
                    Medicine rankings will appear after sales are recorded.
                  </p>
                </div>
              )
            }
          </div>
        </article>
      </div>


      <div className="admin-dashboard-grid admin-dashboard-grid--bottom">
        <article className="admin-panel admin-panel--inventory">
          <div className="admin-panel__header">
            <SectionTitle
              icon="inventory"
              eyebrow="INVENTORY"
              title="Stock Monitoring"
            />

            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/admin/inventory"
                  )
              }
            >
              Inventory
            </button>
          </div>


          <div className="admin-module-placeholder">
            <strong>
              {
                `${formatNumber(
                  inventorySummary.total_items ??
                  metrics.inventory_items
                )} medicines tracked`
              }
            </strong>


            <p>
              {
                `${formatNumber(
                  metrics.low_stock_items
                )} medicines currently require low-stock attention.`
              }
            </p>


            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/admin/inventory"
                  )
              }
            >
              Manage Inventory
            </button>
          </div>
        </article>


        <article className="admin-panel admin-panel--orders">
          <div className="admin-panel__header">
            <SectionTitle
              icon="recent"
              eyebrow="ORDER ACTIVITY"
              title="Recent Medicine Orders"
            />

            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    "/admin/sales"
                  )
              }
            >
              View All
            </button>
          </div>


          <div className="admin-orders-list">
            {
              recentOrders.length >
              0 ? (
                recentOrders.map(
                  order => {

                    const orderStatus =
                      String(
                        order.order_status ||
                        ""
                      )
                        .trim()
                        .toLowerCase();


                    const paymentStatus =
                      String(
                        order.payment_status ||
                        ""
                      )
                        .trim()
                        .toLowerCase();


                    const displayStatus =
                      orderStatus ||
                      paymentStatus ||
                      "pending";


                    return (
                      <div
                        key={
                          order.order_id
                        }
                        className="admin-order-item"
                        role="button"
                        tabIndex={0}
                        onClick={
                          () =>
                            navigate(
                              "/admin/sales"
                            )
                        }
                        onKeyDown={
                          event => {

                            if (
                              event.key ===
                                "Enter" ||
                              event.key ===
                                " "
                            ) {
                              event.preventDefault();

                              navigate(
                                "/admin/sales"
                              );
                            }
                          }
                        }
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >
                        <div>
                          <strong>
                            #
                            {
                              order.order_id
                            }{" "}
                            {
                              order.medicine_name ||
                              "Medicine Order"
                            }
                          </strong>

                          <small>
                            {
                              order.patient_name
                            }

                            {" • Qty: "}

                            {
                              order.quantity
                            }
                          </small>
                        </div>


                        <strong className="admin-order-patient-id">
                          Patient #
                          {
                            order.patient_id
                          }
                        </strong>


                        <span
                          className={
                            `admin-order-status ${displayStatus}`
                          }
                        >
                          {
                            displayStatus
                          }
                        </span>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="admin-empty-orders">
                  <strong>
                    No medicine orders yet
                  </strong>

                  <p>
                    Pharmacy orders will appear here after submission.
                  </p>
                </div>
              )
            }
          </div>
        </article>
      </div>


      <article className="admin-system-panel admin-system-panel--activity">
        <div className="admin-system-heading">
          <SectionTitle
            icon="snapshot"
            eyebrow="LIVE SYSTEM SNAPSHOT"
            title="Pharmacy Activity"
          />
        </div>


        <div className="admin-system-grid">
          <ActivityMetric
            icon="patients"
            tone="violet"
            label="Patients"
            value={
              formatNumber(
                metrics.total_patients
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/patients"
                )
            }
          />


          <ActivityMetric
            icon="pending"
            tone="amber"
            label="Orders Awaiting Action"
            value={
              formatNumber(
                metrics.pending_orders
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/alerts"
                )
            }
          />


          <ActivityMetric
            icon="refill"
            tone="teal"
            label="Refill Requests"
            value={
              formatNumber(
                metrics.pending_refills
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/alerts"
                )
            }
          />


          <ActivityMetric
            icon="payment"
            tone="rose"
            label="Pending Payments"
            value={
              formatNumber(
                paymentSummary.pending ??
                metrics.pending_payments
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/sales"
                )
            }
          />
        </div>
      </article>


      <article className="admin-system-panel admin-system-panel--activity">
        <div className="admin-system-heading">
          <SectionTitle
            icon="refill"
            eyebrow="REFILL STATUS"
            title="Refill Monitoring"
          />
        </div>


        <div className="admin-system-grid">
          <ActivityMetric
            icon="refill"
            tone="teal"
            label="Due Soon"
            value={
              formatNumber(
                refillSummary.due_soon
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/alerts"
                )
            }
          />


          <ActivityMetric
            icon="pending"
            tone="amber"
            label="Due Today"
            value={
              formatNumber(
                refillSummary.due_today
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/alerts"
                )
            }
          />


          <ActivityMetric
            icon="pending"
            tone="rose"
            label="Overdue"
            value={
              formatNumber(
                refillSummary.overdue
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/alerts"
                )
            }
          />


          <ActivityMetric
            icon="orders"
            tone="violet"
            label="Confirmed"
            value={
              formatNumber(
                refillSummary.confirmed
              )
            }
            onClick={
              () =>
                navigate(
                  "/admin/reports"
                )
            }
          />
        </div>
      </article>


      <article className="admin-quick-panel admin-quick-panel--management">
        <div className="admin-quick-heading">
          <SectionTitle
            icon="quick"
            eyebrow="QUICK ACTIONS"
            title="Pharmacy Management"
          />
        </div>


        <div className="admin-quick-grid">
          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/pos"
                )
            }
          >
            <span className="admin-quick-icon">
              <DashboardIcon
                name="pos"
              />
            </span>

            <div>
              <strong>
                Open POS
              </strong>

              <small>
                Start a pharmacy sale
              </small>
            </div>
          </button>


          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/inventory"
                )
            }
          >
            <span className="admin-quick-icon">
              <DashboardIcon
                name="inventory"
              />
            </span>

            <div>
              <strong>
                Inventory
              </strong>

              <small>
                Manage medicine stock
              </small>
            </div>
          </button>


          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/patients"
                )
            }
          >
            <span className="admin-quick-icon">
              <DashboardIcon
                name="patients"
              />
            </span>

            <div>
              <strong>
                Patient Records
              </strong>

              <small>
                View registered patients
              </small>
            </div>
          </button>


          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/admin/reports"
                )
            }
          >
            <span className="admin-quick-icon">
              <DashboardIcon
                name="reports"
              />
            </span>

            <div>
              <strong>
                Reports
              </strong>

              <small>
                Review pharmacy analytics
              </small>
            </div>
          </button>
        </div>
      </article>
    </section>
  );
}


export default AdminDashboard;