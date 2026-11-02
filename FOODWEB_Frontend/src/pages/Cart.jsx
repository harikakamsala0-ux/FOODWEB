
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/cart";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

function formatPrice(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState({
    restaurantId: 0,
    totalItems: 0,
    totalAmount: 0,
    items: [],
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectionInitialized = useRef(false);
  const previousMenuIds = useRef(new Set());

  const loadCart = useCallback(async () => {
    const response = await fetch(API_URL, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Could not load your cart.");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const currentIds = items.map((item) => String(item.menuId));

    const isInitialLoad = !selectionInitialized.current;
    const oldIds = previousMenuIds.current;

    setSelectedIds((previous) => {
      if (isInitialLoad) {
        return new Set(currentIds);
      }

      // Preserve existing selections and select newly added items.
      return new Set(
        currentIds.filter(
          (id) => previous.has(id) || !oldIds.has(id)
        )
      );
    });

    selectionInitialized.current = true;
    previousMenuIds.current = new Set(currentIds);

    setCart({
      restaurantId: data.restaurantId ?? 0,
      totalItems: data.totalItems ?? 0,
      totalAmount: data.totalAmount ?? 0,
      items,
    });
  }, []);

  useEffect(() => {
    loadCart()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    const refreshCart = () => {
      loadCart().catch((err) => setError(err.message));
    };

    window.addEventListener("foodweb-cart-updated", refreshCart);

    return () => {
      window.removeEventListener("foodweb-cart-updated", refreshCart);
    };
  }, [loadCart]);

  const selectedItems = useMemo(
    () =>
      cart.items.filter((item) =>
        selectedIds.has(String(item.menuId))
      ),
    [cart.items, selectedIds]
  );

  const selectedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) =>
          sum +
          Number(
            item.subtotal ??
              Number(item.price) * Number(item.quantity)
          ),
        0
      ),
    [selectedItems]
  );

  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const allSelected =
    cart.items.length > 0 &&
    cart.items.every((item) =>
      selectedIds.has(String(item.menuId))
    );

  function toggleItem(menuId) {
    const id = String(menuId);

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(cart.items.map((item) => String(item.menuId)))
      );
    }
  }

  async function cartAction(action, menuId, quantity) {
    if (busy) return;

    setError("");
    setBusy(true);

    try {
      const params = new URLSearchParams();
      params.set("action", action);

      if (menuId != null) {
        params.set("menuId", String(menuId));
      }

      if (quantity != null) {
        params.set("quantity", String(quantity));
      }

      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        let message = "Cart update failed.";

        try {
          const result = await response.json();
          message = result.error || message;
        } catch {
          // Keep the fallback message if the response isn't JSON.
        }

        throw new Error(message);
      }

      await loadCart();
      window.dispatchEvent(new Event("foodweb-cart-updated"));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function proceedToCheckout() {
    if (selectedItems.length === 0) {
      setError("Please select at least one item for checkout.");
      return;
    }

    // Pass selected menu IDs in the URL so Checkout can filter correctly.
    const params = new URLSearchParams({
      restaurantId: String(cart.restaurantId || ""),
      selectedMenuIds: JSON.stringify(
        selectedItems.map((item) => Number(item.menuId))
      ),
    });

    navigate(`/checkout?${params.toString()}`, {
      state: {
        restaurantId: cart.restaurantId,
        items: selectedItems,
        selectedTotal,
        selectedQuantity,
      },
    });
  }

  if (loading) {
    return (
      <main className="cart-page">
        <p className="cart-loading">Preparing your delicious food...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-header">
        <button
          className="cart-back-btn"
          onClick={() => navigate("/restaurants")}
        >
          ← Continue shopping
        </button>

        <p className="cart-eyebrow">FOODWEB / YOUR ORDER</p>

        <h1>
          Your <span>Cart.</span>
        </h1>

        <p className="cart-subtitle">
          Choose your favourites. We'll take care of the flavour.
        </p>
      </header>

      {error && (
        <div className="cart-error" role="alert">
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              loadCart().catch((err) => setError(err.message));
            }}
          >
            Retry
          </button>
        </div>
      )}

      {cart.items.length === 0 ? (
        <section className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is hungry!</h2>
          <p>You haven't added any delicious food yet.</p>

          <button
            className="cart-primary-btn"
            onClick={() => navigate("/restaurants")}
          >
            Explore restaurants →
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-panel">
            <div className="cart-panel-heading">
              <div>
                <h2>Your items</h2>
                <p>
                  {cart.totalItems} unit(s) · {cart.items.length} different
                  item(s)
                </p>
              </div>

              <button
                className="cart-clear-btn"
                disabled={busy}
                onClick={() => cartAction("clear")}
              >
                Clear cart
              </button>
            </div>

            <label className="cart-select-all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select or unselect all cart items"
              />

              <span className="cart-custom-check" />

              <span className="cart-select-all-text">
                {allSelected ? "Unselect all items" : "Select all items"}
              </span>

              <span className="cart-selected-count">
                {selectedItems.length} of {cart.items.length} selected
              </span>
            </label>

            <div className="cart-item-list">
              {cart.items.map((item) => {
                const itemSelected = selectedIds.has(
                  String(item.menuId)
                );

                return (
                  <article
                    className={`cart-item ${
                      itemSelected ? "cart-item-selected" : ""
                    }`}
                    key={item.menuId}
                  >
                    <label className="cart-item-checkbox">
                      <input
                        type="checkbox"
                        checked={itemSelected}
                        onChange={() => toggleItem(item.menuId)}
                        aria-label={`Select ${item.itemName || "food item"}`}
                      />
                      <span className="cart-custom-check" />
                    </label>

                    <img
                      className="cart-item-image"
                      src={item.imagePath || FALLBACK_IMAGE}
                      alt={item.itemName || "Food"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <div className="cart-item-details">
                      <h3>{item.itemName || "Food item"}</h3>

                      <p className="cart-item-price">
                        {formatPrice(item.price)}
                      </p>

                      <button
                        className="cart-remove-btn"
                        disabled={busy}
                        onClick={() =>
                          cartAction("remove", item.menuId)
                        }
                      >
                        Remove item
                      </button>
                    </div>

                    <div className="cart-item-end">
                      <div className="cart-quantity">
                        <button
                          disabled={busy}
                          onClick={() =>
                            cartAction(
                              "update",
                              item.menuId,
                              Number(item.quantity) - 1
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          disabled={busy}
                          onClick={() =>
                            cartAction(
                              "update",
                              item.menuId,
                              Number(item.quantity) + 1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        {formatPrice(
                          item.subtotal ??
                            Number(item.price) * Number(item.quantity)
                        )}
                      </strong>

                      <span className="cart-item-selection-status">
                        {itemSelected ? "Selected" : "Not selected"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="cart-summary">
            <p className="cart-eyebrow">YOUR SELECTION</p>
            <h2>Bill details</h2>

            <div className="cart-summary-row">
              <span>Selected products</span>
              <span>{selectedItems.length}</span>
            </div>

            <div className="cart-summary-row">
              <span>Selected quantity</span>
              <span>{selectedQuantity}</span>
            </div>

            <div className="cart-summary-row">
              <span>Selected subtotal</span>
              <span>{formatPrice(selectedTotal)}</span>
            </div>

            <div className="cart-summary-row">
              <span>Delivery fee</span>
              <span className="cart-gold-text">At checkout</span>
            </div>

            <div className="cart-summary-total">
              <span>Subtotal to checkout</span>
              <strong>{formatPrice(selectedTotal)}</strong>
            </div>

            <button
              className="cart-primary-btn"
              disabled={selectedItems.length === 0 || busy}
              onClick={proceedToCheckout}
            >
              {selectedItems.length === 0
                ? "Select items to continue"
                : "Proceed to checkout →"}
            </button>

            <p className="cart-note">
              Only selected items are passed to checkout. Unselected items
              remain in your cart.
            </p>

            {selectedItems.length > 0 && (
              <button
                className="cart-select-all-link"
                onClick={toggleSelectAll}
              >
                {allSelected ? "Unselect everything" : "Select everything"}
              </button>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
