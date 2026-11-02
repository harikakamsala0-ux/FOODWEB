package com.tap.controller;

import java.io.IOException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.DaoImpl.OrderDaoImpl;
import com.tap.DaoImpl.OrderItemDaoImpl;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.model.Menu;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.Restaurant;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/admin/orders")
public class AdminOrderServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final Gson gson = new Gson();

    private static final String[] ALLOWED_STATUSES = {
        "PLACED",
        "CONFIRMED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED"
    };

    // CORS headers and OPTIONS preflight
    @Override
    protected void service(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setHeader(
                "Access-Control-Allow-Origin",
                "http://localhost:5173"
        );

        response.setHeader("Access-Control-Allow-Credentials", "true");

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
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        super.service(request, response);
    }

    // Check admin session
    private boolean isAdmin(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return false;
        }

        Object role = session.getAttribute("role");

        return role != null
                && "ADMIN".equalsIgnoreCase(role.toString());
    }

    // Send JSON response using Gson
    private void sendJson(
            HttpServletResponse response,
            int status,
            Object data) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(gson.toJson(data));
    }

    // Create a simple JSON message using a Map
    private Map<String, Object> createMessage(
            boolean success,
            String message) {

        Map<String, Object> result = new HashMap<>();

        result.put("success", success);
        result.put("message", message);

        return result;
    }

    private String formatDate(Timestamp timestamp) {

        if (timestamp == null) {
            return "";
        }

        return new SimpleDateFormat(
                "dd MMM yyyy, hh:mm a",
                Locale.ENGLISH
        ).format(timestamp);
    }

    private boolean isValidStatus(String status) {

        if (status == null) {
            return false;
        }

        for (String allowed : ALLOWED_STATUSES) {
            if (allowed.equals(status)) {
                return true;
            }
        }

        return false;
    }

    // GET: all orders OR one order with its items
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        if (!isAdmin(request)) {
            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    createMessage(false, "Admin login required.")
            );
            return;
        }

        try {
            OrderDaoImpl orderDao = new OrderDaoImpl();

            String orderIdParam = request.getParameter("orderId");

            // Get one order with its items
            if (orderIdParam != null && !orderIdParam.trim().isEmpty()) {

                int orderId;

                try {
                    orderId = Integer.parseInt(orderIdParam);

                    if (orderId <= 0) {
                        throw new NumberFormatException();
                    }

                } catch (NumberFormatException e) {

                    sendJson(
                            response,
                            HttpServletResponse.SC_BAD_REQUEST,
                            createMessage(false, "Invalid order ID.")
                    );
                    return;
                }

                Order order = orderDao.getOrder(orderId);

                if (order == null) {
                    sendJson(
                            response,
                            HttpServletResponse.SC_NOT_FOUND,
                            createMessage(false, "Order not found.")
                    );
                    return;
                }

                Map<String, Object> details = new HashMap<>();

                details.put("success", true);
                details.put("order", createOrderJson(order));
                details.put("items", getOrderItemsJson(orderId));

                sendJson(
                        response,
                        HttpServletResponse.SC_OK,
                        details
                );

                return;
            }

            // Get all orders
            List<Order> orders = orderDao.getAllOrders();

            List<Map<String, Object>> result = new ArrayList<>();

            if (orders != null) {
                for (Order order : orders) {
                    result.add(createOrderJson(order));
                }
            }

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    result
            );

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    createMessage(false, "Unable to load orders.")
            );
        }
    }

    // PUT: update only Orders.status
    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        if (!isAdmin(request)) {
            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    createMessage(false, "Admin login required.")
            );
            return;
        }

        JsonObject body;

        // Read JSON request body
        try {
            JsonElement json = JsonParser.parseReader(request.getReader());

            if (json == null || !json.isJsonObject()) {
                sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        createMessage(false, "Invalid JSON request.")
                );
                return;
            }

            body = json.getAsJsonObject();

        } catch (Exception e) {

            sendJson(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    createMessage(false, "Invalid JSON request.")
            );
            return;
        }

        int orderId;
        String newStatus;

        try {
            if (!body.has("orderId") || body.get("orderId").isJsonNull()) {
                throw new IllegalArgumentException();
            }

            orderId = body.get("orderId").getAsInt();

            if (orderId <= 0) {
                throw new IllegalArgumentException();
            }

            if (!body.has("status") || body.get("status").isJsonNull()) {
                sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        createMessage(false, "Order status is required.")
                );
                return;
            }

            newStatus = body.get("status")
                    .getAsString()
                    .trim()
                    .toUpperCase(Locale.ROOT);

        } catch (Exception e) {

            sendJson(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    createMessage(false, "Valid order ID and status are required.")
            );
            return;
        }

        if (!isValidStatus(newStatus)) {
            sendJson(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    createMessage(false, "Invalid order status.")
            );
            return;
        }

        try {
            OrderDaoImpl orderDao = new OrderDaoImpl();

            Order existingOrder = orderDao.getOrder(orderId);

            if (existingOrder == null) {
                sendJson(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        createMessage(false, "Order not found.")
                );
                return;
            }

            // Updates ONLY the status column in Orders.
            boolean updated = orderDao.updateOrderStatus(
                    orderId,
                    newStatus
            );

            if (updated) {
                sendJson(
                        response,
                        HttpServletResponse.SC_OK,
                        createMessage(true, "Order status updated successfully.")
                );
            } else {
                sendJson(
                        response,
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        createMessage(false, "Failed to update order status.")
                );
            }

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    createMessage(false, "Unable to update order status.")
            );
        }
    }

    // Convert Order model into a JSON Map
    private Map<String, Object> createOrderJson(Order order) {

        Map<String, Object> result = new HashMap<>();

        result.put("orderId", order.getOrderId());
        result.put("userId", order.getUserId());
        result.put("restaurantId", order.getRestaurantId());
        result.put("orderDate", formatDate(order.getOrderDate()));
        result.put("totalAmount", order.getTotalAmount());
        result.put("status", order.getStatus());
        result.put("paymentMode", order.getPaymentMode());

        try {
            RestaurantDaoImpl restaurantDao = new RestaurantDaoImpl();

            Restaurant restaurant = restaurantDao.getRestaurant(
                    order.getRestaurantId()
            );

            if (restaurant != null) {
                result.put("restaurantName", restaurant.getName());
            } else {
                result.put(
                        "restaurantName",
                        "Restaurant #" + order.getRestaurantId()
                );
            }

        } catch (Exception e) {

            result.put(
                    "restaurantName",
                    "Restaurant #" + order.getRestaurantId()
            );
        }

        return result;
    }

    // Get order items and their menu names as JSON Maps
    private List<Map<String, Object>> getOrderItemsJson(int orderId) {

        List<Map<String, Object>> result = new ArrayList<>();

        OrderItemDaoImpl orderItemDao = new OrderItemDaoImpl();
        MenuDaoImpl menuDao = new MenuDaoImpl();

        List<OrderItem> orderItems =
                orderItemDao.getAllOrderItem(orderId);

        if (orderItems == null) {
            return result;
        }

        for (OrderItem item : orderItems) {

            Map<String, Object> itemJson = new HashMap<>();

            itemJson.put("orderItemId", item.getOrderItemId());
            itemJson.put("menuId", item.getMenuId());
            itemJson.put("quantity", item.getQuantity());
            itemJson.put("lineTotal", item.getTotalAmount());

            Menu menu = menuDao.getMenu(item.getMenuId());

            if (menu != null) {

                itemJson.put("itemName", menu.getItemName());
                itemJson.put("unitPrice", menu.getPrice());

            } else {

                itemJson.put(
                        "itemName",
                        "Menu item #" + item.getMenuId()
                );

                double unitPrice = 0;

                if (item.getQuantity() > 0) {
                    unitPrice =
                            item.getTotalAmount() / item.getQuantity();
                }

                itemJson.put("unitPrice", unitPrice);
            }

            result.add(itemJson);
        }

        return result;
    }
}