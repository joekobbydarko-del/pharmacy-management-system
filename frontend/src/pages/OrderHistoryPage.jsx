import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PatientDateCard from "../components/PatientDateCard";
import PatientIcon from "../components/PatientIcon";

import {
  getUserOrders,
} from "../api";

import "./OrderHistoryPage.css";

function OrderHistoryPage() {
  const userId =
    localStorage.getItem("user_id");

  const [orders, setOrders] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadOrders() {
      if (!userId) {
        setError(
          "Patient information could not be found."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getUserOrders(userId);

        setOrders(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load your orders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [userId]);

  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return orders;
      }

      return orders.filter(
        (order) =>
          order.medicine_name
            ?.toLowerCase()
            .includes(query) ||
          order.status
            ?.toLowerCase()
            .includes(query)
      );
    }, [orders, search]);

  const processingOrders =
    orders.filter((order) =>
      [
        "pending",
        "processing",
      ].includes(
        String(
          order.status || ""
        ).toLowerCase()
      )
    );

  const completedOrders =
    orders.filter(
      (order) =>
        String(
          order.status || ""
        ).toLowerCase() ===
        "completed"
    );

  return (
    <section className="orders-page">
      {/* HEADER */}

      <div className="orders-page-header">
        <div>
          <span className="orders-eyebrow">
            PATIENT ORDERS
          </span>

          <h1>
            My Orders
          </h1>

          <p>
            Review your medicine orders,
            payment status, and pharmacy
            order history.
          </p>
        </div>

        <PatientDateCard />
      </div>

      {/* SUMMARY */}

      <div className="orders-summary-grid">
        <article className="orders-summary-card">
          <div className="orders-summary-icon blue">
            <PatientIcon
              name="package"
              size={22}
            />
          </div>

          <div>
            <span>
              TOTAL ORDERS
            </span>

            <strong>
              {orders.length}
            </strong>

            <small>
              Pharmacy orders
            </small>
          </div>
        </article>

        <article className="orders-summary-card">
          <div className="orders-summary-icon orange">
            <PatientIcon
              name="clock"
              size={22}
            />
          </div>

          <div>
            <span>
              PROCESSING
            </span>

            <strong>
              {
                processingOrders.length
              }
            </strong>

            <small>
              Orders in progress
            </small>
          </div>
        </article>

        <article className="orders-summary-card">
          <div className="orders-summary-icon teal">
            <PatientIcon
              name="check"
              size={22}
            />
          </div>

          <div>
            <span>
              COMPLETED
            </span>

            <strong>
              {
                completedOrders.length
              }
            </strong>

            <small>
              Completed orders
            </small>
          </div>
        </article>
      </div>

      {/* ORDER HISTORY */}

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
                size={17}
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
          {loading ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <PatientIcon
                  name="package"
                  size={27}
                />
              </div>

              <h3>
                Loading orders
              </h3>

              <p>
                Please wait while we
                load your medicine
                order history.
              </p>
            </div>
          ) : error ? (
            <div className="orders-empty">
              <h3>
                Unable to load orders
              </h3>

              <p>
                {error}
              </p>
            </div>
          ) : filteredOrders.length ===
            0 ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <PatientIcon
                  name="package"
                  size={27}
                />
              </div>

              <h3>
                No orders yet
              </h3>

              <p>
                Your medicine order
                history will appear here
                after an order has been
                submitted.
              </p>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map(
                (order) => (
                  <article
                    key={
                      order.order_id
                    }
                    className="order-history-item"
                  >
                    <div className="order-history-item__left">
                      <span className="order-history-item__icon">
                        <PatientIcon
                          name="package"
                          size={21}
                        />
                      </span>

                      <div className="order-history-item__details">
                        <h3 className="order-history-item__name">
                          {
                            order.medicine_name
                          }
                        </h3>

                        <p className="order-history-item__meta">
                          Quantity:{" "}
                          {
                            order.quantity
                          }
                        </p>

                        {order.notes && (
                          <p className="order-history-item__note">
                            {
                              order.notes
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`order-status order-status--${String(
                        order.status ||
                          "pending"
                      ).toLowerCase()}`}
                    >
                      {order.status ||
                        "pending"}
                    </span>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </article>

      {/* SECURITY */}

      <div className="orders-security">
        <span>
          <PatientIcon
            name="shield"
            size={19}
          />
        </span>

        <div>
          <strong>
            Secure order history
          </strong>

          <small>
            Your pharmacy orders are
            securely linked to your
            patient account.
          </small>
        </div>
      </div>
    </section>
  );
}

export default OrderHistoryPage;