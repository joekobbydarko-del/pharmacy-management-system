import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAdminSupplier,
  getAdminSuppliers,
  updateAdminSupplierStatus,
} from "../api";

import "./AdminSuppliersPage.css";


function AdminSuppliersPage() {
  const [
    suppliers,
    setSuppliers,
  ] = useState([]);

  const [
    supplierName,
    setSupplierName,
  ] = useState("");

  const [
    contactPerson,
    setContactPerson,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
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

    async function loadInitialSuppliers() {
      try {
        const data =
          await getAdminSuppliers();

        if (!cancelled) {
          setSuppliers(
            data?.suppliers
            ?? []
          );

          setError("");
        }
      }

      catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
            "Unable to load suppliers."
          );
        }
      }

      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialSuppliers();

    return () => {
      cancelled = true;
    };
  }, []);


  async function refreshSuppliers() {
    const data =
      await getAdminSuppliers();

    setSuppliers(
      data?.suppliers
      ?? []
    );
  }


  const filteredSuppliers =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return suppliers;
        }

        return suppliers.filter(
          (
            supplier
          ) => {
            return (
              supplier.supplier_name
                ?.toLowerCase()
                .includes(term)
              ||
              supplier.supplier_code
                ?.toLowerCase()
                .includes(term)
              ||
              supplier.contact_person
                ?.toLowerCase()
                .includes(term)
              ||
              supplier.phone
                ?.toLowerCase()
                .includes(term)
              ||
              supplier.email
                ?.toLowerCase()
                .includes(term)
            );
          }
        );
      },
      [
        suppliers,
        search,
      ]
    );


  const activeCount =
    suppliers.filter(
      (
        supplier
      ) =>
        supplier.is_active
    ).length;


  async function handleCreateSupplier(
    event
  ) {
    event.preventDefault();

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

    try {
      setSaving(true);

      const result =
        await createAdminSupplier(
          {
            supplier_name:
              supplierName.trim(),

            contact_person:
              contactPerson.trim()
              || null,

            phone:
              phone.trim()
              || null,

            email:
              email.trim()
              || null,

            address:
              address.trim()
              || null,

            notes:
              notes.trim()
              || null,
          }
        );

      await refreshSuppliers();

      setSupplierName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");

      setSuccess(
        `${
          result?.supplier
            ?.supplier_name
          ?? "Supplier"
        } created successfully.`
      );
    }

    catch (err) {
      setError(
        err.message ||
        "Unable to create supplier."
      );
    }

    finally {
      setSaving(false);
    }
  }


  async function handleStatusChange(
    supplier
  ) {
    setError("");
    setSuccess("");

    try {
      await updateAdminSupplierStatus(
        supplier.id,
        !supplier.is_active
      );

      await refreshSuppliers();

      setSuccess(
        supplier.is_active
          ? "Supplier deactivated."
          : "Supplier reactivated."
      );
    }

    catch (err) {
      setError(
        err.message ||
        "Unable to update supplier."
      );
    }
  }


  if (loading) {
    return (
      <div className="admin-suppliers-page">

        <div className="admin-suppliers-loading">
          Loading suppliers...
        </div>

      </div>
    );
  }


  return (
    <div className="admin-suppliers-page">

      <div className="admin-suppliers-header">

        <div>

          <p className="admin-suppliers-eyebrow">
            Supplier Management
          </p>

          <h1>
            Suppliers
          </h1>

          <p className="admin-suppliers-subtitle">
            Manage pharmacy suppliers
            and contact information.
          </p>

        </div>

      </div>


      {
        error && (
          <div className="admin-suppliers-message error">
            {error}
          </div>
        )
      }


      {
        success && (
          <div className="admin-suppliers-message success">
            {success}
          </div>
        )
      }


      <div className="admin-suppliers-stats">

        <div className="admin-suppliers-stat">

          <span>
            Total Suppliers
          </span>

          <strong>
            {
              suppliers.length
            }
          </strong>

        </div>


        <div className="admin-suppliers-stat">

          <span>
            Active
          </span>

          <strong>
            {
              activeCount
            }
          </strong>

        </div>


        <div className="admin-suppliers-stat">

          <span>
            Inactive
          </span>

          <strong>
            {
              suppliers.length
              -
              activeCount
            }
          </strong>

        </div>

      </div>


      <div className="admin-suppliers-grid">

        <section className="admin-suppliers-card">

          <h2>
            Add Supplier
          </h2>


          <form
            className="admin-suppliers-form"
            onSubmit={
              handleCreateSupplier
            }
          >

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
              Contact Person

              <input
                type="text"
                value={
                  contactPerson
                }
                onChange={
                  (
                    event
                  ) =>
                    setContactPerson(
                      event.target.value
                    )
                }
                placeholder="Contact person"
              />
            </label>


            <label>
              Phone

              <input
                type="text"
                value={
                  phone
                }
                onChange={
                  (
                    event
                  ) =>
                    setPhone(
                      event.target.value
                    )
                }
                placeholder="Phone number"
              />
            </label>


            <label>
              Email

              <input
                type="email"
                value={
                  email
                }
                onChange={
                  (
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                }
                placeholder="Email"
              />
            </label>


            <label>
              Address

              <input
                type="text"
                value={
                  address
                }
                onChange={
                  (
                    event
                  ) =>
                    setAddress(
                      event.target.value
                    )
                }
                placeholder="Address"
              />
            </label>


            <label>
              Notes

              <textarea
                value={
                  notes
                }
                onChange={
                  (
                    event
                  ) =>
                    setNotes(
                      event.target.value
                    )
                }
                placeholder="Optional notes"
              />
            </label>


            <button
              type="submit"
              disabled={
                saving
              }
            >
              {
                saving
                  ? "Saving..."
                  : "Add Supplier"
              }
            </button>

          </form>

        </section>


        <section className="admin-suppliers-card admin-suppliers-list-card">

          <div className="admin-suppliers-list-header">

            <div>

              <h2>
                Supplier Directory
              </h2>

              <span>
                {
                  filteredSuppliers.length
                } suppliers
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
              placeholder="Search suppliers..."
            />

          </div>


          <div className="admin-suppliers-table-wrap">

            <table className="admin-suppliers-table">

              <thead>

                <tr>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  filteredSuppliers.length
                    === 0
                    ? (
                      <tr>

                        <td
                          colSpan="6"
                          className="admin-suppliers-empty"
                        >
                          No suppliers found.
                        </td>

                      </tr>
                    )
                    : (
                      filteredSuppliers.map(
                        (
                          supplier
                        ) => (
                          <tr
                            key={
                              supplier.id
                            }
                          >

                            <td>

                              <strong>
                                {
                                  supplier.supplier_name
                                }
                              </strong>

                              <small>
                                {
                                  supplier.supplier_code
                                }
                              </small>

                            </td>


                            <td>
                              {
                                supplier.contact_person
                                || "-"
                              }
                            </td>


                            <td>
                              {
                                supplier.phone
                                || "-"
                              }
                            </td>


                            <td>
                              {
                                supplier.email
                                || "-"
                              }
                            </td>


                            <td>

                              <span
                                className={
                                  supplier.is_active
                                    ? "supplier-status active"
                                    : "supplier-status inactive"
                                }
                              >
                                {
                                  supplier.is_active
                                    ? "Active"
                                    : "Inactive"
                                }
                              </span>

                            </td>


                            <td>

                              <button
                                type="button"
                                className="supplier-status-button"
                                onClick={
                                  () =>
                                    handleStatusChange(
                                      supplier
                                    )
                                }
                              >
                                {
                                  supplier.is_active
                                    ? "Deactivate"
                                    : "Reactivate"
                                }
                              </button>

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

    </div>
  );
}


export default AdminSuppliersPage;