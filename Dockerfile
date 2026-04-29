# syntax=docker/dockerfile:1.7

FROM node:lts-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:80 || exit 1
EXPOSE 80
