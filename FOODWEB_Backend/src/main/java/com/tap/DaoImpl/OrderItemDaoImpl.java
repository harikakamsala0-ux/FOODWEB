package com.tap.DaoImpl;

import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.tap.Dao.OrderItemDao;
import com.tap.model.OrderItem;
import com.tap.util.Dbconnection;

public class OrderItemDaoImpl implements OrderItemDao {

    private static final String SELECT_QUERY =
            "SELECT * FROM OrderItem WHERE orderItemId=?";

    private static final String INSERT_QUERY =
            "INSERT INTO OrderItem(orderId, menuId, quantity, totalAmount) "
            + "VALUES (?, ?, ?, ?)";

    private static final String UPDATE_QUERY =
            "UPDATE OrderItem SET orderId=?, menuId=?, quantity=?, totalAmount=? "
            + "WHERE orderItemId=?";

    private static final String DELETE_QUERY =
            "DELETE FROM OrderItem WHERE orderItemId=?";

    private static final String SELECT_ALL_QUERY =
            "SELECT * FROM OrderItem WHERE orderId=?";

    Connection con = Dbconnection.getConnetion();


   

	@Override
	public boolean addOrderItem(OrderItem orderItem) {
	
	    if (con == null) {
	        System.out.println("Database connection failed!");
	        return false;
	    }
	
	    try (PreparedStatement ptst = con.prepareStatement(INSERT_QUERY)) {
	
	        ptst.setInt(1, orderItem.getOrderId());
	        ptst.setInt(2, orderItem.getMenuId());
	        ptst.setInt(3, orderItem.getQuantity());
	        ptst.setDouble(4, orderItem.getTotalAmount());
	
	        int i = ptst.executeUpdate();
	
	        if (i > 0) {
	            System.out.println("OrderItem added successfully!");
	            return true;
	        } else {
	            System.out.println("OrderItem insertion failed!");
	            return false;
	        }
	
	    } catch (SQLException e) {
	        e.printStackTrace();
	        return false;
	    }
	}


    @Override
    public OrderItem getOrderItem(int orderItemId) {

        OrderItem orderItem = null;

        try (PreparedStatement ptst = con.prepareStatement(SELECT_QUERY)) {

            ptst.setInt(1, orderItemId);

            ResultSet res = ptst.executeQuery();

            if (res.next()) {

                int id = res.getInt(1);
                int orderId = res.getInt(2);
                int menuId = res.getInt(3);
                int quantity = res.getInt(4);
                double totalAmount = res.getDouble(5);

                orderItem = new OrderItem(
                        id,
                        orderId,
                        menuId,
                        quantity,
                        totalAmount
                );
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return orderItem;
    }


    @Override
    public void updateOrderItem(OrderItem orderItem) {

        try (PreparedStatement ptst = con.prepareStatement(UPDATE_QUERY)) {

            ptst.setInt(1, orderItem.getOrderId());
            ptst.setInt(2, orderItem.getMenuId());
            ptst.setInt(3, orderItem.getQuantity());
            ptst.setDouble(4, orderItem.getTotalAmount());
            ptst.setInt(5, orderItem.getOrderItemId());

            int i = ptst.executeUpdate();

            if (i > 0) {
                System.out.println("OrderItem Updated Successfully");
            } else {
                System.out.println("Failed to Update OrderItem");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    @Override
    public void deleteOrderItem(int orderItemId) {

        try (PreparedStatement ptst = con.prepareStatement(DELETE_QUERY)) {

            ptst.setInt(1, orderItemId);

            int i = ptst.executeUpdate();

            if (i > 0) {
                System.out.println("OrderItem Deleted Successfully");
            } else {
                System.out.println("Failed to Delete OrderItem");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    @Override
    public List<OrderItem> getAllOrderItem(int orderId) {

        List<OrderItem> allOrderItems = new ArrayList<>();

        try (PreparedStatement ptst =
                     con.prepareStatement(SELECT_ALL_QUERY)) {

            ptst.setInt(1, orderId);

            ResultSet res = ptst.executeQuery();

            while (res.next()) {

                int orderItemId = res.getInt(1);
                int order = res.getInt(2);
                int menuId = res.getInt(3);
                int quantity = res.getInt(4);
                double totalAmount = res.getDouble(5);

                OrderItem orderItem = new OrderItem(
                        orderItemId,
                        order,
                        menuId,
                        quantity,
                        totalAmount
                );

                allOrderItems.add(orderItem);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return allOrderItems;
    }
}