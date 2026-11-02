
package com.tap.util;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

import com.tap.model.User;

public class GetUser {

    public static User extractUserFromResultSet(ResultSet res)
            throws SQLException {

        if (res == null || !res.next()) {
            return null;
        }

        int id = res.getInt("userId");
        String name = res.getString("userName");
        String password = res.getString("password");
        String email = res.getString("email");
        String phone = res.getString("phone");
        String address = res.getString("address");
        String role = res.getString("role");
        Timestamp createdDate = res.getTimestamp("createdDate");
        Timestamp lastLoginDate = res.getTimestamp("lastLoginDate");

        return new User(
            id,
            name,
            password,
            email,
            phone,
            address,
            role,
            createdDate,
            lastLoginDate
        );
    }
}
