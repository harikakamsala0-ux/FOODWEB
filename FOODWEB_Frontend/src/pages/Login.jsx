import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8080/FOODWEB/api/login";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: email.trim(),
          password,
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok || data.success !== true) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      // Refresh navbar session and wishlist count after login.
      window.dispatchEvent(new Event("foodweb-auth-updated"));

      setSuccess("Login successful!");

      // Admin goes directly to the admin dashboard.
      const role = String(data.role || "").trim().toUpperCase();

      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      // Preserve the existing customer redirect behavior.
      const from = location.state?.from || "/";
      const checkoutData = location.state?.checkoutData;

      navigate(from, {
        replace: true,
        state: from === "/checkout" ? checkoutData : undefined,
      });
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">F</span>
          <span>
            FOOD<span className="auth-brand-accent">WEB</span>
          </span>
        </Link>

        <div className="auth-heading">
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>
            Login to <span>FOODWEB</span>
          </h1>
          <p className="auth-description">
            Login to continue your FOODWEB experience.
          </p>
        </div>

        {error && (
          <div className="auth-message auth-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div
            className="auth-message"
            role="status"
            style={{
              border: "1px solid rgba(245, 185, 66, 0.3)",
              background: "rgba(245, 185, 66, 0.08)",
              color: "#F5B942",
            }}
          >
            {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label htmlFor="email">Email Address</label>
            <input
              className="auth-plain-input"
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              className="auth-plain-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch-text" style={{ marginTop: "22px" }}>
          Don't have an account?{" "}
          <Link to="/signup" state={location.state}>
            Sign Up
          </Link>
        </p>

        <Link to="/" className="auth-back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;