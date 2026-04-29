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
ENV API_BACKEND_URL=http://backend:8080
EXPOSE 80
