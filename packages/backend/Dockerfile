# Multi-stage build for Node.js backend
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
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Production build
FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nextjs:nodejs logs

USER nextjs
EXPOSE 3001
CMD ["npm", "start"]