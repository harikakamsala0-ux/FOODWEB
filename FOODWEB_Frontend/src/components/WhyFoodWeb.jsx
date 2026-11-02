function WhyFoodWeb() {

  const features = [
    {
      icon: "⚡",
      title: "Lightning Fast",
      text: "Hot and fresh food delivered without the long wait.",
    },
    {
      icon: "✦",
      title: "Curated Quality",
      text: "Discover restaurants and dishes worth coming back for.",
    },
    {
      icon: "⌁",
      title: "Better Deals",
      text: "Exclusive offers that make every order more rewarding.",
    },
    {
      icon: "◈",
      title: "Secure & Simple",
      text: "Easy ordering with secure payments and transparent pricing.",
    },
  ];

  return (
    <section className="why-section">

      <div className="why-heading">

        <span className="section-label">
          THE FOODWEB DIFFERENCE
        </span>

        <h2>
          Built around
          <br />
          <span>your cravings.</span>
        </h2>

      </div>

      <div className="why-grid">

        {features.map((feature) => (

          <div
            className="why-card"
            key={feature.title}
          >

            <div className="why-icon">
              {feature.icon}
            </div>

            <h3>{feature.title}</h3>

            <p>{feature.text}</p>

            <span className="why-number">
              0{features.indexOf(feature) + 1}
            </span>

          </div>

        ))}

      </div>

    </section>
  );
}

export default WhyFoodWeb;