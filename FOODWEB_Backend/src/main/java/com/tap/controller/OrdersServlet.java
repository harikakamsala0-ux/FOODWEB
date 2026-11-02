
package com.tap.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.DaoImpl.OrderDaoImpl;
import com.tap.DaoImpl.OrderItemDaoImpl;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.model.Menu;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.Restaurant;
import com.tap.util.EmailUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/orders")
public class OrdersServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private OrderDaoImpl orderDao;
    private OrderItemDaoImpl orderItemDao;
    private MenuDaoImpl menuDao;
    private RestaurantDaoImpl restaurantDao;

    private final Gson gson = new Gson();

    @Override
    public void init() throws ServletException {
        orderDao = new OrderDaoImpl();
        orderItemDao = new OrderItemDaoImpl();
        menuDao = new MenuDaoImpl();
        restaurantDao = new RestaurantDaoImpl();
    }

    private void setCorsHeaders(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)
                || "http://localhost:3000".equals(origin)) {

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type");
            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS"
            );
            response.setHeader("Vary", "Origin");
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    private void sendJson(
            HttpServletResponse response,
            int statusCode,
            Map<String, Object> data) throws IOException {

        response.setStatus(statusCode);
        response.getWriter().write(gson.toJson(data));
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // GET: Display orders belonging to the logged-in user.
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Please login to view your orders.");

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    error
            );
            return;
        }

        try {
            Object sessionUserId = session.getAttribute("userId");

            int userId;

            if (sessionUserId instanceof Number) {
                userId = ((Number) sessionUserId).intValue();
            } else {
                throw new IllegalStateException("Invalid login session.");
            }

            List<Order> orders = orderDao.getOrderByUser(userId);
            List<Map<String, Object>> result = new ArrayList<>();

            if (orders != null) {

                // Display newest orders first.
                orders.sort((a, b) -> {
                    if (a.getOrderDate() == null) return 1;
                    if (b.getOrderDate() == null) return -1;
                    return b.getOrderDate().compareTo(a.getOrderDate());
                });

                for (Order order : orders) {

                    Map<String, Object> orderData =
                            new LinkedHashMap<>();

                    orderData.put("orderId", order.getOrderId());
                    orderData.put("restaurantId", order.getRestaurantId());
                    orderData.put("userId", order.getUserId());

                    orderData.put(
                            "orderDate",
                            order.getOrderDate() == null
                                    ? null
                                    : order.getOrderDate().toString()
                    );

                    orderData.put("totalAmount", order.getTotalAmount());
                    orderData.put("status", order.getStatus());
                    orderData.put("paymentMode", order.getPaymentMode());

                    // Fetch restaurant details.
                    Restaurant restaurant =
                            restaurantDao.getRestaurant(
                                    order.getRestaurantId());

                    if (restaurant != null) {
                        orderData.put(
                                "restaurantName",
                                restaurant.getName());

                        orderData.put(
                                "restaurantImage",
                                restaurant.getImagePath());
                    } else {
                        orderData.put("restaurantName", "Restaurant");
                        orderData.put("restaurantImage", "");
                    }

                    // Fetch items saved for this order.
                    List<OrderItem> savedItems =
                            orderItemDao.getAllOrderItem(
                                    order.getOrderId());

                    List<Map<String, Object>> itemList =
                            new ArrayList<>();

                    if (savedItems != null) {
                        for (OrderItem savedItem : savedItems) {

                            Map<String, Object> itemData =
                                    new LinkedHashMap<>();

                            Menu menu =
                                    menuDao.getMenu(savedItem.getMenuId());

                            itemData.put(
                                    "menuId",
                                    savedItem.getMenuId());

                            itemData.put(
                                    "quantity",
                                    savedItem.getQuantity());

                            itemData.put(
                                    "subtotal",
                                    savedItem.getTotalAmount());

                            if (menu != null) {
                                itemData.put(
                                        "itemName",
                                        menu.getItemName());

                                itemData.put(
                                        "imagePath",
                                        menu.getImagePath());

                                int quantity = savedItem.getQuantity();

                                double unitPrice = quantity > 0
                                        ? savedItem.getTotalAmount()
                                                / quantity
                                        : 0.0;

                                itemData.put("price", unitPrice);

                            } else {
                                itemData.put(
                                        "itemName",
                                        "Menu item no longer available");

                                itemData.put("imagePath", "");
                                itemData.put("price", 0.0);
                            }

                            itemList.add(itemData);
                        }
                    }

                    orderData.put("items", itemList);
                    result.add(orderData);
                }
            }

            Map<String, Object> responseData =
                    new LinkedHashMap<>();

            responseData.put("success", true);
            responseData.put("orders", result);

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    responseData
            );

        } catch (Exception e) {
            e.printStackTrace();

            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Unable to load your orders.");

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    error
            );
        }
    }

    // POST: Cancel an order and send a cancellation email.
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        HttpSession session = request.getSession(false);

        // Verify that the customer is logged in.
        if (session == null || session.getAttribute("userId") == null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Please login to cancel an order.");

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    error
            );
            return;
        }

        // Validate the logged-in user's session value.
        Object sessionUserId = session.getAttribute("userId");

        if (!(sessionUserId instanceof Number)) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put(
                    "message",
                    "Invalid login session. Please login again."
            );

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    error
            );
            return;
        }

        int userId = ((Number) sessionUserId).intValue();

        // Read orderId sent by Orders.jsx.
        String orderIdValue = request.getParameter("orderId");

        if (orderIdValue == null || orderIdValue.trim().isEmpty()) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Order ID is required.");

            sendJson(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    error
            );
            return;
        }

        final int orderId;

        try {
            orderId = Integer.parseInt(orderIdValue.trim());

            if (orderId <= 0) {
                throw new NumberFormatException("Invalid order ID");
            }

        } catch (NumberFormatException e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Invalid order ID.");

            sendJson(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    error
            );
            return;
        }

        try {
            // Check that the order exists and belongs to this user.
            Order order = orderDao.getOrder(orderId);

            if (order == null || order.getUserId() != userId) {
                Map<String, Object> error = new LinkedHashMap<>();
                error.put("success", false);
                error.put(
                        "message",
                        "Order not found or you are not allowed to cancel it."
                );

                sendJson(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        error
                );
                return;
            }

            // Only Placed orders can be cancelled.
            String status = order.getStatus();

            if (status == null
                    || !"placed".equalsIgnoreCase(status.trim())) {

                Map<String, Object> error = new LinkedHashMap<>();
                error.put("success", false);
                error.put(
                        "message",
                        "Only orders with Placed status can be cancelled."
                );

                sendJson(
                        response,
                        HttpServletResponse.SC_CONFLICT,
                        error
                );
                return;
            }

            // Update the database using the existing DAO method.
            boolean cancelled = orderDao.cancelOrder(orderId, userId);

            if (cancelled) {

                // The database cancellation has succeeded.
                // Email failure must not undo the cancellation.
                boolean emailSent = false;

                try {
                    Order updatedOrder = orderDao.getOrder(orderId);

                    if (updatedOrder == null) {
                        throw new IllegalStateException(
                                "Unable to retrieve the cancelled order.");
                    }

                    // Read customer details from the login session.
                    String customerEmail =
                            (String) session.getAttribute("email");

                    String customerName =
                            (String) session.getAttribute("userName");

                    // Fetch the saved items for the cancellation email.
                    List<OrderItem> savedItems =
                            orderItemDao.getAllOrderItem(orderId);

                    List<String> emailItems = new ArrayList<>();

                    if (savedItems != null) {
                        for (OrderItem savedItem : savedItems) {

                            Menu menu =
                                    menuDao.getMenu(savedItem.getMenuId());

                            String itemName = menu != null
                                    ? menu.getItemName()
                                    : "Menu item no longer available";

                            emailItems.add(
                                    itemName
                                    + " x " + savedItem.getQuantity()
                                    + " - Rs. "
                                    + String.format(
                                            java.util.Locale.US,
                                            "%.2f",
                                            savedItem.getTotalAmount())
                            );
                        }
                    }

                    // Send email after successful database cancellation.
                    EmailUtil.sendCancellationEmail(
                            customerEmail,
                            customerName,
                            orderId,
                            emailItems,
                            updatedOrder.getTotalAmount(),
                            updatedOrder.getPaymentMode()
                    );

                    emailSent = true;

                } catch (Exception emailException) {
                    // Cancellation remains successful if email fails.
                    emailException.printStackTrace();
                }

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", true);
                result.put("message", "Order cancelled successfully.");
                result.put("orderId", orderId);
                result.put("status", "Cancelled");
                result.put("emailSent", emailSent);

                sendJson(
                        response,
                        HttpServletResponse.SC_OK,
                        result
                );

            } else {
                Map<String, Object> error = new LinkedHashMap<>();
                error.put("success", false);
                error.put(
                        "message",
                        "Order could not be cancelled. Refresh and check its status."
                );

                sendJson(
                        response,
                        HttpServletResponse.SC_CONFLICT,
                        error
                );
            }

        } catch (Exception e) {
            e.printStackTrace();

            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", "Unable to cancel the order.");

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    error
            );
        }
    }
}
