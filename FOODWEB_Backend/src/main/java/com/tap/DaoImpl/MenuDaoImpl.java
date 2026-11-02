package com.tap.DaoImpl;

import java.util.ArrayList;
import java.util.List;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
//import java.sql.Statement;

import com.tap.Dao.MenuDao;
import com.tap.model.Menu;
import com.tap.util.Dbconnection;

public class MenuDaoImpl implements MenuDao {

    private static final String SELECT_QUERY =
            "SELECT * FROM Menu WHERE menuId=?";

    private static final String INSERT_QUERY =
            "INSERT INTO Menu(restaurantId, itemName, description, price, isAvailable, rating, imagePath) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?)";

    private static final String UPDATE_QUERY =
            "UPDATE Menu SET restaurantId=?, itemName=?, description=?, price=?, "
            + "isAvailable=?, rating=?, imagePath=? WHERE menuId=?";

    private static final String DELETE_QUERY =
            "DELETE FROM Menu WHERE menuId=?";

    private static final String SELECT_BY_RESTAURANT_QUERY =
            "SELECT * FROM Menu WHERE restaurantId=?";

    Connection con = Dbconnection.getConnetion();


    @Override
    public void addMenu(Menu menu) {

        if (con == null) {
            System.out.println("Database connection failed!");
            return;
        }

        try (PreparedStatement ptst = con.prepareStatement(INSERT_QUERY)) {

            ptst.setInt(1, menu.getRestaurantId());
            ptst.setString(2, menu.getItemName());
            ptst.setString(3, menu.getDescription());
            ptst.setDouble(4, menu.getPrice());
            ptst.setBoolean(5, menu.getIsAvailable());
            ptst.setFloat(6, menu.getRating());
            ptst.setString(7, menu.getImagePath());

            int i = ptst.executeUpdate();

            if (i > 0) {
                System.out.println("Menu added successfully!");
            } else {
                System.out.println("Menu insertion failed!");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    @Override
    public Menu getMenu(int menuId) {

        Menu menu = null;

        try (PreparedStatement ptst = con.prepareStatement(SELECT_QUERY)) {

            ptst.setInt(1, menuId);

            ResultSet res = ptst.executeQuery();

            if (res.next()) {

                int id = res.getInt(1);
                int restaurantId = res.getInt(2);
                String itemName = res.getString(3);
                String description = res.getString(4);
                double price = res.getDouble(5);
                boolean isAvailable = res.getBoolean(6);
                float rating = res.getFloat(7);
                String imagePath = res.getString(8);

                menu = new Menu(
                        id,
                        restaurantId,
                        itemName,
                        description,
                        price,
                        isAvailable,
                        rating,
                        imagePath
                );
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return menu;
    }


    @Override
    public void updateMenu(Menu menu) {

        try (PreparedStatement ptst = con.prepareStatement(UPDATE_QUERY)) {

            ptst.setInt(1, menu.getRestaurantId());
            ptst.setString(2, menu.getItemName());
            ptst.setString(3, menu.getDescription());
            ptst.setDouble(4, menu.getPrice());
            ptst.setBoolean(5, menu.getIsAvailable());
            ptst.setFloat(6, menu.getRating());
            ptst.setString(7, menu.getImagePath());
            ptst.setInt(8, menu.getMenuId());

            int i = ptst.executeUpdate();

            if (i > 0) {
                System.out.println("Menu Updated Successfully");
            } else {
                System.out.println("Failed to Update Menu");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    @Override
    public void deleteMenu(int menuId) {

        try (PreparedStatement ptst = con.prepareStatement(DELETE_QUERY)) {

            ptst.setInt(1, menuId);

            int i = ptst.executeUpdate();

            if (i > 0) {
                System.out.println("Menu Deleted Successfully");
            } else {
                System.out.println("Failed to Delete Menu");
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    @Override
    public List<Menu> getMenuByRestaurant(int retaurantId) {

        List<Menu> allMenus = new ArrayList<>();

        try (PreparedStatement ptst =
                     con.prepareStatement(SELECT_BY_RESTAURANT_QUERY)) {

            ptst.setInt(1, retaurantId);

            ResultSet res = ptst.executeQuery();

            while (res.next()) {

                int menuId = res.getInt(1);
                int restaurantId = res.getInt(2);
                String itemName = res.getString(3);
                String description = res.getString(4);
                double price = res.getDouble(5);
                boolean isAvailable = res.getBoolean(6);
                float rating = res.getFloat(7);
                String imagePath = res.getString(8);

                Menu menu = new Menu(
                        menuId,
                        restaurantId,
                        itemName,
                        description,
                        price,
                        isAvailable,
                        rating,
                        imagePath
                );

                allMenus.add(menu);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return allMenus;
    }
}