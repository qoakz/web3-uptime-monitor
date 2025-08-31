# Multi-stage build for monitoring node
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm install --only=production

# Development stage
FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nodeapp:nodejs logs

USER nodeapp
EXPOSE 3002
CMD ["npm", "start"]