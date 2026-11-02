
package com.tap.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;
import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.model.Menu;
import com.tap.model.Restaurant;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/wishlist")
public class WishlistServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final Gson gson = new Gson();
    private final MenuDaoImpl menuDao = new MenuDaoImpl();
    private final RestaurantDaoImpl restaurantDao =
            new RestaurantDaoImpl();

    // CORS configuration
    private boolean configureCors(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)
                || "http://localhost:3000".equals(origin)) {

            response.setHeader(
                    "Access-Control-Allow-Origin", origin);
            response.setHeader(
                    "Access-Control-Allow-Credentials", "true");
            response.setHeader(
                    "Access-Control-Allow-Headers", "Content-Type");
            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS");
            response.setHeader("Vary", "Origin");

            return true;
        }

        return origin == null;
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) {

        configureCors(request, response);
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    // GET: Return wishlist items and combined count
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        if (!configureCors(request, response)) {
            sendError(response, 403, "Origin not allowed");
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        Map<Integer, Menu> foodWishlist = new HashMap<>();
        Map<Integer, Restaurant> restaurantWishlist =
                new HashMap<>();

        if (session != null) {
            Map<Integer, Menu> savedFoods =
                    castFoodMap(session.getAttribute("foodWishlist"));

            Map<Integer, Restaurant> savedRestaurants =
                    castRestaurantMap(
                            session.getAttribute("restaurantWishlist"));

            if (savedFoods != null) {
                foodWishlist = savedFoods;
            }

            if (savedRestaurants != null) {
                restaurantWishlist = savedRestaurants;
            }
        }

        Map<String, Object> result = new HashMap<>();

        result.put(
                "foods",
                new ArrayList<>(foodWishlist.values()));

        result.put(
                "restaurants",
                new ArrayList<>(restaurantWishlist.values()));

        result.put(
                "count",
                foodWishlist.size() + restaurantWishlist.size());

        response.getWriter().write(gson.toJson(result));
    }

    // POST: Add or remove a food item or restaurant
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        if (!configureCors(request, response)) {
            sendError(response, 403, "Origin not allowed");
            return;
        }

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        String type = request.getParameter("type");

        if (action == null || type == null) {
            sendError(
                    response, 400,
                    "Action and type are required");
            return;
        }

        action = action.trim().toLowerCase();
        type = type.trim().toLowerCase();

        if (!action.equals("add") && !action.equals("remove")) {
            sendError(response, 400, "Invalid wishlist action");
            return;
        }

        if (!type.equals("food") && !type.equals("restaurant")) {
            sendError(response, 400, "Invalid wishlist type");
            return;
        }

        int id;

        try {
            id = Integer.parseInt(request.getParameter("id"));

            if (id <= 0) {
                throw new NumberFormatException();
            }
        } catch (Exception e) {
            sendError(response, 400, "Valid ID is required");
            return;
        }

        try {
            if ("food".equals(type)) {
                handleFood(request, response, action, id);
            } else {
                handleRestaurant(request, response, action, id);
            }
        } catch (Exception e) {
            log("Wishlist operation failed", e);
            sendError(
                    response, 500,
                    "Unable to process wishlist request");
        }
    }

    // FOOD WISHLIST
    private void handleFood(
            HttpServletRequest request,
            HttpServletResponse response,
            String action,
            int menuId) throws Exception {

        HttpSession session = request.getSession();

        Map<Integer, Menu> foodWishlist =
                castFoodMap(session.getAttribute("foodWishlist"));

        if (foodWishlist == null) {
            foodWishlist = new HashMap<>();
        }

        if ("add".equals(action)) {
            Menu menu = menuDao.getMenu(menuId);

            if (menu == null) {
                sendError(response, 404, "Food item not found");
                return;
            }

            // Map prevents duplicate menu IDs
            foodWishlist.put(menuId, menu);
        } else {
            foodWishlist.remove(menuId);
        }

        session.setAttribute("foodWishlist", foodWishlist);

        sendSuccess(response, session, action, "food");
    }

    // RESTAURANT WISHLIST
    private void handleRestaurant(
            HttpServletRequest request,
            HttpServletResponse response,
            String action,
            int restaurantId) throws Exception {

        HttpSession session = request.getSession();

        Map<Integer, Restaurant> restaurantWishlist =
                castRestaurantMap(
                        session.getAttribute("restaurantWishlist"));

        if (restaurantWishlist == null) {
            restaurantWishlist = new HashMap<>();
        }

        if ("add".equals(action)) {
            Restaurant restaurant =
                    restaurantDao.getRestaurant(restaurantId);

            if (restaurant == null) {
                sendError(response, 404, "Restaurant not found");
                return;
            }

            // Map prevents duplicate restaurant IDs
            restaurantWishlist.put(restaurantId, restaurant);
        } else {
            restaurantWishlist.remove(restaurantId);
        }

        session.setAttribute(
                "restaurantWishlist", restaurantWishlist);

        sendSuccess(response, session, action, "restaurant");
    }

    // Safely retrieve session maps
    @SuppressWarnings("unchecked")
    private Map<Integer, Menu> castFoodMap(Object value) {
        if (value instanceof Map<?, ?>) {
            return (Map<Integer, Menu>) value;
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<Integer, Restaurant> castRestaurantMap(
            Object value) {

        if (value instanceof Map<?, ?>) {
            return (Map<Integer, Restaurant>) value;
        }

        return null;
    }

    // Success response includes the updated combined count
    private void sendSuccess(
            HttpServletResponse response,
            HttpSession session,
            String action,
            String type) throws IOException {

        Map<Integer, Menu> foods =
                castFoodMap(session.getAttribute("foodWishlist"));

        Map<Integer, Restaurant> restaurants =
                castRestaurantMap(
                        session.getAttribute("restaurantWishlist"));

        int foodCount = foods == null ? 0 : foods.size();
        int restaurantCount =
                restaurants == null ? 0 : restaurants.size();

        Map<String, Object> result = new HashMap<>();

        result.put("success", true);
        result.put(
                "message",
                "add".equals(action)
                        ? "Added " + typeName(type) + " to wishlist"
                        : "Removed " + typeName(type) + " from wishlist");

        result.put("count", foodCount + restaurantCount);

        response.getWriter().write(gson.toJson(result));
    }

    private String typeName(String type) {
        return "food".equals(type) ? "food item" : "restaurant";
    }

    // Error response
    private void sendError(
            HttpServletResponse response,
            int status,
            String message) {

        response.setStatus(status);

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("error", message);

        try {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(gson.toJson(result));
        } catch (IOException e) {
            log("Unable to write wishlist error", e);
        }
    }
}
