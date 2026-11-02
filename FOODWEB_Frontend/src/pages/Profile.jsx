
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SESSION_API = "http://localhost:8080/FOODWEB/api/session";
const UPDATE_API = "http://localhost:8080/FOODWEB/api/profile/update";

const createForm = (user = {}) => ({
  userName: user.userName || "",
  email: user.email || "",
  phone: user.phone || "",
  address: user.address || "",
});

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(createForm());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch(SESSION_API, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const data = await response.json();

        if (!active) return;

        if (response.ok && data.success && data.loggedIn && data.user) {
          setUser(data.user);
          setForm(createForm(data.user));
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Unable to load profile:", err);
        if (active) setError("Unable to connect to the server.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleCancel() {
    setForm(createForm(user));
    setEditing(false);
    setMessage("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.userName.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(UPDATE_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          userName: form.userName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        }).toString(),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update profile.");
      }

      const updatedUser = {
        ...user,
        userName: form.userName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      setUser(updatedUser);
      setForm(createForm(updatedUser));
      setEditing(false);
      setMessage("Profile updated successfully!");
      window.dispatchEvent(new Event("foodweb-auth-updated"));
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-state">Loading your profile...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-state">
          <h2>Unable to load profile</h2>
          <p>{error || "Please log in to view your profile."}</p>
          <button
            className="profile-primary-btn"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const initial = (user.userName || "U").trim().charAt(0).toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-container">
        <div className="profile-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>My Profile</span>
        </div>

        <section className="profile-welcome">
          <div className="profile-avatar">{initial}</div>

          <div className="profile-welcome-text">
            <p className="profile-eyebrow">YOUR FOODWEB ACCOUNT</p>
            <h1>Hello, {user.userName}!</h1>
            <p>Manage your personal information and account details.</p>
            <span className="profile-role">
              {(user.role || "customer").toUpperCase()}
            </span>
          </div>
        </section>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <h3>My Account</h3>

            <button
              type="button"
              className="profile-nav-item active"
              onClick={() => {
                setEditing(false);
                setMessage("");
                setError("");
              }}
            >
              <span>👤</span> Profile Details
            </button>

            <button
              type="button"
              className="profile-nav-item"
              onClick={() => navigate("/cart")}
            >
              <span>🛒</span> My Cart
            </button>

            <button
              type="button"
              className="profile-nav-item"
              onClick={() => navigate("/orders")}
            >
              <span>📦</span> My Orders
            </button>

            <div className="profile-sidebar-note">
              <span>🍔</span>
              <p>Your next favourite meal is just a click away.</p>
              <Link to="/restaurants">Explore Restaurants →</Link>
            </div>
          </aside>

          <section className="profile-content">
            <div className="profile-section-heading">
              <div>
                <p className="profile-eyebrow">ACCOUNT SETTINGS</p>
                <h2>Personal Information</h2>
                <p>Keep your contact details up to date.</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="profile-primary-btn"
                  onClick={() => {
                    setForm(createForm(user));
                    setEditing(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  ✎ Edit Profile
                </button>
              )}
            </div>

            {message && (
              <div className="profile-state" role="status">
                ✅ {message}
              </div>
            )}

            {error && (
              <div className="profile-state" role="alert">
                ⚠️ {error}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave}>
                <div className="profile-details-grid">
                  <label className="profile-detail-card">
                    <span className="profile-detail-icon">👤</span>
                    <span>Full Name *</span>
                    <input
                      name="userName"
                      value={form.userName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>

                  <label className="profile-detail-card">
                    <span className="profile-detail-icon">✉️</span>
                    <span>Email Address *</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      maxLength={150}
                      autoComplete="email"
                    />
                  </label>

                  <label className="profile-detail-card">
                    <span className="profile-detail-icon">📱</span>
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={20}
                      autoComplete="tel"
                    />
                  </label>

                  <label className="profile-detail-card">
                    <span className="profile-detail-icon">📍</span>
                    <span>Address</span>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      autoComplete="street-address"
                    />
                  </label>
                </div>

                <div className="profile-bottom-card">
                  <div>
                    <h3>Save your changes</h3>
                    <p>Your updated details will be stored in your account.</p>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="button"
                      className="profile-cancel-btn"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="profile-primary-btn"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-details-grid">
                  <div className="profile-detail-card">
                    <span className="profile-detail-icon">👤</span>
                    <span>Full Name</span>
                    <strong>{user.userName || "Not provided"}</strong>
                  </div>

                  <div className="profile-detail-card">
                    <span className="profile-detail-icon">✉️</span>
                    <span>Email Address</span>
                    <strong>{user.email || "Not provided"}</strong>
                  </div>

                  <div className="profile-detail-card">
                    <span className="profile-detail-icon">📱</span>
                    <span>Phone Number</span>
                    <strong>{user.phone || "Not provided"}</strong>
                  </div>

                  <div className="profile-detail-card">
                    <span className="profile-detail-icon">📍</span>
                    <span>Address</span>
                    <strong>{user.address || "Not provided"}</strong>
                  </div>
                </div>

                <div className="profile-bottom-card">
                  <div>
                    <h3>Hungry for something delicious?</h3>
                    <p>Explore restaurants and find your next favourite meal.</p>
                  </div>

                  <button
                    type="button"
                    className="profile-primary-btn"
                    onClick={() => navigate("/restaurants")}
                  >
                    Explore Food →
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
