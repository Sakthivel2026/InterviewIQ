# Multi-stage production build for InterviewIQ Node.js Server & React Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm ci

# Copy full source
COPY . .

# Generate Prisma client & build production assets
RUN npm --prefix server run db:generate
RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY server/prisma ./server/prisma

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled build artifacts from builder stage
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
