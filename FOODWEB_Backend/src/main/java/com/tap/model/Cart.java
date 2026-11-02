
package com.tap.model;

import java.util.HashMap;
import java.util.Map;

public class Cart {

    private int restaurantId;

    private Map<Integer, CartItem> items = new HashMap<>();

    public Cart() {
        this.restaurantId = 0;
    }

    public Cart(int restaurantId) {
        this.restaurantId = restaurantId;
    }

    public int getRestaurantId() {
        return restaurantId;
    }

    public Map<Integer, CartItem> getItems() {
        return items;
    }

    // Add an item or increase its quantity
    public void addItem(Menu menu, int quantity) {

    	if (menu == null || quantity <= 0) {
    	    throw new IllegalArgumentException(
    	        "Menu and positive quantity are required"
    	    );
    	}

    	if (items.isEmpty()) {
    	    restaurantId = menu.getRestaurantId();
    	} else if (menu.getRestaurantId() != restaurantId) {
    	    throw new IllegalArgumentException(
    	        "Item belongs to a different restaurant"
    	    );
    	}

        int menuId = menu.getMenuId();

        if (items.containsKey(menuId)) {
            CartItem cartItem = items.get(menuId);

            cartItem.setQuantity(
                cartItem.getQuantity() + quantity
            );
        } else {
            items.put(
                menuId,
                new CartItem(menu, quantity)
            );
        }
    }

    // Remove an item completely
    public void removeItem(int menuId) {
        items.remove(menuId);
    }

    // Update quantity; zero removes the item
    public void updateQuantity(int menuId, int quantity) {

        if (!items.containsKey(menuId)) {
            throw new IllegalArgumentException(
                "Item not found in cart"
            );
        }

        if (quantity <= 0) {
            removeItem(menuId);
        } else {
            items.get(menuId).setQuantity(quantity);
        }
    }

    // Calculate total price
    public double getTotalAmount() {
        double total = 0;

        for (CartItem item : items.values()) {
            total += item.getSubtotal();
        }

        return total;
    }

    // Total number of units
    public int getTotalItems() {
        int count = 0;

        for (CartItem item : items.values()) {
            count += item.getQuantity();
        }

        return count;
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public void clearCart() {
        items.clear();
    }
}
