# 1. Sử dụng image Maven để build ứng dụng
FROM maven:3.8.4-openjdk-17-slim AS build

# 2. Đặt thư mục làm việc
WORKDIR /app

# 3. Sao chép file pom.xml và tải các phụ thuộc Maven (dependency)
COPY pom.xml .
RUN mvn dependency:go-offline

# 4. Sao chép mã nguồn vào container
COPY src /app/src

# 5. Build file JAR từ mã nguồn
RUN mvn clean package -DskipTests

# 6. Sử dụng image JDK để chạy ứng dụng
FROM openjdk:17-jdk-slim

# 7. Đặt thư mục làm việc cho container
WORKDIR /app

# 8. Sao chép file JAR đã build từ bước trước vào container
COPY --from=build /app/target/your-application.jar /app/your-application.jar

# 9. Mở cổng mà ứng dụng sẽ chạy trên container
EXPOSE 8080

# 10. Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "/app/your-application.jar"]





# # Sử dụng base image JDK 17
# FROM eclipse-temurin:17-jre

# LABEL maintainer="lminhkhanh231@gmail.com"

# WORKDIR /app

# COPY target/airbnb_service-0.0.1-SNAPSHOT.jar app.jar

# EXPOSE 8080

# ENTRYPOINT ["java", "-jar", "/app/app.jar"]
