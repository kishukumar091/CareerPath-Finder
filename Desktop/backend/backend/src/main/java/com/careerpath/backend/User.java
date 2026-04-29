package com.careerpath.backend;

import lombok.Data;
import java.util.List;

// @Data is a Lombok annotation to generate getters, setters, toString, equals, and hashCode methods.
@Data
public class User {
    private String id; // This will store the Firestore document ID or Firebase Auth UID.
    private String name;
    private String email;
    // Note: It's a bad practice to store plaintext passwords. In a real application, you would store a hashed password.
    private String password;
    private String joinDate;
    private List<SearchHistory> searchHistory;
}
