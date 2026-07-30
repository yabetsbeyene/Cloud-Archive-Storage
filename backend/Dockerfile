FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar
COPY --chmod=0755 render-entrypoint.sh /app/render-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/render-entrypoint.sh"]
