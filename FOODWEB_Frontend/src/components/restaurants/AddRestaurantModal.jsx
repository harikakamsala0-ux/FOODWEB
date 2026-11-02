import { useState } from "react";

function AddRestaurantModal({ isOpen, onClose, onAddRestaurant }) {
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    image: "",
    rating: "4.5",
    time: "20-30 min",
    price: "₹300 for two",
    discount: "",
    area: "Koramangala, Bengaluru",
    isVeg: false,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Restaurant name is required";
    if (!formData.cuisine.trim()) newErrors.cuisine = "Cuisine details are required";
    if (!formData.rating || isNaN(formData.rating) || Number(formData.rating) < 1 || Number(formData.rating) > 5) {
      newErrors.rating = "Rating must be between 1.0 and 5.0";
    }
    if (!formData.time.trim()) newErrors.time = "Delivery time is required";
    if (!formData.price.trim()) newErrors.price = "Price description is required";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newRestaurant = {
      id: Date.now(),
      name: formData.name.trim(),
      cuisine: formData.cuisine.trim(),
      category: formData.cuisine.split("•")[0]?.trim() || "Multi-Cuisine",
      rating: parseFloat(formData.rating),
      time: formData.time.trim(),
      price: formData.price.trim(),
      discount: formData.discount.trim() || undefined,
      image: formData.image.trim() || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=90",
      area: formData.area.trim() || "Bengaluru",
      isVeg: formData.isVeg,
    };

    onAddRestaurant(newRestaurant);
    onClose();
  };

  return (
    <div className="rest-modal-backdrop" onClick={onClose}>
      <div className="rest-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rest-modal-header">
          <h2>Add New Restaurant</h2>
          <button type="button" className="rest-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rest-modal-form">
          {/* Restaurant Name */}
          <div className="rest-form-group">
            <label className="rest-label">
              Restaurant Name <span className="rest-required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className={`rest-input ${errors.name ? "rest-input-error" : ""}`}
              placeholder="e.g. Royal Punjab Express"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="rest-error-text">{errors.name}</span>}
          </div>

          {/* Cuisine */}
          <div className="rest-form-group">
            <label className="rest-label">
              Cuisine <span className="rest-required">*</span>
            </label>
            <input
              type="text"
              name="cuisine"
              className={`rest-input ${errors.cuisine ? "rest-input-error" : ""}`}
              placeholder="e.g. North Indian • Tandoor • Biryani"
              value={formData.cuisine}
              onChange={handleChange}
            />
            {errors.cuisine && <span className="rest-error-text">{errors.cuisine}</span>}
          </div>

          {/* Grid Row for Rating and Time */}
          <div className="rest-form-row">
            <div className="rest-form-group">
              <label className="rest-label">
                Rating (1-5) <span className="rest-required">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                name="rating"
                className={`rest-input ${errors.rating ? "rest-input-error" : ""}`}
                value={formData.rating}
                onChange={handleChange}
              />
              {errors.rating && <span className="rest-error-text">{errors.rating}</span>}
            </div>

            <div className="rest-form-group">
              <label className="rest-label">
                Delivery Time <span className="rest-required">*</span>
              </label>
              <input
                type="text"
                name="time"
                className={`rest-input ${errors.time ? "rest-input-error" : ""}`}
                placeholder="e.g. 20-30 min"
                value={formData.time}
                onChange={handleChange}
              />
              {errors.time && <span className="rest-error-text">{errors.time}</span>}
            </div>
          </div>

          {/* Grid Row for Price and Offer */}
          <div className="rest-form-row">
            <div className="rest-form-group">
              <label className="rest-label">
                Price for Two <span className="rest-required">*</span>
              </label>
              <input
                type="text"
                name="price"
                className={`rest-input ${errors.price ? "rest-input-error" : ""}`}
                placeholder="e.g. ₹350 for two"
                value={formData.price}
                onChange={handleChange}
              />
              {errors.price && <span className="rest-error-text">{errors.price}</span>}
            </div>

            <div className="rest-form-group">
              <label className="rest-label">Discount Offer (Optional)</label>
              <input
                type="text"
                name="discount"
                className="rest-input"
                placeholder="e.g. 50% OFF up to ₹100"
                value={formData.discount}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Image URL and Location */}
          <div className="rest-form-row">
            <div className="rest-form-group">
              <label className="rest-label">Image URL (Optional)</label>
              <input
                type="url"
                name="image"
                className="rest-input"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={handleChange}
              />
            </div>

            <div className="rest-form-group">
              <label className="rest-label">Location / Area</label>
              <input
                type="text"
                name="area"
                className="rest-input"
                placeholder="e.g. Indiranagar, Bengaluru"
                value={formData.area}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Checkbox for Pure Veg */}
          <div className="rest-form-checkbox-group">
            <label className="rest-checkbox-label">
              <input
                type="checkbox"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleChange}
                className="rest-checkbox-input"
              />
              <span>Pure Veg Restaurant</span>
            </label>
          </div>

          {/* Form Action Buttons */}
          <div className="rest-modal-actions">
            <button type="button" className="rest-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rest-modal-submit">
              Add Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRestaurantModal;
