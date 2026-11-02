
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Hero({ search, setSearch }) {
  const navigate = useNavigate();

  const [location, setLocation] = useState("Bengaluru");
  const [locationMessage, setLocationMessage] = useState("");

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by your browser.");
      return;
    }

    setLocationMessage("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(
          `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
        );
        setLocationMessage("Location detected!");
      },
      () => {
        setLocationMessage("Allow location access or enter it manually.");
      }
    );
  };

  return (
    <section className="hero" id="home">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/food-hero.mp4" type="video/mp4" />
      </video>

      <div className="hero-dark"></div>

      <div className="hero-glow glow-one"></div>
      <div className="hero-glow glow-two"></div>

      <div className="hero-content">
        <div className="hero-pill">
          <span className="live-dot"></span>
          Delivering happiness near you
        </div>

        <h1 className="hero-title">
          Eat what
          <br />
          <span className="video-text" data-text="you love.">
            you love.
          </span>
        </h1>

        <p className="hero-description">
          Discover incredible food, amazing restaurants and
          unforgettable flavours — all delivered to your door.
        </p>

        <div className="hero-search">
          <button
            type="button"
            className="location-select"
            onClick={detectLocation}
            title="Detect your current location"
          >
            <span>📍</span>

            <div>
              <small>DELIVER TO</small>
              <strong>{location}</strong>
            </div>

            <span>⌄</span>
          </button>

          <div className="search-field">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search food, dishes or restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  scrollToSection("restaurants");
                }
              }}
              aria-label="Search food, dishes or restaurants"
            />
          </div>

          <button
            type="button"
            className="search-submit"
            onClick={() => scrollToSection("restaurants")}
          >
            Search
          </button>

          {locationMessage && (
            <p className="location-message">{locationMessage}</p>
          )}
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="hero-primary"
            onClick={() => scrollToSection("restaurants")}
          >
            Explore Food <span>↗</span>
          </button>

          <button
            type="button"
            className="hero-secondary"
            onClick={() => navigate("/offers")}
          >
            🔥 Today's Deals
          </button>
        </div>

        <div className="hero-trust">
          <div>
            <strong>10K+</strong>
            <span>Restaurants</span>
          </div>

          <div className="trust-line"></div>

          <div>
            <strong>50K+</strong>
            <span>Food Lovers</span>
          </div>

          <div className="trust-line"></div>

          <div>
            <strong>4.8 ★</strong>
            <span>Average Rating</span>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <span></span>
        Scroll to discover
      </div>
    </section>
  );
}

export default Hero;
