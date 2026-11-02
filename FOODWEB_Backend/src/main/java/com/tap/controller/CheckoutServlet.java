
package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tap.Dao.MenuDao;
import com.tap.Dao.OrderDao;
import com.tap.Dao.OrderItemDao;
import com.tap.Dao.UserDao;
import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.DaoImpl.OrderDaoImpl;
import com.tap.DaoImpl.OrderItemDaoImpl;
import com.tap.DaoImpl.UserDaoImpl;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import com.tap.model.Menu;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.User;
import com.tap.util.EmailUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/checkout")
public class CheckoutServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private UserDao userDao;
    private MenuDao menuDao;
    private OrderDao orderDao;
    private OrderItemDao orderItemDao;

    @Override
    public void init() throws ServletException {
        userDao = new UserDaoImpl();
        menuDao = new MenuDaoImpl();
        orderDao = new OrderDaoImpl();
        orderItemDao = new OrderItemDaoImpl();
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
                    "Content-Type");
            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS");
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeJson(response,
                    "{\"loggedIn\":false,\"message\":\"Please login first.\"}");
            return;
        }

        try {
            String email = (String) session.getAttribute("email");

            if (email == null || email.trim().isEmpty()) {
                writeJson(response,
                        "{\"loggedIn\":false,\"message\":\"User email not found in session.\"}");
                return;
            }

            User user = userDao.getUserByEmail(email);

            if (user == null) {
                writeJson(response,
                        "{\"loggedIn\":false,\"message\":\"User not found.\"}");
                return;
            }

            String json = "{"
                    + "\"loggedIn\":true,"
                    + "\"user\":{"
                    + "\"fullName\":\"" + escapeJson(user.getUserName()) + "\","
                    + "\"userName\":\"" + escapeJson(user.getUserName()) + "\","
                    + "\"email\":\"" + escapeJson(user.getEmail()) + "\","
                    + "\"phone\":\"" + escapeJson(user.getPhone()) + "\","
                    + "\"address\":\"" + escapeJson(user.getAddress()) + "\""
                    + "}"
                    + "}";

            writeJson(response, json);

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            writeJson(response,
                    "{\"loggedIn\":false,\"message\":\"Unable to load checkout details.\"}");
        }
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        HttpSession session = request.getSession(false);

        // 1. Validate login session.
        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            writeJson(response,
                    "{\"success\":false,\"message\":\"Please login first.\"}");
            return;
        }

        int userId = ((Number) session.getAttribute("userId")).intValue();

        // 2. Get the cart directly from the session.
        Cart cart = (Cart) session.getAttribute("cart");

        if (cart == null || cart.getItems() == null
                || cart.getItems().isEmpty()) {

            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            writeJson(response,
                    "{\"success\":false,\"message\":\"Your cart is empty.\"}");
            return;
        }

        // Restaurant ID comes from the session cart.
        int restaurantId = cart.getRestaurantId();

        try {
            // 3. Read checkout request.
            StringBuilder requestBody = new StringBuilder();
            String line;

            try (BufferedReader reader = request.getReader()) {
                while ((line = reader.readLine()) != null) {
                    requestBody.append(line);
                }
            }

            String body = requestBody.toString();

            String paymentMode = extractString(body, "paymentMode");

            if (paymentMode == null || paymentMode.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Please select a payment method.\"}");
                return;
            }

            // 4. Read selected menu IDs from the checkout request.
            List<Integer> selectedMenuIds =
                    extractIntegerArray(body, "selectedMenuIds");

            if (selectedMenuIds.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Please select items to checkout.\"}");
                return;
            }

            // Reject duplicate menu IDs.
            Set<Integer> uniqueIds = new HashSet<>(selectedMenuIds);

            if (uniqueIds.size() != selectedMenuIds.size()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Duplicate menu items were submitted.\"}");
                return;
            }

            // 5. Fetch current menu data from the database.
            List<Menu> databaseMenus =
                    menuDao.getMenuByRestaurant(restaurantId);

            if (databaseMenus == null || databaseMenus.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Restaurant menu not found.\"}");
                return;
            }

            Map<Integer, Menu> menuMap = new HashMap<>();

            for (Menu menu : databaseMenus) {
                menuMap.put(menu.getMenuId(), menu);
            }

            // 6. Validate selected items and calculate total.
            double totalAmount = 0.0;

            for (Integer menuId : selectedMenuIds) {

                CartItem cartItem = cart.getItems().get(menuId);
                Menu databaseMenu = menuMap.get(menuId);

                if (cartItem == null || cartItem.getMenu() == null) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    writeJson(response,
                            "{\"success\":false,\"message\":\"A selected item is not in your cart.\"}");
                    return;
                }

                if (databaseMenu == null) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    writeJson(response,
                            "{\"success\":false,\"message\":\"A selected menu item was not found.\"}");
                    return;
                }

                if (!databaseMenu.getIsAvailable()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    writeJson(response,
                            "{\"success\":false,\"message\":\"An item is currently unavailable.\"}");
                    return;
                }

                int quantity = cartItem.getQuantity();

                if (quantity <= 0 || databaseMenu.getPrice() < 0) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    writeJson(response,
                            "{\"success\":false,\"message\":\"Invalid item quantity or price.\"}");
                    return;
                }

                totalAmount += databaseMenu.getPrice() * quantity;
            }

            // 7. Create the order.
            // Address is intentionally NOT saved in the Order table.
            Order order = new Order(
                    restaurantId,
                    userId,
                    new Timestamp(System.currentTimeMillis()),
                    totalAmount,
                    "PLACED",
                    paymentMode
            );

            int orderId = orderDao.addOrder(order);

            if (orderId <= 0) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Unable to create your order.\"}");
                return;
            }

            // 8. Save order items using current database prices.
            boolean allItemsSaved = true;

            for (Integer menuId : selectedMenuIds) {

                CartItem cartItem = cart.getItems().get(menuId);
                Menu databaseMenu = menuMap.get(menuId);

                int quantity = cartItem.getQuantity();
                double itemTotal = databaseMenu.getPrice() * quantity;

                OrderItem orderItem = new OrderItem(
                        orderId,
                        menuId,
                        quantity,
                        itemTotal
                );

                if (!orderItemDao.addOrderItem(orderItem)) {
                    allItemsSaved = false;
                    break;
                }
            }

            // 9. If saving any order item failed, attempt cleanup.
            if (!allItemsSaved) {
                try {
                    List<OrderItem> savedItems =
                            orderItemDao.getAllOrderItem(orderId);

                    if (savedItems != null) {
                        for (OrderItem item : savedItems) {
                            orderItemDao.deleteOrderItem(
                                    item.getOrderItemId());
                        }
                    }

                    orderDao.deleteOrder(orderId);

                } catch (Exception cleanupException) {
                    cleanupException.printStackTrace();
                }

                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                writeJson(response,
                        "{\"success\":false,\"message\":\"Unable to save all order items. Please try again.\"}");
                return;
            }

            // EMAIL ADDITION 1:
            // Prepare food names and quantities for the confirmation email.
            List<String> emailItems = new ArrayList<>();

            for (Integer menuId : selectedMenuIds) {
                CartItem cartItem = cart.getItems().get(menuId);
                Menu databaseMenu = menuMap.get(menuId);

                String itemName = databaseMenu.getItemName();
                int quantity = cartItem.getQuantity();
                double itemTotal = databaseMenu.getPrice() * quantity;

                emailItems.add(
                        itemName + " x " + quantity
                        + " - Rs. "
                        + String.format(
                                java.util.Locale.US,
                                "%.2f",
                                itemTotal)
                );
            }

            // 10. Remove only the selected items from the session cart.
            for (Integer menuId : selectedMenuIds) {
                cart.removeItem(menuId);
            }

            if (cart.getItems().isEmpty()) {
                session.removeAttribute("cart");
            } else {
                session.setAttribute("cart", cart);
            }

            // EMAIL ADDITION 2:
            // Send email after saving the order successfully.
            // Email failure must not invalidate the saved order.
            try {
                String sessionEmail =
                        (String) session.getAttribute("email");

                if (sessionEmail != null && !sessionEmail.isBlank()) {

                    User customer = userDao.getUserByEmail(sessionEmail);

                    if (customer != null
                            && customer.getEmail() != null
                            && !customer.getEmail().isBlank()) {

                        EmailUtil.sendOrderConfirmation(
                                customer.getEmail(),
                                customer.getUserName(),
                                orderId,
                                emailItems,
                                totalAmount,
                                paymentMode
                        );

                        System.out.println(
                                "FOODWEB confirmation email sent for order "
                                + orderId);

                    } else {
                        System.err.println(
                                "Order saved, but customer email was not found.");
                    }

                } else {
                    System.err.println(
                            "Order saved, but email is missing from the session.");
                }

            } catch (Exception emailException) {
                System.err.println(
                        "Order " + orderId
                        + " was saved, but confirmation email failed.");

                emailException.printStackTrace();
            }

            // 11. Return the result to Checkout.jsx.
            String json = "{"
                    + "\"success\":true,"
                    + "\"message\":\"Order placed successfully!\","
                    + "\"orderId\":" + orderId + ","
                    + "\"restaurantId\":" + restaurantId + ","
                    + "\"totalAmount\":" + totalAmount
                    + "}";

            writeJson(response, json);

        } catch (Exception e) {
            e.printStackTrace();

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            writeJson(response,
                    "{\"success\":false,\"message\":\"Something went wrong during checkout.\"}");
        }
    }

    private List<Integer> extractIntegerArray(
            String json, String key) {

        List<Integer> values = new ArrayList<>();

        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key)
                + "\"\\s*:\\s*\\[([^\\]]*)\\]");

        Matcher matcher = pattern.matcher(json);

        if (matcher.find()) {
            String arrayContent = matcher.group(1).trim();

            if (!arrayContent.isEmpty()) {
                String[] parts = arrayContent.split(",");

                for (String part : parts) {
                    try {
                        values.add(Integer.parseInt(part.trim()));
                    } catch (NumberFormatException e) {
                        values.clear();
                        return values;
                    }
                }
            }
        }

        return values;
    }

    private String extractString(String json, String key) {

        Pattern pattern = Pattern.compile(
                "\"" + Pattern.quote(key)
                + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

        Matcher matcher = pattern.matcher(json);

        if (matcher.find()) {
            return matcher.group(1)
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\")
                    .replace("\\n", "\n")
                    .replace("\\r", "\r");
        }

        return null;
    }

    private void writeJson(
            HttpServletResponse response, String json)
            throws IOException {

        response.getWriter().write(json);
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
