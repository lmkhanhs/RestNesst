
# build file jar
mvn clean package -DskipTests

# build Docker image
docker build -t khanhleminhdotcom/airbnb_service:0.99 .

# push repository to cloudy
docker image push khanhleminhdotcom/airbnb_service:0.99

# tạo Docker network (nếu chưa có)
docker network create lmkhanh-network

# chạy MySQL container
docker run --network lmkhanh-network --name mysql-network -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -d mysql

# chạy app container
docker run --network lmkhanh-network -p 8080:8080 --name airbnb-container airbnb_service:0.99
