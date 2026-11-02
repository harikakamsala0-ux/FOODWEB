
package com.tap.controller;

import java.io.IOException;

import com.tap.Dao.UserDao;
import com.tap.DaoImpl.UserDaoImpl;
import com.tap.model.Cart;
import com.tap.model.User;
import com.tap.util.PasswordUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/signup")
public class SignupServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private UserDao userDao;

    @Override
    public void init() throws ServletException {
        userDao = new UserDaoImpl();
    }

    private void setCorsHeaders(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)
                || "http://localhost:3000".equals(origin)) {

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");

            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "POST, OPTIONS"
            );

            response.setHeader(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Accept"
            );

            response.setHeader("Vary", "Origin");
        }
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String userName = request.getParameter("userName");
        String password = request.getParameter("password");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String address = request.getParameter("address");
        String role = request.getParameter("role");

        if (isBlank(userName)
                || isBlank(password)
                || isBlank(email)
                || isBlank(phone)
                || isBlank(address)
                || isBlank(role)) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response, false, "All fields are required.");
            return;
        }

        userName = userName.trim();
        email = email.trim();
        phone = phone.trim();
        address = address.trim();
        role = role.trim().toLowerCase();

        if (!email.matches(
                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            writeJson(
                    response,
                    false,
                    "Please enter a valid email address."
            );
            return;
        }

        if (password.length() < 8) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            writeJson(
                    response,
                    false,
                    "Password must contain at least 8 characters."
            );
            return;
        }

        if (!role.equals("customer") && !role.equals("vendor")) {

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);

            writeJson(
                    response,
                    false,
                    "Invalid role. Choose Customer or Vendor."
            );
            return;
        }

        try {

            User existingUser = userDao.getUserByEmail(email);

            if (existingUser != null) {

                response.setStatus(HttpServletResponse.SC_CONFLICT);

                writeJson(
                        response,
                        false,
                        "An account with this email already exists."
                );
                return;
            }

            // BCrypt: Hash password before storing in database
            String hashedPassword =
                    PasswordUtil.hashPassword(password);

            User user = new User(
                    userName,
                    hashedPassword,
                    email,
                    phone,
                    address,
                    role
            );

            userDao.addUser(user);

            // Verify that the account was inserted
            User savedUser = userDao.getUserByEmail(email);

            if (savedUser == null) {

                response.setStatus(
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR
                );

                writeJson(
                        response,
                        false,
                        "Signup failed. Please try again."
                );
                return;
            }

            // Preserve cart and wishlist before replacing session
            HttpSession oldSession = request.getSession(false);

            Cart pendingCart = null;
            Object savedFoodWishlist = null;
            Object savedRestaurantWishlist = null;

            if (oldSession != null) {

                Object existingCart = oldSession.getAttribute("cart");

                if (existingCart instanceof Cart) {
                    pendingCart = (Cart) existingCart;
                }

                savedFoodWishlist =
                        oldSession.getAttribute("foodWishlist");

                savedRestaurantWishlist =
                        oldSession.getAttribute("restaurantWishlist");

                oldSession.invalidate();
            }

            // Signup also logs the new user in
            HttpSession session = request.getSession(true);

            session.setAttribute("userId", savedUser.getUserId());
            session.setAttribute("userName", savedUser.getUserName());
            session.setAttribute("email", savedUser.getEmail());
            session.setAttribute("role", savedUser.getRole());

            // Restore existing cart
            if (pendingCart != null) {
                session.setAttribute("cart", pendingCart);
            }

            // Restore food wishlist
            if (savedFoodWishlist != null) {
                session.setAttribute(
                        "foodWishlist",
                        savedFoodWishlist
                );
            }

            // Restore restaurant wishlist
            if (savedRestaurantWishlist != null) {
                session.setAttribute(
                        "restaurantWishlist",
                        savedRestaurantWishlist
                );
            }

            response.setStatus(HttpServletResponse.SC_CREATED);

            writeJson(
                    response,
                    true,
                    "Signup successful."
            );

        } catch (Exception e) {

            log("Signup failed due to a server error.", e);

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            writeJson(
                    response,
                    false,
                    "Unable to process signup right now."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void writeJson(
            HttpServletResponse response,
            boolean success,
            String message) throws IOException {

        response.getWriter().write(
                "{\"success\":" + success
                + ",\"message\":\"" + escapeJson(message) + "\"}"
        );
    }

    private String escapeJson(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
