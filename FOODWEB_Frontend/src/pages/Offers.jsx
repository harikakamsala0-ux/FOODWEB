import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const OFFERS_API = "http://localhost:8080/FOODWEB/api/offers";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85";

function Offers() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(OFFERS_API);

      if (!response.ok) {
        throw new Error("Unable to load offers.");
      }

      const data = await response.json();

      setOffers(
        Array.isArray(data)
          ? data.filter((offer) => offer.active)
          : []
      );
    } catch (err) {
      console.error("Offers fetch error:", err);
      setError("Unable to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);

      setToastMessage("Coupon copied successfully!");

      window.setTimeout(() => {
        setToastMessage("");
      }, 2500);
    } catch (err) {
      console.error("Copy coupon error:", err);

      setToastMessage("Unable to copy coupon code.");

      window.setTimeout(() => {
        setToastMessage("");
      }, 2500);
    }
  };

  const formatDiscount = (offer) => {
    return offer.discountType === "PERCENT"
      ? `${offer.discountValue}% OFF`
      : `₹${offer.discountValue} OFF`;
  };

  return (
    <div className="customer-offers-page">
      {/* HERO */}
      <section className="customer-offers-hero">
        <span className="customer-offers-eyebrow">
          FOODWEB SPECIAL DEALS
        </span>

        <h1>
          Delicious Food.
          <span> Amazing Offers.</span>
        </h1>

        <p>
          Discover exciting deals and enjoy more of your favourite food.
        </p>
      </section>

      {/* OFFERS */}
      <section className="customer-offers-content">
        <div className="customer-offers-heading">
          <div>
            <span>EXCLUSIVE DEALS</span>
            <h2>Offers Just for You</h2>
          </div>

          <button
            className="customer-offers-refresh"
            onClick={fetchOffers}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="customer-offers-message">
            <div className="customer-offers-spinner"></div>
            <p>Loading exciting offers...</p>
          </div>
        ) : error ? (
          <div className="customer-offers-message">
            <p>{error}</p>
            <button onClick={fetchOffers}>Try Again</button>
          </div>
        ) : offers.length === 0 ? (
          <div className="customer-offers-message">
            <div className="customer-offers-empty-icon">%</div>
            <h3>No Offers Available</h3>
            <p>Please check back soon for exciting deals.</p>
          </div>
        ) : (
          <div className="customer-offers-grid">
            {offers.map((offer) => (
              <article
                className="customer-offer-card"
                key={offer.offerId}
              >
                {/* OFFER IMAGE */}
                <div className="customer-offer-image-wrapper">
                  <img
                    className="customer-offer-image"
                    src={offer.imagePath || FALLBACK_IMAGE}
                    alt={offer.title || "Food offer"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />

                  <span className="customer-offer-tag">
                    SPECIAL OFFER
                  </span>

                  <span className="customer-offer-discount">
                    {formatDiscount(offer)}
                  </span>
                </div>

                {/* OFFER DETAILS */}
                <div className="customer-offer-details">
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>

                  <div className="customer-offer-conditions">
                    <div className="customer-offer-minimum">
                      <span>Minimum order</span>
                      <strong>
                        ₹{Number(offer.minOrderAmount || 0).toFixed(0)}
                      </strong>
                    </div>

                    {offer.discountType === "PERCENT" &&
                      Number(offer.maxDiscount) > 0 && (
                        <div className="customer-offer-maximum">
                          <span>Maximum savings</span>
                          <strong>
                            ₹{Number(offer.maxDiscount).toFixed(0)}
                          </strong>
                        </div>
                      )}
                  </div>
                </div>

                {/* COUPON FOOTER */}
                <div className="customer-offer-footer">
                  <div className="customer-offer-coupon">
                    <span>USE CODE</span>
                    <strong>{offer.code}</strong>
                  </div>

                  <button
                    className="customer-offer-copy"
                    onClick={() => copyCoupon(offer.code)}
                  >
                    Copy Code
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* BOTTOM SECTION */}
      <section className="customer-offers-bottom">
        <h2>Hungry for something delicious?</h2>
        <p>Explore restaurants and find your next favourite meal.</p>

        <button onClick={() => navigate("/restaurants")}>
          Explore Restaurants →
        </button>
      </section>

      {/* TOAST */}
      {toastMessage && (
        <div className="customer-offers-toast" role="status">
          <span className="customer-offers-toast-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Offers;