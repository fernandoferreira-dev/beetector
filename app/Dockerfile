FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx expo start

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]