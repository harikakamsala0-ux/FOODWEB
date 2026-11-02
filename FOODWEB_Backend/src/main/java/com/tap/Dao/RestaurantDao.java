
package com.tap.Dao;

import com.tap.model.*;
import java.util.*;

public interface RestaurantDao {

    void addRestaurant(Restaurant restaurant);

    Restaurant getRestaurant(int restaurantId);

    void updateRestaurant(Restaurant restaurant);

    void deleteRestaurant(int restaurantId);

    List<Restaurant> getAllRestaurants();

    // Admin Dashboard
    int getTotalRestaurantCount();
}

