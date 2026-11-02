
package com.tap.util;

import java.util.List;
import java.util.Locale;
import java.util.Properties;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

public class EmailUtil {

    public static void sendOrderConfirmation(
            String recipientEmail,
            String customerName,
            int orderId,
            List<String> items,
            double totalAmount,
            String paymentMode) throws MessagingException {

        String senderEmail = System.getenv("FOODWEB_EMAIL");
        String appPassword = System.getenv("FOODWEB_APP_PASSWORD");

        if (senderEmail == null || senderEmail.isBlank()
                || appPassword == null || appPassword.isBlank()) {
            throw new IllegalStateException(
                    "FOODWEB email environment variables are not configured.");
        }

        Properties properties = new Properties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.host", "smtp.gmail.com");
        properties.put("mail.smtp.port", "587");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.starttls.required", "true");
        properties.put("mail.smtp.connectiontimeout", "10000");
        properties.put("mail.smtp.timeout", "10000");
        properties.put("mail.smtp.writetimeout", "10000");

        Session mailSession = Session.getInstance(
                properties,
                new Authenticator() {
                    @Override
                    protected PasswordAuthentication
                            getPasswordAuthentication() {
                        return new PasswordAuthentication(
                                senderEmail, appPassword);
                    }
                });

        Message message = new MimeMessage(mailSession);
        message.setFrom(new InternetAddress(senderEmail));
        message.setRecipient(
                Message.RecipientType.TO,
                new InternetAddress(recipientEmail));

        message.setSubject("FOODWEB - Your Order Is Confirmed!");

        StringBuilder body = new StringBuilder();
        body.append("Hi ")
            .append(customerName == null ? "Customer" : customerName)
            .append(",\n\n");

        body.append("Thank you for ordering with FOODWEB!\n");
        body.append("Your order has been placed successfully.\n\n");
        body.append("Order ID: ").append(orderId).append("\n\n");
        body.append("Your ordered items:\n");

        for (String item : items) {
            body.append("- ").append(item).append("\n");
        }

        body.append("\nTotal Amount: Rs. ")
            .append(String.format(Locale.US, "%.2f", totalAmount))
            .append("\n");

        body.append("Payment Method: ")
            .append(paymentMode).append("\n");
        body.append("Order Status: PLACED\n\n");
        body.append("Thank you for choosing FOODWEB!\n");
        body.append("Enjoy your meal!\n\n");
        body.append("Team FOODWEB");

        message.setContent(body.toString(), "text/plain; charset=UTF-8");
        Transport.send(message);
    }

    // NEW: Send order cancellation confirmation.
    public static void sendCancellationEmail(
            String recipientEmail,
            String customerName,
            int orderId,
            List<String> items,
            double totalAmount,
            String paymentMode) throws MessagingException {

        String senderEmail = System.getenv("FOODWEB_EMAIL");
        String appPassword = System.getenv("FOODWEB_APP_PASSWORD");

        if (senderEmail == null || senderEmail.isBlank()
                || appPassword == null || appPassword.isBlank()) {
            throw new IllegalStateException(
                    "FOODWEB email environment variables are not configured.");
        }

        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Customer email address is not available.");
        }

        Properties properties = new Properties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.host", "smtp.gmail.com");
        properties.put("mail.smtp.port", "587");
        properties.put("mail.smtp.starttls.enable", "true");
        properties.put("mail.smtp.starttls.required", "true");
        properties.put("mail.smtp.connectiontimeout", "10000");
        properties.put("mail.smtp.timeout", "10000");
        properties.put("mail.smtp.writetimeout", "10000");

        Session mailSession = Session.getInstance(
                properties,
                new Authenticator() {
                    @Override
                    protected PasswordAuthentication
                            getPasswordAuthentication() {
                        return new PasswordAuthentication(
                                senderEmail, appPassword);
                    }
                });

        Message message = new MimeMessage(mailSession);
        message.setFrom(new InternetAddress(senderEmail));
        message.setRecipient(
                Message.RecipientType.TO,
                new InternetAddress(recipientEmail));

        message.setSubject("FOODWEB - Order Cancellation Confirmation");

        StringBuilder body = new StringBuilder();

        body.append("Hi ")
            .append(customerName == null || customerName.isBlank()
                    ? "Customer" : customerName)
            .append(",\n\n");

        body.append("Your FOODWEB order has been cancelled successfully.\n\n");
        body.append("Order ID: ").append(orderId).append("\n\n");
        body.append("Cancelled items:\n");

        if (items != null && !items.isEmpty()) {
            for (String item : items) {
                body.append("- ").append(item).append("\n");
            }
        } else {
            body.append("Order items are not available.\n");
        }

        body.append("\nOrder Amount: Rs. ")
            .append(String.format(Locale.US, "%.2f", totalAmount))
            .append("\n");

        body.append("Payment Method: ")
            .append(paymentMode == null ? "Not available" : paymentMode)
            .append("\n");

        body.append("Order Status: CANCELLED\n\n");
        body.append("If you have already paid, any applicable refund ")
            .append("will be handled according to the payment process.\n\n");
        body.append("Thank you for choosing FOODWEB.\n\n");
        body.append("Team FOODWEB");

        message.setContent(body.toString(), "text/plain; charset=UTF-8");
        Transport.send(message);
    }
}
