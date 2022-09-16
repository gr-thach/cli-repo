# Stage 1 - Install dockerize
FROM node:lts-alpine3.14 AS dev
WORKDIR /app

ENV AMQP_HOST=rabbitmq:5672
EXPOSE 3000

# Adding dockerize for using features like "wait for the db to connect"
RUN apk add --no-cache openssl bash
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
  && rm dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Stage 2 - Install only production dependencies
FROM dev AS production-dependencies
WORKDIR /app

COPY package*.json ./
RUN npm set progress=false && npm config set depth 0 && npm i --only=production

# Stage 3 - Install dev dependencies and build the application
FROM production-dependencies AS build
WORKDIR /app

RUN npm set progress=false && npm config set depth 0 && npm i

COPY src src
COPY scripts scripts
COPY config.js index.js newrelic.js sentry.js tsconfig.json ./
RUN npm run build

# Stage 4 - Run application in production mode
FROM production-dependencies AS production-run
WORKDIR /app

# Create log file for New Relic. Otherwise New Relic will complain that it doesn't have permission to write to the log file (because we don't run as root user).
RUN touch newrelic_agent.log && \
    chown 1000:0 newrelic_agent.log && \
    chmod g+rw newrelic_agent.log

COPY --from=build /app/dist ./dist

USER 1000
CMD dockerize -wait tcp://$AMQP_HOST -timeout 30s npm start
