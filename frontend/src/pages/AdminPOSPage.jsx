import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkoutAdminPOS,
  getAdminPOSProducts,
  getAdminPOSSales,
} from "../api";

import "./AdminPOSPage.css";


function AdminPOSPage() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    sales,
    setSales,
  ] = useState([]);

  const [
    cart,
    setCart,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("cash");

  const [
    amountPaid,
    setAmountPaid,
  ] = useState("");

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

    async function loadPOS() {
      try {
        const [
          productData,
          salesData,
        ] = await Promise.all([
          getAdminPOSProducts(),
          getAdminPOSSales(),
        ]);

        if (!cancelled) {
          setProducts(
            productData?.products ?? []
          );

          setSales(
            salesData?.sales ?? []
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load POS data."
          );
        }
      }

      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPOS();

    return () => {
      cancelled = true;
    };
  }, []);


  const filteredProducts =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return products;
        }

        return products.filter(
          (product) => {
            return (
              product.drug_name
                ?.toLowerCase()
                .includes(term)
              ||
              product.drug_id
                ?.toLowerCase()
                .includes(term)
              ||
              product.category
                ?.toLowerCase()
                .includes(term)
            );
          }
        );
      },
      [
        products,
        search,
      ]
    );


  const subtotal =
    useMemo(
      () => {
        return cart.reduce(
          (
            total,
            item
          ) => {
            return (
              total
              +
              Number(
                item.price || 0
              )
              *
              Number(
                item.quantity || 0
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


  const changeAmount =
    Math.max(
      0,
      Number(
        amountPaid || 0
      )
      -
      subtotal
    );


  function addToCart(
    product
  ) {
    setSuccess("");
    setError("");

    if (
      product.stock_quantity
      <= 0
    ) {
      setError(
        `${product.drug_name} is out of stock.`
      );

      return;
    }

    setCart(
      (
        current
      ) => {
        const existing =
          current.find(
            (item) =>
              item.drug_id
              ===
              product.drug_id
          );

        if (existing) {
          if (
            existing.quantity
            >=
            product.stock_quantity
          ) {
            return current;
          }

          return current.map(
            (item) => {
              if (
                item.drug_id
                ===
                product.drug_id
              ) {
                return {
                  ...item,
                  quantity:
                    item.quantity
                    + 1,
                };
              }

              return item;
            }
          );
        }

        return [
          ...current,
          {
            ...product,
            quantity: 1,
          },
        ];
      }
    );
  }


  function updateQuantity(
    drugId,
    nextQuantity
  ) {
    setCart(
      (
        current
      ) => {
        return current
          .map(
            (item) => {
              if (
                item.drug_id
                !==
                drugId
              ) {
                return item;
              }

              const safeQuantity =
                Math.max(
                  1,
                  Math.min(
                    nextQuantity,
                    item.stock_quantity
                  )
                );

              return {
                ...item,
                quantity:
                  safeQuantity,
              };
            }
          );
      }
    );
  }


  function removeFromCart(
    drugId
  ) {
    setCart(
      (
        current
      ) =>
        current.filter(
          (item) =>
            item.drug_id
            !==
            drugId
        )
    );
  }


  async function handleCheckout() {
    setError("");
    setSuccess("");

    if (
      cart.length === 0
    ) {
      setError(
        "Add at least one medicine to the cart."
      );

      return;
    }

    if (
      Number(
        amountPaid || 0
      )
      <
      subtotal
    ) {
      setError(
        "Amount paid is less than the total."
      );

      return;
    }

    try {
      setProcessing(true);

      const result =
        await checkoutAdminPOS(
          {
            customer_name:
              customerName.trim()
              || "Walk-in Customer",

            customer_type:
              "walk_in",

            patient_id:
              null,

            payment_method:
              paymentMethod,

            amount_paid:
              Number(
                amountPaid
              ),

            items:
              cart.map(
                (item) => ({
                  drug_id:
                    item.drug_id,

                  quantity:
                    item.quantity,
                })
              ),
          }
        );

      const [
        refreshedProducts,
        refreshedSales,
      ] =
        await Promise.all([
          getAdminPOSProducts(),
          getAdminPOSSales(),
        ]);

      setProducts(
        refreshedProducts?.products
        ?? []
      );

      setSales(
        refreshedSales?.sales
        ?? []
      );

      setCart([]);
      setCustomerName("");
      setAmountPaid("");

      setSuccess(
        `Sale ${result?.sale?.sale_number ?? ""} completed successfully.`
      );
    }

    catch (err) {
      setError(
        err.message ||
        "Unable to complete sale."
      );
    }

    finally {
      setProcessing(false);
    }
  }


  if (loading) {
    return (
      <div className="admin-pos-page">
        <div className="admin-pos-loading">
          Loading POS...
        </div>
      </div>
    );
  }


  return (
    <div className="admin-pos-page">

      <div className="admin-pos-header">

        <div>
          <p className="admin-pos-eyebrow">
            Counter Sales
          </p>

          <h1>
            Point of Sale
          </h1>

          <p className="admin-pos-subtitle">
            Select medicines,
            build the cart and
            complete a pharmacy sale.
          </p>
        </div>

      </div>


      {
        error && (
          <div className="admin-pos-message error">
            {error}
          </div>
        )
      }


      {
        success && (
          <div className="admin-pos-message success">
            {success}
          </div>
        )
      }


      <div className="admin-pos-grid">

        <section className="admin-pos-products">

          <div className="admin-pos-section-header">

            <div>
              <h2>
                Medicines
              </h2>

              <span>
                {
                  products.length
                } products
              </span>
            </div>


            <input
              type="search"
              value={search}
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search medicines..."
            />

          </div>


          <div className="admin-pos-product-list">

            {
              filteredProducts.length
                === 0
                ? (
                  <div className="admin-pos-empty">
                    No medicines found.
                  </div>
                )
                : (
                  filteredProducts.map(
                    (
                      product
                    ) => (
                      <button
                        type="button"
                        key={
                          product.drug_id
                        }
                        className="admin-pos-product-card"
                        onClick={
                          () =>
                            addToCart(
                              product
                            )
                        }
                        disabled={
                          product.stock_quantity
                          <= 0
                        }
                      >

                        <div>

                          <strong>
                            {
                              product.drug_name
                            }
                          </strong>

                          <span>
                            {
                              product.drug_id
                            }
                            {
                              product.category
                                ? ` • ${product.category}`
                                : ""
                            }
                          </span>

                        </div>


                        <div className="admin-pos-product-meta">

                          <strong>
                            GHS{" "}
                            {
                              Number(
                                product.price
                                || 0
                              )
                                .toFixed(2)
                            }
                          </strong>

                          <span>
                            Stock:{" "}
                            {
                              product.stock_quantity
                            }
                          </span>

                        </div>

                      </button>
                    )
                  )
                )
            }

          </div>

        </section>


        <aside className="admin-pos-cart">

          <div className="admin-pos-cart-header">

            <div>
              <h2>
                Current Sale
              </h2>

              <span>
                {
                  cart.length
                } item types
              </span>
            </div>

          </div>


          <div className="admin-pos-customer-fields">

            <input
              type="text"
              value={
                customerName
              }
              onChange={
                (
                  event
                ) =>
                  setCustomerName(
                    event.target.value
                  )
              }
              placeholder="Customer name"
            />


            <select
              value={
                paymentMethod
              }
              onChange={
                (
                  event
                ) =>
                  setPaymentMethod(
                    event.target.value
                  )
              }
            >
              <option value="cash">
                Cash
              </option>

              <option value="mobile_money">
                Mobile Money
              </option>

              <option value="card">
                Card
              </option>

              <option value="bank_transfer">
                Bank Transfer
              </option>
            </select>

          </div>


          <div className="admin-pos-cart-items">

            {
              cart.length
                === 0
                ? (
                  <div className="admin-pos-empty">
                    Cart is empty.
                  </div>
                )
                : (
                  cart.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.drug_id
                        }
                        className="admin-pos-cart-item"
                      >

                        <div className="admin-pos-cart-item-main">

                          <strong>
                            {
                              item.drug_name
                            }
                          </strong>

                          <span>
                            GHS{" "}
                            {
                              Number(
                                item.price
                              )
                                .toFixed(2)
                            }
                            {" each"}
                          </span>

                        </div>


                        <div className="admin-pos-quantity">

                          <button
                            type="button"
                            onClick={
                              () =>
                                updateQuantity(
                                  item.drug_id,
                                  item.quantity
                                  - 1
                                )
                            }
                          >
                            -
                          </button>

                          <span>
                            {
                              item.quantity
                            }
                          </span>

                          <button
                            type="button"
                            onClick={
                              () =>
                                updateQuantity(
                                  item.drug_id,
                                  item.quantity
                                  + 1
                                )
                            }
                          >
                            +
                          </button>

                        </div>


                        <div className="admin-pos-cart-item-total">

                          <strong>
                            GHS{" "}
                            {
                              (
                                Number(
                                  item.price
                                )
                                *
                                item.quantity
                              )
                                .toFixed(2)
                            }
                          </strong>

                          <button
                            type="button"
                            onClick={
                              () =>
                                removeFromCart(
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


          <div className="admin-pos-summary">

            <div>
              <span>
                Total
              </span>

              <strong>
                GHS{" "}
                {
                  subtotal.toFixed(2)
                }
              </strong>
            </div>


            <label>
              Amount Paid

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  amountPaid
                }
                onChange={
                  (
                    event
                  ) =>
                    setAmountPaid(
                      event.target.value
                    )
                }
                placeholder="0.00"
              />
            </label>


            <div>
              <span>
                Change
              </span>

              <strong>
                GHS{" "}
                {
                  changeAmount
                    .toFixed(2)
                }
              </strong>
            </div>


            <button
              type="button"
              className="admin-pos-checkout-button"
              onClick={
                handleCheckout
              }
              disabled={
                processing
                ||
                cart.length === 0
              }
            >
              {
                processing
                  ? "Processing..."
                  : "Complete Sale"
              }
            </button>

          </div>

        </aside>

      </div>


      <section className="admin-pos-recent-sales">

        <div className="admin-pos-section-header">

          <div>
            <h2>
              Recent POS Sales
            </h2>

            <span>
              Latest transactions
            </span>
          </div>

        </div>


        <div className="admin-pos-sales-table-wrap">

          <table className="admin-pos-sales-table">

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
                  Total
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>


            <tbody>

              {
                sales.length === 0
                  ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="admin-pos-empty"
                      >
                        No POS sales yet.
                      </td>
                    </tr>
                  )
                  : (
                    sales
                      .slice(
                        0,
                        8
                      )
                      .map(
                        (
                          sale
                        ) => (
                          <tr
                            key={
                              sale.id
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
                                )
                                  .toFixed(2)
                              }
                            </td>

                            <td>
                              {
                                sale.status
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


export default AdminPOSPage;