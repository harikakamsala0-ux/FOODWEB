function FilterChips({ activeFilters, toggleFilter, clearFilters, totalActiveCount }) {
  const filterOptions = [
    { id: "veg", label: "Pure Veg", icon: "🌱" },
    { id: "rating", label: "Rating 4.0+", icon: "★" },
    { id: "fastDelivery", label: "Fast Delivery", icon: "⚡" },
    
  ];

  return (
    <div className="rest-filters-container">
      <div className="rest-filters-label">Filters:</div>
      <div className="rest-chips-group">
        <button
          type="button"
          className={`rest-chip ${totalActiveCount === 0 ? "rest-chip-active" : ""}`}
          onClick={clearFilters}
        >
          All
        </button>

        {filterOptions.map((chip) => {
          const isActive = activeFilters[chip.id];
          return (
            <button
              type="button"
              key={chip.id}
              className={`rest-chip ${isActive ? "rest-chip-active" : ""}`}
              onClick={() => toggleFilter(chip.id)}
            >
              <span className="rest-chip-icon">{chip.icon}</span>
              <span>{chip.label}</span>
              {isActive && <span className="rest-chip-check">✓</span>}
            </button>
          );
        })}

        {totalActiveCount > 0 && (
          <button
            type="button"
            className="rest-chip-clear"
            onClick={clearFilters}
          >
            Reset filters ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterChips;
