package com.careerpath.backend;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.time.Instant;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // frontend called from different port, so allow cross-origin requests
public class UserController {

    private final Firestore db;

    public UserController(Firestore db) {
        this.db = db;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection("users").whereEqualTo("email", user.getEmail()).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            if (!documents.isEmpty()) {
                return ResponseEntity.badRequest().body("Registration failed. A user with this email already exists.");
            }

            if (user.getJoinDate() == null || user.getJoinDate().isBlank()) {
                user.setJoinDate(new Date().toString());
            }
            if (user.getSearchHistory() == null) {
                user.setSearchHistory(new ArrayList<>());
            }

            ApiFuture<WriteResult> writeResult = db.collection("users").document(user.getEmail()).set(user);
            writeResult.get();

            return ResponseEntity.ok("User registered successfully!");
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error during registration: " + e.getMessage());
            return ResponseEntity.badRequest().body("Registration failed. An internal error occurred.");
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signInUser(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        try {
            // Retrieve user from Firestore
            User user = db.collection("users").document(email).get().get().toObject(User.class);

            if (user != null && user.getPassword().equals(password)) {
                user.setPassword(null);
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.badRequest().body("Invalid email or password.");
            }
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error during sign-in: " + e.getMessage());
            return ResponseEntity.badRequest().body("Sign-in failed. An internal error occurred.");
        }
    }

    @PostMapping("/{email}/search-history")
    public ResponseEntity<?> saveSearchHistory(
            @PathVariable String email,
            @RequestBody SearchHistory searchHistory
    ) {
        try {
            DocumentSnapshot snapshot = db.collection("users").document(email).get().get();
            User user = snapshot.toObject(User.class);

            if (user == null) {
                return ResponseEntity.badRequest().body("Cannot save quiz result. User was not found.");
            }

            if (searchHistory.getDate() == null) {
                searchHistory.setDate(new Date());
            }

            List<SearchHistory> history = user.getSearchHistory();
            if (history == null) {
                history = new ArrayList<>();
            }

            history.add(searchHistory);
            if (history.size() > 10) {
                history = new ArrayList<>(history.subList(history.size() - 10, history.size()));
            }

            db.collection("users").document(email).update("searchHistory", history).get();
            return ResponseEntity.ok(history);
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error saving search history: " + e.getMessage());
            return ResponseEntity.badRequest().body("Quiz result could not be saved.");
        }
    }

    @GetMapping("/{email}/search-history")
    public ResponseEntity<?> getSearchHistory(@PathVariable String email) {
        try {
            DocumentSnapshot snapshot = db.collection("users").document(email).get().get();
            User user = snapshot.toObject(User.class);

            if (user == null) {
                return ResponseEntity.badRequest().body("User was not found.");
            }

            return ResponseEntity.ok(user.getSearchHistory() == null ? List.of() : user.getSearchHistory());
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error loading search history: " + e.getMessage());
            return ResponseEntity.badRequest().body("Quiz history could not be loaded.");
        }
    }

    @DeleteMapping("/{email}/search-history/{date}")
    public ResponseEntity<?> deleteSearchHistory(
            @PathVariable String email,
            @PathVariable String date
    ) {
        try {
            DocumentSnapshot snapshot = db.collection("users").document(email).get().get();
            User user = snapshot.toObject(User.class);

            if (user == null) {
                return ResponseEntity.badRequest().body("User was not found.");
            }

            List<SearchHistory> history = user.getSearchHistory();
            if (history == null) {
                return ResponseEntity.ok(List.of());
            }

            history = new ArrayList<>(history);
            boolean removed = history.removeIf(item -> isSameSavedResultDate(item.getDate(), date));

            if (!removed) {
                return ResponseEntity.badRequest().body("Saved result was not found.");
            }

            db.collection("users").document(email).update("searchHistory", history).get();
            return ResponseEntity.ok(history);
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error deleting search history: " + e.getMessage());
            return ResponseEntity.badRequest().body("Quiz result could not be deleted.");
        }
    }

    private boolean isSameSavedResultDate(Date savedDate, String requestedDate) {
        if (savedDate == null || requestedDate == null) {
            return false;
        }

        if (savedDate.toString().equals(requestedDate) || savedDate.toInstant().toString().equals(requestedDate)) {
            return true;
        }

        try {
            return savedDate.toInstant().equals(Instant.parse(requestedDate));
        } catch (RuntimeException ignored) {
            return false;
        }
    }
}
