# Use multi-stage build for optimization
FROM node:18-alpine as base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --omit=dev
RUN cd client && npm ci --omit=dev

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 tmsuser

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Copy application code
COPY . .
RUN chown -R tmsuser:nodejs /app

# Build client
RUN cd client && npm run build

# Create uploads directory
RUN mkdir -p uploads && chown -R tmsuser:nodejs uploads

USER tmsuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]