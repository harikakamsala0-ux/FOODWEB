
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const DASHBOARD_API =
  "http://localhost:8080/FOODWEB/api/admin/dashboard";

const adminModules = [
  {
    icon: "🏪",
    name: "Restaurants",
    description: "Manage restaurants",
    path: "/admin/restaurants",
  },
  {
    icon: "🍽️",
    name: "Menu Management",
    description: "Manage food items",
    path: "/admin/menu",
  },
  {
    icon: "📦",
    name: "Orders",
    description: "Manage customer orders",
    path: "/admin/orders",
  },
  {
    icon: "🎟️",
    name: "Offers & Coupons",
    description: "Manage discounts",
    path: "/admin/offers",
  },
  {
    icon: "👥",
    name: "Customers",
    description: "View customer accounts",
    path: "/admin/customers",
  },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setDashboardError("");

        const response = await fetch(DASHBOARD_API, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              (response.status === 401
                ? "Please log in with your admin account."
                : "Failed to load dashboard data.")
          );
        }

        if (data.success === false) {
          throw new Error(data.message || "Unable to load dashboard.");
        }

        if (isMounted) {
          setDashboardData(data);
        }
      } catch (error) {
        if (isMounted) {
          setDashboardError(
            error.message || "Unable to connect to the server."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statistics = [
    {
      icon: "🏪",
      label: "Restaurants",
      value: dashboardData?.totalRestaurants,
    },
    {
      icon: "👥",
      label: "Customers",
      value: dashboardData?.totalCustomers,
    },
    {
      icon: "📦",
      label: "Total Orders",
      value: dashboardData?.totalOrders,
    },
    {
      icon: "₹",
      label: "Total Revenue",
      value:
        dashboardData?.totalRevenue != null
          ? `₹${Number(
              dashboardData.totalRevenue
            ).toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}`
          : undefined,
    },
  ];

  const recentOrders = Array.isArray(dashboardData?.recentOrders)
    ? dashboardData.recentOrders
    : [];

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAmount(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          
          <div>
            <p class="admin-navbar-badge">ADMIN PANEL</p>
          </div>
        </div>

        <div className="admin-nav-label">MAIN MENU</div>

        <button
          type="button"
          className="admin-nav-item active"
          onClick={() => navigate("/admin/dashboard")}
        >
          <span>▦</span> Dashboard
        </button>

        {/* Sidebar Navigation */}
        {adminModules.map((module) => (
          <button
            type="button"
            className="admin-nav-item"
            key={module.name}
            onClick={() => navigate(module.path)}
          >
            <span>{module.icon}</span>
            {module.name}
          </button>
        ))}

        <div className="admin-sidebar-bottom">
          <div className="admin-role">
            <div className="admin-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <p>Admin Dashboard</p>
            </div>
          </div>

          <button
            className="admin-back-button"
            onClick={() => navigate("/")}
          >
            ← Back to Customer Site
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">FOODWEB / ADMIN</p>
            <h1>Dashboard Overview</h1>
          </div>

          <button
            className="admin-view-site"
            onClick={() => navigate("/")}
          >
            ↗ View Website
          </button>
        </header>

        <section className="admin-welcome">
          <div>
            <span className="admin-eyebrow">ADMINISTRATION</span>
            <h2>Welcome to FOODWEB 👋</h2>
            <p>
              Manage restaurants, food menus, customer orders, and offers
              from one place.
            </p>
          </div>

          <div className="admin-welcome-icon">🍜</div>
        </section>

        {dashboardError && (
          <div className="admin-empty-state" role="alert">
            <div>⚠️</div>
            <h3>Unable to load dashboard data</h3>
            <p>{dashboardError}</p>
            <button
              className="admin-view-site"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        <section className="admin-stats">
          {statistics.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <div className="admin-stat-top">
                <span>{stat.label}</span>
                <span className="admin-stat-icon">{stat.icon}</span>
              </div>

              <h2>
                {loading
                  ? "..."
                  : stat.value !== undefined && stat.value !== null
                    ? stat.value
                    : "—"}
              </h2>

              <p>
                {loading
                  ? "Loading database data..."
                  : dashboardError
                    ? "Data unavailable"
                    : "Live database statistics"}
              </p>
            </article>
          ))}
        </section>

        {/* Management Center */}
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Management Center</h2>
              <p>Your main administration modules</p>
            </div>
          </div>

          <div className="admin-module-grid">
            {adminModules.map((module, index) => (
              <button
                type="button"
                className="admin-module-card"
                key={module.name}
                onClick={() => navigate(module.path)}
              >
                <div className="admin-module-icon">
                  {module.icon}
                </div>

                <span className="admin-module-number">
                  MODULE 0{index + 2}
                </span>

                <h3>{module.name}</h3>

                <p>{module.description}</p>

                <span className="admin-coming-soon">
                  Open Module →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Orders - Existing functionality preserved */}
        <section className="admin-section admin-recent-orders">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">ORDER ACTIVITY</span>
              <h2>Recent Orders</h2>
              <p>Track the latest orders placed on FOODWEB</p>
            </div>

            <span className="admin-orders-count">
              {recentOrders.length} recent
            </span>
          </div>

          <div className="admin-orders-card">
            {loading ? (
              <div className="admin-orders-message">
                <span>⏳</span>
                <h3>Loading orders...</h3>
                <p>Please wait while we fetch the latest orders.</p>
              </div>
            ) : dashboardError ? (
              <div className="admin-orders-message">
                <span>⚠️</span>
                <h3>Unable to load orders</h3>
                <p>Check the dashboard API connection.</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="admin-orders-message">
                <span>📦</span>
                <h3>No orders yet</h3>
                <p>New customer orders will appear here.</p>
              </div>
            ) : (
              <div className="admin-orders-table-wrapper">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>ORDER</th>
                      <th>CUSTOMER</th>
                      <th>RESTAURANT</th>
                      <th>DATE & TIME</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.orderId}>
                        <td>
                          <span className="admin-order-id">
                            #{order.orderId}
                          </span>
                        </td>

                        <td>
                          <span className="admin-order-customer">
                            Customer #{order.userId}
                          </span>
                        </td>

                        <td>
                          <span className="admin-order-restaurant">
                            Restaurant #{order.restaurantId}
                          </span>
                        </td>

                        <td>
                          <span className="admin-order-date">
                            {formatDate(order.orderDate)}
                          </span>
                        </td>

                        <td>
                          <span className="admin-order-amount">
                            {formatAmount(order.totalAmount)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-order-status status-${String(
                              order.status || "unknown"
                            )
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "")}`}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <footer className="admin-footer">
          FOODWEB Admin Panel · Restaurant Management System
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
