
package com.tap.controller;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import com.tap.Dao.MenuDao;
import com.tap.DaoImpl.MenuDaoImpl;
import com.tap.model.Menu;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/menu")
public class MenuServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private MenuDao menuDao;

    @Override
    public void init() throws ServletException {
        menuDao = new MenuDaoImpl();
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private void setCorsHeaders(
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        if ("http://localhost:3000".equals(origin)
                || "http://localhost:5173".equals(origin)) {

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
            response.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization");
        }
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        setCorsHeaders(request, response);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String id = request.getParameter("restaurantId");

        if (id == null || id.trim().isEmpty()) {
            sendError(response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "restaurantId is required");
            return;
        }

        final int restaurantId;

        try {
            restaurantId = Integer.parseInt(id);

            if (restaurantId <= 0) {
                sendError(response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        "restaurantId must be greater than zero");
                return;
            }

        } catch (NumberFormatException e) {
            sendError(response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid restaurantId");
            return;
        }

        try {
            List<Menu> menus =
                    menuDao.getMenuByRestaurant(restaurantId);

            if (menus == null) {
                menus = Collections.emptyList();
            }

            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            for (Menu menu : menus) {

                if (!first) {
                    json.append(",");
                }

                json.append("{")
                    .append("\"menuId\":")
                    .append(menu.getMenuId()).append(",")

                    .append("\"restaurantId\":")
                    .append(menu.getRestaurantId()).append(",")

                    .append("\"itemName\":")
                    .append(jsonString(menu.getItemName())).append(",")

                    .append("\"description\":")
                    .append(jsonString(menu.getDescription())).append(",")

                    .append("\"price\":")
                    .append(menu.getPrice()).append(",")

                    .append("\"isAvailable\":")
                    .append(menu.getIsAvailable()).append(",")

                    .append("\"rating\":")
                    .append(menu.getRating()).append(",")

                    .append("\"imagePath\":")
                    .append(jsonString(menu.getImagePath()))

                    .append("}");

                first = false;
            }

            json.append("]");

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(json.toString());

        } catch (Exception e) {

            getServletContext().log(
                    "Error fetching menu for restaurant "
                            + restaurantId,
                    e);

            sendError(response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Unable to fetch menu items");
        }
    }

    private void sendError(
            HttpServletResponse response,
            int status,
            String message) throws IOException {

        response.setStatus(status);
        response.getWriter().write(
                "{\"error\":" + jsonString(message) + "}");
    }

    private String jsonString(String value) {

        if (value == null) {
            return "null";
        }

        StringBuilder result = new StringBuilder("\"");

        for (char c : value.toCharArray()) {

            switch (c) {
                case '"':
                    result.append("\\\"");
                    break;

                case '\\':
                    result.append("\\\\");
                    break;

                case '\n':
                    result.append("\\n");
                    break;

                case '\r':
                    result.append("\\r");
                    break;

                case '\t':
                    result.append("\\t");
                    break;

                default:
                    if (c < 0x20) {
                        result.append(
                                String.format("\\u%04x", (int) c));
                    } else {
                        result.append(c);
                    }
            }
        }

        return result.append('"').toString();
    }
}
