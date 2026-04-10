# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy server.js
COPY server.js .

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
