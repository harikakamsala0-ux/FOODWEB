
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const RESTAURANTS_API =
  "http://localhost:8080/FOODWEB/api/restaurants";

function launchConfetti() {
  const colors = ["#FF8C00", "#F5B942", "#FFFFFF", "#E97800"];
  const fragment = document.createDocumentFragment();
  const pieces = [];

  for (let i = 0; i < 85; i++) {
    const piece = document.createElement("span");

    piece.className = "order-confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    piece.style.setProperty(
      "--confetti-drift",
      `${Math.random() * 300 - 150}px`
    );

    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.animationDuration = `${2.4 + Math.random() * 1.2}s`;

    fragment.appendChild(piece);
    pieces.push(piece);
  }

  document.body.appendChild(fragment);

  return () => {
    pieces.forEach((piece) => piece.remove());
  };
}

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = location.state || {};

  const [restaurantName, setRestaurantName] = useState(
    order.restaurantName ||
      order.restaurant?.restaurantName ||
      order.restaurant?.name ||
      ""
  );

  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const orderId = order.orderId;
  const totalAmount = Number(order.totalAmount || 0);
  const paymentMode = order.paymentMode || "COD";

  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.orderItems)
      ? order.orderItems
      : Array.isArray(order.cartItems)
        ? order.cartItems
        : [];

  // Launch confetti when the success page opens.
  useEffect(() => {
    const cleanup = launchConfetti();

    const timeout = window.setTimeout(() => {
      cleanup();
    }, 4500);

    return () => {
      window.clearTimeout(timeout);
      cleanup();
    };
  }, []);

  // Get the actual restaurant name using restaurantId.
  useEffect(() => {
    let active = true;

    async function fetchRestaurantName() {
      const restaurantId =
        order.restaurantId ??
        order.restaurant?.restaurantId ??
        order.restaurant?.id;

      if (restaurantName || restaurantId == null) {
        return;
      }

      setRestaurantLoading(true);

      try {
        const response = await fetch(RESTAURANTS_API, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Could not load restaurants (${response.status})`
          );
        }

        const data = await response.json();

        const restaurants = Array.isArray(data)
          ? data
          : Array.isArray(data.restaurants)
            ? data.restaurants
            : [];

        const restaurant = restaurants.find(
          (item) =>
            Number(item.restaurantId ?? item.id) ===
            Number(restaurantId)
        );

        if (active && restaurant) {
          setRestaurantName(
            restaurant.restaurantName ||
              restaurant.name ||
              ""
          );
        }
      } catch (error) {
        console.error("Error fetching restaurant name:", error);
      } finally {
        if (active) {
          setRestaurantLoading(false);
        }
      }
    }

    fetchRestaurantName();

    return () => {
      active = false;
    };
  }, [
    order.restaurantId,
    order.restaurant,
    restaurantName,
  ]);

  const getItemName = (item) =>
    item.itemName ||
    item.menu?.itemName ||
    item.name ||
    "Food item";

  const getQuantity = (item) =>
    Number(item.quantity || 1);

  const getItemSubtotal = (item) =>
    Number(
      item.subtotal ??
        Number(item.price ?? item.menu?.price ?? 0) *
          getQuantity(item)
    );

    useEffect(() => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
    });
    }, []);

  return (
    <div className="order-success-page">
      <div className="order-success-glow order-success-glow-one" />
      <div className="order-success-glow order-success-glow-two" />

      <div className="order-success-card">
        <div className="order-success-icon">
          <svg
            viewBox="0 0 80 80"
            className="order-success-check"
            role="img"
            aria-label="Order successful"
          >
            <circle
              className="order-success-circle"
              cx="40"
              cy="40"
              r="35"
            />

            <path
              className="order-success-tick"
              d="M23 41 L34 52 L57 29"
            />
          </svg>
        </div>

        <p className="order-success-eyebrow">
          FOODWEB · ORDER CONFIRMATION
        </p>

        <h1>
          Order Placed
          <span> Successfully!</span>
        </h1>

        <p className="order-success-description">
          Delicious food is on its way! Thank you for choosing
          FOODWEB. Sit back, relax, and get ready to enjoy your meal.
        </p>

        {orderId != null && (
          <div className="order-success-number">
            <span>YOUR ORDER ID</span>
            <strong>#{orderId}</strong>
          </div>
        )}

        <div className="order-success-divider" />

        <div className="order-success-details">
          <div className="order-success-detail">
            <span className="order-success-detail-icon">
              🍽️
            </span>

            <div>
              <small>Restaurant</small>

              <strong>
                {restaurantName ||
                  (restaurantLoading
                    ? "Loading restaurant..."
                    : "Restaurant details unavailable")}
              </strong>
            </div>
          </div>

          <section className="order-success-items">
            <h3>
              <span>🍴</span>
              Your Ordered Items
            </h3>

            {items.length > 0 ? (
              <div className="order-success-item-list">
                {items.map((item, index) => (
                  <div
                    className="order-success-item"
                    key={
                      item.menuId ??
                      item.menu?.menuId ??
                      index
                    }
                  >
                    <div className="order-success-item-info">
                      <span className="order-success-item-name">
                        {getItemName(item)}
                      </span>

                      <small>
                        Quantity: {getQuantity(item)}
                      </small>
                    </div>

                    <strong className="order-success-item-price">
                      ₹{getItemSubtotal(item).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="order-success-no-items">
                Item details were not passed to this page.
                Please check the checkout navigation state.
              </p>
            )}
          </section>

          <div className="order-success-detail">
            <span className="order-success-detail-icon">
              💰
            </span>

            <div>
              <small>Total Amount</small>
              <strong>₹{totalAmount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="order-success-detail">
            <span className="order-success-detail-icon">
              💳
            </span>

            <div>
              <small>Payment Method</small>
              <strong>
                {paymentMode === "COD"
                  ? "Cash on Delivery"
                  : paymentMode}
              </strong>
            </div>
          </div>

          <div className="order-success-detail">
            <span className="order-success-detail-icon">
              📦
            </span>

            <div>
              <small>Order Status</small>
              <strong className="order-success-status">
                Order Placed
              </strong>
            </div>
          </div>
        </div>

        <div className="order-success-message">
          <span>✦</span>
          Your next delicious moment starts here.
          <span>✦</span>
        </div>

        <button
          type="button"
          className="order-success-explore-btn"
          onClick={() => navigate("/restaurants")}
        >
          Explore Food <span aria-hidden="true">→</span>
        </button>

        <p className="order-success-footer">
          Made with <span>♥</span> by FOODWEB
        </p>
      </div>
    </div>
  );
}

export default OrderSuccess;
