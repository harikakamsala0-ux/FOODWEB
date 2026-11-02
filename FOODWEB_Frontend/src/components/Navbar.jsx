
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CART_API = "http://localhost:8080/FOODWEB/api/cart";
const WISHLIST_API = "http://localhost:8080/FOODWEB/api/wishlist";
const SESSION_API = "http://localhost:8080/FOODWEB/api/session";
const LOGOUT_API = "http://localhost:8080/FOODWEB/api/logout";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();

  // Load cart count from the Java backend
  const loadCartCount = useCallback(async () => {
    try {
      const response = await fetch(CART_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error("Unable to load cart:", response.status);
        return;
      }

      const data = await response.json();
      setCartCount(Number(data.totalItems) || 0);
    } catch (error) {
      console.error("Unable to load cart count:", error);
    }
  }, []);

  // Load combined food + restaurant wishlist count
  const loadWishlistCount = useCallback(async () => {
    try {
      const response = await fetch(WISHLIST_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "Unable to load wishlist:",
          response.status
        );
        return;
      }

      const data = await response.json();

      // Prefer the count supplied by WishlistServlet.
      // Fall back to counting the returned arrays.
      const total =
        data.count !== undefined
          ? Number(data.count)
          : (Array.isArray(data.foods) ? data.foods.length : 0) +
            (Array.isArray(data.restaurants)
              ? data.restaurants.length
              : 0);

      setWishlistCount(
        Number.isFinite(total) ? Math.max(0, total) : 0
      );
    } catch (error) {
      console.error("Unable to load wishlist count:", error);
    }
  }, []);

  // Check whether a valid login session exists
  const loadUserSession = useCallback(async () => {
    try {
      const response = await fetch(SESSION_API, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setUser(null);
        setProfileOpen(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.loggedIn && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setProfileOpen(false);
      }
    } catch (error) {
      console.error("Unable to check login session:", error);
      setUser(null);
      setProfileOpen(false);
    }
  }, []);

  // Load data and listen for updates from other components
  useEffect(() => {
    loadCartCount();
    loadWishlistCount();
    loadUserSession();

    const handleCartUpdate = () => {
      loadCartCount();
    };

    const handleWishlistUpdate = () => {
      loadWishlistCount();
    };

    const handleAuthUpdate = () => {
      loadUserSession();

      // Refresh counts after login/logout changes.
      loadCartCount();
      loadWishlistCount();
    };

    window.addEventListener(
      "foodweb-cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "foodweb-wishlist-updated",
      handleWishlistUpdate
    );

    window.addEventListener(
      "foodweb-auth-updated",
      handleAuthUpdate
    );

    return () => {
      window.removeEventListener(
        "foodweb-cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "foodweb-wishlist-updated",
        handleWishlistUpdate
      );

      window.removeEventListener(
        "foodweb-auth-updated",
        handleAuthUpdate
      );
    };
  }, [loadCartCount, loadWishlistCount, loadUserSession]);

  // Close menus when navigating
  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  // Scroll to a section on the current page
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setOpen(false);
  };

  // Navigate to a page
  const goTo = (path) => {
    closeMenus();
    navigate(path);
  };

  // Log out and destroy the Java session
  const handleLogout = async () => {
    try {
      const response = await fetch(LOGOUT_API, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message || "Unable to log out. Please try again."
        );
        return;
      }

      setUser(null);
      setProfileOpen(false);
      setOpen(false);

      // Refresh navbar state after logout
      window.dispatchEvent(
        new Event("foodweb-auth-updated")
      );

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  const avatarLetter =
    (user?.userName || "U").trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <nav className="navbar">
      {/* FOODWEB Brand */}
      <div
        className="brand"
        onClick={() => goTo("/")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goTo("/");
          }
        }}
      >
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSvuL90Vag4kPP3Yjs8qo79Y_aJ_j4hNm2Cz-A1TaUIQ&s=10"
          alt="FoodWeb"
          className="brand-symbol"
        />

        <div className="brand-text">
          <strong>FOOD</strong>
          <strong>WEB</strong>
        </div>
      </div>

      {/* Navigation Links */}
      <div className={`nav-links ${open ? "nav-open" : ""}`}>
        <button onClick={() => goTo("/")}>Home</button>

        <button onClick={() => scrollTo("categories")}>
          Explore
        </button>

        <button onClick={() => goTo("/restaurants")}>
          Restaurants
        </button>

        <button onClick={() => goTo("/orders")}>Orders</button>

        <button onClick={() => goTo("/offers")}>
          Offers
        </button>
      </div>

      {/* Wishlist, Cart and Authentication */}
      <div className="nav-right">
        {/* Wishlist Icon + Combined Count */}
        <button
          type="button"
          className="nav-wishlist"
          onClick={() => goTo("/wishlist")}
          aria-label={`Open wishlist with ${wishlistCount} saved items`}
          title={`My Wishlist (${wishlistCount})`}
        >
          <svg
            viewBox="0 0 24 24"
            width="23"
            height="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>

          {wishlistCount > 0 && (
            <span className="nav-wishlist-count">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </button>

        {/* Cart */}
        <button
          type="button"
          className="nav-cart"
          onClick={() => goTo("/cart")}
          aria-label={`Open cart with ${cartCount} items`}
          title="My Cart"
        >
          🛒 <span>{cartCount}</span>
        </button>

        {/* Login / Profile */}
        {!user ? (
          <button
            className="nav-login"
            onClick={() => goTo("/login")}
          >
            Login
          </button>
        ) : (
          <div className="nav-profile-container">
            <button
              type="button"
              className="nav-profile-button"
              onClick={() =>
                setProfileOpen((previous) => !previous)
              }
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              title={user.userName || "My Profile"}
            >
              <span className="nav-profile-avatar">
                {avatarLetter}
              </span>
            </button>

            {profileOpen && (
              <div className="nav-profile-dropdown">
                <div className="nav-profile-info">
                  <div className="nav-profile-avatar nav-profile-avatar-large">
                    {avatarLetter}
                  </div>

                  <div className="nav-profile-details">
                    <strong>
                      {user.userName || "FOODWEB User"}
                    </strong>

                    <span>{user.email || ""}</span>

                    <small>
                      {user.role || "Customer"}
                    </small>
                  </div>
                </div>

                <div className="nav-profile-divider" />

                <button
                  type="button"
                  className="nav-profile-menu-item"
                  onClick={() => goTo("/profile")}
                >
                  <span>👤</span>
                  My Profile
                </button>

                <button
                  type="button"
                  className="nav-profile-menu-item nav-logout-item"
                  onClick={handleLogout}
                >
                  <span>↪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation Button */}
      <button
        type="button"
        className="hamburger"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>
    </nav>
  );
}

export default Navbar;
