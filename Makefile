IMAGE=vivekbhandari/nodeapp

image-dev:
	docker build -f ./Dockerfile_dev -t ${IMAGE} .

image:
	docker build -t ${IMAGE} .

start-dev:
	docker run -dt --name nodeapp --hostname nodeapp -p 3000:3000 ${IMAGE}

start:
	docker-compose -f docker-compose.yml up -d

redis:
	docker run -it --network nodeapp_mynet123 --rm redis redis-cli -h redis

mysql:
	docker exec -ti nodeapp_mysql_1 mysql -u root -proot

logs:
	docker logs -f nodeapp_nodeapp_1

stop:
	docker stop `docker ps --no-trunc -aq`
	docker rm `docker ps --no-trunc -aq`

