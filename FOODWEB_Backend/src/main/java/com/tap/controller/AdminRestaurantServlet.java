
package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.Collections;

import com.google.gson.Gson;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.model.Restaurant;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/admin/restaurants")
public class AdminRestaurantServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private RestaurantDaoImpl restaurantDao;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        restaurantDao = new RestaurantDaoImpl();
        gson = new Gson();
    }

    // CORS handling
    @Override
    protected void service(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setHeader(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
        );

        response.setHeader(
                "Access-Control-Allow-Credentials",
                "true"
        );

        response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        response.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With"
        );

        response.setHeader("Vary", "Origin");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }

        super.service(request, response);
    }

    // Get the logged-in admin's actual userId from the session.
    private int getAdminUserId(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return -1;
        }

        String role = String.valueOf(session.getAttribute("role"));

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return -1;
        }

        Object userId = session.getAttribute("userId");

        if (userId instanceof Number) {
            return ((Number) userId).intValue();
        }

        if (userId != null) {
            try {
                return Integer.parseInt(userId.toString());
            } catch (NumberFormatException e) {
                return -1;
            }
        }

        return -1;
    }

    // GET - View all restaurants for admin
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (getAdminUserId(request) <= 0) {
                sendError(response, 401, "Admin login required");
                return;
            }

            response.getWriter().write(
                    gson.toJson(restaurantDao.getAllRestaurants())
            );

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to fetch restaurants");
        }
    }

    // POST - Add restaurant
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            int adminUserId = getAdminUserId(request);

            if (adminUserId <= 0) {
                sendError(response, 401, "Admin login required");
                return;
            }

            Restaurant restaurant = readRestaurant(request);

            if (restaurant == null) {
                sendError(response, 400, "Invalid restaurant data");
                return;
            }

            // Never trust adminUserId sent by React.
            // Use the authenticated admin's session ID.
            restaurant.setAdminUserId(adminUserId);

            restaurantDao.addRestaurant(restaurant);

            response.setStatus(HttpServletResponse.SC_CREATED);

            response.getWriter().write(
                    "{\"message\":\"Restaurant added successfully\"}"
            );

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to add restaurant");
        }
    }

    // PUT - Update restaurant
    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (getAdminUserId(request) <= 0) {
                sendError(response, 401, "Admin login required");
                return;
            }

            Restaurant restaurant = readRestaurant(request);

            if (restaurant == null || restaurant.getRestaurantId() <= 0) {
                sendError(response, 400, "Valid restaurantId is required");
                return;
            }

            // The DAO update query does not modify adminUserId.
            restaurantDao.updateRestaurant(restaurant);

            response.getWriter().write(
                    "{\"message\":\"Restaurant updated successfully\"}"
            );

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to update restaurant");
        }
    }

    // DELETE - Soft delete (deactivate) restaurant
    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (getAdminUserId(request) <= 0) {
                sendError(response, 401, "Admin login required");
                return;
            }

            String idValue = request.getParameter("restaurantId");

            if (idValue == null || idValue.trim().isEmpty()) {
                sendError(response, 400, "restaurantId is required");
                return;
            }

            int restaurantId = Integer.parseInt(idValue);

            if (restaurantId <= 0) {
                sendError(response, 400, "Invalid restaurantId");
                return;
            }

            restaurantDao.deleteRestaurant(restaurantId);

            response.getWriter().write(
                    "{\"message\":\"Restaurant deactivated successfully\"}"
            );

        } catch (NumberFormatException e) {
            sendError(response, 400, "Invalid restaurantId");

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to deactivate restaurant");
        }
    }

    // Read JSON request body
    private Restaurant readRestaurant(
            HttpServletRequest request) throws IOException {

        StringBuilder json = new StringBuilder();
        String line;

        try (BufferedReader reader = request.getReader()) {

            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
        }

        if (json.length() == 0) {
            return null;
        }

        return gson.fromJson(json.toString(), Restaurant.class);
    }

    // Common JSON error response
    private void sendError(
            HttpServletResponse response,
            int status,
            String message) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
                gson.toJson(Collections.singletonMap("error", message))
        );
    }
}
