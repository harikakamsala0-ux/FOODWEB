package com.tap.util;

import java.sql.ResultSet;
import java.sql.SQLException;


import com.tap.model.Restaurant;

public class GetRestaurant {

    public static Restaurant extractRestaurantFromResultSet(ResultSet res) throws SQLException {

        if (res.next()) {

            int restaurantId = res.getInt(1);
            String name = res.getString(2);
            String address = res.getString(3);
            String phone = res.getString(4);
            String cuisineType = res.getString(5);
            String delivaryTime = res.getString("delivaryTime");
            float rating = res.getFloat(7);
            boolean isActive = res.getBoolean(8);
            String imagePath = res.getString(9);
            int adminUserId = res.getInt(10);

            return new Restaurant(
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
        }

        return null;
    }
}