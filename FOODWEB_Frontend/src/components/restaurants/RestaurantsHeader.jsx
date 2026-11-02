import { useNavigate } from "react-router-dom";

function RestaurantsHeader({ searchQuery, setSearchQuery, onOpenAddModal, totalCount }) {
  const navigate = useNavigate();

  return (
    <header className="rest-header">
      {/* Top action row */}
      <div className="rest-top-bar">
        <button className="rest-back-btn" onClick={() => navigate("/")}>
          <span className="rest-btn-icon">←</span>
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main hero title section */}
      <div className="rest-title-section">
        <span className="rest-badge">BENGALURU FOOD EXPLORER</span>
        <h1 className="rest-main-heading">
          Discover & Order From <span>Top Restaurants</span>
        </h1>
        <p className="rest-subtitle">
          Explore curated places, fast delivery spots, and exclusive offers near you.
        </p>
      </div>

      {/* Search Bar */}
      <div className="rest-search-wrapper">
        <div className="rest-search-box">
          <span className="rest-search-icon">🔍</span>
          <input
            type="text"
            className="rest-search-input"
            placeholder="Search by restaurant name, cuisine, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="rest-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="rest-search-count">
          Showing <strong>{totalCount}</strong> {totalCount === 1 ? "restaurant" : "restaurants"}
        </div>
      </div>
    </header>
  );
}

export default RestaurantsHeader;
