import { useCallback, useEffect, useMemo, useState } from "react";
import "../App.css";

const OFFERS_API = "http://localhost:8080/FOODWEB/api/offers";
const ITEMS_PER_PAGE = 10;

const IMAGE_OPTIONS = [
  {
    name: "Pizza",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Biryani",
    url: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Pasta",
    url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Dessert",
    url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Noodles",
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=85",
  },
];

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscount: "",
  imagePath: IMAGE_OPTIONS[0].url,
};

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // LOAD OFFERS
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${OFFERS_API}?admin=true`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load offers.");
      }

      if (!Array.isArray(data)) {
        throw new Error(data.message || "Invalid offers response.");
      }

      setOffers(data);
    } catch (err) {
      console.error("Fetch offers error:", err);
      setError(err.message || "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // TOAST
  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  };

  // FORM HANDLING
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setError("");
    setShowForm(true);
  };

  const openEditForm = (offer) => {
    setEditingId(offer.offerId);

    setFormData({
      code: offer.code || "",
      title: offer.title || "",
      description: offer.description || "",
      discountType: offer.discountType || "PERCENT",
      discountValue: String(offer.discountValue ?? ""),
      minOrderAmount: String(offer.minOrderAmount ?? 0),
      maxDiscount: String(offer.maxDiscount ?? ""),
      imagePath: offer.imagePath || IMAGE_OPTIONS[0].url,
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setError("");
  };

  // VALIDATE FORM
  const validateForm = () => {
    if (!formData.code.trim()) {
      return "Please enter a coupon code.";
    }

    if (!formData.title.trim()) {
      return "Please enter an offer title.";
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      return "Enter a valid discount value.";
    }

    if (
      formData.discountType === "PERCENT" &&
      Number(formData.discountValue) > 100
    ) {
      return "Percentage discount cannot exceed 100%.";
    }

    if (
      formData.minOrderAmount === "" ||
      Number(formData.minOrderAmount) < 0
    ) {
      return "Enter a valid minimum order amount.";
    }

    if (
      formData.discountType === "FLAT" &&
      Number(formData.minOrderAmount) > 0 &&
      Number(formData.discountValue) > Number(formData.minOrderAmount)
    ) {
      return "Flat discount cannot exceed the minimum order amount.";
    }

    if (
      formData.discountType === "PERCENT" &&
      (!formData.maxDiscount || Number(formData.maxDiscount) <= 0)
    ) {
      return "Enter a valid maximum discount.";
    }

    if (!formData.imagePath.trim()) {
      return "Please select an offer image.";
    }

    return "";
  };

  // ADD / UPDATE OFFER
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount),
      maxDiscount:
        formData.discountType === "PERCENT"
          ? Number(formData.maxDiscount)
          : 0,
      imagePath: formData.imagePath,
    };

    if (editingId !== null) {
      payload.offerId = editingId;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(OFFERS_API, {
        method: editingId !== null ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save offer.");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
      setCurrentPage(1);

      await fetchOffers();

      showToast(
        editingId !== null
          ? "Offer updated successfully!"
          : "Offer created successfully!"
      );
    } catch (err) {
      console.error("Save offer error:", err);
      setError(err.message || "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE OFFER
  const handleDelete = async (offerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this offer?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${OFFERS_API}?offerId=${offerId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete offer.");
      }

      await fetchOffers();
      showToast("Offer deleted successfully!");
    } catch (err) {
      console.error("Delete offer error:", err);
      showToast(err.message || "Unable to delete offer.");
    }
  };

  // ACTIVATE / DEACTIVATE OFFER
  const handleToggleStatus = async (offer) => {
    try {
      const updatedOffer = {
        ...offer,
        active: !offer.active,
      };

      const response = await fetch(OFFERS_API, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updatedOffer),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update offer status.");
      }

      await fetchOffers();

      showToast(
        updatedOffer.active
          ? "Offer activated successfully!"
          : "Offer deactivated successfully!"
      );
    } catch (err) {
      console.error("Toggle offer error:", err);
      showToast(err.message || "Unable to update offer.");
    }
  };

  // SEARCH AND FILTER
  const filteredOffers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesSearch =
        !search ||
        String(offer.code || "").toLowerCase().includes(search) ||
        String(offer.title || "").toLowerCase().includes(search) ||
        String(offer.description || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && offer.active === true) ||
        (statusFilter === "INACTIVE" && offer.active !== true);

      return matchesSearch && matchesStatus;
    });
  }, [offers, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOffers.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedOffers = filteredOffers.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // STATISTICS
  const totalActive = offers.filter(
    (offer) => offer.active === true
  ).length;

  const totalInactive = offers.length - totalActive;

  // RENDER
  return (
    <div className="admin-offers-page">
      {/* HEADER */}
      <div className="admin-offers-header">
        <div>
          <span className="admin-offers-eyebrow">
            ADMIN MANAGEMENT
          </span>

          <h1>Offers & Coupons</h1>

          <p>
            Create, manage and control FOODWEB promotional offers.
          </p>
        </div>

        <button
          type="button"
          className="admin-offers-add-button"
          onClick={openAddForm}
        >
          <span>＋</span>
          Add New Offer
        </button>
      </div>

      {/* STATISTICS */}
      <div className="admin-offers-stats">
        <div className="admin-offers-stat-card">
          <div className="admin-offers-stat-icon">%</div>
          <div>
            <span>Total Offers</span>
            <strong>{offers.length}</strong>
          </div>
        </div>

        <div className="admin-offers-stat-card">
          <div className="admin-offers-stat-icon active">✓</div>
          <div>
            <span>Active Offers</span>
            <strong>{totalActive}</strong>
          </div>
        </div>

        <div className="admin-offers-stat-card">
          <div className="admin-offers-stat-icon inactive">Ⅱ</div>
          <div>
            <span>Inactive Offers</span>
            <strong>{totalInactive}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-offers-toolbar">
        <div className="admin-offers-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search coupon code or offer title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="admin-offers-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Offers</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          type="button"
          className="admin-offers-refresh"
          onClick={fetchOffers}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && !showForm && (
        <div className="admin-offers-error">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* TABLE */}
      <div className="admin-offers-table-container">
        {loading ? (
          <div className="admin-offers-loading">
            <div className="admin-offers-spinner" />
            <p>Loading offers...</p>
          </div>
        ) : paginatedOffers.length === 0 ? (
          <div className="admin-offers-empty">
            <div>％</div>
            <h3>No offers found</h3>
            <p>
              Add a new offer or change your search and filters.
            </p>
          </div>
        ) : (
          <div className="admin-offers-table-scroll">
            <table className="admin-offers-table">
              <thead>
                <tr>
                  <th>IMAGE</th>
                  <th>OFFER</th>
                  <th>COUPON CODE</th>
                  <th>DISCOUNT</th>
                  <th>MIN. ORDER</th>
                  <th>MAX. DISCOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOffers.map((offer) => (
                  <tr key={offer.offerId}>
                    <td>
                      <img
                        className="admin-offers-table-image"
                        src={offer.imagePath || IMAGE_OPTIONS[0].url}
                        alt={offer.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = IMAGE_OPTIONS[0].url;
                        }}
                      />
                    </td>

                    <td>
                      <div className="admin-offers-name">
                        <strong>{offer.title}</strong>
                        <span>{offer.description || "No description"}</span>
                      </div>
                    </td>

                    <td>
                      <span className="admin-offers-code">
                        {offer.code}
                      </span>
                    </td>

                    <td>
                      <strong className="admin-offers-discount">
                        {offer.discountType === "PERCENT"
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`}
                      </strong>
                    </td>

                    <td>
                      ₹{Number(offer.minOrderAmount || 0).toFixed(0)}
                    </td>

                    <td>
                      {offer.discountType === "PERCENT"
                        ? `₹${Number(offer.maxDiscount || 0).toFixed(0)}`
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`admin-offers-status ${
                          offer.active ? "active" : "inactive"
                        }`}
                      >
                        {offer.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-offers-actions">
                        <button
                          type="button"
                          className="admin-offers-action edit"
                          title="Edit offer"
                          onClick={() => openEditForm(offer)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="admin-offers-action toggle"
                          title={
                            offer.active
                              ? "Deactivate offer"
                              : "Activate offer"
                          }
                          onClick={() => handleToggleStatus(offer)}
                        >
                          {offer.active ? "Ⅱ" : "▶"}
                        </button>

                        <button
                          type="button"
                          className="admin-offers-action delete"
                          title="Delete offer"
                          onClick={() => handleDelete(offer.offerId)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filteredOffers.length > 0 && (
          <div className="admin-offers-pagination">
            <span>
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}
              {" - "}
              {Math.min(
                safePage * ITEMS_PER_PAGE,
                filteredOffers.length
              )}
              {" of "}
              {filteredOffers.length} offers
            </span>

            <div className="admin-offers-pagination-controls">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                Previous
              </button>

              <span>
                Page {safePage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div
          className="admin-offers-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="admin-offers-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-offers-modal-header">
              <div>
                <span>FOODWEB ADMIN</span>
                <h2>
                  {editingId !== null ? "Edit Offer" : "Create New Offer"}
                </h2>
                <p>Enter the coupon and discount details below.</p>
              </div>

              <button
                type="button"
                className="admin-offers-modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-offers-form-grid">
                <div className="admin-offers-form-group">
                  <label>Coupon Code *</label>
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. FOOD20"
                    maxLength={30}
                    required
                  />
                </div>

                <div className="admin-offers-form-group">
                  <label>Offer Title *</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Welcome Offer"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="admin-offers-form-group full">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this offer..."
                    rows="3"
                  />
                </div>

                {/* NEW: IMAGE SELECTION */}
                <div className="admin-offers-form-group full">
                  <label>Choose Offer Image *</label>

                  <select
                    name="imagePath"
                    value={formData.imagePath}
                    onChange={handleInputChange}
                    required
                  >
                    {IMAGE_OPTIONS.map((image) => (
                      <option key={image.name} value={image.url}>
                        {image.name}
                      </option>
                    ))}
                  </select>

                  <div className="admin-offers-image-preview">
                    <img
                      src={formData.imagePath}
                      alt="Selected offer preview"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = IMAGE_OPTIONS[0].url;
                      }}
                    />

                    <div>
                      <strong>Image Preview</strong>
                      <span>
                        This image will appear on the Customer Offers page.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="admin-offers-form-group">
                  <label>Discount Type *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="admin-offers-form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder={
                      formData.discountType === "PERCENT"
                        ? "e.g. 20"
                        : "e.g. 100"
                    }
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="admin-offers-form-group">
                  <label>Minimum Order Amount (₹) *</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {formData.discountType === "PERCENT" && (
                  <div className="admin-offers-form-group">
                    <label>Maximum Discount (₹) *</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="admin-offers-form-error">
                  {error}
                </div>
              )}

              <div className="admin-offers-modal-actions">
                <button
                  type="button"
                  className="admin-offers-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-offers-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Offer"
                    : "Create Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="admin-offers-toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

export default AdminOffers;