
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/orders";
const SERVER_ORIGIN = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  return `${SERVER_ORIGIN}${
    imagePath.startsWith("/") ? "" : "/"
  }${imagePath}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0.00";
  }

  return `₹${value.toFixed(2)}`;
};

const getOrderStatus = (status) => {
  return String(status || "Placed").trim();
};

const getStatusClass = (status) => {
  const normalizedStatus = getOrderStatus(status).toLowerCase();

  if (normalizedStatus === "cancelled") {
    return "orders-status orders-status-cancelled";
  }

  return "orders-status";
};

const getItemName = (item) => {
  return (
    item.itemName ||
    item.menuName ||
    item.name ||
    "Food Item"
  );
};

const getItemQuantity = (item) => {
  return Number(item.quantity) || 1;
};

const getItemPrice = (item) => {
  return Number(item.price ?? item.unitPrice ?? 0);
};

const getItemImage = (item) => {
  return getImageUrl(item.imagePath || item.image);
};

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New states for cancellation
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelErrors, setCancelErrors] = useState({});

  // Fetch the logged-in user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login", {
            state: { from: "/orders" },
          });
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load your orders."
          );
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        setError(err.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  // Cancel an order
  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    setCancellingOrderId(orderId);

    setCancelErrors((previous) => ({
      ...previous,
      [orderId]: "",
    }));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          orderId: String(orderId),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login", {
          state: { from: "/orders" },
        });
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to cancel this order."
        );
      }

      // Update only the cancelled order in the UI
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          Number(order.orderId) === Number(orderId)
            ? { ...order, status: "Cancelled" }
            : order
        )
      );
    } catch (err) {
      setCancelErrors((previous) => ({
        ...previous,
        [orderId]:
          err.message || "Something went wrong. Please try again.",
      }));
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-loader">
          Loading your orders...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="orders-page">
        <div className="orders-error">
          <p>{error}</p>

          <button
            type="button"
            className="orders-primary-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-heading">
        <p className="orders-eyebrow">YOUR FOOD JOURNEY</p>
        <h1>My Orders</h1>
        <p>Track your orders and revisit your favourites.</p>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">🍽️</div>

          <h2>No orders yet</h2>

          <p>
            Your delicious FOODWEB journey starts with your
            first order.
          </p>

          <button
            type="button"
            className="orders-primary-btn"
            onClick={() => navigate("/restaurants")}
          >
            Explore Restaurants
          </button>
        </div>
      ) : (
        <>
          <div className="orders-count">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </div>

          <div className="orders-list">
            {orders.map((order) => {
              const status = getOrderStatus(order.status);
              const isPlaced = status.toLowerCase() === "placed";
              const isCancelling =
                Number(cancellingOrderId) === Number(order.orderId);

              const items = Array.isArray(order.items)
                ? order.items
                : [];

              return (
                <article
                  className="orders-card"
                  key={order.orderId}
                >
                  <div className="orders-card-header">
                    <div className="orders-restaurant">
                      {order.restaurantImage ||
                      order.imagePath ? (
                        <img
                          className="orders-restaurant-image"
                          src={getImageUrl(
                            order.restaurantImage || order.imagePath
                          )}
                          alt={order.restaurantName || "Restaurant"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="orders-restaurant-placeholder">
                          🍽️
                        </div>
                      )}

                      <div>
                        <h2>
                          {order.restaurantName || "FOODWEB Restaurant"}
                        </h2>

                        <p>
                          Order #{order.orderId}
                        </p>
                      </div>
                    </div>

                    <span className={getStatusClass(status)}>
                      {status}
                    </span>
                  </div>

                  <div className="orders-date">
                    Ordered on {formatDate(order.orderDate)}
                  </div>

                  <div className="orders-items">
                    {items.length > 0 ? (
                      items.map((item, index) => {
                        const imageUrl = getItemImage(item);

                        return (
                          <div
                            className="orders-item"
                            key={
                              item.orderItemId ||
                              `${order.orderId}-${item.menuId || index}`
                            }
                          >
                            {imageUrl ? (
                              <img
                                className="orders-item-image"
                                src={imageUrl}
                                alt={getItemName(item)}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="orders-item-placeholder">
                                🍴
                              </div>
                            )}

                            <div className="orders-item-info">
                              <h3>{getItemName(item)}</h3>

                              <p>
                                Qty: {getItemQuantity(item)}
                              </p>
                            </div>

                            <strong>
                              {formatPrice(
                                getItemPrice(item) *
                                  getItemQuantity(item)
                              )}
                            </strong>
                          </div>
                        );
                      })
                    ) : (
                      <p className="orders-no-items">
                        Order item details are unavailable.
                      </p>
                    )}
                  </div>

                  <div className="orders-card-footer">
                    <div className="orders-payment">
                      <span>Payment</span>
                      <strong>
                        {order.paymentMode || "Not specified"}
                      </strong>
                    </div>

                    <div className="orders-total">
                      <span>Total paid / payable</span>
                      <strong>
                        {formatPrice(order.totalAmount)}
                      </strong>
                    </div>

                    {/* Cancel button appears only for Placed orders */}
                    {isPlaced && (
                      <button
                        type="button"
                        className="orders-cancel-btn"
                        disabled={cancellingOrderId !== null}
                        onClick={() =>
                          handleCancelOrder(order.orderId)
                        }
                      >
                        {isCancelling
                          ? "Cancelling..."
                          : "Cancel Order"}
                      </button>
                    )}

                    {cancelErrors[order.orderId] && (
                      <p className="orders-cancel-error">
                        {cancelErrors[order.orderId]}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

export default Orders;
