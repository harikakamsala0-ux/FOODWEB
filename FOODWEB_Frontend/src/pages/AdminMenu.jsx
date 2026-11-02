
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const MENU_API = "http://localhost:8080/FOODWEB/api/admin/menu";
const RESTAURANT_API =
  "http://localhost:8080/FOODWEB/api/admin/restaurants";

const ITEMS_PER_PAGE = 20;

const EMPTY_FORM = {
  restaurantId: "",
  itemName: "",
  description: "",
  price: "",
  isAvailable: true,
  rating: "0",
  imagePath: "",
};

const isAvailableItem = (item) =>
  item.isAvailable === true ||
  item.isAvailable === 1 ||
  item.isAvailable === "1" ||
  item.isAvailable === "true";

function AdminMenu() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuResponse, restaurantResponse] = await Promise.all([
        fetch(MENU_API, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch(RESTAURANT_API, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      if (
        menuResponse.status === 401 ||
        restaurantResponse.status === 401
      ) {
        navigate("/login");
        return;
      }

      if (
        menuResponse.status === 403 ||
        restaurantResponse.status === 403
      ) {
        throw new Error("You do not have permission to manage menu items.");
      }

      if (!menuResponse.ok || !restaurantResponse.ok) {
        throw new Error("Unable to load menu management data.");
      }

      const menuData = await menuResponse.json();
      const restaurantData = await restaurantResponse.json();

      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setRestaurants(
        Array.isArray(restaurantData) ? restaurantData : []
      );
    } catch (err) {
      console.error("Admin menu loading error:", err);
      setError(err.message || "Unable to load menu items.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const restaurantName = (restaurantId) => {
    const restaurant = restaurants.find(
      (item) =>
        Number(item.restaurantId) === Number(restaurantId)
    );

    return restaurant
      ? restaurant.name
      : `Restaurant #${restaurantId}`;
  };

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSearch =
        (item.itemName || "").toLowerCase().includes(searchText) ||
        (item.description || "").toLowerCase().includes(searchText) ||
        restaurantName(item.restaurantId)
          .toLowerCase()
          .includes(searchText);

      const matchesRestaurant =
        restaurantFilter === "all" ||
        Number(item.restaurantId) === Number(restaurantFilter);

      const available = isAvailableItem(item);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && available) ||
        (statusFilter === "unavailable" && !available);

      return (
        matchesSearch &&
        matchesRestaurant &&
        matchesStatus
      );
    });
  }, [
    menuItems,
    search,
    restaurantFilter,
    statusFilter,
    restaurants,
  ]);

  const availableCount = menuItems.filter(isAvailableItem).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );

  const visibleItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredItems.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, restaurantFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openAddForm = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      restaurantId: restaurants[0]?.restaurantId
        ? String(restaurants[0].restaurantId)
        : "",
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.menuId);

    setForm({
      restaurantId: String(item.restaurantId),
      itemName: item.itemName || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      isAvailable: isAvailableItem(item),
      rating: String(item.rating ?? 0),
      imagePath: item.imagePath || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.restaurantId || !form.itemName.trim()) {
      setError("Please select a restaurant and enter an item name.");
      return;
    }

    const price = Number(form.price);
    const rating = Number(form.rating);

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    const payload = {
      ...(editingId !== null
        ? { menuId: Number(editingId) }
        : {}),
      restaurantId: Number(form.restaurantId),
      itemName: form.itemName.trim(),
      description: form.description.trim(),
      price,
      isAvailable: Boolean(form.isAvailable),
      rating,
      imagePath: form.imagePath.trim(),
    };

    setSaving(true);
    setError("");

    try {
      const response = await fetch(MENU_API, {
        method: editingId !== null ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error ||
          result.message ||
          "Unable to save menu item."
        );
      }

      const wasEditing = editingId !== null;

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      showToast(
        wasEditing
          ? "Menu item updated successfully"
          : "Menu item added successfully"
      );

      await loadData();
    } catch (err) {
      console.error("Menu save error:", err);
      setError(err.message || "Unable to save menu item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menuId) => {
    const confirmed = window.confirm(
      "Deactivate this menu item? It will remain in the database but become unavailable."
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${MENU_API}?menuId=${encodeURIComponent(menuId)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error ||
          result.message ||
          "Unable to deactivate menu item."
        );
      }

      showToast("Menu item deactivated successfully");
      await loadData();
    } catch (err) {
      console.error("Menu deactivate error:", err);
      setError(err.message || "Unable to deactivate menu item.");
    }
  };

  const handleAvailability = async (item) => {
    const currentlyAvailable = isAvailableItem(item);

    const payload = {
      menuId: Number(item.menuId),
      restaurantId: Number(item.restaurantId),
      itemName: item.itemName,
      description: item.description || "",
      price: Number(item.price),
      isAvailable: !currentlyAvailable,
      rating: Number(item.rating || 0),
      imagePath: item.imagePath || "",
    };

    setError("");

    try {
      const response = await fetch(MENU_API, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error ||
          result.message ||
          "Unable to update availability."
        );
      }

      showToast(
        currentlyAvailable
          ? "Item marked unavailable"
          : "Item marked available"
      );

      await loadData();
    } catch (err) {
      console.error("Availability update error:", err);
      setError(err.message || "Unable to update availability.");
    }
  };

  const handleImageError = (event) => {
    const image = event.currentTarget;
    image.style.display = "none";

    const placeholder = image.parentElement?.querySelector(
      ".admin-menu-food-placeholder"
    );

    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  return (
    <div className="admin-menu-page">
      <div className="admin-menu-header">
        <div>
          <p className="admin-menu-eyebrow">
            FOODWEB ADMINISTRATION
          </p>

          <h1>Menu Management</h1>

          <p className="admin-menu-subtitle">
            Manage food items across all your restaurants.
          </p>
        </div>

        <button
          type="button"
          className="admin-menu-primary-btn"
          onClick={openAddForm}
          disabled={restaurants.length === 0}
        >
          + Add Menu Item
        </button>
      </div>

      <div className="admin-menu-stats">
        <div className="admin-menu-stat-card">
          <span>Total Menu Items</span>
          <strong>{menuItems.length}</strong>
        </div>

        <div className="admin-menu-stat-card">
          <span>Available Items</span>
          <strong>{availableCount}</strong>
        </div>

        <div className="admin-menu-stat-card">
          <span>Unavailable Items</span>
          <strong>{menuItems.length - availableCount}</strong>
        </div>

        <div className="admin-menu-stat-card">
          <span>Restaurants</span>
          <strong>{restaurants.length}</strong>
        </div>
      </div>

      <div className="admin-menu-toolbar">
        <input
          type="search"
          placeholder="Search item or restaurant..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-menu-search"
        />

        <select
          value={restaurantFilter}
          onChange={(event) =>
            setRestaurantFilter(event.target.value)
          }
          className="admin-menu-filter"
        >
          <option value="all">All Restaurants</option>

          {restaurants.map((restaurant) => (
            <option
              key={restaurant.restaurantId}
              value={restaurant.restaurantId}
            >
              {restaurant.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="admin-menu-filter"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {error && !showForm && (
        <div className="admin-menu-error">{error}</div>
      )}

      {loading ? (
        <div className="admin-menu-empty">
          Loading menu items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="admin-menu-empty">
          <span className="admin-menu-empty-icon">🍽️</span>
          <h3>No menu items found</h3>
          <p>Add a menu item or change your search filters.</p>
        </div>
      ) : (
        <>
          <div className="admin-menu-results-info">
            Showing{" "}
            <strong>
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              {"–"}
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredItems.length
              )}
            </strong>{" "}
            of <strong>{filteredItems.length}</strong> menu items
          </div>

          <div className="admin-menu-table-wrap">
            <table className="admin-menu-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Restaurant</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((item) => {
                  const available = isAvailableItem(item);

                  return (
                    <tr key={item.menuId}>
                      <td>
                        <div className="admin-menu-food-cell">
                          <div className="admin-menu-image-wrap">
                            {item.imagePath ? (
                              <img
                                src={item.imagePath}
                                alt={item.itemName}
                                loading="lazy"
                                decoding="async"
                                onError={handleImageError}
                              />
                            ) : null}

                            <div
                              className="admin-menu-food-placeholder"
                              style={{
                                display: item.imagePath
                                  ? "none"
                                  : "flex",
                              }}
                            >
                              🍽️
                            </div>
                          </div>

                          <div className="admin-menu-food-details">
                            <strong>{item.itemName}</strong>
                            <small>
                              {item.description || "No description"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{restaurantName(item.restaurantId)}</td>

                      <td className="admin-menu-price">
                        ₹{Number(item.price || 0).toFixed(2)}
                      </td>

                      <td>
                        {Number(item.rating) > 0
                          ? `★ ${Number(item.rating).toFixed(1)}`
                          : "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            available
                              ? "admin-menu-status available"
                              : "admin-menu-status unavailable"
                          }
                          onClick={() => handleAvailability(item)}
                        >
                          {available
                            ? "Available"
                            : "Unavailable"}
                        </button>
                      </td>

                      <td>
                        <div className="admin-menu-actions">
                          <button
                            type="button"
                            className="admin-menu-edit-btn"
                            onClick={() => openEditForm(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-menu-delete-btn"
                            onClick={() => handleDelete(item.menuId)}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-menu-pagination">
              <button
                type="button"
                className="admin-menu-page-btn"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <span>
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>

              <button
                type="button"
                className="admin-menu-page-btn"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div
          className="admin-menu-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="admin-menu-modal">
            <div className="admin-menu-modal-header">
              <div>
                <p className="admin-menu-eyebrow">
                  {editingId !== null
                    ? "UPDATE FOOD DETAILS"
                    : "NEW FOOD ITEM"}
                </p>

                <h2>
                  {editingId !== null
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-menu-close-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-menu-form-grid">
                <label className="admin-menu-form-field full">
                  Restaurant

                  <select
                    name="restaurantId"
                    value={form.restaurantId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Restaurant</option>

                    {restaurants.map((restaurant) => (
                      <option
                        key={restaurant.restaurantId}
                        value={restaurant.restaurantId}
                      >
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-menu-form-field full">
                  Food Item Name

                  <input
                    type="text"
                    name="itemName"
                    value={form.itemName}
                    onChange={handleChange}
                    placeholder="Example: Chicken Biryani"
                    required
                  />
                </label>

                <label className="admin-menu-form-field full">
                  Description

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter food item description"
                    rows="3"
                  />
                </label>

                <label className="admin-menu-form-field">
                  Price (₹)

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label className="admin-menu-form-field">
                  Rating (0–5)

                  <input
                    type="number"
                    name="rating"
                    value={form.rating}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </label>

                <label className="admin-menu-form-field full">
                  Image Path / URL

                  <input
                    type="text"
                    name="imagePath"
                    value={form.imagePath}
                    onChange={handleChange}
                    placeholder="Enter food image URL or path"
                  />
                </label>

                <label className="admin-menu-availability-field full">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                  />

                  <span>Food item is available</span>
                </label>
              </div>

              {error && (
                <div className="admin-menu-error">{error}</div>
              )}

              <div className="admin-menu-form-actions">
                <button
                  type="button"
                  className="admin-menu-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-menu-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Menu Item"
                      : "Add Menu Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="admin-menu-toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default AdminMenu;
