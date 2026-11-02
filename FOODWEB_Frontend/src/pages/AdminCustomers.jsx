
import { useEffect, useMemo, useState } from "react";
import "../App.css";

const CUSTOMER_API = "http://localhost:8080/FOODWEB/api/admin/customers";
const ITEMS_PER_PAGE = 10;

function formatValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Not provided";
  }
  return value;
}

function getInitials(name) {
  if (!name) return "C";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(CUSTOMER_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Admin access denied. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Unable to load customers (${response.status}).`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(data.message || "Invalid customer data received.");
      }

      setCustomers(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Customer loading error:", err);
      setError(err.message || "Something went wrong while loading customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const filteredCustomers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return customers;

    return customers.filter((customer) => {
      return [
        customer.userId,
        customer.userName,
        customer.email,
        customer.phone,
        customer.address,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchValue)
      );
    });
  }, [customers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedCustomers = filteredCustomers.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const customersWithEmail = customers.filter(
    (customer) => customer.email?.trim()
  ).length;

  const customersWithPhone = customers.filter(
    (customer) => customer.phone?.trim()
  ).length;

  const customersWithAddress = customers.filter(
    (customer) => customer.address?.trim()
  ).length;

  const openCustomerDetails = async (userId) => {
    try {
      setDetailsLoading(true);
      setSelectedCustomer(null);

      const response = await fetch(
        `${CUSTOMER_API}?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Admin access denied. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Unable to load customer details (${response.status}).`);
      }

      const data = await response.json();

      if (!data.success || !data.customer) {
        throw new Error(data.message || "Customer details not found.");
      }

      setSelectedCustomer(data.customer);
    } catch (err) {
      console.error("Customer details error:", err);
      setToast(err.message || "Unable to load customer details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="admin-customers-page">
      {/* Header */}
      <div className="admin-customers-header">
        <div>
          <span className="admin-customers-eyebrow">
            ADMIN MANAGEMENT
          </span>

          <h1>Customers</h1>

          <p>
            View and manage customer information registered on FOODWEB.
          </p>
        </div>

        <button
          className="admin-customers-refresh"
          onClick={loadCustomers}
          disabled={loading}
          type="button"
        >
          <span className={loading ? "admin-customers-spin" : ""}>↻</span>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Statistics */}
      <div className="admin-customers-stats">
        <div className="admin-customers-stat-card">
          <div className="admin-customers-stat-icon orange">♙</div>
          <div>
            <span>Total Customers</span>
            <h2>{customers.length}</h2>
          </div>
        </div>

        <div className="admin-customers-stat-card">
          <div className="admin-customers-stat-icon gold">✉</div>
          <div>
            <span>With Email</span>
            <h2>{customersWithEmail}</h2>
          </div>
        </div>

        <div className="admin-customers-stat-card">
          <div className="admin-customers-stat-icon orange">☎</div>
          <div>
            <span>With Phone</span>
            <h2>{customersWithPhone}</h2>
          </div>
        </div>

        <div className="admin-customers-stat-card">
          <div className="admin-customers-stat-icon gold">⌂</div>
          <div>
            <span>With Address</span>
            <h2>{customersWithAddress}</h2>
          </div>
        </div>
      </div>

      {/* Customer table */}
      <section className="admin-customers-content">
        <div className="admin-customers-toolbar">
          <div>
            <h2>Customer Directory</h2>
            <p>All registered customer accounts</p>
          </div>

          <div className="admin-customers-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by ID, name, email or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="admin-customers-error">
            <span>{error}</span>
            <button type="button" onClick={loadCustomers}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-customers-state">
            <div className="admin-customers-loader"></div>
            <p>Loading customers...</p>
          </div>
        ) : !error && filteredCustomers.length === 0 ? (
          <div className="admin-customers-state">
            <div className="admin-customers-empty-icon">♙</div>
            <h3>{search ? "No matching customers" : "No customers found"}</h3>
            <p>
              {search
                ? "Try another name, email, phone number or customer ID."
                : "Customer accounts will appear here when they register."}
            </p>
          </div>
        ) : !error ? (
          <>
            <div className="admin-customers-table-wrap">
              <table className="admin-customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Customer ID</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered On</th>
                    <th>Last Login</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.userId}>
                      <td>
                        <div className="admin-customers-person">
                          <div className="admin-customers-avatar">
                            {getInitials(customer.userName)}
                          </div>

                          <div>
                            <strong>
                              {formatValue(customer.userName)}
                            </strong>
                            <span>Customer</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-customers-id">
                          #{customer.userId}
                        </span>
                      </td>

                      <td className="admin-customers-email">
                        {formatValue(customer.email)}
                      </td>

                      <td>{formatValue(customer.phone)}</td>

                      <td>{formatValue(customer.createdDate)}</td>

                      <td>{formatValue(customer.lastLoginDate)}</td>

                      <td>
                        <button
                          className="admin-customers-view-btn"
                          type="button"
                          onClick={() =>
                            openCustomerDetails(customer.userId)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-customers-pagination">
              <span>
                Showing{" "}
                {filteredCustomers.length === 0
                  ? 0
                  : (safePage - 1) * ITEMS_PER_PAGE + 1}
                {" - "}
                {Math.min(
                  safePage * ITEMS_PER_PAGE,
                  filteredCustomers.length
                )}{" "}
                of {filteredCustomers.length} customers
              </span>

              <div className="admin-customers-page-controls">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                >
                  Previous
                </button>

                <span>
                  {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* Customer details modal */}
      {(detailsLoading || selectedCustomer) && (
        <div
          className="admin-customers-modal-overlay"
          onClick={closeDetails}
        >
          <div
            className="admin-customers-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {detailsLoading ? (
              <div className="admin-customers-state">
                <div className="admin-customers-loader"></div>
                <p>Loading customer details...</p>
              </div>
            ) : selectedCustomer ? (
              <>
                <div className="admin-customers-modal-header">
                  <div>
                    <span className="admin-customers-eyebrow">
                      CUSTOMER PROFILE
                    </span>
                    <h2>Customer Details</h2>
                  </div>

                  <button
                    type="button"
                    className="admin-customers-close"
                    onClick={closeDetails}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="admin-customers-profile">
                  <div className="admin-customers-profile-avatar">
                    {getInitials(selectedCustomer.userName)}
                  </div>

                  <div>
                    <h3>{formatValue(selectedCustomer.userName)}</h3>
                    <span>Customer ID: #{selectedCustomer.userId}</span>
                  </div>

                  <span className="admin-customers-role">
                    {selectedCustomer.role || "CUSTOMER"}
                  </span>
                </div>

                <div className="admin-customers-details-grid">
                  <div className="admin-customers-detail">
                    <span>Email Address</span>
                    <strong>{formatValue(selectedCustomer.email)}</strong>
                  </div>

                  <div className="admin-customers-detail">
                    <span>Phone Number</span>
                    <strong>{formatValue(selectedCustomer.phone)}</strong>
                  </div>

                  <div className="admin-customers-detail full">
                    <span>Address</span>
                    <strong>{formatValue(selectedCustomer.address)}</strong>
                  </div>

                  <div className="admin-customers-detail">
                    <span>Registration Date</span>
                    <strong>{formatValue(selectedCustomer.createdDate)}</strong>
                  </div>

                  <div className="admin-customers-detail">
                    <span>Last Login</span>
                    <strong>
                      {formatValue(selectedCustomer.lastLoginDate)}
                    </strong>
                  </div>
                </div>

                <div className="admin-customers-modal-footer">
                  <button type="button" onClick={closeDetails}>
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="admin-customers-toast">
          <span>!</span>
          {toast}
        </div>
      )}
    </div>
  );
}
