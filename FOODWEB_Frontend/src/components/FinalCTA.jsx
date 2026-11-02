function FinalCTA() {

  const explore = () => {
    document.getElementById("restaurants")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <section className="final-cta">

      <div className="cta-glow"></div>

      <div className="cta-food cta-food-one">
        🍔
      </div>

      <div className="cta-food cta-food-two">
        🍕
      </div>

      <div className="cta-content">

        <span className="section-label">
          YOUR TABLE IS READY
        </span>

        <h2>
          Don't just
          <br />
          <span>think about food.</span>
        </h2>

        <p>
          Find something delicious and make today
          a little more memorable.
        </p>

        <button
          className="hero-primary"
          onClick={explore}
        >
          Start Exploring ↗
        </button>

      </div>

    </section>
  );
}

export default FinalCTA;