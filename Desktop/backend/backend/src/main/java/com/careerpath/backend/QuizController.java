package com.careerpath.backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allows requests from your frontend
public class QuizController {

    private final CareerService careerService;

    public QuizController(CareerService careerService) {
        this.careerService = careerService;
    }

    @PostMapping("/find-career")
    public ResponseEntity<List<Map<String, Object>>> findCareer(@RequestBody Map<String, String> userInputs) {
        String userInputString = String.join(" ",
                userInputs.getOrDefault("hobby", ""),
                userInputs.getOrDefault("dream", ""),
                userInputs.getOrDefault("aim", ""),
                userInputs.getOrDefault("skills", "")
        ).toLowerCase();
        
        List<Map<String, Object>> recommendations = careerService.findMatchingCareers(userInputString);
        return ResponseEntity.ok(recommendations);
    }
}
