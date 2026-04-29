package com.careerpath.backend;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CareerService {

    // This is the career database logic moved from the frontend script.js file.
    private static final Map<String, CareerData> CAREER_DATABASE = new HashMap<>();

    static {
        CAREER_DATABASE.put("technology", new CareerData(
                List.of("coding", "programming", "tech", "computer", "software", "web", "app", "developer", "engineer", "ai", "data", "cybersecurity", "javascript", "python", "html", "css", "react", "node"),
                List.of("Software Developer", "Data Scientist", "AI Engineer", "Web Developer", "Cybersecurity Specialist", "DevOps Engineer", "Mobile App Developer", "Full Stack Developer"),
                "Technology offers endless opportunities to innovate, solve complex problems, and shape the future through code and digital solutions.",
                List.of(
                        new CareerData.Resource("FreeCodeCamp", "https://www.freecodecamp.org/"),
                        new CareerData.Resource("Coursera Tech Courses", "https://www.coursera.org/browse/computer-science")
                )
        ));

        CAREER_DATABASE.put("creative", new CareerData(
                List.of("art", "design", "drawing", "creative", "music", "writing", "photography", "video", "animation", "painting", "graphic", "visual", "illustration", "ui", "ux"),
                List.of("Graphic Designer", "UX/UI Designer", "Animator", "Content Creator", "Photographer", "Digital Artist", "Video Editor", "Creative Director"),
                "Creative fields allow you to express yourself while building meaningful experiences that inspire and engage audiences worldwide.",
                List.of(
                        new CareerData.Resource("Adobe Creative Suite", "https://www.adobe.com/creativecloud.html"),
                        new CareerData.Resource("Behance Portfolio", "https://www.behance.net/")
                )
        ));

        CAREER_DATABASE.put("business", new CareerData(
                List.of("business", "management", "marketing", "sales", "finance", "startup", "entrepreneur", "leadership", "strategy", "accounting", "commerce", "economics"),
                List.of("Business Analyst", "Marketing Manager", "Financial Analyst", "Entrepreneur", "Product Manager", "Sales Manager", "Operations Manager", "Management Consultant"),
                "Business careers are a strong fit when you enjoy planning, leading teams, understanding markets, and turning ideas into sustainable results.",
                List.of(
                        new CareerData.Resource("Harvard Business Review", "https://hbr.org/"),
                        new CareerData.Resource("Khan Academy Finance", "https://www.khanacademy.org/economics-finance-domain")
                )
        ));

        CAREER_DATABASE.put("healthcare", new CareerData(
                List.of("health", "healthcare", "doctor", "medicine", "nursing", "biology", "patient", "care", "therapy", "mental", "fitness", "nutrition", "medical"),
                List.of("Doctor", "Nurse", "Physiotherapist", "Clinical Psychologist", "Nutritionist", "Medical Researcher", "Pharmacist", "Healthcare Administrator"),
                "Healthcare paths suit people who want to improve lives directly through science, empathy, patient care, and long-term service.",
                List.of(
                        new CareerData.Resource("Khan Academy Health and Medicine", "https://www.khanacademy.org/science/health-and-medicine"),
                        new CareerData.Resource("Coursera Healthcare Courses", "https://www.coursera.org/browse/health")
                )
        ));

        CAREER_DATABASE.put("education", new CareerData(
                List.of("teach", "teacher", "education", "learning", "mentor", "training", "school", "students", "knowledge", "coaching", "tutor", "professor"),
                List.of("Teacher", "Instructional Designer", "Professor", "Career Counselor", "Corporate Trainer", "Education Consultant", "Curriculum Developer", "Tutor"),
                "Education careers are ideal if you like explaining ideas, guiding people, designing learning experiences, and helping others grow.",
                List.of(
                        new CareerData.Resource("edX Education Courses", "https://www.edx.org/learn/education"),
                        new CareerData.Resource("FutureLearn Teaching Courses", "https://www.futurelearn.com/subjects/teaching-courses")
                )
        ));

        CAREER_DATABASE.put("science", new CareerData(
                List.of("science", "research", "physics", "chemistry", "biology", "environment", "space", "math", "experiment", "laboratory", "innovation", "analysis"),
                List.of("Research Scientist", "Environmental Scientist", "Lab Technician", "Biotechnologist", "Data Analyst", "Astronomer", "Chemical Engineer", "Mathematician"),
                "Science careers reward curiosity, careful observation, experimentation, and the drive to discover how the world works.",
                List.of(
                        new CareerData.Resource("MIT OpenCourseWare", "https://ocw.mit.edu/"),
                        new CareerData.Resource("NASA STEM Resources", "https://www.nasa.gov/learning-resources/")
                )
        ));

        CAREER_DATABASE.put("sports", new CareerData(
                List.of("sports", "fitness", "athlete", "coach", "game", "training", "exercise", "physical", "team", "competition", "wellness", "gym"),
                List.of("Professional Athlete", "Sports Coach", "Fitness Trainer", "Sports Analyst", "Physiotherapist", "Sports Psychologist", "Event Manager", "Physical Education Teacher"),
                "Sports careers fit energetic people who enjoy performance, discipline, teamwork, coaching, and helping others build physical confidence.",
                List.of(
                        new CareerData.Resource("Coursera Sports Courses", "https://www.coursera.org/courses?query=sports"),
                        new CareerData.Resource("ACE Fitness", "https://www.acefitness.org/")
                )
        ));

        CAREER_DATABASE.put("social", new CareerData(
                List.of("social", "community", "help", "service", "people", "volunteer", "justice", "public", "nonprofit", "communication", "counseling", "support"),
                List.of("Social Worker", "Counselor", "Public Relations Specialist", "Community Manager", "NGO Program Manager", "Human Resources Specialist", "Policy Analyst", "Journalist"),
                "Social-impact careers are a strong match if you care about people, communication, advocacy, and improving communities.",
                List.of(
                        new CareerData.Resource("UN Volunteers", "https://www.unv.org/"),
                        new CareerData.Resource("Idealist", "https://www.idealist.org/")
                )
        ));
    }

    public List<Map<String, Object>> findMatchingCareers(String userInput) {
        List<Map<String, Object>> matches = new ArrayList<>();
        
        for (Map.Entry<String, CareerData> entry : CAREER_DATABASE.entrySet()) {
            String category = entry.getKey();
            CareerData data = entry.getValue();
            
            int score = 0;
            List<String> foundKeywords = new ArrayList<>();
            for (String keyword : data.getKeywords()) {
                if (userInput.contains(keyword)) {
                    score++;
                    foundKeywords.add(keyword);
                }
            }

            if (score > 0) {
                Map<String, Object> match = new HashMap<>();
                match.put("category", category);
                match.put("careers", data.getCareers());
                match.put("description", data.getDescription());
                match.put("resources", data.getResources());
                match.put("score", score);
                match.put("keywordCount", data.getKeywords().size());
                match.put("foundKeywords", foundKeywords);
                matches.add(match);
            }
        }

        // Sort by relevance score in descending order.
        matches.sort((a, b) -> (int)b.get("score") - (int)a.get("score"));
        
        return matches;
    }
}

