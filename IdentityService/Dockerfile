# Build stage: compile the Spring Boot app into a jar
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only the files Maven needs first so Docker can cache dependencies better
COPY pom.xml .
COPY src ./src

# Build the app without running tests inside the image build
RUN mvn -B -DskipTests package

# Runtime stage: keep the final image small
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the jar built in the previous stage
COPY --from=build /app/target/*.jar app.jar

# This is the port the service listens on inside the container
EXPOSE 8084

# Start the service
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
