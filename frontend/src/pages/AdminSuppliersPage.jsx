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

import AdminPageIntro from "../components/AdminPageIntro";

import "./AdminSuppliersPage.css";

function SupplierIcon({
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
    supplier: (
      <>
        <path d="M3 21V8l6-3v16" />
        <path d="M9 21V3l12 5v13" />
        <path d="M13 9h2" />
        <path d="M17 9h2" />
        <path d="M13 13h2" />
        <path d="M17 13h2" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2" />
        <path d="M15 15a5 5 0 0 1 6 5" />
      </>
    ),

    active: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),

    inactive: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8l8 8" />
      </>
    ),

    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    phone: (
      <>
        <path d="M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4c0 1.1-.9 2-2 2C9.7 21 3 14.3 3 6c0-1.1.9-2 2-2Z" />
      </>
    ),

    mail: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="m4 7 8 6 8-6" />
      </>
    ),

    address: (
      <>
        <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),

    note: (
      <>
        <path d="M5 3h14v18H5Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    directory: (
      <>
        <path d="M5 4h14v16H5Z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),

    toggle: (
      <>
        <rect
          x="3"
          y="7"
          width="18"
          height="10"
          rx="5"
        />
        <circle cx="9" cy="12" r="2" />
      </>
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {icons[name] || icons.supplier}
    </svg>
  );
}

