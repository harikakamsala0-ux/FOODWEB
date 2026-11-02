
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantListCard from "./restaurants/RestaurantListCard";

const RESTAURANT_API =
  "http://localhost:8080/FOODWEB/api/restaurants";

function RestaurantSection({ search, selectedCategory }) {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(RESTAURANT_API);

      if (!response.ok) {
        throw new Error("Unable to fetch restaurants");
      }

      const data = await response.json();

      setRestaurants(
        Array.isArray(data)
          ? data.filter(
              (restaurant) =>
                restaurant.isActive === true ||
                restaurant.isActive === 1 ||
                restaurant.isActive === "1" ||
                restaurant.isActive === "true"
            )
          : []
      );
    } catch (err) {
      console.error("Restaurant fetch error:", err);
      setError("Unable to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const name = (restaurant.name || "").toLowerCase();
    const cuisine = (restaurant.cuisineType || "").toLowerCase();
    const searchText = search.trim().toLowerCase();

    // When searching, ignore the selected category
    if (searchText) {
      return (
        name.includes(searchText) ||
        cuisine.includes(searchText)
      );
    }

    // When not searching, show only the selected category
    return cuisine.includes(selectedCategory.toLowerCase());
  });

  return (
    <section className="restaurants-section" id="restaurants">
      <div className="section-top">
        <div>
          <span className="section-label">CURATED FOR YOU</span>
          <h2>
            Popular <span>{selectedCategory}</span>
          </h2>
        </div>

        <button
          className="view-all"
          onClick={() => navigate("/restaurants")}
        >
          View all restaurants →
        </button>
      </div>

      {loading ? (
        <div className="empty-result">
          <p>Loading restaurants...</p>
        </div>
      ) : error ? (
        <div className="empty-result">
          <p>{error}</p>
          <button onClick={fetchRestaurants}>Try Again</button>
        </div>
      ) : selectedCategory === "All" ? (
        <div className="empty-result">
          <div>🍽️</div>
          <h3>Select a food category</h3>
          <p>Choose a category above to explore matching restaurants.</p>
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="restaurant-grid">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantListCard
              key={restaurant.restaurantId}
              restaurant={restaurant}
            />
          ))}
        </div>
      ) : (
        <div className="empty-result">
          <div>🍽️</div>
          <h3>No restaurants found</h3>
          <p>
            No restaurants match {selectedCategory}. Try another category.
          </p>
        </div>
      )}
    </section>
  );
}

export default RestaurantSection;
