FROM eclipse-temurin:17-jdk AS build

WORKDIR /app
COPY . .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/career-path-finder-backend-0.0.1-SNAPSHOT.jar app.jar

CMD ["java", "-jar", "app.jar"]
