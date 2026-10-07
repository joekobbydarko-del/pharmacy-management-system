import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminInventory,
  syncAdminInventory,
} from "../api";

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminInventoryPage.css";

function InventoryIcon({
  name,
  size = 20,
  className = "",
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const icons = {
    refresh: (
      <>
        <path d="M20 11a8 8 0 0 0-14.9-4" />
        <path d="M4 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.9 4" />
        <path d="M20 20v-5h-5" />
      </>
    ),

    pill: (
      <>
        <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </>
    ),

    boxes: (
      <>
        <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
        <path d="m4.5 6.7 7.5 4.2 7.5-4.2" />
        <path d="M12 11v9" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    warning: (
      <>
        <path d="M10.3 3.6 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    "package-x": (
      <>
        <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
        <path d="m4.5 6.7 7.5 4.2 7.5-4.2" />
        <path d="M12 11v4" />
        <path d="m15.5 15.5 4 4" />
        <path d="m19.5 15.5-4 4" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    catalogue: (
      <>
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2"
        />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
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
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    "cloud-check": (
      <>
        <path d="M7 18a5 5 0 0 1-.8-9.9A7 7 0 0 1 19.5 10a4 4 0 0 1-.5 8H7Z" />
        <path d="m9 14 2 2 4-4" />
      </>
    ),

    x: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.pill}
    </svg>
  );
}

function formatCurrency(value) {
  return `GHS ${Number(value || 0).toFixed(2)}`;
}

function getStatus(item) {
  return (
    item.calculated_status ||
    item.stock_status ||
    "Unknown"
  );
}

function getStatusClass(status) {
  if (status === "Healthy") {
    return "healthy";
  }

  if (status === "Low Stock") {
    return "low";
  }

  if (status === "Out of Stock") {
    return "out";
  }

  return "unknown";
}

function getStatusIcon(status) {
  if (status === "Healthy") {
    return "check";
  }

  if (status === "Low Stock") {
    return "warning";
  }

  if (status === "Out of Stock") {
    return "package-x";
  }

  return "alert";
}

function InventoryStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-inventory-stat-card admin-inventory-stat-card--${tone}`}
    >
      <span className="admin-inventory-stat-card__accent" />

      <div className="admin-inventory-stat-icon">
        <InventoryIcon
          name={icon}
          size={23}
        />
      </div>

      <div className="admin-inventory-stat-copy">
        <span className="admin-inventory-stat-label">
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

function AdminInventoryPage() {
  const [
    inventoryData,
    setInventoryData,
  ] = useState(null);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    notice,
    setNotice,
  ] = useState(null);

  const [
    syncState,
    setSyncState,
  ] = useState("ready");

  useEffect(() => {
    let cancelled = false;

    async function fetchInventory() {
      try {
        const data =
          await getAdminInventory();

        if (!cancelled) {
          setInventoryData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setNotice({
            type: "error",
            title:
              "Inventory could not be loaded",
            message:
              err?.message ||
              "Unable to retrieve the current pharmacy inventory.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setNotice(null);
        },
        5500
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  async function handleSync() {
    if (syncing) {
      return;
    }

    try {
      setSyncing(true);
      setSyncState("syncing");
      setNotice(null);

      const syncResult =
        await syncAdminInventory();

      const refreshedData =
        await getAdminInventory();

      setInventoryData(
        refreshedData
      );

      const drugsSynced =
        Number(
          syncResult?.drugs_synced ??
            refreshedData?.summary
              ?.total_items ??
            refreshedData?.inventory
              ?.length ??
            0
        );

      const inventorySynced =
        Number(
          syncResult
            ?.inventory_synced ??
            refreshedData?.inventory
              ?.length ??
            0
        );

      setSyncState("success");

      setNotice({
        type: "success",
        title:
          "Inventory synchronized",
        message:
          `${drugsSynced} medicines and ` +
          `${inventorySynced} inventory records ` +
          "were refreshed successfully from Google Sheets.",
      });
    } catch (err) {
      setSyncState("error");

      setNotice({
        type: "error",
        title:
          "Synchronization failed",
        message:
          err?.message ||
          "The connected Google Sheet could not be refreshed. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  }

  const filteredInventory =
    useMemo(
      () => {
        const inventory =
          inventoryData?.inventory ??
          [];

        const cleanSearch =
          search
            .trim()
            .toLowerCase();

        if (!cleanSearch) {
          return inventory;
        }

        return inventory.filter(
          (item) => {
            const drugName =
              String(
                item.drug_name || ""
              ).toLowerCase();

            const drugId =
              String(
                item.drug_id || ""
              ).toLowerCase();

            const category =
              String(
                item.category || ""
              ).toLowerCase();

            const status =
              String(
                getStatus(item)
              ).toLowerCase();

            return (
              drugName.includes(
                cleanSearch
              ) ||
              drugId.includes(
                cleanSearch
              ) ||
              category.includes(
                cleanSearch
              ) ||
              status.includes(
                cleanSearch
              )
            );
          }
        );
      },
      [
        inventoryData,
        search,
      ]
    );

  const summary =
    inventoryData?.summary ?? {
      total_items: 0,
      total_units: 0,
      healthy: 0,
      low_stock: 0,
      out_of_stock: 0,
    };

  return (
    <div className="admin-inventory-page">
      <AdminPageIntro
        eyebrow="Pharmacy Stock Management"
        title="Inventory"
        subtitle="Monitor medicine stock, pricing and reorder levels."
        accent="green"
      />

      {notice && (
        <div
          className={`admin-inventory-notice admin-inventory-notice--${notice.type}`}
          role={
            notice.type === "error"
              ? "alert"
              : "status"
          }
        >
          <div className="admin-inventory-notice-icon">
            <InventoryIcon
              name={
                notice.type ===
                "success"
                  ? "cloud-check"
                  : "alert"
              }
              size={25}
            />
          </div>

          <div className="admin-inventory-notice-copy">
            <strong>
              {notice.title}
            </strong>

            <p>
              {notice.message}
            </p>
          </div>

          <button
            type="button"
            className="admin-inventory-notice-close"
            onClick={() =>
              setNotice(null)
            }
            aria-label="Dismiss notification"
          >
            <InventoryIcon
              name="x"
              size={17}
            />
          </button>
        </div>
      )}

      <section className="admin-inventory-stats">
        <InventoryStat
          tone="teal"
          icon="pill"
          label="Medicines"
          value={
            summary.total_items
          }
          note="Registered medicines"
        />

        <InventoryStat
          tone="blue"
          icon="boxes"
          label="Total Units"
          value={
            summary.total_units
          }
          note="Available stock units"
        />

        <InventoryStat
          tone="green"
          icon="shield"
          label="Healthy Stock"
          value={
            summary.healthy
          }
          note="Safe inventory levels"
        />

        <InventoryStat
          tone="amber"
          icon="warning"
          label="Low Stock"
          value={
            summary.low_stock
          }
          note="Requires monitoring"
        />

        <InventoryStat
          tone="red"
          icon="package-x"
          label="Out of Stock"
          value={
            summary.out_of_stock
          }
          note="Requires attention"
        />
      </section>

      <section className="admin-inventory-table-card">
        <div className="admin-inventory-catalogue-header">
          <div className="admin-inventory-table-heading">
            <div className="admin-inventory-table-icon">
              <InventoryIcon
                name="catalogue"
                size={23}
              />
            </div>

            <div>
              <p>
                Inventory Directory
              </p>

              <h2>
                Medicine Catalogue
              </h2>
            </div>
          </div>

          <div className="admin-inventory-search">
            <div className="admin-inventory-search-icon">
              <InventoryIcon
                name="search"
                size={18}
              />
            </div>

            <input
              type="search"
              value={search}
              onChange={
                (event) => {
                  setSearch(
                    event.target.value
                  );
                }
              }
              placeholder="Search medicine, code, category or status..."
            />

            {search && (
              <button
                type="button"
                className="admin-inventory-search-clear"
                onClick={() => {
                  setSearch("");
                }}
                aria-label="Clear inventory search"
              >
                ×
              </button>
            )}
          </div>

          <div className="admin-inventory-count">
            <InventoryIcon
              name="boxes"
              size={15}
            />

            <span>
              {
                filteredInventory.length
              }{" "}
              {filteredInventory.length ===
              1
                ? "medicine"
                : "medicines"}
            </span>
          </div>
        </div>

        <div className="admin-inventory-table-wrap">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Drug</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Monthly</th>
                <th>One-Time</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="admin-inventory-empty-cell"
                  >
                    <div className="admin-inventory-loading">
                      <div className="admin-inventory-empty-icon">
                        <InventoryIcon
                          name="refresh"
                          size={25}
                          className="admin-inventory-spinner"
                        />
                      </div>

                      <strong>
                        Loading inventory
                      </strong>

                      <span>
                        Retrieving live pharmacy stock...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="admin-inventory-empty-cell"
                  >
                    <div className="admin-inventory-empty">
                      <div className="admin-inventory-empty-icon">
                        <InventoryIcon
                          name="search"
                          size={26}
                        />
                      </div>

                      <strong>
                        No medicines found
                      </strong>

                      <span>
                        Try another medicine,
                        code, category or status.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map(
                  (item) => {
                    const status =
                      getStatus(item);

                    const statusClass =
                      getStatusClass(
                        status
                      );

                    return (
                      <tr
                        key={
                          item.inventory_id ||
                          item.drug_id
                        }
                      >
                        <td>
                          <div className="admin-inventory-drug">
                            <div className="admin-inventory-drug-icon">
                              <InventoryIcon
                                name="pill"
                                size={17}
                              />
                            </div>

                            <div className="admin-inventory-drug-info">
                              <strong>
                                {item.drug_name ||
                                  "Unnamed medicine"}
                              </strong>

                              <span>
                                {item.drug_id ||
                                  "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.category ||
                            "-"}
                        </td>

                        <td className="admin-inventory-money">
                          {formatCurrency(
                            item.cost_price
                          )}
                        </td>

                        <td className="admin-inventory-money">
                          {formatCurrency(
                            item.monthly_price
                          )}
                        </td>

                        <td className="admin-inventory-money">
                          {formatCurrency(
                            item.one_time_price
                          )}
                        </td>

                        <td>
                          <span className="admin-inventory-stock-number">
                            {item.stock_quantity ??
                              0}
                          </span>
                        </td>

                        <td>
                          {item.reorder_level ??
                            0}
                        </td>

                        <td>
                          <span
                            className={`admin-inventory-status ${statusClass}`}
                          >
                            <InventoryIcon
                              name={getStatusIcon(
                                status
                              )}
                              size={12}
                            />

                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>

        <div
          className={`admin-inventory-sync-panel admin-inventory-sync-panel--${syncState}`}
        >
          <div className="admin-inventory-sync-panel-icon">
            <InventoryIcon
              name={
                syncState === "success"
                  ? "cloud-check"
                  : syncState === "error"
                    ? "alert"
                    : "refresh"
              }
              size={24}
              className={
                syncing
                  ? "admin-inventory-spinner"
                  : ""
              }
            />
          </div>

          <div className="admin-inventory-sync-panel-copy">
            <span>
              Inventory Data Source
            </span>

            <strong>
              Google Sheet Synchronization
            </strong>

            <p>
              Refresh medicine pricing,
              stock quantities and reorder
              information from the connected
              pharmacy inventory source.
            </p>
          </div>

          <div className="admin-inventory-sync-panel-action">
            <span
              className={`admin-inventory-sync-status admin-inventory-sync-status--${syncState}`}
            >
              <span className="admin-inventory-sync-status-dot" />

              {syncing
                ? "Synchronizing"
                : syncState === "success"
                  ? "Synced"
                  : syncState === "error"
                    ? "Retry available"
                    : "Connected"}
            </span>

            <button
              type="button"
              className="admin-inventory-sync-button"
              onClick={
                handleSync
              }
              disabled={
                syncing
              }
            >
              <InventoryIcon
                name="refresh"
                size={18}
                className={
                  syncing
                    ? "admin-inventory-spinner"
                    : ""
                }
              />

              <span>
                {syncing
                  ? "Synchronizing..."
                  : "Sync Google Sheet"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminInventoryPage;