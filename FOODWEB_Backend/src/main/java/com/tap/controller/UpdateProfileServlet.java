
package com.tap.controller;

import java.io.IOException;
import java.sql.SQLException;

import com.tap.DaoImpl.UserDaoImpl;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/profile/update")
public class UpdateProfileServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final UserDaoImpl userDao = new UserDaoImpl();

    private void setCors(HttpServletResponse response) {
        response.setHeader(
            "Access-Control-Allow-Origin",
            "http://localhost:5173"
        );
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Accept"
        );
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        setCors(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        setCors(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Please log in first.\"}"
            );
            return;
        }

        Object sessionId = session.getAttribute("userId");
        int userId;

        try {
            userId = sessionId instanceof Number
                ? ((Number) sessionId).intValue()
                : Integer.parseInt(sessionId.toString());
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Invalid login session.\"}"
            );
            return;
        }

        String userName = request.getParameter("userName");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");
        String address = request.getParameter("address");

        if (userName == null || userName.trim().isEmpty()
                || email == null || email.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Name and email are required.\"}"
            );
            return;
        }

        userName = userName.trim();
        email = email.trim();
        phone = phone == null ? "" : phone.trim();
        address = address == null ? "" : address.trim();

        if (userName.length() > 100 || email.length() > 150
                || phone.length() > 20 || address.length() > 500) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write(
                "{\"success\":false,\"message\":\"One or more fields are too long.\"}"
            );
            return;
        }

        try {
            boolean updated = userDao.updateProfile(
                userId, userName, email, phone, address
            );

            if (!updated) {
                response.setStatus(HttpServletResponse.SC_CONFLICT);
                response.getWriter().write(
                    "{\"success\":false,\"message\":\"This email is already used by another account, or no profile was updated.\"}"
                );
                return;
            }

            session.setAttribute("userName", userName);
            session.setAttribute("email", email);

            response.getWriter().write(
                "{\"success\":true,\"message\":\"Profile updated successfully.\"}"
            );

        } catch (SQLException e) {
            e.printStackTrace();

            response.setStatus(
                HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Database error while updating profile.\"}"
            );
        }
    }
}
