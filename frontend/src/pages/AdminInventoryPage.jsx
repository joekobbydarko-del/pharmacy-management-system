import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAdminInventory,
  syncAdminInventory,
} from "../api";

import "./AdminInventoryPage.css";


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
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        const data =
          await getAdminInventory();

        if (!cancelled) {
          setInventoryData(
            data
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load inventory."
          );
        }
      }

      finally {
        if (!cancelled) {
          setLoading(
            false
          );
        }
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);


  async function handleSync() {
    try {
      setSyncing(
        true
      );

      setError("");

      await syncAdminInventory();

      const refreshedData =
        await getAdminInventory();

      setInventoryData(
        refreshedData
      );
    }

    catch (err) {
      setError(
        err.message ||
        "Unable to synchronize inventory."
      );
    }

    finally {
      setSyncing(
        false
      );
    }
  }


  const filteredInventory =
    useMemo(
      () => {
        const inventory =
          inventoryData?.inventory
          ?? [];

        const cleanSearch =
          search
            .trim()
            .toLowerCase();

        if (!cleanSearch) {
          return inventory;
        }

        return inventory.filter(
          (item) => {
            return (
              item.drug_name
                ?.toLowerCase()
                .includes(
                  cleanSearch
                ) ||

              item.drug_id
                ?.toLowerCase()
                .includes(
                  cleanSearch
                ) ||

              item.category
                ?.toLowerCase()
                .includes(
                  cleanSearch
                ) ||

              item.stock_status
                ?.toLowerCase()
                .includes(
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


  if (loading) {
    return (
      <div className="admin-inventory-page">
        <div className="admin-inventory-loading">
          Loading inventory...
        </div>
      </div>
    );
  }


  const summary =
    inventoryData?.summary
    ?? {
      total_items: 0,
      total_units: 0,
      healthy: 0,
      low_stock: 0,
      out_of_stock: 0,
    };


  return (
    <div className="admin-inventory-page">

      <div className="admin-inventory-header">

        <div>
          <p className="admin-inventory-eyebrow">
            Pharmacy Stock Management
          </p>

          <h1>
            Inventory
          </h1>

          <p className="admin-inventory-subtitle">
            Monitor medicine stock,
            pricing and reorder levels.
          </p>
        </div>


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
          {
            syncing
              ? "Syncing..."
              : "Sync Google Sheet"
          }
        </button>

      </div>


      {
        error && (
          <div className="admin-inventory-error">
            {error}
          </div>
        )
      }


      <div className="admin-inventory-stats">

        <div className="admin-inventory-stat-card">
          <span>
            Medicines
          </span>

          <strong>
            {
              summary.total_items
            }
          </strong>
        </div>


        <div className="admin-inventory-stat-card">
          <span>
            Total Units
          </span>

          <strong>
            {
              summary.total_units
            }
          </strong>
        </div>


        <div className="admin-inventory-stat-card">
          <span>
            Healthy Stock
          </span>

          <strong>
            {
              summary.healthy
            }
          </strong>
        </div>


        <div className="admin-inventory-stat-card warning">
          <span>
            Low Stock
          </span>

          <strong>
            {
              summary.low_stock
            }
          </strong>
        </div>


        <div className="admin-inventory-stat-card danger">
          <span>
            Out of Stock
          </span>

          <strong>
            {
              summary.out_of_stock
            }
          </strong>
        </div>

      </div>


      <div className="admin-inventory-toolbar">

        <input
          type="text"
          value={
            search
          }
          onChange={
            (
              event
            ) => {
              setSearch(
                event
                  .target
                  .value
              );
            }
          }
          placeholder="Search medicines..."
        />

      </div>


      <div className="admin-inventory-table-card">

        <div className="admin-inventory-table-wrap">

          <table className="admin-inventory-table">

            <thead>
              <tr>
                <th>
                  Drug
                </th>

                <th>
                  Category
                </th>

                <th>
                  Cost
                </th>

                <th>
                  Monthly
                </th>

                <th>
                  One-Time
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Reorder
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>


            <tbody>

              {
                filteredInventory.length
                  === 0
                  ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="admin-inventory-empty"
                      >
                        No inventory items found.
                      </td>
                    </tr>
                  )
                  : (
                    filteredInventory.map(
                      (
                        item
                      ) => (
                        <tr
                          key={
                            item.inventory_id
                          }
                        >

                          <td>
                            <div className="admin-inventory-drug">
                              <strong>
                                {
                                  item.drug_name
                                }
                              </strong>

                              <span>
                                {
                                  item.drug_id
                                }
                              </span>
                            </div>
                          </td>


                          <td>
                            {
                              item.category
                              || "-"
                            }
                          </td>


                          <td>
                            GHS{" "}
                            {
                              Number(
                                item.cost_price
                                || 0
                              )
                                .toFixed(
                                  2
                                )
                            }
                          </td>


                          <td>
                            GHS{" "}
                            {
                              Number(
                                item.monthly_price
                                || 0
                              )
                                .toFixed(
                                  2
                                )
                            }
                          </td>


                          <td>
                            GHS{" "}
                            {
                              Number(
                                item.one_time_price
                                || 0
                              )
                                .toFixed(
                                  2
                                )
                            }
                          </td>


                          <td>
                            {
                              item.stock_quantity
                            }
                          </td>


                          <td>
                            {
                              item.reorder_level
                            }
                          </td>


                          <td>
                            <span
                              className={
                                `admin-inventory-status ${
                                  item.calculated_status
                                    === "Healthy"
                                    ? "healthy"
                                    : item.calculated_status
                                      === "Low Stock"
                                      ? "low"
                                      : "out"
                                }`
                              }
                            >
                              {
                                item.calculated_status
                              }
                            </span>
                          </td>

                        </tr>
                      )
                    )
                  )
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


export default AdminInventoryPage;