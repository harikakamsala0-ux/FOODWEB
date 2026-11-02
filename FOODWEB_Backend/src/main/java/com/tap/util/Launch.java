package com.tap.util;
import com.tap.model.User;
import com.tap.DaoImpl.UserDaoImpl;
import java.util.*;



public class Launch {
	
	public static void main(String[] args) {
		Scanner sc=new Scanner(System.in);
		System.out.println("Enter the Username: ");
		String userName=sc.nextLine();
		System.out.println("Enter the Password: ");
		String password=sc.nextLine();
		System.out.println("Enter the Email: ");
		String email=sc.nextLine();
		System.out.println("Enter the Phone: ");
		String phone=sc.nextLine();
		System.out.println("Enter the Address: ");
		String address=sc.nextLine();
		System.out.println("Enter the Role: ");
		String role=sc.nextLine();
		
		
		User u=new User(userName,password,email,phone,address,role);
		UserDaoImpl udao=new UserDaoImpl();
		udao.addUser(u);
		System.out.println("ENter the id");
		int id=sc.nextInt();
	    u=udao.getUser(id);
		u.setAddress("ks");
		udao.updateUser(u);
		//udao.deleteUser(id);
		System.out.println(udao.getAllUsers());
		
		sc.close();
		
	}

}
