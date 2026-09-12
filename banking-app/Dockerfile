# Build stage: Maven + JDK 17 prepare the app jar
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage: slim JRE with just the jar
FROM eclipse-temurin:17-jre
WORKDIR /workspace
COPY --from=build /workspace/target/banking-service-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]