
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

@WebServlet("/api/login")
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private UserDao userDao;

    @Override
    public void init() throws ServletException {
        userDao = new UserDaoImpl();
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
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
                    "Access-Control-Allow-Headers",
                    "Content-Type"
            );

            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS"
            );
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            String email = request.getParameter("email");
            String password = request.getParameter("password");

            if (email == null || email.trim().isEmpty()
                    || password == null || password.isEmpty()) {

                response.setStatus(
                        HttpServletResponse.SC_BAD_REQUEST
                );

                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Email and password are required.\"}"
                );

                return;
            }

            // Fetch user using email
            User user = userDao.getUserByEmail(email.trim());

            if (user == null || user.getPassword() == null) {

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Invalid email or password.\"}"
                );

                return;
            }

            // Verify password using BCrypt
            boolean passwordValid = PasswordUtil.checkPassword(
                    password,
                    user.getPassword()
            );

            if (!passwordValid) {

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Invalid email or password.\"}"
                );

                return;
            }

            // Preserve existing cart and wishlist
            HttpSession oldSession = request.getSession(false);

            Cart cart = null;
            Object foodWishlist = null;
            Object restaurantWishlist = null;

            if (oldSession != null) {

                Object existingCart = oldSession.getAttribute("cart");

                if (existingCart instanceof Cart) {
                    cart = (Cart) existingCart;
                }

                foodWishlist =
                        oldSession.getAttribute("foodWishlist");

                restaurantWishlist =
                        oldSession.getAttribute("restaurantWishlist");

                oldSession.invalidate();
            }

            // Create a new session after successful login
            HttpSession session = request.getSession(true);

            session.setAttribute("userId", user.getUserId());
            session.setAttribute("userName", user.getUserName());
            session.setAttribute("email", user.getEmail());
            session.setAttribute("role", user.getRole());

            // Restore cart
            if (cart != null) {
                session.setAttribute("cart", cart);
            }

            // Restore food wishlist
            if (foodWishlist != null) {
                session.setAttribute("foodWishlist", foodWishlist);
            }

            // Restore restaurant wishlist
            if (restaurantWishlist != null) {
                session.setAttribute(
                        "restaurantWishlist",
                        restaurantWishlist
                );
            }

            // Login successful
            response.setStatus(HttpServletResponse.SC_OK);

            response.getWriter().write(
                    "{\"success\":true,\"message\":\"Login successful.\",\"role\":\""
                    + user.getRole()
                    + "\"}"
            );

        } catch (Exception e) {

            e.printStackTrace();

            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Server error during login.\"}"
            );
        }
    }
}
