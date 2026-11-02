
package com.tap.controller;

import java.io.IOException;
import java.util.Map;

import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import com.tap.model.Menu;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/cart")
public class CartServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final MenuDaoImpl menuDao = new MenuDaoImpl();

    // Change this to match your actual frontend origin.
    private boolean configureCors(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)
                || "http://localhost:3000".equals(origin)) {

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Headers",
                    "Content-Type");
            response.setHeader("Access-Control-Allow-Methods",
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

        Cart cart = getCart(request, false);
        writeCart(response, cart);
    }

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

        try {
            if (action == null || action.isBlank()) {
                sendError(response, 400, "Action is required");
                return;
            }

            switch (action.toLowerCase()) {

                case "add":
                    add(request, response);
                    break;

                case "update":
                    update(request, response);
                    break;

                case "remove":
                    remove(request, response);
                    break;

                case "clear":
                    clear(request, response);
                    break;

                default:
                    sendError(response, 400, "Invalid cart action");
            }

        } catch (IllegalArgumentException e) {
            sendError(response, 400, e.getMessage());
        } catch (Exception e) {
            log("Cart operation failed", e);
            sendError(response, 500, "Unable to process cart request");
        }
    }

    // Get an existing cart or create a new session cart.
    private Cart getCart(
            HttpServletRequest request, boolean create) {

        HttpSession session = request.getSession(create);

        if (session == null) {
            return null;
        }

        Cart cart = (Cart) session.getAttribute("cart");

        if (cart == null && create) {
            cart = new Cart();
            session.setAttribute("cart", cart);
        }

        return cart;
    }
    // ACTION: ADD

	private void add(
	        HttpServletRequest request,
	        HttpServletResponse response) throws Exception {
	
	    int menuId = positiveInt(request, "menuId");
	    int quantity = positiveInt(request, "quantity");
	
	    // Fetch the menu item from the database
	    Menu menu = menuDao.getMenu(menuId);
	
	    if (menu == null) {
	        sendError(response, 404, "Menu item not found");
	        return;
	    }
	
	    // Use the getter from your actual Menu.java
	    if (!menu.getIsAvailable()) {
	        sendError(response, 400, "This item is unavailable");
	        return;
	    }
	
	    // Get or create the session cart
	    Cart cart = getCart(request, true);
	
	    // Add the menu item to the cart
	    cart.addItem(menu, quantity);
	
	    // Return updated cart JSON
	    writeCart(response, cart);
	}


    // ACTION: UPDATE QUANTITY
    private void update(
            HttpServletRequest request,
            HttpServletResponse response) {

        int menuId = positiveInt(request, "menuId");
        int quantity = nonNegativeInt(request, "quantity");

        Cart cart = getCart(request, false);

        if (cart == null || cart.isEmpty()) {
            sendError(response, 404, "Cart is empty");
            return;
        }

        cart.updateQuantity(menuId, quantity);

        writeCart(response, cart);
    }

    // ACTION: REMOVE ITEM
    private void remove(
            HttpServletRequest request,
            HttpServletResponse response) {

        int menuId = positiveInt(request, "menuId");

        Cart cart = getCart(request, false);

        if (cart == null) {
            sendError(response, 404, "Cart is empty");
            return;
        }

        cart.removeItem(menuId);

        writeCart(response, cart);
    }

    // ACTION: CLEAR ENTIRE CART
    private void clear(
            HttpServletRequest request,
            HttpServletResponse response) {

        Cart cart = getCart(request, false);

        if (cart != null) {
            cart.clearCart();
        }

        writeCart(response, cart);
    }

    private int positiveInt(
            HttpServletRequest request, String name) {

        int value = parseInt(request, name);

        if (value <= 0) {
            throw new IllegalArgumentException(
                    name + " must be greater than zero");
        }

        return value;
    }

    private int nonNegativeInt(
            HttpServletRequest request, String name) {

        int value = parseInt(request, name);

        if (value < 0) {
            throw new IllegalArgumentException(
                    name + " cannot be negative");
        }

        return value;
    }

    private int parseInt(
            HttpServletRequest request, String name) {

        try {
            return Integer.parseInt(request.getParameter(name));
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Valid " + name + " is required");
        }
    }

    // Send the complete cart as JSON.
    private void writeCart(
            HttpServletResponse response, Cart cart) {

        if (cart == null) {
            cart = new Cart();
        }

        StringBuilder json = new StringBuilder();

        json.append("{");
        json.append("\"restaurantId\":")
            .append(cart.getRestaurantId()).append(",");

        json.append("\"totalItems\":")
            .append(cart.getTotalItems()).append(",");

        json.append("\"totalAmount\":")
            .append(cart.getTotalAmount()).append(",");

        json.append("\"items\":[");

        boolean first = true;

        for (Map.Entry<Integer, CartItem> entry
                : cart.getItems().entrySet()) {

            if (!first) {
                json.append(",");
            }

            first = false;

            CartItem item = entry.getValue();
            Menu menu = item.getMenu();

            json.append("{");
            json.append("\"menuId\":").append(entry.getKey()).append(",");
            json.append("\"restaurantId\":")
                .append(menu.getRestaurantId()).append(",");
            json.append("\"itemName\":\"")
                .append(escape(menu.getItemName())).append("\",");
            json.append("\"description\":\"")
                .append(escape(menu.getDescription())).append("\",");
            json.append("\"price\":").append(menu.getPrice()).append(",");
            json.append("\"quantity\":").append(item.getQuantity()).append(",");
            json.append("\"subtotal\":").append(item.getSubtotal()).append(",");
            json.append("\"imagePath\":\"")
                .append(escape(menu.getImagePath())).append("\"");
            json.append("}");
        }

        json.append("]}");

        try {
            response.getWriter().write(json.toString());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String escape(String value) {
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

    private void sendError(
            HttpServletResponse response,
            int status,
            String message) {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            response.getWriter().write(
                    "{\"error\":\"" + escape(message) + "\"}");
        } catch (IOException e) {
            log("Unable to write error response", e);
        }
    }
}
