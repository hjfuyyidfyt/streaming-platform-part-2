# Stage 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the frontend normally
RUN npm run build

# Stage 2: Serve the app with Node.js
FROM node:22-alpine

WORKDIR /app

# Install 'serve' globally to host static files
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Create a startup script that injects runtime environment variables
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "window.env = { VITE_API_BASE_URL: \"$VITE_API_BASE_URL\" };" > /app/dist/env-config.js' >> /app/start.sh && \
    echo 'exec serve -s dist -l tcp://0.0.0.0:${PORT}' >> /app/start.sh && \
    chmod +x /app/start.sh

# EXPOSE must be a static number, not a variable. 
# We explicitly expose 8080 and Railway's proxy will detect this and route web traffic here.
ENV PORT=8080
EXPOSE 8080

# Run the startup script
CMD ["/app/start.sh"]
