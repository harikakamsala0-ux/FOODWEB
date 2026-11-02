import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/admin/restaurants";

const emptyRestaurant = {
  name: "",
  address: "",
  phone: "",
  cuisineType: "",
  delivaryTime: "",
  rating: "4.0",
  isActive: true,
  imagePath: "",
};

function AdminRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [formData, setFormData] = useState(emptyRestaurant);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchRestaurants = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load restaurants.");
      }

      const restaurantList = Array.isArray(data)
        ? data
        : data.restaurants || [];

      setRestaurants(restaurantList);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyRestaurant });
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (restaurant) => {
    setEditingId(restaurant.restaurantId);

    setFormData({
      name: restaurant.name || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      cuisineType: restaurant.cuisineType || "",
      delivaryTime: restaurant.delivaryTime || "",
      rating: String(restaurant.rating ?? 4.0),
      isActive:
        restaurant.isActive === true ||
        restaurant.isActive === 1 ||
        restaurant.isActive === "1" ||
        String(restaurant.isActive).toLowerCase() === "true",
      imagePath: restaurant.imagePath || "",
    });

    setMessage("");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...formData,
      rating: Number(formData.rating),
    };

    try {
      const response = await fetch(API_URL, {
        method: editingId !== null ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...payload,
          restaurantId: editingId,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            `Unable to ${editingId !== null ? "update" : "add"} restaurant.`
        );
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyRestaurant });

      setMessage(
        editingId !== null
          ? "Restaurant updated successfully."
          : "Restaurant added successfully."
      );

      await fetchRestaurants();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (restaurant) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${restaurant.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}?restaurantId=${restaurant.restaurantId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to delete restaurant.");
      }

      setRestaurants((previous) =>
        previous.filter(
          (item) => item.restaurantId !== restaurant.restaurantId
        )
      );

      setMessage("Restaurant deleted successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete this restaurant. Check related menu items and orders."
      );
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const search = searchTerm.toLowerCase();

    return (
      String(restaurant.name || "").toLowerCase().includes(search) ||
      String(restaurant.cuisineType || "").toLowerCase().includes(search) ||
      String(restaurant.address || "").toLowerCase().includes(search)
    );
  });

  const isRestaurantActive = (restaurant) =>
    restaurant.isActive === true ||
    restaurant.isActive === 1 ||
    restaurant.isActive === "1" ||
    String(restaurant.isActive).toLowerCase() === "true";

  return (
    <main className="admin-restaurants-page">
      <div className="admin-restaurants-header">
        <div>
         

          <p className="admin-restaurants-eyebrow">FOODWEB ADMIN PANEL</p>

          <h1>Restaurant Management</h1>

          <p className="admin-restaurants-subtitle">
            Manage restaurant details, availability, and listings.
          </p>
        </div>

        <button
          type="button"
          className="admin-restaurants-add-btn"
          onClick={openAddForm}
        >
          <span>＋</span> Add Restaurant
        </button>
      </div>

      <section className="admin-restaurants-stats">
        <div className="admin-restaurants-stat-card">
          <span className="admin-restaurants-stat-icon">🏪</span>
          <div>
            <p>Total Restaurants</p>
            <h2>{restaurants.length}</h2>
          </div>
        </div>

        <div className="admin-restaurants-stat-card">
          <span className="admin-restaurants-stat-icon">🟢</span>
          <div>
            <p>Active Restaurants</p>
            <h2>
              {restaurants.filter(isRestaurantActive).length}
            </h2>
          </div>
        </div>

        <div className="admin-restaurants-stat-card">
          <span className="admin-restaurants-stat-icon">⏸️</span>
          <div>
            <p>Inactive Restaurants</p>
            <h2>
              {restaurants.filter((item) => !isRestaurantActive(item)).length}
            </h2>
          </div>
        </div>
      </section>

      {message && (
        <div className="admin-restaurants-message success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="admin-restaurants-message error">
          ⚠ {error}
        </div>
      )}

      {showForm && (
        <section className="admin-restaurants-form-card">
          <div className="admin-restaurants-form-heading">
            <div>
              <p className="admin-restaurants-eyebrow">
                {editingId !== null ? "UPDATE DETAILS" : "NEW LISTING"}
              </p>

              <h2>
                {editingId !== null
                  ? "Edit Restaurant"
                  : "Add New Restaurant"}
              </h2>
            </div>

            <button
              type="button"
              className="admin-restaurants-close-btn"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setError("");
              }}
              aria-label="Close restaurant form"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-restaurants-form-grid">
              <label>
                Restaurant Name *
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Phone Number *
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  maxLength={20}
                />
              </label>

              <label>
                Cuisine Type *
                <input
                  type="text"
                  name="cuisineType"
                  value={formData.cuisineType}
                  onChange={handleChange}
                  placeholder="e.g. South Indian, Chinese"
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Delivery Time *
                <input
                  type="text"
                  name="delivaryTime"
                  value={formData.delivaryTime}
                  onChange={handleChange}
                  placeholder="e.g. 25-30 mins"
                  required
                  maxLength={50}
                />
              </label>

              <label>
                Rating
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  required
                />
              </label>

              <label>
                Image Path / URL
                <input
                  type="text"
                  name="imagePath"
                  value={formData.imagePath}
                  onChange={handleChange}
                  placeholder="Enter image URL or path"
                  maxLength={500}
                />
              </label>

              <label className="admin-restaurants-address-field">
                Restaurant Address *
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete restaurant address"
                  rows="3"
                  required
                  maxLength={500}
                />
              </label>

              <label className="admin-restaurants-active-field">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Restaurant is active and available to customers
              </label>
            </div>

            <div className="admin-restaurants-form-actions">
              <button
                type="button"
                className="admin-restaurants-cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-restaurants-save-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Restaurant"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-restaurants-list-card">
        <div className="admin-restaurants-list-header">
          <div>
            <h2>All Restaurants</h2>
            <p>View and manage restaurants in your database.</p>
          </div>

          <button
            type="button"
            className="admin-restaurants-refresh-btn"
            onClick={fetchRestaurants}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="admin-restaurants-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search by name, cuisine, or address..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="admin-restaurants-state">
            <div className="admin-restaurants-loader" />
            <p>Loading restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="admin-restaurants-state">
            <span className="admin-restaurants-empty-icon">🍽️</span>
            <h3>No restaurants found</h3>
            <p>
              {searchTerm
                ? "Try a different search term."
                : "Add your first restaurant to get started."}
            </p>

            {!searchTerm && (
              <button
                type="button"
                className="admin-restaurants-add-btn"
                onClick={openAddForm}
              >
                ＋ Add Restaurant
              </button>
            )}
          </div>
        ) : (
          <div className="admin-restaurants-table-wrapper">
            <table className="admin-restaurants-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Cuisine</th>
                  <th>Delivery</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant.restaurantId}>
                    <td>
                      <div className="admin-restaurants-name-cell">
                        {restaurant.imagePath ? (
                          <img
                            src={restaurant.imagePath}
                            alt={restaurant.name || "Restaurant"}
                            onError={(event) => {
                              event.currentTarget.style.visibility = "hidden";
                            }}
                          />
                        ) : (
                          <div className="admin-restaurants-image-placeholder">
                            🍽️
                          </div>
                        )}

                        <div>
                          <strong>{restaurant.name || "Unnamed Restaurant"}</strong>
                          <span>
                            ID: {restaurant.restaurantId}
                          </span>
                          <small>{restaurant.address || "No address added"}</small>
                        </div>
                      </div>
                    </td>

                    <td>{restaurant.cuisineType || "—"}</td>

                    <td>{restaurant.delivaryTime || "—"}</td>

                    <td>
                      <span className="admin-restaurants-rating">
                        ★ {Number(restaurant.rating) > 0
                          ? Number(restaurant.rating).toFixed(1)
                          : "—"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-restaurants-status ${
                          isRestaurantActive(restaurant)
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {isRestaurantActive(restaurant)
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-restaurants-actions">
                        <button
                          type="button"
                          className="admin-restaurants-edit-btn"
                          onClick={() => openEditForm(restaurant)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-restaurants-delete-btn"
                          onClick={() => handleDelete(restaurant)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredRestaurants.length > 0 && (
          <div className="admin-restaurants-list-footer">
            Showing {filteredRestaurants.length} of {restaurants.length} restaurants
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminRestaurants;

