import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminReportsOverview,
  getAdminReportsSales,
  getAdminReportsTopProducts,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminSalesPage.css";

function SalesIcon({
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
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.5-1.6-.8-2.6-.8-1.5 0-2.6.7-2.6 1.8 0 2.8 5.7 1.3 5.7 4.3 0 1.2-1.1 2.1-2.9 2.1-1.2 0-2.3-.4-3.1-1" />
        <path d="M12 6v12" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    chart: (
      <>
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
      </>
    ),

    trend: (
      <>
        <path d="M4 16 9 11l4 4 7-8" />
        <path d="M15 7h5v5" />
      </>
    ),

    medicine: (
      <>
        <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </>
    ),

    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    person: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),

    payment: (
      <>
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        />
        <path d="M3 10h18" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.chart}
    </svg>
  );
}

function money(value) {
  return `GHS ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function words(value) {
  const text =
    String(value || "")
      .replaceAll("_", " ")
      .trim();

  if (!text) {
    return "—";
  }

  return text
    .split(" ")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function startOfDay(date) {
  const copy =
    new Date(date);

  copy.setHours(
    0,
    0,
    0,
    0
  );

  return copy;
}

function saleAmount(sale) {
  return Number(
    sale?.total_amount ??
      sale?.total ??
      sale?.amount ??
      0
  );
}

function SalesStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-sales-stat-card admin-sales-stat-card--${tone}`}
    >
      <span className="admin-sales-stat-accent" />

      <div className="admin-sales-stat-icon">
        <SalesIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-sales-stat-copy">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {note}
        </small>
      </div>
    </article>
  );
}

