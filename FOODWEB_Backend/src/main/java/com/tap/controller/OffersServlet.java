
package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/offers")
public class OffersServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private static final Gson gson =
            new GsonBuilder().setPrettyPrinting().create();

    // Store offers outside the deployed web application.
    private static final Path OFFERS_FILE = Paths.get(
            System.getProperty("user.home"),
            "FOODWEB-data",
            "offers.json"
    );

    // -----------------------------------------
    // CORS
    // -----------------------------------------

    private void setCorsHeaders(HttpServletResponse response) {
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
    }

    @Override
    protected void doOptions(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    // -----------------------------------------
    // ADMIN SESSION CHECK
    // -----------------------------------------

    private boolean isAdmin(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            return false;
        }

        Object role = session.getAttribute("role");

        return role != null &&
                "ADMIN".equalsIgnoreCase(role.toString().trim());
    }

    // -----------------------------------------
    // JSON RESPONSE
    // -----------------------------------------

    private void sendJson(
            HttpServletResponse response,
            int status,
            Object data
    ) throws IOException {

        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(gson.toJson(data));
    }

    private JsonObject message(boolean success, String message) {

        JsonObject result = new JsonObject();

        result.addProperty("success", success);
        result.addProperty("message", message);

        return result;
    }

    // -----------------------------------------
    // READ OFFERS JSON FILE
    // -----------------------------------------

    private JsonArray readOffers() throws IOException {

        Files.createDirectories(OFFERS_FILE.getParent());

        if (!Files.exists(OFFERS_FILE)) {

            Files.writeString(
                    OFFERS_FILE,
                    "[]",
                    StandardCharsets.UTF_8
            );
        }

        String content = Files.readString(
                OFFERS_FILE,
                StandardCharsets.UTF_8
        );

        JsonElement element = JsonParser.parseString(content);

        if (!element.isJsonArray()) {
            throw new IOException("Invalid offers.json format.");
        }

        return element.getAsJsonArray();
    }

    // -----------------------------------------
    // SAVE OFFERS JSON FILE
    // -----------------------------------------

    private void saveOffers(JsonArray offers) throws IOException {

        Files.createDirectories(OFFERS_FILE.getParent());

        Path temporaryFile = OFFERS_FILE.resolveSibling("offers.tmp");

        Files.writeString(
                temporaryFile,
                gson.toJson(offers),
                StandardCharsets.UTF_8
        );

        try {
            Files.move(
                    temporaryFile,
                    OFFERS_FILE,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING,
                    java.nio.file.StandardCopyOption.ATOMIC_MOVE
            );
        } catch (java.nio.file.AtomicMoveNotSupportedException e) {
            Files.move(
                    temporaryFile,
                    OFFERS_FILE,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING
            );
        }
    }

    // -----------------------------------------
    // READ REQUEST BODY
    // -----------------------------------------

    private JsonObject readRequestBody(
            HttpServletRequest request
    ) throws IOException {

        StringBuilder body = new StringBuilder();

        try (BufferedReader reader = request.getReader()) {

            String line;

            while ((line = reader.readLine()) != null) {
                body.append(line);
            }
        }

        JsonElement element = JsonParser.parseString(body.toString());

        if (!element.isJsonObject()) {
            throw new IllegalArgumentException("Invalid JSON request.");
        }

        return element.getAsJsonObject();
    }

    // -----------------------------------------
    // VALIDATE OFFER
    // -----------------------------------------

    private String validateOffer(JsonObject offer) {

        if (!offer.has("code") ||
                offer.get("code").isJsonNull() ||
                offer.get("code").getAsString().trim().isEmpty()) {

            return "Coupon code is required.";
        }

        if (!offer.has("title") ||
                offer.get("title").isJsonNull() ||
                offer.get("title").getAsString().trim().isEmpty()) {

            return "Offer title is required.";
        }

        if (!offer.has("discountType") ||
                offer.get("discountType").isJsonNull()) {

            return "Discount type is required.";
        }

        String type = offer.get("discountType")
                .getAsString()
                .trim()
                .toUpperCase();

        if (!type.equals("PERCENT") && !type.equals("FLAT")) {
            return "Discount type must be PERCENT or FLAT.";
        }

        try {

            double discountValue =
                    offer.get("discountValue").getAsDouble();

            double minOrderAmount =
                    offer.get("minOrderAmount").getAsDouble();

            if (discountValue <= 0 || minOrderAmount < 0) {
                return "Enter valid discount and minimum order values.";
            }

            if (type.equals("PERCENT") && discountValue > 100) {
                return "Percentage discount cannot exceed 100.";
            }

            if (type.equals("FLAT") && discountValue > minOrderAmount
                    && minOrderAmount > 0) {
                return "Flat discount cannot exceed the minimum order amount.";
            }

            if (type.equals("PERCENT")) {

                double maxDiscount =
                        offer.get("maxDiscount").getAsDouble();

                if (maxDiscount <= 0) {
                    return "Maximum discount must be greater than zero.";
                }
            }

        } catch (Exception e) {
            return "Enter valid numeric discount details.";
        }

        return null;
    }

    // -----------------------------------------
    // GET OFFERS
    // -----------------------------------------

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        setCorsHeaders(response);

        boolean adminRequest =
                "true".equalsIgnoreCase(request.getParameter("admin"));

        if (adminRequest && !isAdmin(request)) {

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    message(false, "Admin login required.")
            );

            return;
        }

        try {

            JsonArray offers = readOffers();
            JsonArray result = new JsonArray();

            for (JsonElement element : offers) {

                JsonObject offer = element.getAsJsonObject();

                boolean active = offer.has("active") &&
                        offer.get("active").getAsBoolean();

                if (adminRequest || active) {
                    result.add(offer.deepCopy());
                }
            }

            sendJson(response, HttpServletResponse.SC_OK, result);

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    message(false, "Unable to fetch offers.")
            );
        }
    }

    // -----------------------------------------
    // CREATE OFFER
    // -----------------------------------------

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        setCorsHeaders(response);

        if (!isAdmin(request)) {

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    message(false, "Admin login required.")
            );

            return;
        }

        try {

            JsonObject offer = readRequestBody(request);

            String validationError = validateOffer(offer);

            if (validationError != null) {

                sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        message(false, validationError)
                );

                return;
            }

            JsonArray offers = readOffers();

            String code = offer.get("code")
                    .getAsString()
                    .trim()
                    .toUpperCase();

            for (JsonElement element : offers) {

                String existingCode = element.getAsJsonObject()
                        .get("code")
                        .getAsString();

                if (existingCode.equalsIgnoreCase(code)) {

                    sendJson(
                            response,
                            HttpServletResponse.SC_CONFLICT,
                            message(false, "Coupon code already exists.")
                    );

                    return;
                }
            }

            int nextId = 1;

            for (JsonElement element : offers) {

                int existingId = element.getAsJsonObject()
                        .get("offerId")
                        .getAsInt();

                nextId = Math.max(nextId, existingId + 1);
            }

            JsonObject newOffer = offer.deepCopy();

            newOffer.addProperty("offerId", nextId);
            newOffer.addProperty("code", code);
            newOffer.addProperty(
                    "discountType",
                    offer.get("discountType").getAsString().toUpperCase()
            );

            if (!newOffer.has("description") ||
                    newOffer.get("description").isJsonNull()) {
                newOffer.addProperty("description", "");
            }

            if (!newOffer.has("maxDiscount") ||
                    newOffer.get("maxDiscount").isJsonNull()) {
                newOffer.addProperty("maxDiscount", 0);
            }

            newOffer.addProperty("active", true);
            newOffer.addProperty(
                    "createdAt",
                    java.time.LocalDateTime.now().toString()
            );

            offers.add(newOffer);

            saveOffers(offers);

            sendJson(
                    response,
                    HttpServletResponse.SC_CREATED,
                    message(true, "Offer created successfully.")
            );

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    message(false, "Unable to create offer.")
            );
        }
    }

    // -----------------------------------------
    // UPDATE OFFER
    // -----------------------------------------

    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        setCorsHeaders(response);

        if (!isAdmin(request)) {

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    message(false, "Admin login required.")
            );

            return;
        }

        try {

            JsonObject updatedData = readRequestBody(request);

            if (!updatedData.has("offerId")) {

                sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        message(false, "Offer ID is required.")
                );

                return;
            }

            int offerId = updatedData.get("offerId").getAsInt();

            JsonArray offers = readOffers();

            for (int i = 0; i < offers.size(); i++) {

                JsonObject existing = offers.get(i).getAsJsonObject();

                if (existing.get("offerId").getAsInt() == offerId) {

                    JsonObject merged = existing.deepCopy();

                    for (Map.Entry<String, JsonElement> entry
                            : updatedData.entrySet()) {

                        String key = entry.getKey();

                        if (!key.equals("offerId") &&
                                !key.equals("createdAt")) {

                            merged.add(key, entry.getValue());
                        }
                    }

                    String validationError = validateOffer(merged);

                    if (validationError != null) {

                        sendJson(
                                response,
                                HttpServletResponse.SC_BAD_REQUEST,
                                message(false, validationError)
                        );

                        return;
                    }

                    merged.addProperty(
                            "code",
                            merged.get("code").getAsString()
                                    .trim().toUpperCase()
                    );

                    merged.addProperty(
                            "discountType",
                            merged.get("discountType").getAsString()
                                    .trim().toUpperCase()
                    );

                    // Prevent duplicate coupon codes.
                    for (JsonElement otherElement : offers) {

                        JsonObject other = otherElement.getAsJsonObject();

                        if (other.get("offerId").getAsInt() != offerId &&
                                other.get("code").getAsString()
                                        .equalsIgnoreCase(
                                                merged.get("code").getAsString()
                                        )) {

                            sendJson(
                                    response,
                                    HttpServletResponse.SC_CONFLICT,
                                    message(false, "Coupon code already exists.")
                            );

                            return;
                        }
                    }

                    offers.set(i, merged);

                    saveOffers(offers);

                    sendJson(
                            response,
                            HttpServletResponse.SC_OK,
                            message(true, "Offer updated successfully.")
                    );

                    return;
                }
            }

            sendJson(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    message(false, "Offer not found.")
            );

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    message(false, "Unable to update offer.")
            );
        }
    }

    // -----------------------------------------
    // DELETE OFFER
    // -----------------------------------------

    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {

        setCorsHeaders(response);

        if (!isAdmin(request)) {

            sendJson(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    message(false, "Admin login required.")
            );

            return;
        }

        try {

            String idValue = request.getParameter("offerId");

            if (idValue == null || idValue.trim().isEmpty()) {

                sendJson(
                        response,
                        HttpServletResponse.SC_BAD_REQUEST,
                        message(false, "Offer ID is required.")
                );

                return;
            }

            int offerId = Integer.parseInt(idValue);

            JsonArray offers = readOffers();
            JsonArray updatedOffers = new JsonArray();

            boolean found = false;

            for (JsonElement element : offers) {

                JsonObject offer = element.getAsJsonObject();

                if (offer.get("offerId").getAsInt() == offerId) {
                    found = true;
                } else {
                    updatedOffers.add(offer.deepCopy());
                }
            }

            if (!found) {

                sendJson(
                        response,
                        HttpServletResponse.SC_NOT_FOUND,
                        message(false, "Offer not found.")
                );

                return;
            }

            saveOffers(updatedOffers);

            sendJson(
                    response,
                    HttpServletResponse.SC_OK,
                    message(true, "Offer deleted successfully.")
            );

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    message(false, "Unable to delete offer.")
            );
        }
    }
}
