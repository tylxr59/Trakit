FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Prune dev dependencies
RUN npm prune --omit=dev

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_DB_PATH=/app/data/trakit.db

# Run migrations and start app
CMD ["sh", "-c", "npm run migrate:up && node build"]
