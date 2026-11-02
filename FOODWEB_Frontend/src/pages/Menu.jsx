
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../App.css";

const API_BASE_URL = "http://localhost:8080/FOODWEB/api";
const CART_URL = `${API_BASE_URL}/cart`;
const WISHLIST_URL = `${API_BASE_URL}/wishlist`;

const FALLBACK_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80";

const FALLBACK_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

function isItemAvailable(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
}

function getFoodType(item) {
  const value =
    item.isVeg ?? item.veg ?? item.foodType ?? item.itemType;

  if (typeof value === "boolean") {
    return value ? "veg" : "nonveg";
  }

  if (value === 1 || String(value).toLowerCase() === "true") {
    return "veg";
  }

  if (value === 0 || String(value).toLowerCase() === "false") {
    return "nonveg";
  }

  const type = String(value ?? "").trim().toLowerCase();

  if (["veg", "vegetarian"].includes(type)) return "veg";

  if (
    ["nonveg", "non-veg", "non vegetarian", "non-vegetarian"].includes(type)
  ) {
    return "nonveg";
  }

  return "unknown";
}

function formatPrice(value) {
  const price = Number(value);

  return value != null && value !== "" && Number.isFinite(price)
    ? `₹${price.toFixed(0)}`
    : "—";
}

function getRestaurantId(restaurant) {
  return String(restaurant.restaurantId ?? restaurant.id ?? "");
}

function getCategory(item) {
  return item.category || item.itemCategory || "All Items";
}

function getValidRating(value) {
  const rating = Number(value);

  return Number.isFinite(rating) && rating >= 1 && rating <= 5
    ? rating
    : null;
}

// Read the delivery time using the backend's actual field name first.
function getRestaurantDeliveryTime(restaurant) {
  const value = [
    restaurant.delivaryTime,
    restaurant.deliveryTime,
    restaurant.time,
  ].find(
    (item) => item != null && String(item).trim() !== ""
  );

  if (value == null) {
    return "";
  }

  const deliveryTime = String(value).trim();

  return /min|minute/i.test(deliveryTime)
    ? deliveryTime
    : `${deliveryTime} min`;
}

