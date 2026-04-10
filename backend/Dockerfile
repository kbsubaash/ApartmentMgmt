# Build stage
FROM node:20-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install --omit=dev

EXPOSE 5000

# Start command
CMD ["npm", "run", "start"]
