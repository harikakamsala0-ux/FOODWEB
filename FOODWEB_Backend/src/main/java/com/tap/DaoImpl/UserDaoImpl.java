
package com.tap.DaoImpl;
import com.tap.util.PasswordUtil;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.tap.Dao.UserDao;
import com.tap.model.User;
import com.tap.util.Dbconnection;
import com.tap.util.GetUser;

public class UserDaoImpl implements UserDao {

    private static final String SELECT_QUERY =
        "SELECT * FROM User WHERE userId = ?";

    private static final String SELECT_QUERY_EMAIL =
        "SELECT * FROM User WHERE email = ?";

    private static final String INSERT_QUERY =
        "INSERT INTO User "
        + "(userName, password, email, phone, address, role, "
        + "createdDate, lastLoginDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    private static final String UPDATE_QUERY =
        "UPDATE User SET userName = ?, password = ?, email = ?, "
        + "phone = ?, address = ?, role = ?, lastLoginDate = ? "
        + "WHERE userId = ?";

    private static final String UPDATE_PROFILE_QUERY =
        "UPDATE User SET userName = ?, email = ?, phone = ?, "
        + "address = ? WHERE userId = ?";

    private static final String DELETE_QUERY =
        "DELETE FROM User WHERE userId = ?";

    private static final String SELECT_ALL_QUERY =
        "SELECT * FROM User";

    private Connection con = Dbconnection.getConnetion();

    @Override
    public void addUser(User user) {
        Timestamp now = new Timestamp(System.currentTimeMillis());

        try (PreparedStatement ps = con.prepareStatement(INSERT_QUERY)) {
            ps.setString(1, user.getUserName());
            ps.setString(2, user.getPassword());
            ps.setString(3, user.getEmail());
            ps.setString(4, user.getPhone());
            ps.setString(5, user.getAddress());
            ps.setString(6, user.getRole());
            ps.setTimestamp(7, now);
            ps.setTimestamp(8, now);

            ps.executeUpdate();

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public User getUser(int userId) {
        try (PreparedStatement ps = con.prepareStatement(SELECT_QUERY)) {
            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                return GetUser.extractUserFromResultSet(rs);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public User getUserByEmail(String email) {
        try (PreparedStatement ps =
                con.prepareStatement(SELECT_QUERY_EMAIL)) {

            ps.setString(1, email);

            try (ResultSet rs = ps.executeQuery()) {
                return GetUser.extractUserFromResultSet(rs);
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }


	@Override
	public void updateUser(User user) {
	
	    try (PreparedStatement ps = con.prepareStatement(UPDATE_QUERY)) {
	
	        String password = user.getPassword();
	
	        // Hash the password only if it is not already BCrypt
	        if (password != null
	                && !password.startsWith("$2a$")
	                && !password.startsWith("$2b$")
	                && !password.startsWith("$2y$")) {
	
	            password = PasswordUtil.hashPassword(password);
	        }
	
	        ps.setString(1, user.getUserName());
	        ps.setString(2, password);
	        ps.setString(3, user.getEmail());
	        ps.setString(4, user.getPhone());
	        ps.setString(5, user.getAddress());
	        ps.setString(6, user.getRole());
	
	        ps.setTimestamp(
	            7,
	            new Timestamp(System.currentTimeMillis())
	        );
	
	        ps.setInt(8, user.getUserId());
	
	        ps.executeUpdate();
	
	    } catch (SQLException e) {
	        e.printStackTrace();
	    }
	}


    @Override
    public boolean updateProfile(
            int userId,
            String userName,
            String email,
            String phone,
            String address) throws SQLException {

        String checkEmail =
            "SELECT userId FROM User WHERE email = ? AND userId <> ?";

        try (PreparedStatement check = con.prepareStatement(checkEmail)) {
            check.setString(1, email);
            check.setInt(2, userId);

            try (ResultSet rs = check.executeQuery()) {
                if (rs.next()) {
                    return false;
                }
            }
        }

        try (PreparedStatement ps =
                con.prepareStatement(UPDATE_PROFILE_QUERY)) {

            ps.setString(1, userName);
            ps.setString(2, email);
            ps.setString(3, phone);
            ps.setString(4, address);
            ps.setInt(5, userId);

            return ps.executeUpdate() > 0;
        }
    }

    @Override
    public void deleteUser(int userId) {
        try (PreparedStatement ps = con.prepareStatement(DELETE_QUERY)) {
            ps.setInt(1, userId);
            ps.executeUpdate();

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public List<User> getAllUsers() {
        List<User> users = new ArrayList<>();

        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(SELECT_ALL_QUERY)) {

            while (rs.next()) {
                int id = rs.getInt(1);
                String name = rs.getString(2);
                String password = rs.getString(3);
                String email = rs.getString(4);
                String phone = rs.getString(5);
                String address = rs.getString(6);
                String role = rs.getString(7);
                Timestamp createdDate = rs.getTimestamp(8);
                Timestamp lastLoginDate = rs.getTimestamp(9);

                User user = new User(
                    id, name, password, email, phone, address,
                    role, createdDate, lastLoginDate
                );

                users.add(user);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return users;
    }

	@Override
	public int getTotalCustomerCount() {
	
	    if (con == null) {
	        System.out.println("Database connection failed!");
	        return 0;
	    }
	
	    String query =
	        "SELECT COUNT(*) FROM User " +
	        "WHERE UPPER(TRIM(role)) = 'CUSTOMER'";
	
	    try (PreparedStatement ps = con.prepareStatement(query);
	         ResultSet rs = ps.executeQuery()) {
	
	        if (rs.next()) {
	            return rs.getInt(1);
	        }
	
	    } catch (SQLException e) {
	        e.printStackTrace();
	    }
	
	    return 0;
	}

}
