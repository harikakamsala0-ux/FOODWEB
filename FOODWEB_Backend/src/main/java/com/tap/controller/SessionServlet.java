
package com.tap.controller;

import java.io.IOException;

import com.tap.DaoImpl.UserDaoImpl;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/session")
public class SessionServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final UserDaoImpl userDao = new UserDaoImpl();

    private void setCorsHeaders(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }

        response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Accept"
        );
    }

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

        if (session == null || session.getAttribute("userId") == null) {
            response.getWriter().write(
                "{\"success\":true,\"loggedIn\":false,\"user\":null}"
            );
            return;
        }

        int userId;

        try {
            Object id = session.getAttribute("userId");

            if (id instanceof Number) {
                userId = ((Number) id).intValue();
            } else {
                userId = Integer.parseInt(id.toString());
            }
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                "{\"success\":false,\"loggedIn\":false,\"user\":null}"
            );
            return;
        }

        // Retrieve the latest profile details from MySQL.
        User user = userDao.getUser(userId);

        if (user == null) {
            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
            response.getWriter().write(
                "{\"success\":false,\"loggedIn\":true,"
                + "\"message\":\"Unable to retrieve profile details.\"}"
            );
            return;
        }

        // Synchronize session display values with the database.
        session.setAttribute("userName", user.getUserName());
        session.setAttribute("email", user.getEmail());
        session.setAttribute("role", user.getRole());

        String json =
            "{\"success\":true,"
            + "\"loggedIn\":true,"
            + "\"user\":{"
            + "\"userId\":" + user.getUserId() + ","
            + "\"userName\":\"" + escapeJson(user.getUserName()) + "\","
            + "\"email\":\"" + escapeJson(user.getEmail()) + "\","
            + "\"phone\":\"" + escapeJson(user.getPhone()) + "\","
            + "\"address\":\"" + escapeJson(user.getAddress()) + "\","
            + "\"role\":\"" + escapeJson(user.getRole()) + "\""
            + "}}";

        response.getWriter().write(json);
    }

    private String escapeJson(Object value) {
        if (value == null) {
            return "";
        }

        return value.toString()
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\b", "\\b")
            .replace("\f", "\\f")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
}
