
package com.tap.DaoImpl;

import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import com.tap.Dao.OrderDao;
import com.tap.model.Order;
import com.tap.util.Dbconnection;

public class OrderDaoImpl implements OrderDao {

    private static final String SELECT_QUERY =
            "SELECT * FROM Orders WHERE orderId=?";

    private static final String INSERT_QUERY =
            "INSERT INTO Orders (restaurantId, userId, orderDate, totalAmount, status, paymentMode) "
            + "VALUES (?, ?, ?, ?, ?, ?)";

    private static final String UPDATE_QUERY =
            "UPDATE Orders SET restaurantId=?, userId=?, orderDate=?, totalAmount=?, "
            + "status=?, paymentMode=? WHERE orderId=?";

    private static final String DELETE_QUERY =
            "DELETE FROM Orders WHERE orderId=?";

    private static final String SELECT_BY_USER_QUERY =
            "SELECT * FROM Orders WHERE userId=?";

    // Cancel only an order belonging to this user
    // and only when its current status is Placed.
    private static final String CANCEL_ORDER_QUERY =
            "UPDATE Orders SET status = 'Cancelled' "
            + "WHERE orderId = ? AND userId = ? "
            + "AND LOWER(TRIM(status)) = 'placed'";

    Connection con = Dbconnection.getConnetion();

