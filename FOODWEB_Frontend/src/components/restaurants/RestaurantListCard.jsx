
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080/FOODWEB/api";
const WISHLIST_URL = `${API_BASE_URL}/wishlist`;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=90";

function RestaurantListCard({ restaurant }) {
  const navigate = useNavigate();

  const [imgSrc, setImgSrc] = useState(
    restaurant.imagePath || restaurant.image || FALLBACK_IMAGE
  );

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const restaurantId = restaurant.restaurantId ?? restaurant.id;

  // Read delivery time from the available API field.
  const deliveryTime =
    restaurant.delivaryTime ??
    restaurant.deliveryTime ??
    restaurant.time ??
    "";

  useEffect(() => {
    setImgSrc(
      restaurant.imagePath || restaurant.image || FALLBACK_IMAGE
    );
  }, [restaurant.imagePath, restaurant.image]);
  const discount = restaurant.discount || "30% OFF";
  // Load saved restaurants from the session.
  const loadRestaurantWishlist = useCallback(async () => {
    try {
      const response = await fetch(WISHLIST_URL, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load wishlist");
      }

      const data = await response.json();

      const restaurants = Array.isArray(data.restaurants)
        ? data.restaurants
        : [];

      const saved = restaurants.some((item) => {
        const savedId = item.restaurantId ?? item.id;
        return Number(savedId) === Number(restaurantId);
      });

      setIsWishlisted(saved);
    } catch (error) {
      console.error("Error loading restaurant wishlist:", error);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurantWishlist();

    const handleWishlistUpdate = () => {
      loadRestaurantWishlist();
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
  }, [loadRestaurantWishlist]);

  const handleImageError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  // Navigate to the selected restaurant's menu.
  const handleCardClick = () => {
    if (
      !restaurantId ||
      !Number.isInteger(Number(restaurantId)) ||
      Number(restaurantId) <= 0
    ) {
      console.error("Invalid restaurant ID:", restaurant);
      return;
    }

    const name = encodeURIComponent(
      restaurant.name || "Restaurant"
    );

    navigate(
      `/menu?restaurantId=${restaurantId}&restaurantName=${name}`
    );
  };

  // Add/remove restaurant from the session wishlist.
  const toggleRestaurantWishlist = async (e) => {
    e.stopPropagation();

    if (wishlistLoading) return;

    if (
      !restaurantId ||
      !Number.isInteger(Number(restaurantId)) ||
      Number(restaurantId) <= 0
    ) {
      console.error("Invalid restaurant ID:", restaurant);
      return;
    }

    setWishlistLoading(true);

    const wasWishlisted = isWishlisted;

    try {
      const params = new URLSearchParams({
        action: wasWishlisted ? "remove" : "add",
        type: "restaurant",
        id: String(restaurantId),
      });

      const response = await fetch(WISHLIST_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update wishlist"
        );
      }

      setIsWishlisted(!wasWishlisted);

      window.dispatchEvent(
        new Event("foodweb-wishlist-updated")
      );
    } catch (error) {
      console.error("Restaurant wishlist error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Determine Veg / Non-Veg using cuisine and category.
  const cuisine = (
    restaurant.cuisine ||
    restaurant.cuisineType ||
    ""
  ).toLowerCase();

  const category = (restaurant.category || "").toLowerCase();
  const restaurantText = `${cuisine}, ${category}`;

  const nonVegKeywords = [
    "non-vegetarian",
    "non vegetarian",
    "non-veg",
    "non veg",
    "biryani",
    "steak",
    "seafood",
    "kebab",
    "shawarma",
    "barbecue",
    "grill",
    "chicken",
    "mutton",
    "fish",
  ];

  const vegKeywords = [
    "pure veg",
    "vegetarian",
    "south indian",
    "tiffin",
    "benne dosa",
    "ghee dosa",
    "dessert",
    "ice cream",
  ];

  const hasNonVeg = nonVegKeywords.some((word) =>
    restaurantText.includes(word)
  );

  const hasVeg = vegKeywords.some((word) =>
    restaurantText.includes(word)
  );

  const isVeg = hasVeg && !hasNonVeg;

  // Format delivery time without duplicating "min".
  const formattedDeliveryTime =
    deliveryTime !== "" && deliveryTime != null
      ? /min|minute/i.test(String(deliveryTime))
        ? String(deliveryTime)
        : `${deliveryTime} min`
      : "Delivery time unavailable";

  return (
    <article
      className="rest-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-label={`View menu for ${restaurant.name}`}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;

        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="rest-card-image-wrapper">
        <img
          src={imgSrc}
          alt={restaurant.name}
          className="rest-card-image"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Image overlay */}
        <div className="rest-card-img-overlay"></div>

        {/* Offer badge */}
        <div className="rest-card-discount-tag">
          <span className="rest-discount-icon">🏷️</span>
          <span>{discount}</span>
        </div>

        {/* Veg / Non-Veg badge */}
        <div
          className={`rest-veg-badge ${
            isVeg ? "rest-veg-true" : "rest-veg-false"
          }`}
          title={isVeg ? "Veg" : "Non-Veg"}
          aria-label={isVeg ? "Vegetarian" : "Non-Vegetarian"}
        >
          <span className="rest-veg-dot"></span>
        </div>

        {/* View Menu label */}
        <div className="rest-card-view-menu">
          View Menu →
        </div>

        {/* Session Wishlist button */}
        <button
          type="button"
          className={`rest-wishlist-btn ${
            isWishlisted ? "rest-wishlist-active" : ""
          }`}
          onClick={toggleRestaurantWishlist}
          disabled={wishlistLoading}
          aria-label={
            isWishlisted
              ? "Remove restaurant from wishlist"
              : "Add restaurant to wishlist"
          }
          title={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          {wishlistLoading
            ? "…"
            : isWishlisted
              ? "♥"
              : "♡"}
        </button>
      </div>

      {/* Restaurant details */}
      <div className="rest-card-content">
        <div className="rest-card-header">
          <h3 className="rest-card-title">
            {restaurant.name}
          </h3>

          <div className="rest-card-rating">
            <span className="rest-star">★</span>
            <span>{restaurant.rating || "4.2"}</span>
          </div>
        </div>

        <p className="rest-card-cuisine">
          {restaurant.cuisine ||
            restaurant.cuisineType ||
            "Multi-Cuisine"}
        </p>

        <div className="rest-card-divider"></div>

        <div className="rest-card-meta">
          <div className="rest-meta-item">
            <span className="rest-meta-icon">⏱</span>
            <span>{formattedDeliveryTime}</span>
          </div>

          <div className="rest-meta-dot">•</div>

          <div className="rest-meta-item">
            <span className="rest-meta-icon">💰</span>
            <span>
              {restaurant.price || "₹300 for two"}
            </span>
          </div>

          <div className="rest-meta-dot">•</div>

          <div className="rest-meta-item rest-meta-location">
            <span className="rest-meta-icon">📍</span>
            <span>
              {restaurant.area ||
                restaurant.location ||
                restaurant.address ||
                "Bengaluru"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default RestaurantListCard;
