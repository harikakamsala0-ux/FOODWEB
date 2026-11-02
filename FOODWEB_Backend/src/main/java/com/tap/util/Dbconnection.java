package com.tap.util;

import java.sql.DriverManager;
import java.sql.Connection;
import java.sql.SQLException;

public class Dbconnection {
	private static final String URL="jdbc:mysql://localhost:3306/FoodDeliveryDB";
	private static final String USERNAME="root";
	private static final String PASSWORD = "YOUR_DB_PASSWORD";
	private static Connection con;
	public static Connection getConnetion() {
		try{
			Class.forName("com.mysql.cj.jdbc.Driver");
			con=DriverManager.getConnection(URL,USERNAME,PASSWORD);
			
		} catch (ClassNotFoundException |SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return con;
	}

}
