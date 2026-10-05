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

import "./AdminReportsPage.css";


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
          purchaseData,
          inventoryData,
          productData,
        ] = await Promise.all([
          getAdminReportsOverview(),
          getAdminReportsSales(),
          getAdminReportsPurchases(),
          getAdminReportsInventory(),
          getAdminReportsTopProducts(),
        ]);

        if (!cancelled) {
          setOverview(
            overviewData
          );

          setSales(
            salesData?.sales
            ?? []
          );

          setPurchases(
            purchaseData?.purchases
            ?? []
          );

          setInventory(
            inventoryData?.inventory
            ?? []
          );

          setTopProducts(
            productData?.products
            ?? []
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load reports."
          );
        }
      }

      finally {
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


  if (loading) {
    return (
      <div className="admin-reports-page">
        Loading reports...
      </div>
    );
  }


  const data =
    overview ?? {
      total_sales: 0,
      total_purchases: 0,
      gross_profit: 0,
      total_transactions: 0,
      total_purchase_records: 0,
      inventory_units: 0,
      low_stock_items: 0,
    };


  return (
    <div className="admin-reports-page">

      <div className="admin-reports-header">

        <p className="admin-reports-eyebrow">
          Pharmacy Analytics
        </p>

        <h1>
          Reports
        </h1>

        <p>
          Review pharmacy sales,
          purchasing and inventory
          performance.
        </p>

      </div>


      {
        error && (
          <div className="admin-reports-error">
            {error}
          </div>
        )
      }


      <div className="admin-reports-stats">

        <div className="admin-report-stat">
          <span>
            Total Sales
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                data.total_sales || 0
              ).toFixed(2)
            }
          </strong>
        </div>


        <div className="admin-report-stat">
          <span>
            Total Purchases
          </span>

          <strong>
            GHS{" "}
            {
              Number(
                data.total_purchases || 0
              ).toFixed(2)
            }
          </strong>
        </div>


        <div className="admin-report-stat">
          <span>
            Sales Transactions
          </span>

          <strong>
            {
              data.total_transactions
            }
          </strong>
        </div>


        <div className="admin-report-stat">
          <span>
            Purchase Records
          </span>

          <strong>
            {
              data.total_purchase_records
            }
          </strong>
        </div>


        <div className="admin-report-stat">
          <span>
            Inventory Units
          </span>

          <strong>
            {
              data.inventory_units
            }
          </strong>
        </div>


        <div className="admin-report-stat">
          <span>
            Low Stock
          </span>

          <strong>
            {
              data.low_stock_items
            }
          </strong>
        </div>

      </div>


      <div className="admin-reports-grid">

        <section className="admin-reports-card">

          <h2>
            Top Selling Medicines
          </h2>

          {
            topProducts.length === 0
              ? (
                <p className="admin-reports-empty">
                  No sales data yet.
                </p>
              )
              : (
                <div className="admin-report-list">

                  {
                    topProducts.map(
                      (
                        product,
                        index
                      ) => (
                        <div
                          key={
                            product.drug_id
                          }
                          className="admin-report-list-row"
                        >

                          <span>
                            {
                              index + 1
                            }
                          </span>


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


                          <div>
                            <strong>
                              {
                                product.units_sold
                              } sold
                            </strong>

                            <small>
                              GHS{" "}
                              {
                                Number(
                                  product.revenue
                                  || 0
                                ).toFixed(2)
                              }
                            </small>
                          </div>

                        </div>
                      )
                    )
                  }

                </div>
              )
          }

        </section>


        <section className="admin-reports-card">

          <h2>
            Inventory Status
          </h2>

          <div className="admin-report-list">

            {
              inventory.map(
                (
                  item
                ) => (
                  <div
                    key={
                      item.drug_id
                    }
                    className="admin-report-list-row"
                  >

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


                    <div>
                      <strong>
                        {
                          item.stock_quantity
                        } units
                      </strong>

                      <small>
                        Reorder:{" "}
                        {
                          item.reorder_level
                        }
                      </small>
                    </div>


                    <span className="admin-report-status">
                      {
                        item.status
                      }
                    </span>

                  </div>
                )
              )
            }

          </div>

        </section>

      </div>


      <section className="admin-reports-card admin-reports-section">

        <h2>
          Sales Report
        </h2>

        <div className="admin-reports-table-wrap">

          <table className="admin-reports-table">

            <thead>
              <tr>
                <th>Sale</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>

              {
                sales.map(
                  (
                    sale
                  ) => (
                    <tr
                      key={
                        sale.sale_number
                      }
                    >
                      <td>
                        {
                          sale.sale_number
                        }
                      </td>

                      <td>
                        {
                          sale.customer_name
                        }
                      </td>

                      <td>
                        {
                          sale.payment_method
                        }
                      </td>

                      <td>
                        GHS{" "}
                        {
                          Number(
                            sale.total_amount
                            || 0
                          ).toFixed(2)
                        }
                      </td>

                      <td>
                        GHS{" "}
                        {
                          Number(
                            sale.amount_paid
                            || 0
                          ).toFixed(2)
                        }
                      </td>

                      <td>
                        {
                          sale.created_at
                            ? new Date(
                                sale.created_at
                              ).toLocaleString()
                            : "-"
                        }
                      </td>
                    </tr>
                  )
                )
              }

            </tbody>

          </table>

        </div>

      </section>


      <section className="admin-reports-card admin-reports-section">

        <h2>
          Purchase Report
        </h2>

        <div className="admin-reports-table-wrap">

          <table className="admin-reports-table">

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

              {
                purchases.map(
                  (
                    purchase
                  ) => (
                    <tr
                      key={
                        purchase.purchase_number
                      }
                    >

                      <td>
                        {
                          purchase.purchase_number
                        }
                      </td>

                      <td>
                        {
                          purchase.supplier_name
                        }
                      </td>

                      <td>
                        {
                          purchase.reference_number
                          || "-"
                        }
                      </td>

                      <td>
                        GHS{" "}
                        {
                          Number(
                            purchase.total_amount
                            || 0
                          ).toFixed(2)
                        }
                      </td>

                      <td>
                        {
                          purchase.payment_status
                        }
                      </td>

                      <td>
                        {
                          purchase.status
                        }
                      </td>

                      <td>
                        {
                          purchase.created_at
                            ? new Date(
                                purchase.created_at
                              ).toLocaleString()
                            : "-"
                        }
                      </td>

                    </tr>
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


export default AdminReportsPage;
