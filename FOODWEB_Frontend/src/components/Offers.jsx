import { useNavigate } from "react-router-dom";
function Offers() {
  const navigate = useNavigate();
  return (
    <section
      className="offers-section"
      id="offers"
    >

      <div className="offer-copy">

        <span className="section-label">
          EXCLUSIVE FOODWEB DEAL
        </span>

        <h2>
          More food.
          <br />
          <span>Less money.</span>
        </h2>

        <p>
          Get delicious meals from your favourite restaurants
          with exclusive discounts available only on FOODWEB.
        </p>

        <button
            className="hero-primary"
            onClick={() => navigate("/offers")}
          >
            Grab the Deal ↗
          </button>

      </div>

      <div className="offer-art">

        <div className="offer-ring ring-one"></div>
        <div className="offer-ring ring-two"></div>

        <div className="offer-food">
          🍕
        </div>

        <div className="offer-floating-card offer-top">
          🔥
          <strong>40%</strong>
          <small>OFF</small>
        </div>

        <div className="offer-floating-card offer-bottom">
          🚚
          <span>FREE DELIVERY</span>
        </div>

      </div>

    </section>
  );
}

export default Offers;