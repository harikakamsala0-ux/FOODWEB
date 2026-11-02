
package com.tap.model;

public class Restaurant {

    private int restaurantId;
    private String name;
    private String address;
    private String phone;
    private String cuisineType;
    private String delivaryTime;
    private float rating;
    private boolean isActive;
    private String imagePath;
    private int adminUserId;

    public Restaurant() {
    }

    public Restaurant(int restaurantId, String name, String address, String phone, String cuisineType,
            String delivaryTime, float rating, boolean isActive, String imagePath, int adminUserId) {

        super();
        this.restaurantId = restaurantId;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisineType = cuisineType;
        this.delivaryTime = delivaryTime;
        this.rating = rating;
        this.isActive = isActive;
        this.imagePath = imagePath;
        this.adminUserId = adminUserId;
    }

    public Restaurant(String name, String address, String phone, String cuisineType, String delivaryTime,
            float rating, boolean isActive, String imagePath, int adminUserId) {

        super();
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisineType = cuisineType;
        this.delivaryTime = delivaryTime;
        this.rating = rating;
        this.isActive = isActive;
        this.imagePath = imagePath;
        this.adminUserId = adminUserId;
    }

    public int getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(int restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCuisineType() {
        return cuisineType;
    }

    public void setCuisineType(String cuisineType) {
        this.cuisineType = cuisineType;
    }

    public String getDelivaryTime() {
        return delivaryTime;
    }

    public void setDelivaryTime(String delivaryTime) {
        this.delivaryTime = delivaryTime;
    }

    public float getRating() {
        return rating;
    }

    public void setRating(float rating) {
        this.rating = rating;
    }

    public boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public int getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(int adminUserId) {
        this.adminUserId = adminUserId;
    }

    @Override
    public String toString() {
        return "Restaurant [restaurantId=" + restaurantId + ", name=" + name + ", address=" + address + ", phone="
                + phone + ", cuisineType=" + cuisineType + ", delivaryTime=" + delivaryTime + ", rating=" + rating
                + ", isActive=" + isActive + ", imagePath=" + imagePath + ", adminUserId=" + adminUserId + "]";
    }
}
