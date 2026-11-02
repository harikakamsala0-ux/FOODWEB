
package com.tap.DaoImpl;

import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import com.tap.Dao.RestaurantDao;
import com.tap.model.Restaurant;
import com.tap.util.Dbconnection;
import com.tap.util.GetRestaurant;

public class RestaurantDaoImpl implements RestaurantDao {

    private static final String SELECT_QUERY =
            "SELECT * FROM Restaurant WHERE restaurantId=?";

    private static final String INSERT_QUERY =
            "INSERT INTO Restaurant(name, address, phone, cuisineType, delivaryTime, rating, isActive, imagePath, adminUserId) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    // adminUserId is intentionally NOT updated.
    private static final String UPDATE_QUERY =
            "UPDATE Restaurant SET name=?, address=?, phone=?, cuisineType=?, delivaryTime=?, "
            + "rating=?, isActive=?, imagePath=? WHERE restaurantId=?";

    // Soft delete: preserve menu items and order history.
    private static final String DELETE_QUERY =
            "UPDATE Restaurant SET isActive=false WHERE restaurantId=?";

    private static final String SELECT_ALL_QUERY =
            "SELECT * FROM Restaurant";

    private final Connection con = Dbconnection.getConnetion();

    @Override
    public void addRestaurant(Restaurant restaurant) {

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        try (PreparedStatement ptst = con.prepareStatement(INSERT_QUERY)) {

            ptst.setString(1, restaurant.getName());
            ptst.setString(2, restaurant.getAddress());
            ptst.setString(3, restaurant.getPhone());
            ptst.setString(4, restaurant.getCuisineType());
            ptst.setString(5, restaurant.getDelivaryTime());
            ptst.setFloat(6, restaurant.getRating());
            ptst.setBoolean(7, restaurant.getIsActive());
            ptst.setString(8, restaurant.getImagePath());
            ptst.setInt(9, restaurant.getAdminUserId());

            int rows = ptst.executeUpdate();

            if (rows == 0) {
                throw new IllegalStateException("Restaurant was not added.");
            }

            System.out.println("Restaurant added successfully!");

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to add restaurant: " + e.getMessage(), e);
        }
    }

    @Override
    public Restaurant getRestaurant(int restaurantId) {

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        try (PreparedStatement ptst = con.prepareStatement(SELECT_QUERY)) {

            ptst.setInt(1, restaurantId);

            try (ResultSet res = ptst.executeQuery()) {
                return GetRestaurant.extractRestaurantFromResultSet(res);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to fetch restaurant.", e);
        }
    }

    @Override
    public void updateRestaurant(Restaurant restaurant) {

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        try (PreparedStatement ptst = con.prepareStatement(UPDATE_QUERY)) {

            ptst.setString(1, restaurant.getName());
            ptst.setString(2, restaurant.getAddress());
            ptst.setString(3, restaurant.getPhone());
            ptst.setString(4, restaurant.getCuisineType());
            ptst.setString(5, restaurant.getDelivaryTime());
            ptst.setFloat(6, restaurant.getRating());
            ptst.setBoolean(7, restaurant.getIsActive());
            ptst.setString(8, restaurant.getImagePath());
            ptst.setInt(9, restaurant.getRestaurantId());

            int rows = ptst.executeUpdate();

            if (rows == 0) {
                throw new IllegalStateException("Restaurant not found.");
            }

            System.out.println("Restaurant updated successfully!");

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to update restaurant: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteRestaurant(int restaurantId) {

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        try (PreparedStatement ptst = con.prepareStatement(DELETE_QUERY)) {

            ptst.setInt(1, restaurantId);

            int rows = ptst.executeUpdate();

            if (rows == 0) {
                throw new IllegalStateException("Restaurant not found.");
            }

            System.out.println("Restaurant deactivated successfully!");

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to deactivate restaurant: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Restaurant> getAllRestaurants() {

        List<Restaurant> allRestaurants = new ArrayList<>();

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        try (Statement st = con.createStatement();
             ResultSet res = st.executeQuery(SELECT_ALL_QUERY)) {

            while (res.next()) {

                int restaurantId = res.getInt("restaurantId");
                String name = res.getString("name");
                String address = res.getString("address");
                String phone = res.getString("phone");
                String cuisineType = res.getString("cuisineType");
                String delivaryTime = res.getString("delivaryTime");
                float rating = res.getFloat("rating");
                boolean isActive = res.getBoolean("isActive");
                String imagePath = res.getString("imagePath");
                int adminUserId = res.getInt("adminUserId");

                Restaurant restaurant = new Restaurant(
                        restaurantId,
                        name,
                        address,
                        phone,
                        cuisineType,
                        delivaryTime,
                        rating,
                        isActive,
                        imagePath,
                        adminUserId
                );

                allRestaurants.add(restaurant);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to fetch restaurants.", e);
        }

        return allRestaurants;
    }

    // Admin Dashboard
    @Override
    public int getTotalRestaurantCount() {

        if (con == null) {
            throw new IllegalStateException("Database connection failed!");
        }

        String query = "SELECT COUNT(*) FROM Restaurant";

        try (PreparedStatement ptst = con.prepareStatement(query);
             ResultSet rs = ptst.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw new IllegalStateException("Unable to count restaurants.", e);
        }

        return 0;
    }
}
