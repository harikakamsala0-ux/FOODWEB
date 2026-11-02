
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_API = "http://localhost:8080/FOODWEB/api/session";
const LOGOUT_API = "http://localhost:8080/FOODWEB/api/logout";

function AdminNavbar() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadAdminSession = useCallback(async () => {
    try {
      const response = await fetch(SESSION_API, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        setAdmin(null);
        return;
      }

      const data = await response.json();

      if (
        data.success &&
        data.loggedIn &&
        data.user &&
        String(data.user.role).toUpperCase() === "ADMIN"
      ) {
        setAdmin(data.user);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error("Unable to load admin session:", error);
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    loadAdminSession();

    const handleAuthUpdate = () => loadAdminSession();

    window.addEventListener("foodweb-auth-updated", handleAuthUpdate);

    return () => {
      window.removeEventListener(
        "foodweb-auth-updated",
        handleAuthUpdate
      );
    };
  }, [loadAdminSession]);

  const goToDashboard = () => {
    setProfileOpen(false);
    navigate("/admin/dashboard");
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(LOGOUT_API, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Unable to log out. Please try again.");
        return;
      }

      setAdmin(null);
      setProfileOpen(false);

      window.dispatchEvent(new Event("foodweb-auth-updated"));

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Admin logout error:", error);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  const avatarLetter =
    (admin?.userName || "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <nav className="admin-navbar">

      {/* LEFT: FOODWEB BRAND */}
      <button
        type="button"
        className="admin-navbar-brand"
        onClick={goToDashboard}
        aria-label="Go to Admin Dashboard"
      >
       <span className="admin-brand-icon">🍴</span>

        <span className="admin-navbar-brand-text">
          <span className="food">FOOD</span><span className="web">WEB</span>
        </span>

        
      </button>

      {/* RIGHT: DASHBOARD + PROFILE */}
      <div className="admin-navbar-right">

        <button
          type="button"
          className="admin-navbar-dashboard"
          onClick={goToDashboard}
        >
          <span className="admin-navbar-dashboard-icon">▦</span>
          Dashboard
        </button>

        {/* PROFILE ICON */}
        <div className="admin-navbar-profile-container">

          <button
            type="button"
            className="admin-navbar-profile-button"
            onClick={() => setProfileOpen((previous) => !previous)}
            aria-label="Open admin profile"
            aria-expanded={profileOpen}
            title="Admin Profile"
          >
            <span className="admin-navbar-avatar">
              {avatarLetter}
            </span>
          </button>

          {profileOpen && (
            <div className="admin-navbar-dropdown">

              <div className="admin-navbar-dropdown-heading">
                ADMIN ACCOUNT
              </div>

              <div className="admin-navbar-profile-info">
                <div className="admin-navbar-avatar admin-navbar-avatar-large">
                  {avatarLetter}
                </div>

                <div className="admin-navbar-profile-details">
                  <strong>{admin?.userName || "Admin"}</strong>
                  <span>{admin?.email || "Email unavailable"}</span>
                  <small>{admin?.role || "ADMIN"}</small>
                </div>
              </div>

              <div className="admin-navbar-dropdown-divider" />

              <button
                type="button"
                className="admin-navbar-logout"
                onClick={handleLogout}
              >
                <span>↪</span>
                Logout
              </button>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default AdminNavbar;