function SupplierStat({
  tone,
  icon,
  label,
  value,
  note,
}) {
  return (
    <article
      className={`admin-suppliers-stat admin-suppliers-stat--${tone}`}
    >
      <span className="admin-suppliers-stat-accent" />

      <div className="admin-suppliers-stat-icon">
        <SupplierIcon
          name={icon}
          size={22}
        />
      </div>

      <div className="admin-suppliers-stat-copy">
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
            data?.suppliers ?? []
          );

          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load suppliers."
          );
        }
      } finally {
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
      data?.suppliers ?? []
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
          (supplier) =>
            supplier.supplier_name
              ?.toLowerCase()
              .includes(term) ||
            supplier.supplier_code
              ?.toLowerCase()
              .includes(term) ||
            supplier.contact_person
              ?.toLowerCase()
              .includes(term) ||
            supplier.phone
              ?.toLowerCase()
              .includes(term) ||
            supplier.email
              ?.toLowerCase()
              .includes(term)
        );
      },
      [
        suppliers,
        search,
      ]
    );

  const activeCount =
    suppliers.filter(
      (supplier) =>
        supplier.is_active
    ).length;

  const inactiveCount =
    suppliers.length -
    activeCount;

  async function handleCreateSupplier(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!supplierName.trim()) {
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
              contactPerson.trim() ||
              null,

            phone:
              phone.trim() ||
              null,

            email:
              email.trim() ||
              null,

            address:
              address.trim() ||
              null,

            notes:
              notes.trim() ||
              null,
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
            ?.supplier_name ??
          "Supplier"
        } created successfully.`
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create supplier."
      );
    } finally {
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
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update supplier."
      );
    }
  }

  if (loading) {
    return (
      <div className="admin-suppliers-page">
        <div className="admin-suppliers-loading">
          <div className="admin-suppliers-loading-icon">
            <SupplierIcon
              name="supplier"
              size={28}
            />
          </div>

          <strong>
            Loading Suppliers
          </strong>

          <span>
            Preparing supplier records and contact information...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-suppliers-page">
      <AdminPageIntro
        eyebrow="Supplier Management"
        title="Suppliers"
        subtitle="Manage medicine suppliers and maintain pharmacy contact information."
        accent="teal"
      />

      {error && (
        <div className="admin-suppliers-message error">
          <SupplierIcon
            name="alert"
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="admin-suppliers-message success">
          <SupplierIcon
            name="active"
            size={18}
          />

          <span>
            {success}
          </span>
        </div>
      )}

      <section className="admin-suppliers-stats">
        <SupplierStat
          tone="teal"
          icon="users"
          label="Total Suppliers"
          value={suppliers.length}
          note="Registered suppliers"
        />

        <SupplierStat
          tone="green"
          icon="active"
          label="Active"
          value={activeCount}
          note="Available suppliers"
        />

        <SupplierStat
          tone="red"
          icon="inactive"
          label="Inactive"
          value={inactiveCount}
          note="Disabled supplier records"
        />
      </section>

      <section className="admin-suppliers-grid">
        <article className="admin-suppliers-card admin-suppliers-form-card">
          <div className="admin-suppliers-card-header">
            <div className="admin-suppliers-card-header-copy">
              <div className="admin-suppliers-card-icon">
                <SupplierIcon
                  name="plus"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Supplier Registration
                </span>

                <h2>
                  Add Supplier
                </h2>

                <p>
                  Create a new medicine supplier record
                </p>
              </div>
            </div>
          </div>

          <form
            className="admin-suppliers-form"
            onSubmit={
              handleCreateSupplier
            }
          >
            <label>
              <span>
                Supplier Name
              </span>

              <div className="admin-suppliers-input-wrap">
                <SupplierIcon
                  name="supplier"
                  size={17}
                />

                <input
                  type="text"
                  value={
                    supplierName
                  }
                  onChange={
                    (event) =>
                      setSupplierName(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter supplier name"
                />
              </div>
            </label>

            <label>
              <span>
                Contact Person
              </span>

              <div className="admin-suppliers-input-wrap">
                <SupplierIcon
                  name="person"
                  size={17}
                />

                <input
                  type="text"
                  value={
                    contactPerson
                  }
                  onChange={
                    (event) =>
                      setContactPerson(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter contact person"
                />
              </div>
            </label>

            <label>
              <span>
                Phone
              </span>

              <div className="admin-suppliers-input-wrap">
                <SupplierIcon
                  name="phone"
                  size={17}
                />

                <input
                  type="text"
                  value={phone}
                  onChange={
                    (event) =>
                      setPhone(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </label>

            <label>
              <span>
                Email
              </span>

              <div className="admin-suppliers-input-wrap">
                <SupplierIcon
                  name="mail"
                  size={17}
                />

                <input
                  type="email"
                  value={email}
                  onChange={
                    (event) =>
                      setEmail(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter email address"
                />
              </div>
            </label>

            <label>
              <span>
                Address
              </span>

              <div className="admin-suppliers-input-wrap">
                <SupplierIcon
                  name="address"
                  size={17}
                />

                <input
                  type="text"
                  value={address}
                  onChange={
                    (event) =>
                      setAddress(
                        event.target
                          .value
                      )
                  }
                  placeholder="Enter supplier address"
                />
              </div>
            </label>

            <label>
              <span>
                Notes
              </span>

              <div className="admin-suppliers-input-wrap admin-suppliers-textarea-wrap">
                <SupplierIcon
                  name="note"
                  size={17}
                />

                <textarea
                  value={notes}
                  onChange={
                    (event) =>
                      setNotes(
                        event.target
                          .value
                      )
                  }
                  placeholder="Optional supplier notes"
                />
              </div>
            </label>

            <button
              type="submit"
              className="admin-suppliers-submit-button"
              disabled={saving}
            >
              <SupplierIcon
                name="plus"
                size={18}
              />

              <span>
                {saving
                  ? "Saving..."
                  : "Add Supplier"}
              </span>
            </button>
          </form>
        </article>

        <article className="admin-suppliers-card admin-suppliers-list-card">
          <div className="admin-suppliers-list-header">
            <div className="admin-suppliers-card-header-copy">
              <div className="admin-suppliers-card-icon">
                <SupplierIcon
                  name="directory"
                  size={21}
                />
              </div>

              <div>
                <span>
                  Supplier Records
                </span>

                <h2>
                  Supplier Directory
                </h2>

                <p>
                  Review and manage registered suppliers
                </p>
              </div>
            </div>

            <div className="admin-suppliers-search">
              <SupplierIcon
                name="search"
                size={17}
              />

              <input
                type="search"
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target
                        .value
                    )
                }
                placeholder="Search suppliers..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="admin-suppliers-count">
              <SupplierIcon
                name="supplier"
                size={14}
              />

              <span>
                {
                  filteredSuppliers.length
                }{" "}
                suppliers
              </span>
            </div>
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
                {filteredSuppliers.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="admin-suppliers-empty-cell"
                    >
                      <div className="admin-suppliers-empty">
                        <div className="admin-suppliers-empty-icon">
                          <SupplierIcon
                            name="supplier"
                            size={28}
                          />
                        </div>

                        <strong>
                          No suppliers found
                        </strong>

                        <span>
                          Try another supplier name, code or contact detail.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(
                    (supplier) => (
                      <tr
                        key={
                          supplier.id
                        }
                      >
                        <td>
                          <div className="admin-suppliers-supplier-cell">
                            <span className="admin-suppliers-row-icon">
                              <SupplierIcon
                                name="supplier"
                                size={15}
                              />
                            </span>

                            <div>
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
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="admin-suppliers-contact-cell">
                            <SupplierIcon
                              name="person"
                              size={14}
                            />

                            <span>
                              {supplier.contact_person ||
                                "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-suppliers-contact-cell">
                            <SupplierIcon
                              name="phone"
                              size={14}
                            />

                            <span>
                              {supplier.phone ||
                                "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-suppliers-contact-cell">
                            <SupplierIcon
                              name="mail"
                              size={14}
                            />

                            <span>
                              {supplier.email ||
                                "—"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              supplier.is_active
                                ? "supplier-status active"
                                : "supplier-status inactive"
                            }
                          >
                            <SupplierIcon
                              name={
                                supplier.is_active
                                  ? "active"
                                  : "inactive"
                              }
                              size={12}
                            />

                            {supplier.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              supplier.is_active
                                ? "supplier-status-button deactivate"
                                : "supplier-status-button reactivate"
                            }
                            onClick={() =>
                              handleStatusChange(
                                supplier
                              )
                            }
                          >
                            <SupplierIcon
                              name="toggle"
                              size={14}
                            />

                            <span>
                              {supplier.is_active
                                ? "Deactivate"
                                : "Reactivate"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminSuppliersPage;