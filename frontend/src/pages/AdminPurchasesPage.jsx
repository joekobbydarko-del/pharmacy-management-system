import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAdminPurchase,
  getAdminPurchaseDrugs,
  getAdminPurchases,
} from "../api";

import "./AdminPurchasesPage.css";


function AdminPurchasesPage() {
  const [
    drugs,
    setDrugs,
  ] = useState([]);

  const [
    purchases,
    setPurchases,
  ] = useState([]);

  const [
    supplierName,
    setSupplierName,
  ] = useState("");

  const [
    referenceNumber,
    setReferenceNumber,
  ] = useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("paid");

  const [
    selectedDrugId,
    setSelectedDrugId,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    unitCost,
    setUnitCost,
  ] = useState("");

  const [
    cart,
    setCart,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [
          drugsData,
          purchasesData,
        ] = await Promise.all([
          getAdminPurchaseDrugs(),
          getAdminPurchases(),
        ]);

        if (!cancelled) {
          setDrugs(
            drugsData?.drugs
            ?? []
          );

          setPurchases(
            purchasesData?.purchases
            ?? []
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load purchases."
          );
        }
      }

      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);


  const selectedDrug =
    useMemo(
      () => {
        return drugs.find(
          (
            drug
          ) =>
            drug.drug_id
            ===
            selectedDrugId
        );
      },
      [
        drugs,
        selectedDrugId,
      ]
    );


  const total =
    useMemo(
      () => {
        return cart.reduce(
          (
            sum,
            item
          ) => {
            return (
              sum
              +
              Number(
                item.total_cost
                || 0
              )
            );
          },
          0
        );
      },
      [
        cart,
      ]
    );


  function handleDrugChange(
    drugId
  ) {
    setSelectedDrugId(
      drugId
    );

    const drug =
      drugs.find(
        (
          item
        ) =>
          item.drug_id
          ===
          drugId
      );

    if (drug) {
      setUnitCost(
        String(
          drug.cost_price
          ?? ""
        )
      );
    }
    else {
      setUnitCost("");
    }
  }


  function addItem() {
    setError("");
    setSuccess("");

    if (!selectedDrug) {
      setError(
        "Select a medicine first."
      );

      return;
    }

    const safeQuantity =
      Number(
        quantity
      );

    const safeUnitCost =
      Number(
        unitCost
      );

    if (
      !safeQuantity
      ||
      safeQuantity < 1
    ) {
      setError(
        "Quantity must be at least 1."
      );

      return;
    }

    if (
      Number.isNaN(
        safeUnitCost
      )
      ||
      safeUnitCost < 0
    ) {
      setError(
        "Enter a valid unit cost."
      );

      return;
    }

    setCart(
      (
        current
      ) => {
        const existing =
          current.find(
            (
              item
            ) =>
              item.drug_id
              ===
              selectedDrug.drug_id
          );

        if (existing) {
          return current.map(
            (
              item
            ) => {
              if (
                item.drug_id
                !==
                selectedDrug.drug_id
              ) {
                return item;
              }

              const nextQuantity =
                item.quantity
                +
                safeQuantity;

              return {
                ...item,
                quantity:
                  nextQuantity,
                unit_cost:
                  safeUnitCost,
                total_cost:
                  nextQuantity
                  *
                  safeUnitCost,
              };
            }
          );
        }

        return [
          ...current,
          {
            drug_id:
              selectedDrug.drug_id,

            drug_name:
              selectedDrug.drug_name,

            quantity:
              safeQuantity,

            unit_cost:
              safeUnitCost,

            total_cost:
              safeQuantity
              *
              safeUnitCost,
          },
        ];
      }
    );

    setQuantity(1);
  }


  function removeItem(
    drugId
  ) {
    setCart(
      (
        current
      ) =>
        current.filter(
          (
            item
          ) =>
            item.drug_id
            !==
            drugId
        )
    );
  }


  async function handleSubmit() {
    setError("");
    setSuccess("");

    if (
      !supplierName.trim()
    ) {
      setError(
        "Supplier name is required."
      );

      return;
    }

    if (
      cart.length === 0
    ) {
      setError(
        "Add at least one medicine."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await createAdminPurchase(
          {
            supplier_name:
              supplierName.trim(),

            reference_number:
              referenceNumber.trim()
              || null,

            payment_status:
              paymentStatus,

            items:
              cart.map(
                (
                  item
                ) => ({
                  drug_id:
                    item.drug_id,

                  quantity:
                    item.quantity,

                  unit_cost:
                    item.unit_cost,
                })
              ),
          }
        );

      const [
        refreshedDrugs,
        refreshedPurchases,
      ] = await Promise.all([
        getAdminPurchaseDrugs(),
        getAdminPurchases(),
      ]);

      setDrugs(
        refreshedDrugs?.drugs
        ?? []
      );

      setPurchases(
        refreshedPurchases?.purchases
        ?? []
      );

      setSupplierName("");
      setReferenceNumber("");
      setSelectedDrugId("");
      setUnitCost("");
      setQuantity(1);
      setCart([]);

      setSuccess(
        `Purchase ${
          result?.purchase
            ?.purchase_number
          ?? ""
        } recorded successfully.`
      );
    }

    catch (err) {
      setError(
        err.message ||
        "Unable to record purchase."
      );
    }

    finally {
      setProcessing(false);
    }
  }


  if (loading) {
    return (
      <div className="admin-purchases-page">
        <div className="admin-purchases-loading">
          Loading purchases...
        </div>
      </div>
    );
  }


  return (
    <div className="admin-purchases-page">

      <div className="admin-purchases-header">

        <div>
          <p className="admin-purchases-eyebrow">
            Stock Receiving
          </p>

          <h1>
            Purchases
          </h1>

          <p className="admin-purchases-subtitle">
            Record medicines received
            from suppliers and update
            pharmacy inventory.
          </p>
        </div>

      </div>


      {
        error && (
          <div className="admin-purchases-message error">
            {error}
          </div>
        )
      }


      {
        success && (
          <div className="admin-purchases-message success">
            {success}
          </div>
        )
      }


      <div className="admin-purchases-grid">

        <section className="admin-purchases-card">

          <div className="admin-purchases-card-header">
            <h2>
              New Purchase
            </h2>
          </div>


          <div className="admin-purchases-form">

            <label>
              Supplier Name

              <input
                type="text"
                value={
                  supplierName
                }
                onChange={
                  (
                    event
                  ) =>
                    setSupplierName(
                      event.target.value
                    )
                }
                placeholder="Supplier name"
              />
            </label>


            <label>
              Reference Number

              <input
                type="text"
                value={
                  referenceNumber
                }
                onChange={
                  (
                    event
                  ) =>
                    setReferenceNumber(
                      event.target.value
                    )
                }
                placeholder="Invoice or reference"
              />
            </label>


            <label>
              Payment Status

              <select
                value={
                  paymentStatus
                }
                onChange={
                  (
                    event
                  ) =>
                    setPaymentStatus(
                      event.target.value
                    )
                }
              >
                <option value="paid">
                  Paid
                </option>

                <option value="pending">
                  Pending
                </option>
              </select>
            </label>

          </div>


          <div className="admin-purchases-item-builder">

            <label>
              Medicine

              <select
                value={
                  selectedDrugId
                }
                onChange={
                  (
                    event
                  ) =>
                    handleDrugChange(
                      event.target.value
                    )
                }
              >
                <option value="">
                  Select medicine
                </option>

                {
                  drugs.map(
                    (
                      drug
                    ) => (
                      <option
                        key={
                          drug.drug_id
                        }
                        value={
                          drug.drug_id
                        }
                      >
                        {
                          drug.drug_name
                        }
                        {" - Stock "}
                        {
                          drug.current_stock
                        }
                      </option>
                    )
                  )
                }
              </select>
            </label>


            <label>
              Quantity

              <input
                type="number"
                min="1"
                value={
                  quantity
                }
                onChange={
                  (
                    event
                  ) =>
                    setQuantity(
                      event.target.value
                    )
                }
              />
            </label>


            <label>
              Unit Cost

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  unitCost
                }
                onChange={
                  (
                    event
                  ) =>
                    setUnitCost(
                      event.target.value
                    )
                }
                placeholder="0.00"
              />
            </label>


            <button
              type="button"
              className="admin-purchases-add-button"
              onClick={
                addItem
              }
            >
              Add Item
            </button>

          </div>


          <div className="admin-purchases-cart">

            {
              cart.length === 0
                ? (
                  <div className="admin-purchases-empty">
                    No medicines added yet.
                  </div>
                )
                : (
                  cart.map(
                    (
                      item
                    ) => (
                      <div
                        className="admin-purchases-cart-row"
                        key={
                          item.drug_id
                        }
                      >

                        <div>
                          <strong>
                            {
                              item.drug_name
                            }
                          </strong>

                          <span>
                            {
                              item.quantity
                            }
                            {" × GHS "}
                            {
                              Number(
                                item.unit_cost
                              )
                                .toFixed(2)
                            }
                          </span>
                        </div>


                        <div>
                          <strong>
                            GHS{" "}
                            {
                              Number(
                                item.total_cost
                              )
                                .toFixed(2)
                            }
                          </strong>

                          <button
                            type="button"
                            onClick={
                              () =>
                                removeItem(
                                  item.drug_id
                                )
                            }
                          >
                            Remove
                          </button>
                        </div>

                      </div>
                    )
                  )
                )
            }

          </div>


          <div className="admin-purchases-total">

            <span>
              Purchase Total
            </span>

            <strong>
              GHS{" "}
              {
                total.toFixed(2)
              }
            </strong>

          </div>


          <button
            type="button"
            className="admin-purchases-submit-button"
            disabled={
              processing
              ||
              cart.length === 0
            }
            onClick={
              handleSubmit
            }
          >
            {
              processing
                ? "Saving Purchase..."
                : "Record Purchase"
            }
          </button>

        </section>


        <section className="admin-purchases-card">

          <div className="admin-purchases-card-header">

            <div>
              <h2>
                Current Stock
              </h2>

              <span>
                {
                  drugs.length
                } medicines
              </span>
            </div>

          </div>


          <div className="admin-purchases-stock-list">

            {
              drugs.map(
                (
                  drug
                ) => (
                  <div
                    className="admin-purchases-stock-row"
                    key={
                      drug.drug_id
                    }
                  >

                    <div>
                      <strong>
                        {
                          drug.drug_name
                        }
                      </strong>

                      <span>
                        {
                          drug.drug_id
                        }
                        {
                          drug.category
                            ? ` • ${drug.category}`
                            : ""
                        }
                      </span>
                    </div>


                    <div>
                      <strong>
                        {
                          drug.current_stock
                        }
                      </strong>

                      <span>
                        GHS{" "}
                        {
                          Number(
                            drug.cost_price
                            || 0
                          )
                            .toFixed(2)
                        }
                      </span>
                    </div>

                  </div>
                )
              )
            }

          </div>

        </section>

      </div>


      <section className="admin-purchases-card admin-purchases-history">

        <div className="admin-purchases-card-header">

          <div>
            <h2>
              Purchase History
            </h2>

            <span>
              {
                purchases.length
              } records
            </span>
          </div>

        </div>


        <div className="admin-purchases-table-wrap">

          <table className="admin-purchases-table">

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
                  Items
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

              {
                purchases.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="admin-purchases-empty"
                      >
                        No purchases recorded.
                      </td>
                    </tr>
                  )
                  : (
                    purchases.map(
                      (
                        purchase
                      ) => (
                        <tr
                          key={
                            purchase.id
                          }
                        >

                          <td>
                            <strong>
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
                            {
                              purchase.reference_number
                              || "-"
                            }
                          </td>

                          <td>
                            {
                              purchase.item_count
                            }
                          </td>

                          <td>
                            GHS{" "}
                            {
                              Number(
                                purchase.total_amount
                                || 0
                              )
                                .toFixed(2)
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


export default AdminPurchasesPage;