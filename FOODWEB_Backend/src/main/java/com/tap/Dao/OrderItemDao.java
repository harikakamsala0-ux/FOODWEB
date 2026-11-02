package com.tap.Dao;
import com.tap.model.*;
import java.util.*;

public interface OrderItemDao {
	boolean addOrderItem(OrderItem orderItem);
	OrderItem getOrderItem(int orderItemId);
	void updateOrderItem(OrderItem orderItem);
	void deleteOrderItem(int orderItemId);
	List<OrderItem> getAllOrderItem(int orderId);	

}
