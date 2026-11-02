
package com.tap.Dao;

import java.util.List;
import com.tap.model.*;

public interface OrderDao {

    int addOrder(Order order);

    Order getOrder(int orderId);

    void updateOrder(Order order);

    void deleteOrder(int orderId);

    List<Order> getOrderByUser(int userId);

    boolean cancelOrder(int orderId, int userId);

    // Admin Dashboard methods
    List<Order> getAllOrders();

    int getTotalOrderCount();

    double getTotalRevenue();
    boolean updateOrderStatus(int orderId, String status);
}
