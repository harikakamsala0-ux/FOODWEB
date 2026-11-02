
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/signup";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: new URLSearchParams({
          userName: formData.userName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          password: formData.password,
          role: "customer",
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        setError(data.message || "Unable to create your account.");
        return;
      }

      // Refresh navbar session and wishlist count after signup.
      window.dispatchEvent(new Event("foodweb-auth-updated"));

      // SignupServlet creates an authenticated session.
      // Return to the original destination, preserving Checkout data.
      const from = location.state?.from || "/";
      const checkoutData = location.state?.checkoutData;

      navigate(from, {
        replace: true,
        state: from === "/checkout" ? checkoutData : undefined,
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        "Unable to connect to the server. Please check whether Tomcat is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-signup-page">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <section className="auth-card auth-signup-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">F</span>
          <span>
            FOOD<span className="auth-brand-accent">WEB</span>
          </span>
        </Link>

        <div className="auth-heading">
          <p className="auth-eyebrow">JOIN THE TABLE</p>
          <h1>
            Your next
            <br />
            <span>favorite starts here.</span>
          </h1>
          <p className="auth-description">
            Create your account and discover something delicious.
          </p>
        </div>

        {error && (
          <div className="auth-message auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              className="auth-plain-input"
              id="signup-name"
              type="text"
              name="userName"
              placeholder="Enter your full name"
              value={formData.userName}
              onChange={handleChange}
              autoComplete="name"
              maxLength={100}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              className="auth-plain-input"
              id="signup-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form-row">
            <div className="auth-field">
              <label htmlFor="signup-phone">Phone number</label>
              <input
                className="auth-plain-input"
                id="signup-phone"
                type="tel"
                name="phone"
                placeholder="Your phone number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                maxLength={20}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-role">I am a</label>
              <select
                className="auth-plain-input auth-select"
                id="signup-role"
                name="role"
                value="customer"
                disabled
              >
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-address">Address</label>
            <textarea
              className="auth-plain-input auth-textarea"
              id="signup-address"
              name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              autoComplete="street-address"
              maxLength={500}
              rows={3}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                ◈
              </span>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="auth-show-password"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <input
              className="auth-plain-input"
              id="signup-confirm-password"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Enter your password again"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <p className="auth-role-note">
            Customer accounts let you explore restaurants and order your favorite food.
          </p>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <Link to="/login" state={location.state}>
            Sign in
          </Link>
        </p>

        <Link to="/" className="auth-back-link">
          ← Back to exploring
        </Link>

        <p className="auth-footer">
          Good food brings everyone together.
        </p>
      </section>
    </main>
  );
}
