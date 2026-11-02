function Footer() {

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <footer className="footer" id="footer">

      <div className="footer-main">

        <div className="footer-brand">

          <div className="brand footer-logo">
            <div className="brand-symbol">✦</div>

            <div>
              <strong>FOOD</strong>
              <span>WEB</span>
            </div>
          </div>

          <p>
            Discover great food.
            Support amazing restaurants.
            Make every meal memorable.
          </p>

          <div className="social-icons">
            <button>𝕏</button>
            <button>f</button>
            <button>◎</button>
            <button>in</button>
          </div>

        </div>

        <div className="footer-column">

          <h4>EXPLORE</h4>

          <button onClick={() => scrollTo("home")}>
            Home
          </button>

          <button onClick={() => scrollTo("categories")}>
            Categories
          </button>

          <button onClick={() => scrollTo("restaurants")}>
            Restaurants
          </button>

          <button onClick={() => scrollTo("offers")}>
            Offers
          </button>

        </div>

        <div className="footer-column">

          <h4>ACCOUNT</h4>

          <button>Login</button>
          <button>Sign Up</button>
          <button>My Orders</button>
          <button>Favorites</button>

        </div>

        <div className="footer-column">

          <h4>GET THE APP</h4>

          <p>
            Your favourite food,
            one tap away.
          </p>

          <button className="store-button">
             &nbsp; App Store
          </button>

          <button className="store-button">
            ▶ &nbsp; Google Play
          </button>

        </div>

      </div>

      <div className="footer-bottom">

        <span>
          © 2026 FOODWEB. All rights reserved.
        </span>

        <span>
          Made with ♥ for food lovers.
        </span>

      </div>

    </footer>
  );
}

export default Footer;