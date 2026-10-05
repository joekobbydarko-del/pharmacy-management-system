import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminDailySales,
  getAdminSalesSummary,
  getAdminSalesTransactions,
  getAdminTopProducts,
} from "../api";

import "./AdminSalesPage.css";


function AdminSalesPage() {
  const [
    summary,
    setSummary,
  ] = useState(null);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    topProducts,
    setTopProducts,
  ] = useState([]);

  const [
    dailySales,
    setDailySales,
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
    let cancelled = false;

    async function loadSales() {
      try {
        const [
          summaryData,
          transactionData,
          topProductData,
          dailyData,
        ] = await Promise.all([
          getAdminSalesSummary(),
          getAdminSalesTransactions(),
          getAdminTopProducts(),
          getAdminDailySales(),
        ]);

        if (!cancelled) {
          setSummary(
            summaryData
          );

          setTransactions(
            transactionData?.transactions
            ?? []
          );

          setTopProducts(
            topProductData?.products
            ?? []
          );

          setDailySales(
            dailyData?.daily
            ?? []
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load sales data."
          );
        }
      }

      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSales();

    return () => {
      cancelled = true;
    };
  }, []);


  const filteredTransactions =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return transactions;
        }

        return transactions.filter(
          (
            sale
          ) => {
            return (
              sale.sale_number
                ?.toLowerCase()
                .includes(term)
              ||
              sale.customer_name
                ?.toLowerCase()
                .includes(term)
              ||
              sale.payment_method
                ?.toLowerCase()
                .includes(term)
            );
          }
        );
      },
      [
        search,
        transactions,
      ]
    );


  const maxDailySales =
    useMemo(
      () => {
        const values =
          dailySales.map(
            (
              item
            ) =>
              Number(
                item.sales || 0
              )
          );

        return Math.max(
          1,
          ...values
        );
      },
      [
        dailySales,
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


  const safeSummary =
    summary
    ?? {
      total_sales: 0,
      total_transactions: 0,
      today_sales: 0,
      today_transactions: 0,
      week_sales: 0,
      month_sales: 0,
      average_sale: 0,
    };


  return (
    <div className="admin-sales-page">

      <div className="admin-sales-header">

        <div>
          <p className="admin-sales-eyebrow">
            Revenue & Transactions
          </p>

          <h1>
            Sales
          </h1>

          <p className="admin-sales-subtitle">
            Review pharmacy revenue,
            recent transactions and
            best-selling medicines.
          </p>
        </div>

      </div>


      {
        error && (
          <div className="admin-sales-error">
            {error}
          </div>
        )
      }


      <div className="admin-sales-stats">

        <div className="admin-sales-stat-card">
          <span>
            Total Sales
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                safeSummary.total_sales
                || 0
              )
                .toFixed(2)
            }
          </strong>
        </div>


        <div className="admin-sales-stat-card">
          <span>
            Today
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                safeSummary.today_sales
                || 0
              )
                .toFixed(2)
            }
          </strong>

          <small>
            {
              safeSummary.today_transactions
            } transactions
          </small>
        </div>


        <div className="admin-sales-stat-card">
          <span>
            This Week
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                safeSummary.week_sales
                || 0
              )
                .toFixed(2)
            }
          </strong>
        </div>


        <div className="admin-sales-stat-card">
          <span>
            This Month
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                safeSummary.month_sales
                || 0
              )
                .toFixed(2)
            }
          </strong>
        </div>


        <div className="admin-sales-stat-card">
          <span>
            Average Sale
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                safeSummary.average_sale
                || 0
              )
                .toFixed(2)
            }
          </strong>

          <small>
            {
              safeSummary.total_transactions
            } total transactions
          </small>
        </div>

      </div>


      <div className="admin-sales-overview-grid">

        <section className="admin-sales-card">

          <div className="admin-sales-card-header">

            <div>
              <h2>
                Last 7 Days
              </h2>

              <span>
                Daily sales performance
              </span>
            </div>

          </div>


          <div className="admin-sales-chart">

            {
              dailySales.map(
                (
                  item
                ) => {
                  const sales =
                    Number(
                      item.sales
                      || 0
                    );

                  const height =
                    Math.max(
                      4,
                      (
                        sales
                        /
                        maxDailySales
                      )
                      *
                      100
                    );

                  const date =
                    new Date(
                      `${item.date}T00:00:00`
                    );

                  const dayLabel =
                    date.toLocaleDateString(
                      undefined,
                      {
                        weekday:
                          "short",
                      }
                    );

                  return (
                    <div
                      className="admin-sales-bar-column"
                      key={
                        item.date
                      }
                    >

                      <div className="admin-sales-bar-value">
                        {
                          sales > 0
                            ? `GHS ${sales.toFixed(0)}`
                            : ""
                        }
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
                        {dayLabel}
                      </span>

                    </div>
                  );
                }
              )
            }

          </div>

        </section>


        <section className="admin-sales-card">

          <div className="admin-sales-card-header">

            <div>
              <h2>
                Top Medicines
              </h2>

              <span>
                Ranked by units sold
              </span>
            </div>

          </div>


          <div className="admin-sales-top-products">

            {
              topProducts.length === 0
                ? (
                  <div className="admin-sales-empty">
                    No sales data yet.
                  </div>
                )
                : (
                  topProducts.map(
                    (
                      product,
                      index
                    ) => (
                      <div
                        className="admin-sales-product-row"
                        key={
                          product.drug_id
                        }
                      >

                        <span className="admin-sales-product-rank">
                          {
                            index + 1
                          }
                        </span>


                        <div className="admin-sales-product-info">

                          <strong>
                            {
                              product.drug_name
                            }
                          </strong>

                          <span>
                            {
                              product.drug_id
                            }
                          </span>

                        </div>


                        <div className="admin-sales-product-stats">

                          <strong>
                            {
                              product.units_sold
                            } units
                          </strong>

                          <span>
                            GHS{" "}
                            {
                              Number(
                                product.revenue
                                || 0
                              )
                                .toFixed(2)
                            }
                          </span>

                        </div>

                      </div>
                    )
                  )
                )
            }

          </div>

        </section>

      </div>


      <section className="admin-sales-card admin-sales-transactions">

        <div className="admin-sales-card-header">

          <div>
            <h2>
              Sales Transactions
            </h2>

            <span>
              {
                filteredTransactions.length
              } records
            </span>
          </div>


          <input
            type="search"
            value={
              search
            }
            onChange={
              (
                event
              ) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder="Search sales..."
          />

        </div>


        <div className="admin-sales-table-wrap">

          <table className="admin-sales-table">

            <thead>
              <tr>
                <th>
                  Sale
                </th>

                <th>
                  Customer
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
                  Paid
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

              {
                filteredTransactions.length
                  === 0
                  ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="admin-sales-empty"
                      >
                        No sales found.
                      </td>
                    </tr>
                  )
                  : (
                    filteredTransactions.map(
                      (
                        sale
                      ) => (
                        <tr
                          key={
                            sale.id
                          }
                        >

                          <td>
                            <strong>
                              {
                                sale.sale_number
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              sale.customer_name
                              || "Walk-in Customer"
                            }
                          </td>

                          <td>
                            {
                              sale.payment_method
                            }
                          </td>

                          <td>
                            {
                              sale.item_count
                            }
                          </td>

                          <td>
                            GHS{" "}
                            {
                              Number(
                                sale.total_amount
                                || 0
                              )
                                .toFixed(2)
                            }
                          </td>

                          <td>
                            GHS{" "}
                            {
                              Number(
                                sale.amount_paid
                                || 0
                              )
                                .toFixed(2)
                            }
                          </td>

                          <td>
                            GHS{" "}
                            {
                              Number(
                                sale.change_amount
                                || 0
                              )
                                .toFixed(2)
                            }
                          </td>

                          <td>
                            <span className="admin-sales-status">
                              {
                                sale.status
                              }
                            </span>
                          </td>

                          <td>
                            {
                              sale.created_at
                                ? new Date(
                                    sale.created_at
                                  )
                                    .toLocaleString()
                                : "-"
                            }
                          </td>

                        </tr>
                      )
                    )
                  )
              }

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}


export default AdminSalesPage;