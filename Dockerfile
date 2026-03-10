# Multi-stage Dockerfile for vPlyer

# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS frontend-build
WORKDIR /build

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy all source files and build
COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.cjs ./
COPY tailwind.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# --- Stage 2: Backend & Runtime ---
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build results
COPY --from=frontend-build /build/dist/ ./dist/

# Create necessary directories
RUN mkdir -p backend/temp_uploads backend/temp_transcodes backend/thumbnails

# Environment variables
ENV PORT=8000
ENV HOST=0.0.0.0

EXPOSE 8000

# Start application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
