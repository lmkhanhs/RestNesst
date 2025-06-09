# Sử dụng base image JDK 17
FROM eclipse-temurin:17-jre

LABEL maintainer="lminhkhanh231@gmail.com"

WORKDIR /app

COPY target/airbnb_service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
