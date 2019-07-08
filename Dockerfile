FROM alpine:3.9.4

RUN mkdir -p /opt/nodeapp

WORKDIR /opt/nodeapp

COPY index.js .

RUN apk add nodejs
RUN apk add --update nodejs npm

RUN npm init --yes
RUN npm i express
RUN npm i joi
RUN npm i mysql
RUN npm i -g nodemon

EXPOSE 3000

CMD [ "/bin/sh", "-c", "sleep 3 && nodemon" ]