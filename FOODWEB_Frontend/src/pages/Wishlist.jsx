
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../App.css";

const API_BASE_URL = "http://localhost:8080/FOODWEB/api";
const WISHLIST_API = `${API_BASE_URL}/wishlist`;
const CART_API = `${API_BASE_URL}/cart`;

function Wishlist() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [activeTab, setActiveTab] = useState("foods");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItems, setBusyItems] = useState({});
  const [message, setMessage] = useState("");

  // Load both food and restaurant wishlists from HttpSession
  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(WISHLIST_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load your wishlist.");
      }

      const data = await response.json();

      setFoods(Array.isArray(data.foods) ? data.foods : []);
      setRestaurants(
        Array.isArray(data.restaurants) ? data.restaurants : []
      );
    } catch (err) {
      console.error("Wishlist loading error:", err);
      setError(
        "We couldn't load your wishlist. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();

    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener(
      "foodweb-wishlist-updated",
      handleWishlistUpdate
    );

    return () => {
      window.removeEventListener(
        "foodweb-wishlist-updated",
        handleWishlistUpdate
      );
    };
  }, [loadWishlist]);

  // Remove a food item or restaurant from the session wishlist
  const removeFromWishlist = async (type, item) => {
    const id =
      type === "food"
        ? item.menuId ?? item.id
        : item.restaurantId ?? item.id;

    if (!id || busyItems[`${type}-${id}`]) return;

    const key = `${type}-${id}`;
    setBusyItems((previous) => ({ ...previous, [key]: true }));
    setMessage("");

    try {
      const params = new URLSearchParams({
        action: "remove",
        type,
        id: String(id),
      });

      const response = await fetch(WISHLIST_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove item.");
      }

      if (type === "food") {
        setFoods((previous) =>
          previous.filter(
            (food) =>
              Number(food.menuId ?? food.id) !== Number(id)
          )
        );
      } else {
        setRestaurants((previous) =>
          previous.filter(
            (restaurant) =>
              Number(restaurant.restaurantId ?? restaurant.id) !==
              Number(id)
          )
        );
      }

      setMessage("Removed from your wishlist.");

      window.dispatchEvent(
        new Event("foodweb-wishlist-updated")
      );
    } catch (err) {
      console.error("Wishlist remove error:", err);
      setMessage(err.message || "Unable to remove this item.");
    } finally {
      setBusyItems((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  // Add a saved food item to the session cart
  const addToCart = async (food) => {
    const menuId = food.menuId ?? food.id;

    if (!menuId || busyItems[`cart-${menuId}`]) return;

    const key = `cart-${menuId}`;
    setBusyItems((previous) => ({ ...previous, [key]: true }));
    setMessage("");

    try {
      const params = new URLSearchParams({
        action: "add",
        menuId: String(menuId),
        quantity: "1",
      });

      const response = await fetch(CART_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to add item to cart.");
      }

      setMessage(`${food.itemName || food.name || "Food item"} added to cart.`);

      window.dispatchEvent(new Event("foodweb-cart-updated"));
    } catch (err) {
      console.error("Add to cart error:", err);
      setMessage(
        err.message || "Unable to add this item to your cart."
      );
    } finally {
      setBusyItems((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const openRestaurantMenu = (restaurant) => {
    const id = restaurant.restaurantId ?? restaurant.id;

    if (!id) return;

    const name = encodeURIComponent(
      restaurant.name || restaurant.restaurantName || "Restaurant"
    );

    navigate(
      `/menu?restaurantId=${id}&restaurantName=${name}`
    );
  };

  const getFoodImage = (food) =>
    food.imagePath ||
    food.image ||
    food.imageUrl ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=85";

  const getRestaurantImage = (restaurant) =>
    restaurant.imagePath ||
    restaurant.image ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=85";

  const formatPrice = (price) => {
    const value = Number(price);
    return Number.isFinite(value)
      ? `₹${value.toFixed(2)}`
      : "Price unavailable";
  };

  const activeCount =
    activeTab === "foods" ? foods.length : restaurants.length;

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <div className="wishlist-hero-content">
          <span className="wishlist-eyebrow">
            YOUR PERSONAL COLLECTION
          </span>

          <h1>
            Your <span>Wishlist</span>
          </h1>

          <p>
            All your favourite flavours and restaurants, saved in one place.
          </p>

          <div className="wishlist-hero-stats">
            <div className="wishlist-stat">
              <span className="wishlist-stat-icon">♡</span>
              <div>
                <strong>{foods.length}</strong>
                <small>Saved foods</small>
              </div>
            </div>

            <div className="wishlist-stat-divider" />

            <div className="wishlist-stat">
              <span className="wishlist-stat-icon">⌂</span>
              <div>
                <strong>{restaurants.length}</strong>
                <small>Saved restaurants</small>
              </div>
            </div>
          </div>
        </div>

        <div className="wishlist-hero-decoration" aria-hidden="true">
          <span>♥</span>
        </div>
      </section>

      <section className="wishlist-content">
        <div className="wishlist-heading-row">
          <div>
            <h2>Saved for later</h2>
            <p>Your collection, ready whenever you are.</p>
          </div>

          <button
            type="button"
            className="wishlist-browse-btn"
            onClick={() => navigate("/restaurants")}
          >
            Explore food <span>→</span>
          </button>
        </div>

        <div className="wishlist-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "foods"}
            className={`wishlist-tab ${
              activeTab === "foods" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("foods");
              setMessage("");
            }}
          >
            <span>♡</span> Food items
            <span className="wishlist-tab-count">{foods.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "restaurants"}
            className={`wishlist-tab ${
              activeTab === "restaurants" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("restaurants");
              setMessage("");
            }}
          >
            <span>⌂</span> Restaurants
            <span className="wishlist-tab-count">
              {restaurants.length}
            </span>
          </button>
        </div>

        {message && (
          <div className="wishlist-message" role="status">
            {message}
          </div>
        )}

        {loading ? (
          <div className="wishlist-state">
            <div className="wishlist-loader" />
            <h3>Loading your wishlist...</h3>
            <p>Fetching your saved items.</p>
          </div>
        ) : error ? (
          <div className="wishlist-state">
            <span className="wishlist-state-icon">!</span>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button
              type="button"
              className="wishlist-primary-btn"
              onClick={loadWishlist}
            >
              Try again
            </button>
          </div>
        ) : activeTab === "foods" ? (
          foods.length === 0 ? (
            <div className="wishlist-state">
              <span className="wishlist-empty-heart">♡</span>
              <h3>No saved food items yet</h3>
              <p>
                Tap the heart on any food item in the menu to save it here.
              </p>
              <button
                type="button"
                className="wishlist-primary-btn"
                onClick={() => navigate("/restaurants")}
              >
                Discover restaurants
              </button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {foods.map((food, index) => {
                const id = food.menuId ?? food.id;
                const key = `food-${id}`;
                const name = food.itemName || food.name || "Food item";
                const restaurantName =
                  food.restaurantName ||
                  food.restaurant?.name ||
                  "FOODWEB Restaurant";

                return (
                  <article
                    className="wishlist-card wishlist-food-card"
                    key={id ?? `food-${index}`}
                  >
                    <div className="wishlist-card-image-wrap">
                      <img
                        src={getFoodImage(food)}
                        alt={name}
                        className="wishlist-card-image"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=85";
                        }}
                      />

                      <span className="wishlist-saved-label">
                        ♥ Saved
                      </span>

                      <button
                        type="button"
                        className="wishlist-remove-icon"
                        onClick={() =>
                          removeFromWishlist("food", food)
                        }
                        disabled={Boolean(busyItems[key])}
                        aria-label={`Remove ${name} from wishlist`}
                        title="Remove from wishlist"
                      >
                        {busyItems[key] ? "…" : "×"}
                      </button>
                    </div>

                    <div className="wishlist-card-body">
                      <div className="wishlist-card-title-row">
                        <h3>{name}</h3>
                        <strong className="wishlist-price">
                          {formatPrice(food.price)}
                        </strong>
                      </div>

                      <p className="wishlist-restaurant-name">
                        {restaurantName}
                      </p>

                      {food.description && (
                        <p className="wishlist-food-description">
                          {food.description}
                        </p>
                      )}

                      <div className="wishlist-card-actions">
                        <button
                          type="button"
                          className="wishlist-primary-btn"
                          onClick={() => addToCart(food)}
                          disabled={Boolean(busyItems[`cart-${id}`])}
                        >
                          {busyItems[`cart-${id}`]
                            ? "Adding..."
                            : "＋ Add to cart"}
                        </button>

                        <button
                          type="button"
                          className="wishlist-remove-text"
                          onClick={() =>
                            removeFromWishlist("food", food)
                          }
                          disabled={Boolean(busyItems[key])}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : restaurants.length === 0 ? (
          <div className="wishlist-state">
            <span className="wishlist-empty-heart">♡</span>
            <h3>No saved restaurants yet</h3>
            <p>
              Tap the heart on a restaurant card to keep it in your collection.
            </p>
            <button
              type="button"
              className="wishlist-primary-btn"
              onClick={() => navigate("/restaurants")}
            >
              Browse restaurants
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {restaurants.map((restaurant, index) => {
              const id = restaurant.restaurantId ?? restaurant.id;
              const key = `restaurant-${id}`;
              const name =
                restaurant.name ||
                restaurant.restaurantName ||
                "Restaurant";

              return (
                <article
                  className="wishlist-card wishlist-restaurant-card"
                  key={id ?? `restaurant-${index}`}
                >
                  <div className="wishlist-card-image-wrap">
                    <img
                      src={getRestaurantImage(restaurant)}
                      alt={name}
                      className="wishlist-card-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=85";
                      }}
                    />

                    <span className="wishlist-saved-label">
                      ♥ Saved
                    </span>

                    <button
                      type="button"
                      className="wishlist-remove-icon"
                      onClick={() =>
                        removeFromWishlist("restaurant", restaurant)
                      }
                      disabled={Boolean(busyItems[key])}
                      aria-label={`Remove ${name} from wishlist`}
                      title="Remove from wishlist"
                    >
                      {busyItems[key] ? "…" : "×"}
                    </button>
                  </div>

                  <div className="wishlist-card-body">
                    <div className="wishlist-card-title-row">
                      <h3>{name}</h3>

                      {Number(restaurant.rating) > 0 &&
                        Number(restaurant.rating) <= 5 && (
                          <span className="wishlist-rating">
                            ★ {restaurant.rating}
                          </span>
                        )}
                    </div>

                    <p className="wishlist-restaurant-name">
                      {restaurant.cuisine ||
                        restaurant.cuisineType ||
                        "Multi-Cuisine"}
                    </p>

                    <p className="wishlist-restaurant-location">
                      📍{" "}
                      {restaurant.area ||
                        restaurant.location ||
                        restaurant.address ||
                        "Location unavailable"}
                    </p>

                    <div className="wishlist-card-actions">
                      <button
                        type="button"
                        className="wishlist-primary-btn"
                        onClick={() => openRestaurantMenu(restaurant)}
                      >
                        View menu →
                      </button>

                      <button
                        type="button"
                        className="wishlist-remove-text"
                        onClick={() =>
                          removeFromWishlist("restaurant", restaurant)
                        }
                        disabled={Boolean(busyItems[key])}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Wishlist;
