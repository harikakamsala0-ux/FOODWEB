
import { useState, useMemo, useEffect } from "react";
import RestaurantsHeader from "../components/restaurants/RestaurantsHeader";
import FilterChips from "../components/restaurants/FilterChips";
import RestaurantListCard from "../components/restaurants/RestaurantListCard";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/restaurants";

const NON_VEG_KEYWORDS = [
  "non-vegetarian",
  "non vegetarian",
  "non-veg",
  "non veg",
  "biryani",
  "steak",
  "seafood",
  "kebab",
  "shawarma",
  "barbecue",
  "grill",
  "chicken",
  "mutton",
  "fish",
];

const VEG_KEYWORDS = [
  "pure veg",
  "vegetarian",
  "south indian",
  "tiffin",
  "benne dosa",
  "ghee dosa",
  "dessert",
  "ice cream",
];

function isVegetarianRestaurant(restaurant) {
  const cuisine = (
    restaurant.cuisine ||
    restaurant.cuisineType ||
    ""
  ).toLowerCase();

  const category = (restaurant.category || "").toLowerCase();
  const restaurantText = `${cuisine}, ${category}`;

  const hasNonVeg = NON_VEG_KEYWORDS.some((keyword) =>
    restaurantText.includes(keyword)
  );

  const hasVeg = VEG_KEYWORDS.some((keyword) =>
    restaurantText.includes(keyword)
  );

  return hasVeg && !hasNonVeg;
}

function Restaurants() {
  const [restaurantList, setRestaurantList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeFilters, setActiveFilters] = useState({
    veg: false,
    rating: false,
    fastDelivery: false,
    offers: false,
  });

  const [favorites, setFavorites] = useState(new Set());
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch restaurants from the Java Servlet backend.
  useEffect(() => {
    let isMounted = true;

    async function fetchRestaurants() {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        console.log("Restaurants API status:", response.status);
        console.log(
          "Access-Control-Allow-Origin:",
          response.headers.get("Access-Control-Allow-Origin")
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Backend response is not a JSON array"
          );
        }

        console.log("Restaurants JSON:", data);

        console.log(
          "Actual restaurant ratings:",
          data.map((restaurant) => ({
            name: restaurant.name,
            rating: restaurant.rating,
          }))
        );

        console.log(
          "Restaurant delivery times:",
          data.map((restaurant) => ({
            name: restaurant.name,
            delivaryTime: restaurant.delivaryTime,
            deliveryTime: restaurant.deliveryTime,
            time: restaurant.time,
          }))
        );

        const formattedRestaurants = data.map((restaurant) => ({
          ...restaurant,

          image: restaurant.imagePath || restaurant.image,

          cuisine:
            restaurant.cuisineType ||
            restaurant.cuisine ||
            "",

          time:
            restaurant.delivaryTime ||
            restaurant.deliveryTime ||
            restaurant.time ||
            "",

          area:
            restaurant.address ||
            restaurant.area ||
            restaurant.location ||
            "",

          id:
            restaurant.id ??
            restaurant.restaurantId,
        }));

        if (isMounted) {
          setRestaurantList(formattedRestaurants);
          setError("");
        }
      } catch (err) {
        console.error(
          "Error fetching restaurants:",
          err
        );

        if (isMounted) {
          setError(
            "Unable to load restaurants. Check your backend URL, Tomcat console, and CORS configuration."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleToggleFavorite = (id) => {
    setFavorites((previousFavorites) => {
      const updatedFavorites = new Set(previousFavorites);

      if (updatedFavorites.has(id)) {
        updatedFavorites.delete(id);
        showToast("Removed from favorites");
      } else {
        updatedFavorites.add(id);
        showToast("Added to favorites ❤️");
      }

      return updatedFavorites;
    });
  };

  const handleToggleFilter = (filterKey) => {
    setActiveFilters((previousFilters) => ({
      ...previousFilters,
      [filterKey]: !previousFilters[filterKey],
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({
      veg: false,
      rating: false,
      fastDelivery: false,
      offers: false,
    });

    setSearchQuery("");
  };

  const totalActiveFilters = useMemo(() => {
    return Object.values(activeFilters).filter(Boolean).length;
  }, [activeFilters]);

  // Search and filter restaurants.
  const filteredRestaurants = useMemo(() => {
    return restaurantList.filter((restaurant) => {
      // Search filter.
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();

        const nameMatch = (restaurant.name || "")
          .toLowerCase()
          .includes(query);

        const cuisineMatch = (
          restaurant.cuisine ||
          restaurant.cuisineType ||
          ""
        )
          .toLowerCase()
          .includes(query);

        const categoryMatch = (
          restaurant.category || ""
        )
          .toLowerCase()
          .includes(query);

        const areaMatch = (
          restaurant.area ||
          restaurant.location ||
          restaurant.address ||
          ""
        )
          .toLowerCase()
          .includes(query);

        if (
          !nameMatch &&
          !cuisineMatch &&
          !categoryMatch &&
          !areaMatch
        ) {
          return false;
        }
      }

      // Pure vegetarian filter.
      if (
        activeFilters.veg &&
        !isVegetarianRestaurant(restaurant)
      ) {
        return false;
      }

      // Rating filter: 4.0 and above.
      if (activeFilters.rating) {
        const ratingValue = Number(restaurant.rating);

        if (
          !Number.isFinite(ratingValue) ||
          ratingValue < 4.0
        ) {
          return false;
        }
      }

      // Fast delivery filter: 25 minutes or less.
      if (activeFilters.fastDelivery) {
        const timeString =
          restaurant.delivaryTime ||
          restaurant.deliveryTime ||
          restaurant.time ||
          "";

        const numbers = String(timeString).match(/\d+/g);

        const minimumTime = numbers
          ? parseInt(numbers[0], 10)
          : 30;

        if (minimumTime > 25) {
          return false;
        }
      }

      // Offers filter.
      if (activeFilters.offers) {
        if (
          !restaurant.discount ||
          String(restaurant.discount).trim() === ""
        ) {
          return false;
        }
      }

      return true;
    });
  }, [restaurantList, searchQuery, activeFilters]);

  return (
    <div className="rest-page">
      {toastMessage && (
        <div className="rest-toast" role="alert">
          {toastMessage}
        </div>
      )}

      <div className="rest-container">
        <RestaurantsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalCount={filteredRestaurants.length}
        />

        <FilterChips
          activeFilters={activeFilters}
          toggleFilter={handleToggleFilter}
          clearFilters={handleClearFilters}
          totalActiveCount={totalActiveFilters}
        />

        {loading ? (
          <p>Loading restaurants...</p>
        ) : error ? (
          <div className="rest-empty-state">
            <h2>Failed to Load Restaurants</h2>
            <p>{error}</p>

            <button
              className="rest-btn-reset"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="rest-grid">
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantListCard
                key={
                  restaurant.restaurantId ??
                  restaurant.id ??
                  index
                }
                restaurant={restaurant}
                isFavorite={favorites.has(
                  restaurant.id ?? restaurant.restaurantId ?? index
                )}
                onToggleFavorite={() =>
                  handleToggleFavorite(
                    restaurant.id ??
                      restaurant.restaurantId ??
                      index
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="rest-empty-state">
            <div className="rest-empty-icon">🍽️</div>

            <h2>No Restaurants Found</h2>

            <p>
              We couldn't find any restaurant matching your
              criteria.
            </p>

            <button
              className="rest-btn-reset"
              onClick={handleClearFilters}
            >
              Reset Filters &amp; Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Restaurants;
