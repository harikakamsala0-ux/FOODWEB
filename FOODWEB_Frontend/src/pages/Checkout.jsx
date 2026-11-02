import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/checkout";
const CART_URL = "http://localhost:8080/FOODWEB/api/cart";
const LOGIN_URL = "/login";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

// Remove spaces and non-digit characters from a saved phone number.
const cleanPhoneNumber = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(0, 10);

const cleanPincode = (pincode) =>
  String(pincode || "").replace(/\D/g, "").slice(0, 6);

function getSelectedIds(searchParams) {
  const raw = searchParams.get("selectedMenuIds");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter(Number.isFinite);
    }
  } catch {
    // Accept comma-separated IDs too.
  }

  return raw.split(",").map(Number).filter(Number.isFinite);
}

function launchConfetti() {
  const colors = ["#FF8C00", "#F5B942", "#FFFFFF", "#FFB347"];

  for (let i = 0; i < 45; i += 1) {
    const piece = document.createElement("span");
    piece.className = "checkout-confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.setProperty(
      "--confetti-rotation",
      `${Math.random() * 720}deg`
    );
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 2800);
  }
}

function luhnCheck(number) {
  let sum = 0;
  let doubleDigit = false;

  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

function normalizeCartItem(entry) {
  const menu = entry.menu || entry;

  return {
    menuId: Number(entry.menuId ?? menu.menuId ?? menu.id),
    itemName: menu.itemName || menu.name || "Food item",
    price: Number(menu.price) || 0,
    quantity: Number(entry.quantity) || 1,
    imagePath: menu.imagePath || menu.image || "",
    subtotal:
      Number(entry.subtotal) ||
      (Number(menu.price) || 0) * (Number(entry.quantity) || 1),
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /*
   * Cart.jsx passes selectedItems through location.state.
   * Query parameters are also supported for refresh-safe navigation.
   */
  const selectedMenuIds = useMemo(() => {
    const stateItems = location.state?.items;

    if (Array.isArray(stateItems)) {
      return [
        ...new Set(
          stateItems
            .map((item) =>
              Number(item.menuId ?? item.menu?.menuId ?? item.id)
            )
            .filter(Number.isFinite)
        ),
      ];
    }

    return [...new Set(getSelectedIds(searchParams))];
  }, [location.state, searchParams]);

  const restaurantId =
    location.state?.restaurantId ||
    searchParams.get("restaurantId") ||
    "";

  const [address, setAddress] = useState(initialAddress);
  const [savedProfile, setSavedProfile] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [paymentMode, setPaymentMode] = useState("COD");
  const [upiId, setUpiId] = useState("");

  const [cardDetails, setCardDetails] = useState({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [cartItems, setCartItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Verify login and fill saved profile details.
  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const result = await response.json();
        if (!active) return;

        const isLoggedIn = response.ok && result.loggedIn === true;
        setLoggedIn(isLoggedIn);

        if (isLoggedIn && result.user) {
          const profile = {
            fullName:
              result.user.fullName || result.user.userName || "",
            phone: cleanPhoneNumber(result.user.phone),
            address: result.user.address || "",
          };

          setSavedProfile(profile);

          setAddress((previous) => ({
            ...previous,
            fullName: previous.fullName || profile.fullName,
            phone: previous.phone || profile.phone,
            addressLine: previous.addressLine || profile.address,
          }));
        } else if (!response.ok && response.status !== 401) {
          setError(result.message || "Unable to verify your login session.");
        }
      } catch {
        if (active) {
          setLoggedIn(false);
          setError(
            "Unable to connect to the server. Please check that Tomcat is running."
          );
        }
      } finally {
        if (active) setCheckingLogin(false);
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, []);

  // Load the server cart, but display only IDs selected on the Cart page.
  useEffect(() => {
    let active = true;

    async function loadSelectedItems() {
      setLoadingItems(true);

      try {
        if (selectedMenuIds.length === 0) {
          setCartItems([]);
          setError(
            "No items were selected. Return to your cart and select items."
          );
          return;
        }

        const response = await fetch(CART_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Unable to load your cart.");
        }

        const result = await response.json();
        if (!active) return;

        const rawItems = Array.isArray(result.items)
          ? result.items
          : Array.isArray(result.cartItems)
            ? result.cartItems
            : [];

        const selectedIds = new Set(selectedMenuIds.map(String));

        const normalized = rawItems
          .map(normalizeCartItem)
          .filter((item) => Number.isFinite(item.menuId));

        const filteredItems = normalized.filter((item) =>
          selectedIds.has(String(item.menuId))
        );

        setCartItems(filteredItems);

        if (filteredItems.length === 0) {
          setError(
            "Your selected items were not found in the current cart. Please return to your cart."
          );
        } else {
          setError("");
        }
      } catch (err) {
        if (active) {
          setCartItems([]);
          setError(err.message || "Unable to load your selected items.");
        }
      } finally {
        if (active) setLoadingItems(false);
      }
    }

    if (loggedIn) {
      loadSelectedItems();
    } else if (!checkingLogin) {
      setCartItems([]);
      setLoadingItems(false);
    }

    return () => {
      active = false;
    };
  }, [loggedIn, checkingLogin, selectedMenuIds]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cartItems]
  );

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  function updateAddress(event) {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]:
        name === "phone"
          ? cleanPhoneNumber(value)
          : name === "pincode"
            ? cleanPincode(value)
            : value,
    }));

    setError("");
  }

  function updateCard(event) {
    const { name, value } = event.target;

    setCardDetails((previous) => {
      if (name === "cardNumber") {
        return {
          ...previous,
          cardNumber: value.replace(/\D/g, "").slice(0, 19),
        };
      }

      if (name === "expiry") {
        const digits = value.replace(/\D/g, "").slice(0, 4);

        return {
          ...previous,
          expiry:
            digits.length > 2
              ? `${digits.slice(0, 2)}/${digits.slice(2)}`
              : digits,
        };
      }

      if (name === "cvv") {
        return {
          ...previous,
          cvv: value.replace(/\D/g, "").slice(0, 4),
        };
      }

      return { ...previous, [name]: value };
    });

    setError("");
  }

  function validateForm() {
    if (!address.fullName.trim()) {
      return "Please enter the receiver's name.";
    }

    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (!address.addressLine.trim()) {
      return "Please enter your delivery address.";
    }

    if (!address.city.trim() || !address.state.trim()) {
      return "Please enter your city and state.";
    }

    if (!/^\d{6}$/.test(address.pincode.trim())) {
      return "Enter a valid 6-digit pincode.";
    }

    if (cartItems.length === 0) {
      return "No selected items are available for checkout.";
    }

    if (paymentMode === "UPI") {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
        return "Enter a valid UPI ID, for example name@upi.";
      }
    }

    if (paymentMode === "CARD") {
      if (!cardDetails.cardholder.trim()) {
        return "Enter the cardholder name.";
      }

      if (
        !/^\d{13,19}$/.test(cardDetails.cardNumber) ||
        !luhnCheck(cardDetails.cardNumber)
      ) {
        return "Enter a valid card number.";
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry)) {
        return "Enter the card expiry in MM/YY format.";
      }

      const [month, year] = cardDetails.expiry.split("/").map(Number);
      const now = new Date();
      const expiryDate = new Date(2000 + year, month, 1);

      if (expiryDate <= new Date(now.getFullYear(), now.getMonth(), 1)) {
        return "Your card has expired.";
      }

      if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
        return "Enter a valid 3- or 4-digit CVV.";
      }
    }

    return "";
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!loggedIn) {
      navigate(LOGIN_URL);
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setPlacingOrder(true);

    try {
      // Never send or store card number, expiry or CVV in your own backend.
      // Real card payments must be handled by a payment gateway.
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          restaurantId: Number(restaurantId) || undefined,
          selectedMenuIds: cartItems.map((item) => item.menuId),
          address,
          paymentMode,
          upiId: paymentMode === "UPI" ? upiId.trim() : "",
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "Unable to place your order.");
      }
      window.dispatchEvent(new Event("foodweb-cart-updated"));
      launchConfetti();
      setSuccessMessage("Your order has been placed successfully!");

      window.setTimeout(() => {
        navigate("/order-success", {
          state: {
            orderId: result.orderId,
            restaurantId: result.restaurantId,
            totalAmount: result.totalAmount ?? total,
            paymentMode,
          },
        });
      }, 900);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (checkingLogin) {
    return (
      <main className="checkout-page">
        <div className="checkout-loading">
          <span className="checkout-spinner" />
          <p>Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="checkout-page">
        <section className="checkout-login-card">
          <div className="checkout-login-icon">🔐</div>
          <h1>Please log in first</h1>
          <p className="checkout-login-description">
            You need to log in to complete your FOODWEB order.
          </p>

          {error && (
            <div className="checkout-alert">
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="checkout-primary-btn"
            onClick={() => navigate(LOGIN_URL)}
          >
            Go to Login
          </button>

          <p className="checkout-secure-note">
            FOODWEB · Your food, your way.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button
          type="button"
          className="checkout-back-btn"
          onClick={() => navigate("/cart")}
        >
          ← Back to cart
        </button>

        <p className="checkout-eyebrow">FOODWEB / YOUR ORDER</p>

        <h1>
          Almost <span>there!</span>
        </h1>

        <p className="checkout-subtitle">
          Confirm your delivery details and choose how to pay.
        </p>

        <div className="checkout-progress">
          <span className="checkout-progress-done">✓ Cart</span>
          <i />
          <span className="checkout-progress-current">2 Checkout</span>
          <i />
          <span>3 Order</span>
        </div>
      </header>

      {error && (
        <div className="checkout-alert" role="alert">
          <span>⚠ {error}</span>
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="checkout-alert" role="status">
          <span>✓ {successMessage}</span>
        </div>
      )}

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span className="checkout-step-icon">⌖</span>
              <div>
                <h2>Delivery address</h2>
                <p>Where should we deliver your food?</p>
              </div>
            </div>

            <div className="checkout-upi-box checkout-profile-note">
              Your saved profile details are filled in automatically. You can
              edit them for this order.
            </div>

            <div className="checkout-form-grid">
              <label className="checkout-field">
                <span className="checkout-field-label">
                  Full name <span>*</span>
                </span>
                <input
                  name="fullName"
                  type="text"
                  value={address.fullName}
                  onChange={updateAddress}
                  placeholder="Receiver's full name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">
                  Mobile number <span>*</span>
                </span>
                <input
                  name="phone"
                  type="tel"
                  value={address.phone}
                  onChange={updateAddress}
                  placeholder={
                    savedProfile.phone
                      ? "Saved mobile number"
                      : "10-digit mobile number"
                  }
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required
                />
                {savedProfile.phone && (
                  <small>Prefilled from your saved profile</small>
                )}
              </label>

              <label className="checkout-field checkout-field-full">
                <span className="checkout-field-label">
                  House / street address <span>*</span>
                </span>
                <textarea
                  name="addressLine"
                  value={address.addressLine}
                  onChange={updateAddress}
                  placeholder="House number, street, area"
                  autoComplete="street-address"
                  rows={3}
                  required
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">Landmark</span>
                <input
                  name="landmark"
                  type="text"
                  value={address.landmark}
                  onChange={updateAddress}
                  placeholder="Nearby landmark (optional)"
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">
                  Pincode <span>*</span>
                </span>
                <input
                  name="pincode"
                  type="text"
                  value={address.pincode}
                  onChange={updateAddress}
                  placeholder="6-digit pincode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">
                  City <span>*</span>
                </span>
                <input
                  name="city"
                  type="text"
                  value={address.city}
                  onChange={updateAddress}
                  placeholder="Your city"
                  autoComplete="address-level2"
                  required
                />
              </label>

              <label className="checkout-field">
                <span className="checkout-field-label">
                  State <span>*</span>
                </span>
                <input
                  name="state"
                  type="text"
                  value={address.state}
                  onChange={updateAddress}
                  placeholder="Your state"
                  autoComplete="address-level1"
                  required
                />
              </label>
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span className="checkout-step-icon">₹</span>
              <div>
                <h2>Payment method</h2>
                <p>Choose your preferred payment option.</p>
              </div>
            </div>

            <div className="checkout-payment-options">
              {[
                {
                  value: "COD",
                  icon: "💵",
                  title: "Cash on delivery",
                  description: "Pay when your order arrives",
                },
                {
                  value: "UPI",
                  icon: "📱",
                  title: "UPI",
                  description: "Pay using your UPI ID",
                },
                {
                  value: "CARD",
                  icon: "💳",
                  title: "Debit / credit card",
                  description: "Card form for demonstration only",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`checkout-payment-option ${
                    paymentMode === option.value ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value={option.value}
                    checked={paymentMode === option.value}
                    onChange={(event) =>
                      setPaymentMode(event.target.value)
                    }
                  />

                  <span className="checkout-payment-icon">
                    {option.icon}
                  </span>

                  <span className="checkout-payment-copy">
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>

                  <span className="checkout-radio-mark" />
                </label>
              ))}
            </div>

            {paymentMode === "UPI" && (
              <div className="checkout-upi-box">
                <label className="checkout-field">
                  <span className="checkout-field-label">
                    UPI ID <span>*</span>
                  </span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                    placeholder="yourname@upi"
                    autoComplete="off"
                    required
                  />
                </label>
                <p>
                  This demo collects a UPI ID but does not process or verify
                  an actual UPI payment.
                </p>
              </div>
            )}

            {paymentMode === "CARD" && (
              <div className="checkout-upi-box">
                <div className="checkout-form-grid">
                  <label className="checkout-field checkout-field-full">
                    <span className="checkout-field-label">
                      Cardholder name <span>*</span>
                    </span>
                    <input
                      name="cardholder"
                      type="text"
                      value={cardDetails.cardholder}
                      onChange={updateCard}
                      placeholder="Name on card"
                      autoComplete="cc-name"
                      required
                    />
                  </label>

                  <label className="checkout-field checkout-field-full">
                    <span className="checkout-field-label">
                      Card number <span>*</span>
                    </span>
                    <input
                      name="cardNumber"
                      type="text"
                      value={cardDetails.cardNumber.replace(
                        /(\d{4})(?=\d)/g,
                        "$1 "
                      )}
                      onChange={updateCard}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      maxLength={23}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    <span className="checkout-field-label">
                      Expiry date <span>*</span>
                    </span>
                    <input
                      name="expiry"
                      type="text"
                      value={cardDetails.expiry}
                      onChange={updateCard}
                      placeholder="MM/YY"
                      autoComplete="cc-exp"
                      maxLength={5}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    <span className="checkout-field-label">
                      CVV <span>*</span>
                    </span>
                    <input
                      name="cvv"
                      type="password"
                      value={cardDetails.cvv}
                      onChange={updateCard}
                      placeholder="•••"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      maxLength={4}
                      required
                    />
                  </label>
                </div>

                <p>
                  Demo only. Do not enter a real card. Card details are not
                  sent to a payment provider and no card payment is processed.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Order summary</h2>

          {loadingItems ? (
            <div className="checkout-loading">
              <span className="checkout-spinner" />
              <p>Loading your selected items...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="checkout-empty">
              <div>🛒</div>
              <h2>No selected items</h2>
              <p>
                Return to your cart, select the items you want, and try again.
              </p>
              <button
                type="button"
                className="checkout-primary-btn"
                onClick={() => navigate("/cart")}
              >
                Return to cart
              </button>
            </div>
          ) : (
            <>
              <div className="checkout-summary-items">
                {cartItems.map((item) => (
                  <div
                    className="checkout-summary-item"
                    key={item.menuId}
                  >
                    <img
                      src={item.imagePath || FALLBACK_IMAGE}
                      alt={item.itemName}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <div>
                      <strong>{item.itemName}</strong>
                      <small>Qty: {item.quantity}</small>
                    </div>

                    <span>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-line">
                <span>Selected items subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="checkout-summary-line">
                <span>Delivery fee</span>
                <span className="checkout-free">FREE</span>
              </div>

              <div className="checkout-summary-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <button
                type="submit"
                className="checkout-primary-btn checkout-place-order"
                disabled={placingOrder || loadingItems}
              >
                {placingOrder
                  ? "Placing your order..."
                  : `Place order · ${formatPrice(total)}`}
              </button>

              <p className="checkout-summary-note">
                Only the items selected in your cart are included in this
                order.
              </p>
            </>
          )}

          <div className="checkout-summary-line">
            <span>🔒 Your details stay private</span>
          </div>
        </aside>
      </form>
    </main>
  );
}