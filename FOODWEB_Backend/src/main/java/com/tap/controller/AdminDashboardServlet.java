
package com.tap.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.tap.DaoImpl.OrderDaoImpl;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.DaoImpl.UserDaoImpl;
import com.tap.model.Order;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/admin/dashboard")
public class AdminDashboardServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final Gson gson = new Gson();

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        // Only logged-in administrators may access dashboard data.
        if (session == null
                || !"ADMIN".equalsIgnoreCase(
                        String.valueOf(session.getAttribute("role")))) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Admin login required.");

            response.getWriter().write(gson.toJson(error));
            return;
        }

        try {
            RestaurantDaoImpl restaurantDao = new RestaurantDaoImpl();
            UserDaoImpl userDao = new UserDaoImpl();
            OrderDaoImpl orderDao = new OrderDaoImpl();

            List<Order> allOrders = orderDao.getAllOrders();

            // Prepare the recent five orders.
            List<Map<String, Object>> recentOrders = new ArrayList<>();

            int limit = Math.min(5, allOrders.size());

            for (int i = 0; i < limit; i++) {
                Order order = allOrders.get(i);

                Map<String, Object> item = new HashMap<>();

                item.put("orderId", order.getOrderId());
                item.put("userId", order.getUserId());
                item.put("restaurantId", order.getRestaurantId());
                item.put("orderDate", order.getOrderDate());
                item.put("totalAmount", order.getTotalAmount());
                item.put("status", order.getStatus());
                item.put("paymentMode", order.getPaymentMode());

                recentOrders.add(item);
            }

            Map<String, Object> dashboard = new HashMap<>();

            dashboard.put("success", true);
            dashboard.put(
                "totalRestaurants",
                restaurantDao.getTotalRestaurantCount()
            );
            dashboard.put(
                "totalCustomers",
                userDao.getTotalCustomerCount()
            );
            dashboard.put(
                "totalOrders",
                orderDao.getTotalOrderCount()
            );
            dashboard.put(
                "totalRevenue",
                orderDao.getTotalRevenue()
            );
            dashboard.put("recentOrders", recentOrders);

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(gson.toJson(dashboard));

        } catch (Exception e) {
            e.printStackTrace();

            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Unable to load admin dashboard data.");

            response.getWriter().write(gson.toJson(error));
        }
    }

    private void setCorsHeaders(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)
                || "http://localhost:3000".equals(origin)) {

            response.setHeader(
                "Access-Control-Allow-Origin",
                origin
            );

            response.setHeader(
                "Access-Control-Allow-Credentials",
                "true"
            );

            response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, OPTIONS"
            );

            response.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type"
            );

            response.setHeader("Vary", "Origin");
        }
    }
}
