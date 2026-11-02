package com.tap.controller;

import java.io.IOException;
import java.util.List;

import com.google.gson.Gson;
import com.tap.DaoImpl.RestaurantDaoImpl;
import com.tap.model.Restaurant;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/restaurants")
public class RestaurantServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
    private RestaurantDaoImpl rdao;

    @Override
    public void init() throws ServletException {
        rdao = new RestaurantDaoImpl();
    }

    // CORS configuration for React frontend
    private void setCorsHeaders(
            HttpServletRequest req,
            HttpServletResponse res) {

        String origin = req.getHeader("Origin");

        if ("http://localhost:5173".equals(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Vary", "Origin");
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Accept"
        );
    }

    // Handle CORS preflight requests
    @Override
    protected void doOptions(
            HttpServletRequest req,
            HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(req, res);
        res.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(
            HttpServletRequest req,
            HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(req, res);

        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");

        try {
            List<Restaurant> allRestaurants =
                    rdao.getAllRestaurants();

            Gson gson = new Gson();
            String json = gson.toJson(allRestaurants);

            res.setStatus(HttpServletResponse.SC_OK);
            res.getWriter().write(json);

        } catch (Exception e) {
            e.printStackTrace();

            res.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );

            res.getWriter().write(
                    "{\"error\":\"Unable to fetch restaurants\"}"
            );
        }
    }
}