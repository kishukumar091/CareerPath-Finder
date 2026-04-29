package com.careerpath.backend;

import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.Map;

// @Data is a Lombok annotation to generate getters, setters, toString, equals, and hashCode methods.
@Data
public class SearchHistory {
    private String hobby;
    private String dream;
    private String aim;
    private String skills;
    private List<String> matchedCategories;
    private List<Map<String, Object>> matches;
    private Date date;
}