function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const restaurantId = searchParams.get("restaurantId") || "";
  const restaurantName =
    searchParams.get("restaurantName") || "Our Restaurant";

  const [menuItems, setMenuItems] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [cartData, setCartData] = useState({
    restaurantId: 0,
    totalItems: 0,
    totalAmount: 0,
    items: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartBusy, setCartBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");

  // Wishlist state
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [wishlistLoading, setWishlistLoading] = useState({});
  const wishlistBusyRef = useRef(new Set());

  const categoryRefs = useRef({});
  const cartBusyRef = useRef(false);

  // ----------------------------------------
  // LOAD CART FROM JAVA SESSION
  // ----------------------------------------

  const loadCart = useCallback(async () => {
    const response = await fetch(CART_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load your cart.");
    }

    const data = await response.json();

    setCartData({
      restaurantId: data.restaurantId ?? 0,
      totalItems: Number(data.totalItems ?? 0),
      totalAmount: Number(data.totalAmount ?? 0),
      items: Array.isArray(data.items) ? data.items : [],
    });
  }, []);

  useEffect(() => {
    loadCart().catch((err) => {
      console.error("Cart loading error:", err);
      setCartError(
        "Unable to connect to the cart. Please check that Tomcat is running."
      );
    });
  }, [loadCart]);

  // Refresh cart when another component changes it.
  useEffect(() => {
    const refreshCart = () => {
      loadCart().catch((err) => {
        console.error("Cart refresh error:", err);
      });
    };

    window.addEventListener("foodweb-cart-updated", refreshCart);

    return () => {
      window.removeEventListener("foodweb-cart-updated", refreshCart);
    };
  }, [loadCart]);

  // ----------------------------------------
  // LOAD FOOD WISHLIST FROM JAVA SESSION
  // ----------------------------------------

  const loadFoodWishlist = useCallback(async () => {
    const response = await fetch(WISHLIST_URL, {
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

    const ids = (Array.isArray(data.foods) ? data.foods : [])
      .map((food) => Number(food.menuId))
      .filter((id) => Number.isFinite(id) && id > 0);

    setWishlistIds(new Set(ids));
  }, []);

  useEffect(() => {
    loadFoodWishlist().catch((err) => {
      console.error("Wishlist loading error:", err);
    });
  }, [loadFoodWishlist]);

  // Refresh wishlist when another component changes it.
  useEffect(() => {
    const refreshWishlist = () => {
      loadFoodWishlist().catch((err) => {
        console.error("Wishlist refresh error:", err);
      });
    };

    window.addEventListener(
      "foodweb-wishlist-updated",
      refreshWishlist
    );

    return () => {
      window.removeEventListener(
        "foodweb-wishlist-updated",
        refreshWishlist
      );
    };
  }, [loadFoodWishlist]);

  // ----------------------------------------
  // ADD OR REMOVE FOOD FROM WISHLIST
  // ----------------------------------------

  const toggleFoodWishlist = useCallback(async (menuId) => {
    const id = Number(menuId);

    if (!Number.isFinite(id) || id <= 0) {
      return;
    }

    // Prevent duplicate requests for the same item.
    if (wishlistBusyRef.current.has(id)) {
      return;
    }

    const isSaved = wishlistIds.has(id);

    wishlistBusyRef.current.add(id);

    setWishlistLoading((previous) => ({
      ...previous,
      [id]: true,
    }));

    try {
      const params = new URLSearchParams({
        action: isSaved ? "remove" : "add",
        type: "food",
        id: String(id),
      });

      const response = await fetch(WISHLIST_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Unable to update your wishlist."
        );
      }

      setWishlistIds((previous) => {
        const updated = new Set(previous);

        if (isSaved) {
          updated.delete(id);
        } else {
          updated.add(id);
        }

        return updated;
      });

      window.dispatchEvent(
        new Event("foodweb-wishlist-updated")
      );
    } catch (err) {
      console.error("Wishlist update error:", err);
      alert(err.message || "Unable to update your wishlist.");
    } finally {
      wishlistBusyRef.current.delete(id);

      setWishlistLoading((previous) => ({
        ...previous,
        [id]: false,
      }));
    }
  }, [wishlistIds]);

  // Find the quantity of a menu item in the session cart.
  const getCartQuantity = useCallback(
    (menuId) => {
      const cartItem = cartData.items.find(
        (item) => Number(item.menuId) === Number(menuId)
      );

      return Number(cartItem?.quantity || 0);
    },
    [cartData.items]
  );

  // ----------------------------------------
  // ADD, UPDATE AND REMOVE CART ITEMS
  // ----------------------------------------

  const changeQuantity = useCallback(
    async (item, delta) => {
      if (delta > 0 && !isItemAvailable(item.isAvailable)) {
        return;
      }

      if (cartBusyRef.current) {
        return;
      }

      const currentQuantity = getCartQuantity(item.menuId);
      const nextQuantity = currentQuantity + delta;

      if (nextQuantity < 0 || delta === 0) {
        return;
      }

      const action =
        currentQuantity === 0 && delta > 0 ? "add" : "update";

      const quantity =
        action === "add" ? delta : nextQuantity;

      const params = new URLSearchParams();

      params.set("action", action);
      params.set("menuId", String(item.menuId));
      params.set("quantity", String(quantity));

      cartBusyRef.current = true;
      setCartBusy(true);
      setCartError("");

      try {
        const response = await fetch(CART_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Unable to update your cart.");
        }

        await loadCart();

        window.dispatchEvent(new Event("foodweb-cart-updated"));
      } catch (err) {
        console.error("Cart update error:", err);

        setCartError(
          err.message ||
            "Unable to update your cart. Please try again."
        );
      } finally {
        cartBusyRef.current = false;
        setCartBusy(false);
      }
    },
    [getCartQuantity, loadCart]
  );

  // ----------------------------------------
  // FETCH RESTAURANT DETAILS
  // ----------------------------------------

  useEffect(() => {
    if (!/^\d+$/.test(restaurantId) || Number(restaurantId) <= 0) {
      setRestaurantInfo(null);
      return;
    }

    const controller = new AbortController();

    async function fetchRestaurant() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/restaurants`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load restaurant details.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          return;
        }

        const restaurant = data.find(
          (item) =>
            getRestaurantId(item) === String(restaurantId)
        );

        if (restaurant) {
          setRestaurantInfo({
            name: restaurant.name,
            cuisine:
              restaurant.cuisineType ||
              restaurant.cuisine ||
              "",
            image:
              restaurant.imagePath ||
              restaurant.image ||
              FALLBACK_RESTAURANT_IMAGE,
            rating: getValidRating(restaurant.rating),

            // FIX: Check delivaryTime first and do not invent a default.
            deliveryTime: getRestaurantDeliveryTime(restaurant),

            price: restaurant.price || "₹300 for two",
            address:
              restaurant.address ||
              restaurant.area ||
              restaurant.location ||
              "",
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Restaurant details error:", err);
        }
      }
    }

    fetchRestaurant();

    return () => controller.abort();
  }, [restaurantId]);

  // ----------------------------------------
  // FETCH MENU ITEMS
  // ----------------------------------------

  const fetchMenu = useCallback(
    async (signal) => {
      if (
        !/^\d+$/.test(restaurantId) ||
        Number(restaurantId) <= 0
      ) {
        setMenuItems([]);
        setError(
          "Please select a valid restaurant from the Restaurants page."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/menu?restaurantId=${encodeURIComponent(
            restaurantId
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load menu (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The menu API must return a JSON array."
          );
        }

        const selectedItems = data.filter((item) => {
          const id =
            item.restaurantId ??
            item.restaurant?.restaurantId;

          return (
            id == null ||
            String(id) === String(restaurantId)
          );
        });

        setMenuItems(selectedItems);
        setActiveCategory("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Menu fetch error:", err);
          setError(err.message || "Unable to load the menu.");
          setMenuItems([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [restaurantId]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchMenu(controller.signal);

    return () => controller.abort();
  }, [fetchMenu, reloadKey]);

  // ----------------------------------------
  // MENU CATEGORIES
  // ----------------------------------------

  const categories = useMemo(() => {
    const seen = new Set();

    return menuItems.reduce((result, item) => {
      const category = getCategory(item);

      if (!seen.has(category)) {
        seen.add(category);
        result.push(category);
      }

      return result;
    }, []);
  }, [menuItems]);

  useEffect(() => {
    if (!categories.length) {
      setActiveCategory("");
    } else if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // ----------------------------------------
  // SEARCH AND GROUP MENU ITEMS
  // ----------------------------------------

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return menuItems;
    }

    return menuItems.filter(
      (item) =>
        String(item.itemName || "")
          .toLowerCase()
          .includes(query) ||
        String(item.description || "")
          .toLowerCase()
          .includes(query) ||
        String(getCategory(item))
          .toLowerCase()
          .includes(query)
    );
  }, [menuItems, searchQuery]);

  const grouped = useMemo(() => {
    const result = {};

    filteredItems.forEach((item) => {
      const category = getCategory(item);

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push(item);
    });

    return result;
  }, [filteredItems]);

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => grouped[category]?.length > 0
      ),
    [categories, grouped]
  );

  // ----------------------------------------
  // CATEGORY SCROLLING
  // ----------------------------------------

  function scrollToCategory(category) {
    setActiveCategory(category);

    categoryRefs.current[category]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    if (loading || !visibleCategories.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const elements = visibleCategories
      .map((category) => categoryRefs.current[category])
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top -
              b.boundingClientRect.top
          );

        if (visible.length) {
          setActiveCategory(
            visible[0].target.dataset.category
          );
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [loading, visibleCategories, searchQuery]);

  // ----------------------------------------
  // CART TOTALS FROM SESSION
  // ----------------------------------------

  const cartCount = Number(cartData.totalItems || 0);
  const cartTotal = Number(cartData.totalAmount || 0);

  const heroImg =
    restaurantInfo?.image || FALLBACK_RESTAURANT_IMAGE;

  const displayName =
    restaurantInfo?.name || restaurantName;

  // ----------------------------------------
  // PAGE UI
  // ----------------------------------------

  return (
    <div className="zm-page">
      {/* RESTAURANT HERO */}

      <div className="zm-hero">
        <img
          className="zm-hero__bg"
          src={heroImg}
          alt={displayName}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_RESTAURANT_IMAGE;
          }}
        />

        <div className="zm-hero__overlay" />

        <div className="zm-hero__content">
          <button
            type="button"
            className="zm-back-btn"
            onClick={() => navigate("/restaurants")}
          >
            <span>←</span> Back to Restaurants
          </button>

          <div className="zm-hero__info">
            <div className="zm-hero__badge">
              {restaurantInfo?.cuisine || "Multi-Cuisine"}
            </div>

            <h1 className="zm-hero__title">{displayName}</h1>

            <div className="zm-hero__meta">
              {restaurantInfo?.rating != null && (
                <span className="zm-meta-chip zm-meta-chip--green">
                  ★ {restaurantInfo.rating.toFixed(1)}
                </span>
              )}

              {restaurantInfo?.deliveryTime && (
                <span className="zm-meta-chip">
                  ⏱ {restaurantInfo.deliveryTime}
                </span>
              )}

              {restaurantInfo?.price && (
                <span className="zm-meta-chip">
                  💰 {restaurantInfo.price}
                </span>
              )}

              {restaurantInfo?.address && (
                <span className="zm-meta-chip zm-meta-chip--addr">
                  📍 {restaurantInfo.address}
                </span>
              )}
            </div>

            <div className="zm-hero__stats">
              <div className="zm-hero__stat">
                <strong>{menuItems.length}</strong>
                <span>Menu Items</span>
              </div>

              <div className="zm-hero__stat-divider" />

              <div className="zm-hero__stat">
                <strong>
                  {
                    menuItems.filter((item) =>
                      isItemAvailable(item.isAvailable)
                    ).length
                  }
                </strong>
                <span>Available Now</span>
              </div>

              <div className="zm-hero__stat-divider" />

              <div className="zm-hero__stat">
                <strong>{cartCount}</strong>
                <span>In Cart</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH */}

      <div className="zm-search-wrap">
        <label className="zm-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="search"
            placeholder={`Search in ${displayName}...`}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search menu items"
          />

          {searchQuery && (
            <button
              type="button"
              className="zm-search__clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>
      </div>

      {/* CART ERROR */}

      {cartError && (
        <div className="cart-error" role="alert">
          <span>{cartError}</span>

          <button
            type="button"
            onClick={() => {
              setCartError("");
              loadCart().catch((err) => setCartError(err.message));
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING, ERROR AND EMPTY STATES */}

      {loading ? (
        <div className="zm-status">
          <div className="zm-spinner" />
          <h3>Preparing your menu...</h3>
          <p>
            Just a moment while we bring up the delicious choices.
          </p>
        </div>
      ) : error ? (
        <div className="zm-status zm-status--error">
          <span className="zm-status__icon">⚠️</span>
          <h3>Couldn't load the menu</h3>
          <p>{error}</p>

          <button
            type="button"
            className="zm-btn-primary"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try Again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="zm-status">
          <span className="zm-status__icon">🔍</span>

          <h3>
            {menuItems.length === 0
              ? "No menu items available"
              : "No dishes found"}
          </h3>

          <p>
            {menuItems.length === 0
              ? "No menu items were returned for this restaurant. Check your Menu table and backend response."
              : "Try a different search term."}
          </p>

          {searchQuery && (
            <button
              type="button"
              className="zm-btn-secondary"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </button>
          )}

          {menuItems.length === 0 && (
            <button
              type="button"
              className="zm-btn-primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Reload Menu
            </button>
          )}
        </div>
      ) : (
        <div className="zm-body">
          {/* CATEGORY SIDEBAR */}

          <aside className="zm-sidebar">
            <p className="zm-sidebar__label">MENU</p>

            <nav>
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`zm-sidebar__item ${
                    activeCategory === category
                      ? "zm-sidebar__item--active"
                      : ""
                  }`}
                  onClick={() => scrollToCategory(category)}
                >
                  <span className="zm-sidebar__dot" />

                  <span className="zm-sidebar__name">
                    {category}
                  </span>

                  <span className="zm-sidebar__count">
                    {grouped[category].length}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* MENU ITEMS */}

          <main className="zm-menu-main">
            {visibleCategories.map((category) => {
              const items = grouped[category];

              return (
                <section
                  key={category}
                  className="zm-cat-section"
                  data-category={category}
                  ref={(element) => {
                    categoryRefs.current[category] = element;
                  }}
                >
                  <h2 className="zm-cat-title">
                    {category}
                    <span className="zm-cat-count">
                      {items.length}
                    </span>
                  </h2>

                  <div className="zm-item-list">
                    {items.map((item) => {
                      const available = isItemAvailable(
                        item.isAvailable
                      );

                      const quantity = getCartQuantity(item.menuId);
                      const foodType = getFoodType(item);
                      const menuId = Number(item.menuId);
                      const isWishlisted = wishlistIds.has(menuId);
                      const isWishlistBusy = Boolean(
                        wishlistLoading[menuId]
                      );

                      return (
                        <article
                          key={item.menuId}
                          className={`zm-item ${
                            !available ? "zm-item--unavail" : ""
                          }`}
                        >
                          {/* FOOD IMAGE */}

                          <div className="zm-item__image-column">
                            <img
                              className="zm-item__img"
                              src={
                                item.imagePath || FALLBACK_FOOD_IMAGE
                              }
                              alt={item.itemName || "Food item"}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src =
                                  FALLBACK_FOOD_IMAGE;
                              }}
                            />

                            {/* WISHLIST HEART */}

                            <button
                              type="button"
                              className={`food-wishlist-btn ${
                                isWishlisted ? "active" : ""
                              }`}
                              onClick={() =>
                                toggleFoodWishlist(item.menuId)
                              }
                              disabled={isWishlistBusy}
                              aria-label={
                                isWishlisted
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                              title={
                                isWishlisted
                                  ? "Remove from wishlist"
                                  : "Add to wishlist"
                              }
                            >
                              {isWishlistBusy
                                ? "…"
                                : isWishlisted
                                ? "♥"
                                : "♡"}
                            </button>

                            {quantity > 0 ? (
                              <div className="zm-qty">
                                <button
                                  type="button"
                                  className="zm-qty__btn"
                                  disabled={cartBusy}
                                  onClick={() =>
                                    changeQuantity(item, -1)
                                  }
                                  aria-label={`Remove one ${
                                    item.itemName || "item"
                                  }`}
                                >
                                  −
                                </button>

                                <span className="zm-qty__num">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  className="zm-qty__btn"
                                  disabled={!available || cartBusy}
                                  onClick={() =>
                                    changeQuantity(item, 1)
                                  }
                                  aria-label={`Add one ${
                                    item.itemName || "item"
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="zm-add-btn"
                                disabled={!available || cartBusy}
                                onClick={() =>
                                  changeQuantity(item, 1)
                                }
                              >
                                {!available
                                  ? "SOLD OUT"
                                  : cartBusy
                                  ? "ADDING..."
                                  : "ADD +"}
                              </button>
                            )}
                          </div>

                          {/* FOOD DETAILS */}

                          <div className="zm-item__info">
                            {foodType !== "unknown" && (
                              <span
                                className={`zm-veg-dot ${
                                  foodType === "veg"
                                    ? "zm-veg-dot--veg"
                                    : "zm-veg-dot--nonveg"
                                }`}
                                title={
                                  foodType === "veg"
                                    ? "Vegetarian"
                                    : "Non-vegetarian"
                                }
                              />
                            )}

                            <h3 className="zm-item__name">
                              {item.itemName || "Untitled dish"}
                            </h3>

                            <p className="zm-item__price">
                              {formatPrice(item.price)}
                            </p>

                            {Number(item.rating) > 0 &&
                              Number(item.rating) <= 5 && (
                                <span className="zm-item__rating">
                                  ★ {Number(item.rating).toFixed(1)}
                                </span>
                              )}

                            {item.description && (
                              <p className="zm-item__desc">
                                {item.description}
                              </p>
                            )}

                            {!available && (
                              <span className="zm-item__sold-out">
                                Currently unavailable
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      )}

      {/* CART BAR */}

      {cartCount > 0 && (
        <div className="zm-cart-bar">
          <div className="zm-cart-bar__left">
            <span className="zm-cart-bar__badge">
              {cartCount}
            </span>

            <span className="zm-cart-bar__label">
              {cartCount} item{cartCount !== 1 ? "s" : ""} added
            </span>
          </div>

          <div className="zm-cart-bar__right">
            <strong className="zm-cart-bar__total">
              {formatPrice(cartTotal)}
            </strong>

            <button
              type="button"
              className="zm-cart-bar__btn"
              onClick={() => navigate("/cart")}
            >
              View Cart →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
