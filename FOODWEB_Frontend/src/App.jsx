import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";

import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Offers from "./pages/Offers";

import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminMenu from "./pages/AdminMenu";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminOffers from "./pages/AdminOffers";

function AppContent() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {isAdminPage ? <AdminNavbar /> : <Navbar />}

      <main
        className={
          isAdminPage
            ? "app-page-content admin-page-content"
            : "app-page-content"
        }
      >
        <Routes>
          {/* Customer Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/offers" element={<Offers />} />

          {/* Admin Pages */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
          <Route
            path="/admin/restaurants"
            element={<AdminRestaurants />}
          />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route
            path="/admin/customers"
            element={<AdminCustomers />}
          />
          <Route path="/admin/offers" element={<AdminOffers />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;