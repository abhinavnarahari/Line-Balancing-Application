# ==============================================================================
# Multi-Stage Production Dockerfile for QTech Line Balancing Spring Boot Backend
# Java 21 LTS | Alpine Runtime | Non-Root Security | JVM Container Optimizations
# ==============================================================================

# Stage 1: Build & Package
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# 1. Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Build application JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine AS runner

# Install curl for healthcheck & dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache curl dumb-init

# Create non-privileged system user for container security
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy executable jar from builder stage
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

# Switch to non-root user
USER appuser:appgroup

# Cloud Run defaults to $PORT (usually 8085 or 8080)
ENV PORT=8085 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8085

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
