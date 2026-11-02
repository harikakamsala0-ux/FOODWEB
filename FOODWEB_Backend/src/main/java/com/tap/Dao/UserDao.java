
package com.tap.Dao;

import java.sql.SQLException;
import java.util.List;

import com.tap.model.User;

public interface UserDao {

    void addUser(User user);

    User getUser(int userId);

    User getUserByEmail(String email);

    void updateUser(User user);

    boolean updateProfile(
        int userId,
        String userName,
        String email,
        String phone,
        String address
    ) throws SQLException;

    void deleteUser(int userId);

    List<User> getAllUsers();
 // Admin Dashboard: count registered customers
    int getTotalCustomerCount();
}
