
package com.tap.controller;

import java.io.IOException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.tap.DaoImpl.UserDaoImpl;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/admin/customers")
public class AdminCustomerServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final Gson gson = new Gson();

    private boolean isAdmin(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return false;
        }

        String role = (String) session.getAttribute("role");

        return role != null && role.equalsIgnoreCase("ADMIN");
    }

    @Override
    public void service(
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
            "GET, OPTIONS"
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

    private void sendJson(
            HttpServletResponse response,
            int status,
            Object data) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(gson.toJson(data));
    }

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
            return null;
        }

        SimpleDateFormat formatter =
            new SimpleDateFormat("dd MMM yyyy, hh:mm a");

        return formatter.format(timestamp);
    }

    // Customer response without password
    private Map<String, Object> createCustomerJson(User user) {

        Map<String, Object> customer = new HashMap<>();

        customer.put("userId", user.getUserId());
        customer.put("userName", user.getUserName());
        customer.put("email", user.getEmail());
        customer.put("phone", user.getPhone());
        customer.put("address", user.getAddress());
        customer.put("role", user.getRole());

        customer.put(
            "createdDate",
            formatDate(user.getCreatedDate())
        );

        customer.put(
            "lastLoginDate",
            formatDate(user.getLastLoginDate())
        );

        // Password is intentionally not included.

        return customer;
    }

    // GET: All customers or one customer's details
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        if (!isAdmin(request)) {

            sendJson(
                response,
                HttpServletResponse.SC_UNAUTHORIZED,
                createMessage(false, "Admin login required.")
            );

            return;
        }

        try {

            UserDaoImpl userDao = new UserDaoImpl();

            String customerIdParam =
                request.getParameter("userId");

            // GET /api/admin/customers?userId=1
            if (customerIdParam != null &&
                !customerIdParam.trim().isEmpty()) {

                int userId;

                try {
                    userId = Integer.parseInt(customerIdParam);
                } catch (NumberFormatException e) {

                    sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        createMessage(false, "Invalid customer ID.")
                    );

                    return;
                }

                User user = userDao.getUser(userId);

                if (user == null ||
                    user.getRole() == null ||
                    !user.getRole().trim().equalsIgnoreCase("CUSTOMER")) {

                    sendJson(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        createMessage(false, "Customer not found.")
                    );

                    return;
                }

                Map<String, Object> result = new HashMap<>();

                result.put("success", true);
                result.put(
                    "customer",
                    createCustomerJson(user)
                );

                sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    result
                );

                return;
            }

            // GET /api/admin/customers
            List<User> allUsers = userDao.getAllUsers();

            List<Map<String, Object>> customers =
                new ArrayList<>();

            for (User user : allUsers) {

                if (user.getRole() != null &&
                    user.getRole().trim().equalsIgnoreCase("CUSTOMER")) {

                    customers.add(createCustomerJson(user));
                }
            }

            sendJson(
                response,
                HttpServletResponse.SC_OK,
                customers
            );

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                response,
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                createMessage(false, "Unable to load customers.")
            );
        }
    }
}

