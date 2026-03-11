# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Pass the VITE_API_BASE_URL to the build environment
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the frontend (Vite will bake the API URL into the static files)
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Use nginx templates to dynamically listen on the PORT assigned by Railway
RUN mkdir -p /etc/nginx/templates && echo 'server { \
    listen ${PORT}; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Provide a default port definition
ENV PORT=80

CMD ["nginx", "-g", "daemon off;"]
