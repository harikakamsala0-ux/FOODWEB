package com.tap.model;

import java.sql.Timestamp;
public class User {
	private int userId;
	private String userName;
	private String password;
	private String email;
	private String phone;
	private String address;
	private String role;
	private Timestamp createdDate;
	private Timestamp lastLoginDate;
	
	public User() {
		
	}
	
	public User(String userName, String password, String email, String phone, String address, String role) {
		super();
		this.userName = userName;
		this.password = password;
		this.email = email;
		this.phone = phone;
		this.address = address;
		this.role = role;
	}
	
	public User(int userId, String userName, String password, String email, String phone, String address, String role,
			Timestamp createdDate, Timestamp lastLoginDate) {
		super();
		this.userId = userId;
		this.userName = userName;
		this.password = password;
		this.email = email;
		this.phone = phone;
		this.address = address;
		this.role = role;
		this.createdDate = createdDate;
		this.lastLoginDate = lastLoginDate;
	}

	public User(String userName,String password,String email,String phone,String address,String role,
	 Timestamp createdDate,
	Timestamp lastLoginDate) {
		
		this.userName=userName;
		this.password=password;
		this.email=email;
		this.phone=phone;
		this.address=address;
		this.role=role;
		this.createdDate=createdDate;
		this.lastLoginDate=lastLoginDate;
		
		
	}
	
	
	public int getUserId() {
		return userId;
	}

	public void setUserId(int userId) {
		this.userId = userId;
	}

	public void setUserName(String userName) {
		this.userName=userName;
		
	}
	public void setPassword(String password) {
		this.password=password;
		
	}
	public void setEmail(String email) {
		this.email=email;
		
	}
	public void setPhone(String phone) {
		this.phone=phone;
		
	}
	public void setAddress(String address) {
		this.address=address;
	}
	public void setRole(String role) {
		this.role=role;
	}
	public void setCreatedDate(Timestamp createdDate) {
		this.createdDate=createdDate;
	}
	public void setLastLoginDate(Timestamp lastLoginDate) {
		this.lastLoginDate=lastLoginDate;
	
	}
	
	public String getUserName() {
		return userName;
	}
	public String getPassword() {
		return password;
	}
	public String getEmail() {
		return email;
	}
	public String getPhone() {
		return phone;
	}
	public String getAddress() {
		return address;
	}
	public String getRole() {
		return role;
	}
	public Timestamp getCreatedDate() {
		return createdDate;
	}
	public Timestamp getLastLoginDate() {
		return lastLoginDate;
	}
	
	@Override
	public String toString() {
	    return "User [userId=" + userId
	            + ", userName=" + userName
	            + ", email=" + email
	            + ", phone=" + phone
	            + ", address=" + address
	            + ", role=" + role
	            + ", createdDate=" + createdDate
	            + ", lastLoginDate=" + lastLoginDate + "]";
	}

	
	
	
	

	
}
