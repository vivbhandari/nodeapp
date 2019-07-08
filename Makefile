IMAGE=vivekbhandari/nodeapp

image:
	docker build -t ${IMAGE} .

start-dev:
	docker run -dt --name nodeapp --hostname nodeapp -p 3000:3000 ${IMAGE}

start:
	docker-compose -f docker-compose.yml up -d

stop:
	docker stop `docker ps --no-trunc -aq`
	docker rm `docker ps --no-trunc -aq`

