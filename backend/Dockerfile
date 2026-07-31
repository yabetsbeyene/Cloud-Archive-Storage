FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

COPY deployment-entrypoint.sh /workspace/deployment-entrypoint.sh
RUN sed -i 's/\r$//' /workspace/deployment-entrypoint.sh && chmod 0755 /workspace/deployment-entrypoint.sh

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar
COPY --from=build /workspace/deployment-entrypoint.sh /app/deployment-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/deployment-entrypoint.sh"]
