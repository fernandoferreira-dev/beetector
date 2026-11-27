# syntax=docker/dockerfile:1

# Stage 1: Build the Angular frontend
FROM node:22-alpine AS web-build
WORKDIR /app/web

COPY web/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY web/ ./
RUN npm run build -- --configuration production

# Stage 2: Build the Spring Boot backend with Java 25
FROM maven:3.9-eclipse-temurin-25-alpine AS api-build
WORKDIR /app/api

COPY api/pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

COPY api/src ./src
COPY --from=web-build /app/web/dist/*/browser/ ./src/main/resources/static/

RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B

# Stage 3: Final lightweight runtime image with Java 25
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

COPY --from=api-build /app/api/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]