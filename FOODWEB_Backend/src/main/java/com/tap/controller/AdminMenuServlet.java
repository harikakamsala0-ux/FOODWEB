
package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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

@WebServlet("/api/admin/menu")
public class AdminMenuServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private MenuDaoImpl menuDao;
    private RestaurantDaoImpl restaurantDao;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        menuDao = new MenuDaoImpl();
        restaurantDao = new RestaurantDaoImpl();
        gson = new Gson();
    }

    // CORS configuration
    @Override
    protected void service(
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
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        response.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With"
        );

        response.setHeader("Vary", "Origin");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }

        super.service(request, response);
    }

    // Check admin login
    private boolean isAdmin(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return false;
        }

        return "ADMIN".equalsIgnoreCase(
                String.valueOf(session.getAttribute("role"))
        );
    }

    // GET - View all menu items across all restaurants
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (!isAdmin(request)) {
                sendError(response, 401, "Admin login required");
                return;
            }

            List<Menu> allMenus = new ArrayList<>();

            List<Restaurant> restaurants =
                    restaurantDao.getAllRestaurants();

            for (Restaurant restaurant : restaurants) {

                List<Menu> restaurantMenus =
                        menuDao.getMenuByRestaurant(
                                restaurant.getRestaurantId()
                        );

                if (restaurantMenus != null) {
                    allMenus.addAll(restaurantMenus);
                }
            }

            response.getWriter().write(gson.toJson(allMenus));

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to fetch menu items");
        }
    }

    // POST - Add menu item
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (!isAdmin(request)) {
                sendError(response, 401, "Admin login required");
                return;
            }

            Menu menu = readMenu(request);

            if (menu == null) {
                sendError(response, 400, "Invalid menu data");
                return;
            }

            if (!isValidMenu(menu)) {
                sendError(response, 400, "Please provide valid menu details");
                return;
            }

            Restaurant restaurant =
                    restaurantDao.getRestaurant(menu.getRestaurantId());

            if (restaurant == null) {
                sendError(response, 400, "Selected restaurant does not exist");
                return;
            }

            menuDao.addMenu(menu);

            response.setStatus(HttpServletResponse.SC_CREATED);

            response.getWriter().write(
                    "{\"message\":\"Menu item added successfully\"}"
            );

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to add menu item");
        }
    }

    // PUT - Update menu item
    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (!isAdmin(request)) {
                sendError(response, 401, "Admin login required");
                return;
            }

            Menu menu = readMenu(request);

            if (menu == null || menu.getMenuId() <= 0) {
                sendError(response, 400, "Valid menuId is required");
                return;
            }

            if (!isValidMenu(menu)) {
                sendError(response, 400, "Please provide valid menu details");
                return;
            }

            Restaurant restaurant =
                    restaurantDao.getRestaurant(menu.getRestaurantId());

            if (restaurant == null) {
                sendError(response, 400, "Selected restaurant does not exist");
                return;
            }

            Menu existingMenu = menuDao.getMenu(menu.getMenuId());

            if (existingMenu == null) {
                sendError(response, 404, "Menu item not found");
                return;
            }

            menuDao.updateMenu(menu);

            response.getWriter().write(
                    "{\"message\":\"Menu item updated successfully\"}"
            );

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to update menu item");
        }
    }

    // DELETE - Deactivate menu item instead of physical deletion
    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            if (!isAdmin(request)) {
                sendError(response, 401, "Admin login required");
                return;
            }

            String idValue = request.getParameter("menuId");

            if (idValue == null || idValue.trim().isEmpty()) {
                sendError(response, 400, "menuId is required");
                return;
            }

            int menuId = Integer.parseInt(idValue);

            if (menuId <= 0) {
                sendError(response, 400, "Invalid menuId");
                return;
            }

            Menu menu = menuDao.getMenu(menuId);

            if (menu == null) {
                sendError(response, 404, "Menu item not found");
                return;
            }

            // Preserve the menu record and mark it unavailable.
            menu.setIsAvailable(false);
            menuDao.updateMenu(menu);

            response.getWriter().write(
                    "{\"message\":\"Menu item deactivated successfully\"}"
            );

        } catch (NumberFormatException e) {
            sendError(response, 400, "Invalid menuId");

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, 500, "Unable to deactivate menu item");
        }
    }

    private boolean isValidMenu(Menu menu) {

        return menu.getRestaurantId() > 0
                && menu.getItemName() != null
                && !menu.getItemName().trim().isEmpty()
                && menu.getPrice() >= 0
                && menu.getRating() >= 0
                && menu.getRating() <= 5;
    }

    // Read JSON request body
    private Menu readMenu(HttpServletRequest request)
            throws IOException {

        StringBuilder json = new StringBuilder();
        String line;

        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
        }

        if (json.length() == 0) {
            return null;
        }

        return gson.fromJson(json.toString(), Menu.class);
    }

    // Common JSON error response
    private void sendError(
            HttpServletResponse response,
            int status,
            String message) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(
                gson.toJson(Collections.singletonMap("error", message))
        );
    }
}
