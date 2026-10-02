import { useMemo, useState } from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import "./OrderHistoryPage.css";

function OrderHistoryPage() {
  const [search, setSearch] = useState("");

  const orders = useMemo(() => [], []);

  const filteredOrders = orders.filter(
    (order) => {
      const term =
        search.trim().toLowerCase();

      if (!term) return true;

      return (
        String(order.id || "")
          .toLowerCase()
          .includes(term) ||
        String(order.status || "")
          .toLowerCase()
          .includes(term)
      );
    }
  );

  return (
    <section className="orders-page">
      <div className="orders-page-header">
        <div>
          <span className="orders-eyebrow">
            PATIENT ORDERS
          </span>

          <h1>My Orders</h1>

          <p>
            Review your medicine orders, payment status,
            and pharmacy order history.
          </p>
        </div>

        <PatientDateCard />
      </div>

      <div className="orders-summary-grid">
        <article className="orders-summary-card">
          <div className="orders-summary-icon blue">
            <PatientIcon
              name="package"
              size={23}
            />
          </div>

          <div>
            <span>TOTAL ORDERS</span>
            <strong>{orders.length}</strong>
            <small>Pharmacy orders</small>
          </div>
        </article>

        <article className="orders-summary-card">
          <div className="orders-summary-icon orange">
            <PatientIcon
              name="clock"
              size={23}
            />
          </div>

          <div>
            <span>PROCESSING</span>
            <strong>0</strong>
            <small>
              Orders in progress
            </small>
          </div>
        </article>

        <article className="orders-summary-card">
          <div className="orders-summary-icon teal">
            <PatientIcon
              name="check"
              size={23}
            />
          </div>

          <div>
            <span>COMPLETED</span>
            <strong>0</strong>
            <small>
              Completed orders
            </small>
          </div>
        </article>
      </div>

      <article className="orders-panel">
        <div className="orders-panel-header">
          <div>
            <span className="orders-panel-icon">
              <PatientIcon
                name="clipboard"
                size={20}
              />
            </span>

            <div>
              <span className="orders-section-label">
                ORDER HISTORY
              </span>

              <h2>
                Medicine Orders
              </h2>
            </div>
          </div>

          <div className="orders-search">
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
              placeholder="Search orders..."
            />
          </div>
        </div>

        <div className="orders-panel-body">
          {filteredOrders.length === 0 ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <PatientIcon
                  name="package"
                  size={29}
                />
              </div>

              <h3>
                No orders yet
              </h3>

              <p>
                Your medicine order history will appear
                here after an order has been submitted.
              </p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>
                            #{order.id}
                          </strong>
                        </td>

                        <td>
                          {order.date}
                        </td>

                        <td>
                          {order.items}
                        </td>

                        <td>
                          {
                            order.paymentStatus
                          }
                        </td>

                        <td>
                          <span className="order-status">
                            {
                              order.status
                            }
                          </span>
                        </td>

                        <td>
                          {order.total}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>

      <div className="orders-security">
        <span>
          <PatientIcon
            name="shield"
            size={20}
          />
        </span>

        <div>
          <strong>
            Secure order history
          </strong>

          <small>
            Your pharmacy orders are securely linked to
            your patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default OrderHistoryPage;