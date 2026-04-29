package com.careerpath.backend;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

// @Data is a Lombok annotation to generate getters, setters, equals, hashCode, and toString methods.
// @AllArgsConstructor generates a constructor with all fields.
// @NoArgsConstructor generates a constructor with no arguments.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CareerData {
    private List<String> keywords;
    private List<String> careers;
    private String description;
    private List<Resource> resources;

    // Inner class to represent a learning resource.
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Resource {
        private String name;
        private String url;
    }
}