function AdminSalesPage() {
  const [
    overview,
    setOverview,
  ] = useState({});

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    topMedicines,
    setTopMedicines,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      getAdminReportsOverview(),
      getAdminReportsSales(),
      getAdminReportsTopProducts(),
    ])
      .then(
        ([
          overviewData,
          salesData,
          productsData,
        ]) => {
          if (!active) {
            return;
          }

          setOverview(
            overviewData || {}
          );

          setTransactions(
            salesData?.sales ??
              salesData?.transactions ??
              []
          );

          setTopMedicines(
            productsData?.products ??
              productsData?.top_products ??
              []
          );

          setError("");
        }
      )
      .catch(
        (err) => {
          if (!active) {
            return;
          }

          setError(
            err?.message ||
              "Unable to load sales information."
          );
        }
      )
      .finally(
        () => {
          if (!active) {
            return;
          }

          setLoading(false);
        }
      );

    return () => {
      active = false;
    };
  }, []);

  const totalRevenue =
    useMemo(
      () => {
        const overviewTotal =
          Number(
            overview?.total_sales ??
              overview?.total_revenue ??
              0
          );

        if (
          overviewTotal > 0
        ) {
          return overviewTotal;
        }

        return transactions.reduce(
          (
            total,
            sale
          ) =>
            total +
            saleAmount(sale),
          0
        );
      },
      [
        overview,
        transactions,
      ]
    );

  const todayRevenue =
    useMemo(
      () => {
        const today =
          startOfDay(
            new Date()
          );

        return transactions.reduce(
          (
            total,
            sale
          ) => {
            const value =
              sale?.created_at ??
              sale?.date;

            if (!value) {
              return total;
            }

            const saleDate =
              startOfDay(
                new Date(value)
              );

            if (
              saleDate.getTime() !==
              today.getTime()
            ) {
              return total;
            }

            return (
              total +
              saleAmount(sale)
            );
          },
          0
        );
      },
      [
        transactions,
      ]
    );

  const todayRecords =
    useMemo(
      () => {
        const today =
          startOfDay(
            new Date()
          );

        return transactions.filter(
          (sale) => {
            const value =
              sale?.created_at ??
              sale?.date;

            if (!value) {
              return false;
            }

            return (
              startOfDay(
                new Date(value)
              ).getTime() ===
              today.getTime()
            );
          }
        ).length;
      },
      [
        transactions,
      ]
    );

  const weekRevenue =
    useMemo(
      () => {
        const now =
          new Date();

        const start =
          startOfDay(now);

        start.setDate(
          start.getDate() - 6
        );

        return transactions.reduce(
          (
            total,
            sale
          ) => {
            const value =
              sale?.created_at ??
              sale?.date;

            if (!value) {
              return total;
            }

            const date =
              new Date(value);

            if (
              date < start ||
              date > now
            ) {
              return total;
            }

            return (
              total +
              saleAmount(sale)
            );
          },
          0
        );
      },
      [
        transactions,
      ]
    );

  const monthRevenue =
    useMemo(
      () => {
        const now =
          new Date();

        return transactions.reduce(
          (
            total,
            sale
          ) => {
            const value =
              sale?.created_at ??
              sale?.date;

            if (!value) {
              return total;
            }

            const date =
              new Date(value);

            const sameMonth =
              date.getFullYear() ===
                now.getFullYear() &&
              date.getMonth() ===
                now.getMonth();

            if (!sameMonth) {
              return total;
            }

            return (
              total +
              saleAmount(sale)
            );
          },
          0
        );
      },
      [
        transactions,
      ]
    );

  const averageSale =
    transactions.length
      ? totalRevenue /
        transactions.length
      : 0;

  const last7Days =
    useMemo(
      () => {
        const days = [];

        for (
          let offset = 6;
          offset >= 0;
          offset -= 1
        ) {
          const date =
            startOfDay(
              new Date()
            );

          date.setDate(
            date.getDate() -
              offset
          );

          const amount =
            transactions.reduce(
              (
                total,
                sale
              ) => {
                const value =
                  sale?.created_at ??
                  sale?.date;

                if (!value) {
                  return total;
                }

                const saleDate =
                  startOfDay(
                    new Date(value)
                  );

                if (
                  saleDate.getTime() !==
                  date.getTime()
                ) {
                  return total;
                }

                return (
                  total +
                  saleAmount(
                    sale
                  )
                );
              },
              0
            );

          days.push({
            key:
              date.toISOString(),

            label:
              date.toLocaleDateString(
                undefined,
                {
                  weekday:
                    "short",
                }
              ),

            amount,
          });
        }

        return days;
      },
      [
        transactions,
      ]
    );

  const maxChartValue =
    Math.max(
      ...last7Days.map(
        (item) =>
          item.amount
      ),
      1
    );

  const filteredTransactions =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return transactions;
        }

        return transactions.filter(
          (item) => {
            const searchable = [
              item?.sale_number,
              item?.customer_name,
              item?.patient_name,
              item?.recipient_name,
              item?.payment_method,
              item?.status,
            ];

            return searchable
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(query)
              );
          }
        );
      },
      [
        search,
        transactions,
      ]
    );

  if (loading) {
    return (
      <div className="admin-sales-page">
        <div className="admin-sales-loading">
          Loading sales...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-sales-page">
      <AdminPageIntro
        eyebrow="Medication Revenue"
        title="Sales & Revenue"
        subtitle="Track pharmacy sales, dispensing records and revenue performance."
        accent="teal"
      />

      {error && (
        <div className="admin-sales-error">
          {error}
        </div>
      )}

      <section className="admin-sales-stats">
        <SalesStat
          tone="teal"
          icon="money"
          label="Total Revenue"
          value={
            money(
              totalRevenue
            )
          }
          note={`${transactions.length} dispensing records`}
        />

        <SalesStat
          tone="blue"
          icon="calendar"
          label="Today"
          value={
            money(
              todayRevenue
            )
          }
          note={`${todayRecords} records today`}
        />

        <SalesStat
          tone="green"
          icon="chart"
          label="This Week"
          value={
            money(
              weekRevenue
            )
          }
          note="Weekly medication revenue"
        />

        <SalesStat
          tone="amber"
          icon="calendar"
          label="This Month"
          value={
            money(
              monthRevenue
            )
          }
          note="Monthly medication revenue"
        />

        <SalesStat
          tone="purple"
          icon="trend"
          label="Average Record"
          value={
            money(
              averageSale
            )
          }
          note="Average dispensing value"
        />

        <SalesStat
          tone="navy"
          icon="receipt"
          label="Total Transactions"
          value={
            transactions.length
          }
          note="Completed sales records"
        />
      </section>

      <section className="admin-sales-overview-grid">
        <article className="admin-sales-card admin-sales-card--trend">
          <div className="admin-sales-card-header">
            <div className="admin-sales-card-heading">
              <div className="admin-sales-card-icon">
                <SalesIcon
                  name="chart"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Revenue Trend
                </span>

                <h2>
                  Last 7 Days
                </h2>

                <p>
                  Daily dispensing revenue
                </p>
              </div>
            </div>
          </div>

          <div className="admin-sales-chart">
            {last7Days.map(
              (item) => {
                const height =
                  Math.max(
                    4,
                    (
                      item.amount /
                      maxChartValue
                    ) *
                      100
                  );

                return (
                  <div
                    className="admin-sales-bar-column"
                    key={
                      item.key
                    }
                  >
                    <div className="admin-sales-bar-value">
                      {item.amount >
                      0
                        ? money(
                            item.amount
                          )
                        : "—"}
                    </div>

                    <div className="admin-sales-bar-track">
                      <div
                        className="admin-sales-bar"
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />
                    </div>

                    <span>
                      {
                        item.label
                      }
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </article>

        <article className="admin-sales-card admin-sales-card--medicines">
          <div className="admin-sales-card-header">
            <div className="admin-sales-card-heading">
              <div className="admin-sales-card-icon">
                <SalesIcon
                  name="medicine"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Medication Performance
                </span>

                <h2>
                  Top Medicines
                </h2>

                <p>
                  Ranked by units dispensed
                </p>
              </div>
            </div>
          </div>

          <div className="admin-sales-top-products">
            {topMedicines.length ===
            0 ? (
              <div className="admin-sales-empty">
                No medicine performance data available.
              </div>
            ) : (
              topMedicines
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    medicine,
                    index
                  ) => (
                    <div
                      className="admin-sales-product-row"
                      key={
                        medicine?.drug_id ??
                        medicine?.id ??
                        index
                      }
                    >
                      <div className="admin-sales-product-rank">
                        {index +
                          1}
                      </div>

                      <div className="admin-sales-product-icon">
                        <SalesIcon
                          name="medicine"
                          size={17}
                        />
                      </div>

                      <div className="admin-sales-product-info">
                        <strong>
                          {medicine?.drug_name ??
                            medicine?.name ??
                            "Medicine"}
                        </strong>

                        <span>
                          {medicine?.drug_id ??
                            medicine?.code ??
                            "—"}
                        </span>
                      </div>

                      <div className="admin-sales-product-stats">
                        <strong>
                          {medicine?.units_sold ??
                            medicine?.quantity ??
                            0}{" "}
                          units
                        </strong>

                        <span>
                          {money(
                            medicine?.revenue ??
                              medicine?.total ??
                              0
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )
            )}
          </div>
        </article>
      </section>

      <section className="admin-sales-card admin-sales-card--transactions admin-sales-transactions">
        <div className="admin-sales-card-header admin-sales-transactions-header">
          <div className="admin-sales-card-heading">
            <div className="admin-sales-card-icon">
              <SalesIcon
                name="receipt"
                size={21}
              />
            </div>

            <div>
              <span>
                Dispensing Records
              </span>

              <h2>
                Revenue Transactions
              </h2>

              <p>
                Completed medication payment records
              </p>
            </div>
          </div>

          <div className="admin-sales-search">
            <SalesIcon
              name="search"
              size={17}
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
              placeholder="Search record, recipient or payment..."
            />
          </div>

          <div className="admin-sales-record-count">
            <SalesIcon
              name="receipt"
              size={15}
            />

            <span>
              {
                filteredTransactions.length
              }{" "}
              records
            </span>
          </div>
        </div>

        <div className="admin-sales-table-wrap">
          <table className="admin-sales-table">
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
                  Items
                </th>

                <th>
                  Total
                </th>

                <th>
                  Received
                </th>

                <th>
                  Change
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
              {filteredTransactions.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="admin-sales-empty"
                  >
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(
                  (
                    sale,
                    index
                  ) => (
                    <tr
                      key={
                        sale?.sale_number ??
                        sale?.id ??
                        index
                      }
                    >
                      <td>
                        <strong className="admin-sales-record-number">
                          {sale?.sale_number ??
                            `POS-${String(
                              index +
                                1
                            ).padStart(
                              6,
                              "0"
                            )}`}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-sales-patient">
                          <span>
                            <SalesIcon
                              name="person"
                              size={14}
                            />
                          </span>

                          <strong>
                            {sale?.customer_name ??
                              sale?.patient_name ??
                              sale?.recipient_name ??
                              "—"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="admin-sales-payment">
                          <SalesIcon
                            name="payment"
                            size={14}
                          />

                          <span>
                            {words(
                              sale?.payment_method
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        {sale?.item_count ??
                          sale?.items_count ??
                          sale?.items?.length ??
                          0}
                      </td>

                      <td>
                        <strong>
                          {money(
                            sale?.total_amount ??
                              sale?.total ??
                              0
                          )}
                        </strong>
                      </td>

                      <td>
                        {money(
                          sale?.amount_paid ??
                            sale?.received ??
                            0
                        )}
                      </td>

                      <td>
                        {money(
                          sale?.change_amount ??
                            sale?.change ??
                            0
                        )}
                      </td>

                      <td>
                        <span className="admin-sales-status">
                          <SalesIcon
                            name="check"
                            size={12}
                          />

                          {words(
                            sale?.status ??
                              "Completed"
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          sale?.created_at ??
                            sale?.date
                        )}
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

export default AdminSalesPage;