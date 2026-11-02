
package com.tap.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PasswordMigration {

    public static void main(String[] args) {

        Connection con = null;

        int migrated = 0;
        int alreadyHashed = 0;
        int skipped = 0;

        try {
            // Get database connection
            con = Dbconnection.getConnetion();

            if (con == null) {
                throw new SQLException("Database connection failed.");
            }

            // Start transaction
            con.setAutoCommit(false);

            List<Integer> userIds = new ArrayList<>();
            List<String> passwords = new ArrayList<>();

            String selectSQL =
                "SELECT userId, password FROM User";

            try (PreparedStatement ps =
                    con.prepareStatement(selectSQL);
                 ResultSet rs = ps.executeQuery()) {

                while (rs.next()) {
                    userIds.add(rs.getInt("userId"));
                    passwords.add(rs.getString("password"));
                }
            }

            String updateSQL =
                "UPDATE User SET password = ? WHERE userId = ?";

            try (PreparedStatement ps =
                    con.prepareStatement(updateSQL)) {

                for (int i = 0; i < userIds.size(); i++) {

                    String password = passwords.get(i);
                    int userId = userIds.get(i);

                    if (password == null || password.isEmpty()) {
                        skipped++;
                        continue;
                    }

                    // Skip passwords that are already BCrypt hashed
                    if (password.startsWith("$2a$")
                            || password.startsWith("$2b$")
                            || password.startsWith("$2y$")) {

                        alreadyHashed++;
                        continue;
                    }

                    // Hash the existing plain-text password
                    String hashedPassword =
                        PasswordUtil.hashPassword(password);

                    ps.setString(1, hashedPassword);
                    ps.setInt(2, userId);

                    ps.addBatch();
                    migrated++;
                }

                ps.executeBatch();
            }

            // Save all changes
            con.commit();

            System.out.println("PASSWORD MIGRATION COMPLETED");
            System.out.println("Migrated passwords: " + migrated);
            System.out.println("Already hashed: " + alreadyHashed);
            System.out.println("Skipped: " + skipped);

        } catch (Exception e) {

            System.out.println("Migration failed. Rolling back.");

            if (con != null) {
                try {
                    con.rollback();
                } catch (SQLException rollbackError) {
                    rollbackError.printStackTrace();
                }
            }

            e.printStackTrace();

        } finally {

            if (con != null) {
                try {
                    con.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
