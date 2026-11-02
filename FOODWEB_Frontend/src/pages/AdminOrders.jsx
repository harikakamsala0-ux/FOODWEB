
import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/FOODWEB/api/admin/orders";

const ITEMS_PER_PAGE = 10;

const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getStatusClass(status) {
  return String(status || "PLACED")
    .toLowerCase()
    .replaceAll("_", "-");
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  // Load all orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Admin session expired. Please login again.");
        }

        throw new Error(`Unable to load orders (${response.status}).`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(data.message || "Invalid orders response from server.");
      }

      setOrders(data);

      const statusMap = {};
      data.forEach((order) => {
        statusMap[order.orderId] = order.status || "PLACED";
      });

      setPendingStatuses(statusMap);
    } catch (err) {
      console.error("Load orders error:", err);
      setError(err.message || "Something went wrong while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Search and filter
  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        String(order.orderId).includes(searchValue) ||
        String(order.userId).includes(searchValue) ||
        String(order.restaurantName || "").toLowerCase().includes(searchValue) ||
        String(order.paymentMode || "").toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(order.status || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Dashboard statistics
  const totalOrders = orders.length;

  const deliveredOrders = orders.filter(
    (order) => String(order.status).toUpperCase() === "DELIVERED"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => String(order.status).toUpperCase() === "CANCELLED"
  ).length;

  const totalRevenue = orders
    .filter(
      (order) => String(order.status).toUpperCase() !== "CANCELLED"
    )
    .reduce(
      (total, order) => total + (Number(order.totalAmount) || 0),
      0
    );

  // Change selected status locally
  const handleStatusChange = (orderId, newStatus) => {
    setPendingStatuses((previous) => ({
      ...previous,
      [orderId]: newStatus,
    }));
  };

  // Save status to Orders table
  const handleStatusUpdate = async (order) => {
    const orderId = order.orderId;
    const newStatus = pendingStatuses[orderId];

    if (!newStatus) {
      showToast("Please select an order status.");
      return;
    }

    if (newStatus === order.status) {
      showToast("No status changes to save.");
      return;
    }

    try {
      setSavingId(orderId);

      const response = await fetch(API_URL, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to update order status.");
      }

      setOrders((previous) =>
        previous.map((item) =>
          item.orderId === orderId
            ? { ...item, status: newStatus }
            : item
        )
      );

      showToast(result.message || "Order status updated successfully.");

      // Refresh open order details if this order is selected
      if (selectedOrder?.orderId === orderId) {
        await loadOrderDetails(orderId);
      }
    } catch (err) {
      console.error("Update status error:", err);
      showToast(err.message || "Unable to update order status.");
    } finally {
      setSavingId(null);
    }
  };

  // Load order and its items
  const loadOrderDetails = async (orderId) => {
    try {
      setDetailsLoading(true);
      setSelectedOrder(null);
      setOrderItems([]);

      const response = await fetch(
        `${API_URL}?orderId=${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load order details.");
      }

      setSelectedOrder(data.order);
      setOrderItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("Order details error:", err);
      showToast(err.message || "Unable to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  return (
    <div className="admin-orders-page">
      {/* Header */}
      <div className="admin-orders-header">
        <div>
          <span className="admin-orders-eyebrow">FOODWEB ADMIN</span>
          <h1>
            Order <span>Management</span>
          </h1>
          <p>View customer orders and manage their delivery status.</p>
        </div>

        <button
          type="button"
          className="admin-orders-refresh"
          onClick={loadOrders}
          disabled={loading}
        >
          <span className={loading ? "admin-orders-refresh-icon spinning" : "admin-orders-refresh-icon"}>
            ↻
          </span>
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="admin-orders-stats">
        <div className="admin-orders-stat-card">
          <div className="admin-orders-stat-icon orange">▤</div>
          <div>
            <p>Total Orders</p>
            <h2>{totalOrders}</h2>
          </div>
        </div>

        <div className="admin-orders-stat-card">
          <div className="admin-orders-stat-icon gold">₹</div>
          <div>
            <p>Total Revenue</p>
            <h2>{formatCurrency(totalRevenue)}</h2>
          </div>
        </div>

        <div className="admin-orders-stat-card">
          <div className="admin-orders-stat-icon green">✓</div>
          <div>
            <p>Delivered</p>
            <h2>{deliveredOrders}</h2>
          </div>
        </div>

        <div className="admin-orders-stat-card">
          <div className="admin-orders-stat-icon red">×</div>
          <div>
            <p>Cancelled</p>
            <h2>{cancelledOrders}</h2>
          </div>
        </div>
      </div>

      {/* Orders section */}
      <section className="admin-orders-panel">
        <div className="admin-orders-panel-heading">
          <div>
            <h2>All Orders</h2>
            <p>Manage and track customer orders.</p>
          </div>

          <span className="admin-orders-count">
            {filteredOrders.length} orders
          </span>
        </div>

        {/* Search and filters */}
        <div className="admin-orders-toolbar">
          <div className="admin-orders-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search order ID, user ID, restaurant..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="admin-orders-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="admin-orders-state">
            <div className="admin-orders-spinner"></div>
            <p>Loading orders...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="admin-orders-error">
            <p>{error}</p>
            <button type="button" onClick={loadOrders}>
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="admin-orders-table-wrapper">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>USER ID</th>
                    <th>RESTAURANT</th>
                    <th>ORDER DATE</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT</th>
                    <th>STATUS</th>
                    <th>UPDATE STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => {
                    const selectedStatus =
                      pendingStatuses[order.orderId] || order.status;

                    const hasChanged = selectedStatus !== order.status;

                    return (
                      <tr key={order.orderId}>
                        <td>
                          <span className="admin-orders-id">
                            #{order.orderId}
                          </span>
                        </td>

                        <td>{order.userId}</td>

                        <td>
                          <span className="admin-orders-restaurant">
                            {order.restaurantName || `Restaurant #${order.restaurantId}`}
                          </span>
                          <small>Restaurant ID: {order.restaurantId}</small>
                        </td>

                        <td>{formatDate(order.orderDate)}</td>

                        <td className="admin-orders-amount">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        <td>
                          <span className="admin-orders-payment">
                            {order.paymentMode || "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-orders-status ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {String(order.status || "PLACED").replaceAll("_", " ")}
                          </span>
                        </td>

                        <td>
                          <div className="admin-orders-update-control">
                            <select
                              value={selectedStatus || "PLACED"}
                              onChange={(event) =>
                                handleStatusChange(
                                  order.orderId,
                                  event.target.value
                                )
                              }
                              disabled={savingId === order.orderId}
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="admin-orders-save"
                              onClick={() => handleStatusUpdate(order)}
                              disabled={!hasChanged || savingId === order.orderId}
                            >
                              {savingId === order.orderId ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-orders-view"
                            onClick={() => loadOrderDetails(order.orderId)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="9">
                        <div className="admin-orders-empty">
                          <span>▤</span>
                          <h3>No orders found</h3>
                          <p>Try changing your search or status filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="admin-orders-pagination">
                <p>
                  Showing{" "}
                  {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(safePage * ITEMS_PER_PAGE, filteredOrders.length)}{" "}
                  of {filteredOrders.length} orders
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage === 1}
                  >
                    Previous
                  </button>

                  <span>
                    {safePage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safePage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Order details modal */}
      {(detailsLoading || selectedOrder) && (
        <div className="admin-orders-modal-overlay" onClick={closeDetails}>
          <div
            className="admin-orders-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-orders-modal-header">
              <div>
                <span className="admin-orders-eyebrow">ORDER DETAILS</span>
                <h2>
                  {selectedOrder
                    ? `Order #${selectedOrder.orderId}`
                    : "Loading order..."}
                </h2>
              </div>

              <button
                type="button"
                className="admin-orders-modal-close"
                onClick={closeDetails}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="admin-orders-state">
                <div className="admin-orders-spinner"></div>
                <p>Loading order details...</p>
              </div>
            ) : selectedOrder ? (
              <>
                <div className="admin-orders-detail-grid">
                  <div>
                    <span>Customer ID</span>
                    <strong>{selectedOrder.userId}</strong>
                  </div>

                  <div>
                    <span>Restaurant</span>
                    <strong>
                      {selectedOrder.restaurantName ||
                        `Restaurant #${selectedOrder.restaurantId}`}
                    </strong>
                  </div>

                  <div>
                    <span>Order Date</span>
                    <strong>{formatDate(selectedOrder.orderDate)}</strong>
                  </div>

                  <div>
                    <span>Payment Mode</span>
                    <strong>{selectedOrder.paymentMode || "—"}</strong>
                  </div>

                  <div>
                    <span>Order Status</span>
                    <strong
                      className={`admin-orders-status ${getStatusClass(
                        selectedOrder.status
                      )}`}
                    >
                      {String(selectedOrder.status || "PLACED").replaceAll("_", " ")}
                    </strong>
                  </div>

                  <div>
                    <span>Total Amount</span>
                    <strong className="admin-orders-detail-total">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </strong>
                  </div>
                </div>

                <div className="admin-orders-items-heading">
                  <h3>Ordered Items</h3>
                  <span>{orderItems.length} items</span>
                </div>

                <div className="admin-orders-items-list">
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <div
                        className="admin-orders-item"
                        key={item.orderItemId}
                      >
                        <div className="admin-orders-item-info">
                          <strong>
                            {item.itemName || `Menu Item #${item.menuId}`}
                          </strong>
                          <span>Menu ID: {item.menuId}</span>
                          <span>Quantity: {item.quantity}</span>
                        </div>

                        <div className="admin-orders-item-price">
                          <span>
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </span>
                          <strong>{formatCurrency(item.lineTotal)}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-orders-no-items">
                      No items found for this order.
                    </div>
                  )}
                </div>

                <div className="admin-orders-modal-footer">
                  <span>Order Total</span>
                  <strong>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </strong>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="admin-orders-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