    @Override
    public int addOrder(Order order) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return -1;
        }

        try (PreparedStatement ptst = con.prepareStatement(
                INSERT_QUERY, Statement.RETURN_GENERATED_KEYS)) {

            ptst.setInt(1, order.getRestaurantId());
            ptst.setInt(2, order.getUserId());
            ptst.setTimestamp(3, order.getOrderDate());
            ptst.setDouble(4, order.getTotalAmount());
            ptst.setString(5, order.getStatus());
            ptst.setString(6, order.getPaymentMode());

            int rowsInserted = ptst.executeUpdate();

            if (rowsInserted > 0) {
                try (ResultSet rs = ptst.getGeneratedKeys()) {
                    if (rs.next()) {
                        int orderId = rs.getInt(1);
                        order.setOrderId(orderId);

                        System.out.println(
                                "Order added successfully! Order ID: "
                                        + orderId);

                        return orderId;
                    }
                }
            }

            System.out.println("Order insertion failed!");
            return -1;

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Override
    public Order getOrder(int orderId) {

        Order order = null;

        if (con == null) {
            System.out.println("Database connection failed!");
            return null;
        }

        try (PreparedStatement ptst = con.prepareStatement(SELECT_QUERY)) {

            ptst.setInt(1, orderId);

            try (ResultSet res = ptst.executeQuery()) {
                if (res.next()) {
                    int id = res.getInt(1);
                    int restaurantId = res.getInt(2);
                    int userId = res.getInt(3);
                    java.sql.Timestamp orderDate = res.getTimestamp(4);
                    double totalAmount = res.getDouble(5);
                    String status = res.getString(6);
                    String paymentMode = res.getString(7);

                    order = new Order(
                            id,
                            restaurantId,
                            userId,
                            orderDate,
                            totalAmount,
                            status,
                            paymentMode
                    );
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return order;
    }

    @Override
    public void updateOrder(Order order) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return;
        }

        try (PreparedStatement ptst = con.prepareStatement(UPDATE_QUERY)) {

            ptst.setInt(1, order.getRestaurantId());
            ptst.setInt(2, order.getUserId());
            ptst.setTimestamp(3, order.getOrderDate());
            ptst.setDouble(4, order.getTotalAmount());
            ptst.setString(5, order.getStatus());
            ptst.setString(6, order.getPaymentMode());
            ptst.setInt(7, order.getOrderId());

            int rowsUpdated = ptst.executeUpdate();

            if (rowsUpdated > 0) {
                System.out.println("Order updated successfully!");
            } else {
                System.out.println("Failed to update order.");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void deleteOrder(int orderId) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return;
        }

        try (PreparedStatement ptst = con.prepareStatement(DELETE_QUERY)) {

            ptst.setInt(1, orderId);

            int rowsDeleted = ptst.executeUpdate();

            if (rowsDeleted > 0) {
                System.out.println("Order deleted successfully!");
            } else {
                System.out.println("Failed to delete order.");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public List<Order> getOrderByUser(int userId) {

        List<Order> allOrders = new ArrayList<>();

        if (con == null) {
            System.out.println("Database connection failed!");
            return allOrders;
        }

        try (PreparedStatement ptst =
                     con.prepareStatement(SELECT_BY_USER_QUERY)) {

            ptst.setInt(1, userId);

            try (ResultSet res = ptst.executeQuery()) {
                while (res.next()) {
                    int orderId = res.getInt(1);
                    int restaurantId = res.getInt(2);
                    int user = res.getInt(3);
                    java.sql.Timestamp orderDate = res.getTimestamp(4);
                    double totalAmount = res.getDouble(5);
                    String status = res.getString(6);
                    String paymentMode = res.getString(7);

                    Order order = new Order(
                            orderId,
                            restaurantId,
                            user,
                            orderDate,
                            totalAmount,
                            status,
                            paymentMode
                    );

                    allOrders.add(order);
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return allOrders;
    }

    // Cancel an order belonging to this user
    @Override
    public boolean cancelOrder(int orderId, int userId) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return false;
        }

        try (PreparedStatement ptst =
                     con.prepareStatement(CANCEL_ORDER_QUERY)) {

            ptst.setInt(1, orderId);
            ptst.setInt(2, userId);

            int rowsUpdated = ptst.executeUpdate();

            if (rowsUpdated == 1) {
                System.out.println(
                        "Order cancelled successfully! Order ID: "
                                + orderId);
                return true;
            }

            System.out.println(
                    "Order cancellation failed. Order may not exist, "
                    + "belong to this user, or have Placed status.");

            return false;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // =========================================
    // ADMIN DASHBOARD METHODS
    // =========================================

    // Get all orders, newest first
    @Override
    public List<Order> getAllOrders() {

        List<Order> orders = new ArrayList<>();

        if (con == null) {
            System.out.println("Database connection failed!");
            return orders;
        }

        String query =
                "SELECT * FROM Orders ORDER BY orderDate DESC";

        try (PreparedStatement ptst = con.prepareStatement(query);
             ResultSet rs = ptst.executeQuery()) {

            while (rs.next()) {

                Order order = new Order(
                        rs.getInt("orderId"),
                        rs.getInt("restaurantId"),
                        rs.getInt("userId"),
                        rs.getTimestamp("orderDate"),
                        rs.getDouble("totalAmount"),
                        rs.getString("status"),
                        rs.getString("paymentMode")
                );

                orders.add(order);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return orders;
    }

    // Get total number of orders
    @Override
    public int getTotalOrderCount() {

        if (con == null) {
            System.out.println("Database connection failed!");
            return 0;
        }

        String query = "SELECT COUNT(*) FROM Orders";

        try (PreparedStatement ptst = con.prepareStatement(query);
             ResultSet rs = ptst.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return 0;
    }

    // Get total amount excluding cancelled orders
    @Override
    public double getTotalRevenue() {

        if (con == null) {
            System.out.println("Database connection failed!");
            return 0.0;
        }

        String query =
                "SELECT COALESCE(SUM(totalAmount), 0) "
                + "FROM Orders "
                + "WHERE LOWER(TRIM(status)) <> 'cancelled'";

        try (PreparedStatement ptst = con.prepareStatement(query);
             ResultSet rs = ptst.executeQuery()) {

            if (rs.next()) {
                return rs.getDouble(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return 0.0;
    }
    
    @Override
    public boolean updateOrderStatus(int orderId, String status) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return false;
        }

        String query = "UPDATE Orders SET status = ? WHERE orderId = ?";

        try (PreparedStatement ptst = con.prepareStatement(query)) {

            ptst.setString(1, status);
            ptst.setInt(2, orderId);

            int rowsUpdated = ptst.executeUpdate();

            if (rowsUpdated > 0) {
                System.out.println("Order status updated successfully!");
                return true;
            }

            // Also handle an order that already has the requested status.
            Order existingOrder = getOrder(orderId);

            return existingOrder != null
                    && status.equalsIgnoreCase(existingOrder.getStatus());

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
