package com.tap.Dao;
import com.tap.model.*;
import java.util.List;
public interface MenuDao {
	
	void addMenu(Menu menu);
	Menu getMenu(int menuId);
	void updateMenu(Menu menu);
	void deleteMenu(int menuId);
	List<Menu> getMenuByRestaurant(int retaurantId);
	

}
