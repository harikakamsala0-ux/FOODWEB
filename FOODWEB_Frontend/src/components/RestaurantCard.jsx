
import { useNavigate } from "react-router-dom";

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  const openMenu = () => {
    navigate(
      `/menu?restaurantId=${restaurant.restaurantId}&restaurantName=${encodeURIComponent(
        restaurant.name
      )}`
    );
  };

  return (
    <article
      className="restaurant-card"
      onClick={openMenu}
      style={{ cursor: "pointer" }}
    >
      <div className="restaurant-image">
        <img
          src={restaurant.imagePath || "/fallback-restaurant.png"}
          alt={restaurant.name}
        />

        <div className="image-shade"></div>

        <button
          className="heart-button"
          onClick={(event) => {
            event.stopPropagation();
            alert("Added to favourites ❤️");
          }}
        >
          ♡
        </button>

        <div className="delivery-time">
          ⚡ {restaurant.delivaryTime}
        </div>
      </div>

      <div className="restaurant-info">
        <div className="restaurant-heading">
          <div>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.cuisineType}</p>
          </div>

          {Number(restaurant.rating) >= 1 &&
            Number(restaurant.rating) <= 5 && (
              <span className="rating">
                ★ {restaurant.rating}
              </span>
            )}
        </div>

        <div className="restaurant-meta">
          <span>{restaurant.address}</span>

          <button
            onClick={(event) => {
              event.stopPropagation();
              openMenu();
            }}
          >
            View Menu →
          </button>
        </div>
      </div>
    </article>
  );
}

export default RestaurantCard;
