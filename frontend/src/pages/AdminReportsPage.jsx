import {
  useEffect,
  useState,
} from "react";

import {
  getAdminReportsInventory,
  getAdminReportsOverview,
  getAdminReportsPurchases,
  getAdminReportsSales,
  getAdminReportsTopProducts,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminReportsPage.css";


/* =========================================================
   ICON SYSTEM
   ========================================================= */

function ReportIcon({
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
    revenue: (
      <>
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-4" />
      </>
    ),

    purchase: (
      <>
        <path d="M3 5h2l2.2 9.2a1 1 0 0 0 .97.78h8.88a1 1 0 0 0 .98-.8L21 8H7" />
        <circle
          cx="10"
          cy="19"
          r="1.5"
        />
        <circle
          cx="18"
          cy="19"
          r="1.5"
        />
      </>
    ),

    records: (
      <>
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v4h4" />
        <path d="M9 12h6M9 16h6" />
      </>
    ),

    inventory: (
      <>
        <path d="M12 3 4 7l8 4 8-4-8-4Z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 17l8 4 8-4" />
      </>
    ),

    medicine: (
      <>
        <path d="M8.5 4.5a3.5 3.5 0 0 1 4.95 0l1.05 1.05a3.5 3.5 0 0 1 0 4.95l-5 5a3.5 3.5 0 0 1-4.95 0L3.5 14.45a3.5 3.5 0 0 1 0-4.95l5-5Z" />
        <path d="M7 7l10 10" />
      </>
    ),

    warning: (
      <>
        <path d="M12 3 2.8 20h18.4Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    print: (
      <>
        <path d="M7 8V4h10v4" />
        <path d="M7 14H5a2 2 0 0 1-2-2v-2a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 12h10v8H7z" />
      </>
    ),

    trend: (
      <>
        <path d="M4 17 9 12l4 3 7-8" />
        <path d="M15 7h5v5" />
      </>
    ),

    box: (
      <>
        <path d="m12 3 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4Z" />
        <path d="M12 11v10" />
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
  };

  return (
    <svg {...common}>
      {icons[name] || icons.records}
    </svg>
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function money(value) {
  return `GHS ${Number(
    value || 0
  ).toFixed(2)}`;
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      dateStyle:
        "medium",

      timeStyle:
        "short",
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
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}


/* =========================================================
   KPI CARD
   ========================================================= */

function ReportStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-report-stat admin-report-stat--${tone}`}
    >
      <span className="admin-report-stat-accent" />

      <div className="admin-report-stat-icon">
        <ReportIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-report-stat-copy">
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


/* =========================================================
   PAGE
   ========================================================= */

function AdminReportsPage() {
  const [
    overview,
    setOverview,
  ] = useState(null);

  const [
    sales,
    setSales,
  ] = useState([]);

  const [
    purchases,
    setPurchases,
  ] = useState([]);

  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    topProducts,
    setTopProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        const [
          overviewData,
          salesData,
          purchasesData,
          inventoryData,
          productsData,
        ] =
          await Promise.all([
            getAdminReportsOverview(),
            getAdminReportsSales(),
            getAdminReportsPurchases(),
            getAdminReportsInventory(),
            getAdminReportsTopProducts(),
          ]);

        if (cancelled) {
          return;
        }

        setOverview(
          overviewData ||
            {}
        );

        setSales(
          salesData?.sales ||
            []
        );

        setPurchases(
          purchasesData
            ?.purchases ||
            []
        );

        setInventory(
          inventoryData
            ?.inventory ||
            []
        );

        setTopProducts(
          productsData
            ?.products ||
            []
        );

        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load reports."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, []);


  const summary = {
    totalSales:
      Number(
        overview?.total_sales ||
          0
      ),

    totalPurchases:
      Number(
        overview?.total_purchases ||
          0
      ),

    salesTransactions:
      Number(
        overview
          ?.total_transactions ??
          sales.length
      ),

    purchaseCount:
      Number(
        overview
          ?.total_purchase_records ??
          purchases.length
      ),

    inventoryUnits:
      Number(
        overview
          ?.inventory_units ||
          0
      ),

    lowStock:
      Number(
        overview
          ?.low_stock_items ||
          0
      ),
  };


  /* =========================================================
     PREMIUM PRINT REPORT
     ========================================================= */

  function handlePrintReport() {
    const generated =
      new Date()
        .toLocaleString();


    const topMedicineRows =
      topProducts.length
        ? topProducts
            .map(
              (
                product,
                index
              ) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${product.drug_name || "Medicine"}</td>
                  <td>${product.drug_id || "—"}</td>
                  <td>${product.units_sold || 0}</td>
                  <td>${money(product.revenue)}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="5" class="empty">
              No medicine performance data available.
            </td>
          </tr>
        `;


    const inventoryRows =
      inventory.length
        ? inventory
            .map(
              (item) => `
                <tr>
                  <td>${item.drug_name || "Medicine"}</td>
                  <td>${item.drug_id || "—"}</td>
                  <td>${item.stock_quantity || 0}</td>
                  <td>${item.reorder_level || 0}</td>
                  <td>${words(item.status)}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="5" class="empty">
              No inventory data available.
            </td>
          </tr>
        `;


    const salesRows =
      sales.length
        ? sales
            .map(
              (sale) => `
                <tr>
                  <td>${sale.sale_number || "—"}</td>
                  <td>${sale.customer_name || "—"}</td>
                  <td>${words(sale.payment_method)}</td>
                  <td>${money(sale.total_amount)}</td>
                  <td>${money(sale.amount_paid)}</td>
                  <td>${formatDate(sale.created_at)}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="6" class="empty">
              No dispensing records available.
            </td>
          </tr>
        `;


    const purchaseRows =
      purchases.length
        ? purchases
            .map(
              (purchase) => `
                <tr>
                  <td>${purchase.purchase_number || "—"}</td>
                  <td>${purchase.supplier_name || "—"}</td>
                  <td>${purchase.reference_number || "—"}</td>
                  <td>${money(purchase.total_amount)}</td>
                  <td>${words(purchase.payment_status)}</td>
                  <td>${words(purchase.status)}</td>
                  <td>${formatDate(purchase.created_at)}</td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td colspan="7" class="empty">
              No purchase records available.
            </td>
          </tr>
        `;


    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1200,height=900"
      );

    if (!printWindow) {
      return;
    }


    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            Dr. Evans Pharmacy Report
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 28px;

              font-family:
                Arial,
                Helvetica,
                sans-serif;

              background:
                #f3f8f9;

              color:
                #173846;
            }

            .report {
              max-width:
                1100px;

              margin:
                auto;

              overflow:
                hidden;

              border:
                1px solid
                #d8e6e9;

              border-radius:
                22px;

              background:
                #ffffff;

              box-shadow:
                0 18px 50px
                rgba(
                  15,
                  47,
                  70,
                  0.08
                );
            }

            .hero {
              position:
                relative;

              padding:
                32px;

              overflow:
                hidden;

              border-bottom:
                1px solid
                #dfeaec;

              background:
                linear-gradient(
                  135deg,
                  #edfbfa,
                  #ffffff 55%,
                  #eef7fb
                );
            }

            .hero::after {
              content: "";

              position:
                absolute;

              right:
                -90px;

              top:
                -100px;

              width:
                280px;

              height:
                280px;

              border-radius:
                50%;

              background:
                rgba(
                  24,
                  191,
                  192,
                  0.08
                );
            }

            .brand {
              position:
                relative;

              z-index:
                2;

              display:
                flex;

              justify-content:
                space-between;

              align-items:
                flex-start;

              gap:
                20px;
            }

            .brand-label {
              margin-bottom:
                8px;

              color:
                #0b8f89;

              font-size:
                11px;

              font-weight:
                900;

              letter-spacing:
                1.3px;

              text-transform:
                uppercase;
            }

            h1 {
              margin:
                0;

              color:
                #0f2f46;

              font-size:
                34px;

              font-weight:
                900;
            }

            .subtitle {
              margin:
                8px
                0
                0;

              color:
                #5f7884;

              font-size:
                14px;

              font-weight:
                600;
            }

            .generated {
              min-width:
                230px;

              padding:
                14px
                16px;

              border:
                1px solid
                #d9e7e9;

              border-radius:
                14px;

              background:
                rgba(
                  255,
                  255,
                  255,
                  0.92
                );
            }

            .generated small {
              display:
                block;

              margin-bottom:
                6px;

              color:
                #0b8f89;

              font-size:
                10px;

              font-weight:
                900;

              letter-spacing:
                0.8px;

              text-transform:
                uppercase;
            }

            .generated strong {
              color:
                #173846;

              font-size:
                13px;
            }

            .summary {
              position:
                relative;

              z-index:
                2;

              display:
                grid;

              grid-template-columns:
                repeat(
                  3,
                  1fr
                );

              gap:
                12px;

              margin-top:
                25px;
            }

            .summary-card {
              padding:
                16px;

              border:
                1px solid
                #dce8eb;

              border-radius:
                14px;

              background:
                rgba(
                  255,
                  255,
                  255,
                  0.92
                );
            }

            .summary-card span {
              display:
                block;

              margin-bottom:
                7px;

              color:
                #68808a;

              font-size:
                10px;

              font-weight:
                900;

              letter-spacing:
                0.55px;

              text-transform:
                uppercase;
            }

            .summary-card strong {
              color:
                #0f2f46;

              font-size:
                21px;

              font-weight:
                900;
            }

            section {
              padding:
                25px
                30px
                0;
            }

            section h2 {
              margin:
                0
                0
                5px;

              color:
                #0f2f46;

              font-size:
                21px;

              font-weight:
                900;
            }

            section p {
              margin:
                0
                0
                14px;

              color:
                #68808a;

              font-size:
                13px;
            }

            table {
              width:
                100%;

              margin-bottom:
                24px;

              overflow:
                hidden;

              border:
                1px solid
                #e0eaed;

              border-radius:
                12px;

              border-collapse:
                collapse;
            }

            th {
              padding:
                11px
                12px;

              background:
                #f4f9fa;

              color:
                #526d76;

              font-size:
                10px;

              font-weight:
                900;

              text-align:
                left;

              text-transform:
                uppercase;
            }

            td {
              padding:
                11px
                12px;

              border-top:
                1px solid
                #e8eff1;

              font-size:
                12px;

              font-weight:
                600;
            }

            tbody tr:nth-child(even) {
              background:
                #fbfdfd;
            }

            .empty {
              padding:
                18px;

              text-align:
                center;

              color:
                #738991;
            }

            footer {
              padding:
                8px
                30px
                28px;

              color:
                #768a91;

              font-size:
                11px;
            }

            @media print {
              body {
                padding:
                  0;

                background:
                  #ffffff;
              }

              .report {
                border:
                  0;

                border-radius:
                  0;

                box-shadow:
                  none;
              }
            }
          </style>
        </head>

        <body>
          <main class="report">
            <div class="hero">
              <div class="brand">
                <div>
                  <div class="brand-label">
                    Pharmacy Administration
                  </div>

                  <h1>
                    Dr. Evans Pharmacy
                  </h1>

                  <p class="subtitle">
                    Pharmacy Performance Report
                  </p>
                </div>

                <div class="generated">
                  <small>
                    Generated
                  </small>

                  <strong>
                    ${generated}
                  </strong>
                </div>
              </div>

              <div class="summary">
                <div class="summary-card">
                  <span>
                    Total Sales
                  </span>

                  <strong>
                    ${money(summary.totalSales)}
                  </strong>
                </div>

                <div class="summary-card">
                  <span>
                    Total Purchases
                  </span>

                  <strong>
                    ${money(summary.totalPurchases)}
                  </strong>
                </div>

                <div class="summary-card">
                  <span>
                    Dispensing Records
                  </span>

                  <strong>
                    ${summary.salesTransactions}
                  </strong>
                </div>

                <div class="summary-card">
                  <span>
                    Purchase Records
                  </span>

                  <strong>
                    ${summary.purchaseCount}
                  </strong>
                </div>

                <div class="summary-card">
                  <span>
                    Inventory Units
                  </span>

                  <strong>
                    ${summary.inventoryUnits}
                  </strong>
                </div>

                <div class="summary-card">
                  <span>
                    Low Stock
                  </span>

                  <strong>
                    ${summary.lowStock}
                  </strong>
                </div>
              </div>
            </div>

            <section>
              <h2>
                Top Medicines
              </h2>

              <p>
                Medicine performance by units dispensed and revenue.
              </p>

              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Code</th>
                    <th>Units</th>
                    <th>Revenue</th>
                  </tr>
                </thead>

                <tbody>
                  ${topMedicineRows}
                </tbody>
              </table>
            </section>

            <section>
              <h2>
                Inventory Status
              </h2>

              <p>
                Current medicine stock and reorder levels.
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Code</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  ${inventoryRows}
                </tbody>
              </table>
            </section>

            <section>
              <h2>
                Medication Revenue Report
              </h2>

              <p>
                Completed medication dispensing records.
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Patient / Recipient</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Received</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  ${salesRows}
                </tbody>
              </table>
            </section>

            <section>
              <h2>
                Purchase Report
              </h2>

              <p>
                Supplier medicine receiving records.
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Purchase</th>
                    <th>Supplier</th>
                    <th>Reference</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  ${purchaseRows}
                </tbody>
              </table>
            </section>

            <footer>
              Generated from Dr. Evans Pharmacy Administration.
            </footer>
          </main>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(
      () => {
        printWindow.print();
      },
      400
    );
  }


  if (loading) {
    return (
      <div className="admin-reports-page">
        <div className="admin-reports-loading">
          <div className="admin-reports-loading-icon">
            <ReportIcon
              name="records"
              size={28}
            />
          </div>

          <strong>
            Loading Reports
          </strong>

          <span>
            Preparing pharmacy analytics and performance records...
          </span>
        </div>
      </div>
    );
  }


  return (
    <div className="admin-reports-page">
      <AdminPageIntro
        eyebrow="Pharmacy Analytics"
        title="Reports"
        subtitle="Review medication dispensing, purchasing and inventory performance."
        accent="teal"
      />


      <div className="admin-reports-toolbar">
        <div className="admin-reports-toolbar-copy">
          <ReportIcon
            name="records"
            size={18}
          />

          <span>
            Pharmacy performance reporting
          </span>
        </div>

        <button
          type="button"
          className="admin-reports-print-button"
          onClick={
            handlePrintReport
          }
        >
          <ReportIcon
            name="print"
            size={18}
          />

          <span>
            Print Premium Report
          </span>
        </button>
      </div>


      {error && (
        <div className="admin-reports-error">
          {error}
        </div>
      )}


      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <section className="admin-reports-stats">
        <ReportStat
          tone="teal"
          icon="revenue"
          label="Total Sales"
          value={
            money(
              summary.totalSales
            )
          }
          note="Medication revenue"
        />

        <ReportStat
          tone="blue"
          icon="purchase"
          label="Total Purchases"
          value={
            money(
              summary.totalPurchases
            )
          }
          note="Supplier receiving value"
        />

        <ReportStat
          tone="violet"
          icon="records"
          label="Dispensing Records"
          value={
            summary.salesTransactions
          }
          note="Completed records"
        />

        <ReportStat
          tone="orange"
          icon="box"
          label="Purchase Records"
          value={
            summary.purchaseCount
          }
          note="Receiving records"
        />

        <ReportStat
          tone="green"
          icon="inventory"
          label="Inventory Units"
          value={
            summary.inventoryUnits
          }
          note="Medicine units available"
        />

        <ReportStat
          tone="red"
          icon="warning"
          label="Low Stock"
          value={
            summary.lowStock
          }
          note="Requires monitoring"
        />
      </section>


      {/* =====================================================
          TOP SELLING + INVENTORY
          ===================================================== */}

      <section className="admin-reports-grid">
        <article className="admin-reports-card admin-reports-card--medicines">
          <div className="admin-reports-card-head">
            <div className="admin-reports-card-title">
              <div className="admin-reports-card-icon">
                <ReportIcon
                  name="medicine"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Medicine Performance
                </span>

                <h2>
                  Top Selling Medicines
                </h2>

                <p>
                  Medicines ranked by units dispensed.
                </p>
              </div>
            </div>

            <div className="admin-reports-card-count">
              {topProducts.length}
            </div>
          </div>


          <div className="admin-report-list">
            {topProducts.length ===
            0 ? (
              <div className="admin-reports-empty">
                No medicine performance data available.
              </div>
            ) : (
              topProducts.map(
                (
                  product,
                  index
                ) => (
                  <div
                    className="admin-report-list-row"
                    key={
                      `${
                        product.drug_id ||
                        index
                      }`
                    }
                  >
                    <div className="admin-report-left">
                      <div className="admin-report-mini-icon">
                        <ReportIcon
                          name="medicine"
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          {
                            product.drug_name
                          }
                        </strong>

                        <small>
                          {
                            product.drug_id
                          }
                        </small>
                      </div>
                    </div>

                    <div className="admin-report-right">
                      <strong>
                        {
                          product.units_sold
                        }{" "}
                        units
                      </strong>

                      <small>
                        {money(
                          product.revenue
                        )}
                      </small>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </article>


        <article className="admin-reports-card admin-reports-card--inventory">
          <div className="admin-reports-card-head">
            <div className="admin-reports-card-title">
              <div className="admin-reports-card-icon">
                <ReportIcon
                  name="inventory"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Stock Monitoring
                </span>

                <h2>
                  Inventory Status
                </h2>

                <p>
                  Current medicine quantities and reorder levels.
                </p>
              </div>
            </div>

            <div className="admin-reports-card-count">
              {inventory.length}
            </div>
          </div>


          <div className="admin-report-list">
            {inventory.length ===
            0 ? (
              <div className="admin-reports-empty">
                No inventory data available.
              </div>
            ) : (
              inventory.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="admin-report-list-row"
                    key={
                      `${
                        item.drug_id ||
                        index
                      }`
                    }
                  >
                    <div className="admin-report-left">
                      <div className="admin-report-mini-icon">
                        <ReportIcon
                          name="inventory"
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          {
                            item.drug_name
                          }
                        </strong>

                        <small>
                          {
                            item.drug_id
                          }
                        </small>
                      </div>
                    </div>

                    <div className="admin-report-right">
                      <strong>
                        {
                          item.stock_quantity
                        }{" "}
                        units
                      </strong>

                      <small>
                        Reorder:{" "}
                        {
                          item.reorder_level
                        }
                      </small>
                    </div>

                    <span
                      className={`admin-report-status ${
                        String(
                          item.status ||
                            ""
                        )
                          .toLowerCase()
                          .includes(
                            "low"
                          )
                          ? "low"
                          : "healthy"
                      }`}
                    >
                      {words(
                        item.status
                      )}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </article>
      </section>


      {/* =====================================================
          MEDICATION REVENUE
          ===================================================== */}

      <section className="admin-reports-section admin-reports-section--revenue">
        <div className="admin-reports-section-head">
          <div className="admin-reports-section-title">
            <div className="admin-reports-section-icon">
              <ReportIcon
                name="money"
                size={21}
              />
            </div>

            <div>
              <span>
                Dispensing Records
              </span>

              <h2>
                Medication Revenue Report
              </h2>

              <p>
                Completed medication dispensing records
              </p>
            </div>
          </div>

          <div className="admin-reports-record-pill">
            <ReportIcon
              name="records"
              size={14}
            />

            <span>
              {sales.length} records
            </span>
          </div>
        </div>


        <div className="admin-reports-table-wrap">
          <table className="admin-reports-table">
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
                  Total
                </th>

                <th>
                  Received
                </th>

                <th>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-reports-empty"
                  >
                    No dispensing records available.
                  </td>
                </tr>
              ) : (
                sales.map(
                  (
                    sale,
                    index
                  ) => (
                    <tr
                      key={
                        sale.sale_number ||
                        index
                      }
                    >
                      <td>
                        <strong className="admin-report-record-code">
                          {
                            sale.sale_number
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          sale.customer_name
                        }
                      </td>

                      <td>
                        {words(
                          sale.payment_method
                        )}
                      </td>

                      <td>
                        <strong>
                          {money(
                            sale.total_amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {money(
                          sale.amount_paid
                        )}
                      </td>

                      <td>
                        {formatDate(
                          sale.created_at
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


      {/* =====================================================
          PURCHASE REPORT
          ===================================================== */}

      <section className="admin-reports-section admin-reports-section--purchases">
        <div className="admin-reports-section-head">
          <div className="admin-reports-section-title">
            <div className="admin-reports-section-icon">
              <ReportIcon
                name="purchase"
                size={21}
              />
            </div>

            <div>
              <span>
                Inventory Receiving
              </span>

              <h2>
                Purchase Report
              </h2>

              <p>
                Recorded supplier medicine deliveries
              </p>
            </div>
          </div>

          <div className="admin-reports-record-pill">
            <ReportIcon
              name="box"
              size={14}
            />

            <span>
              {purchases.length} records
            </span>
          </div>
        </div>


        <div className="admin-reports-table-wrap">
          <table className="admin-reports-table">
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
                    colSpan="7"
                    className="admin-reports-empty"
                  >
                    No purchase records available.
                  </td>
                </tr>
              ) : (
                purchases.map(
                  (
                    purchase,
                    index
                  ) => (
                    <tr
                      key={
                        purchase.purchase_number ||
                        index
                      }
                    >
                      <td>
                        <strong className="admin-report-record-code">
                          {
                            purchase.purchase_number
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          purchase.supplier_name
                        }
                      </td>

                      <td>
                        {purchase.reference_number ||
                          "—"}
                      </td>

                      <td>
                        <strong>
                          {money(
                            purchase.total_amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {words(
                          purchase.payment_status
                        )}
                      </td>

                      <td>
                        <span className="admin-report-purchase-status">
                          {words(
                            purchase.status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          purchase.created_at
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

export default AdminReportsPage;