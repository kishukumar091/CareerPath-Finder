package com.careerpath.backend;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Configuration
    static class FirestoreConfig {
        @Bean
        public Firestore firestore(
                @Value("${firebase.service-account.json:}") String serviceAccountJson,
                @Value("${firebase.service-account.path:}") String serviceAccountPath,
                @Value("${firebase.project-id:}") String projectId
        ) throws IOException {
            GoogleCredentials credentials;
            if (StringUtils.hasText(serviceAccountJson)) {
                try (ByteArrayInputStream credentialsStream =
                             new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))) {
                    credentials = GoogleCredentials.fromStream(credentialsStream);
                }
            } else if (StringUtils.hasText(serviceAccountPath)) {
                try (FileInputStream credentialsStream = new FileInputStream(serviceAccountPath)) {
                    credentials = GoogleCredentials.fromStream(credentialsStream);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }

            FirestoreOptions.Builder optionsBuilder = FirestoreOptions.newBuilder().setCredentials(credentials);
            if (StringUtils.hasText(projectId)) {
                optionsBuilder.setProjectId(projectId);
            }

            FirestoreOptions options = optionsBuilder.build();
            return options.getService();
        }
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Allows all origins, methods, and headers for development
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
