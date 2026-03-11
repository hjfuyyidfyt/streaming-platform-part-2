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

# Stage 2: Serve the app with Node.js
FROM node:22-alpine

WORKDIR /app

# Install 'serve' globally to host static files
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# EXPOSE must be a static number, not a variable. 
# We explicitly expose 8080 and Railway's proxy will detect this and route web traffic here.
ENV PORT=8080
EXPOSE 8080

# Explicitly bind serve to 0.0.0.0:8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]
