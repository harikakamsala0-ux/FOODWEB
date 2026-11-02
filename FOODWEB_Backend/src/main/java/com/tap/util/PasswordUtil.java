package com.tap.util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordUtil {

    // Convert plain-text password into BCrypt hash
    public static String hashPassword(String password) {

        return BCrypt.hashpw(
            password,
            BCrypt.gensalt(12)
        );
    }

    // Verify entered password against stored BCrypt hash
    public static boolean checkPassword(
            String enteredPassword,
            String storedHash) {

        if (enteredPassword == null || storedHash == null) {
            return false;
        }

        try {
            return BCrypt.checkpw(enteredPassword, storedHash);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}