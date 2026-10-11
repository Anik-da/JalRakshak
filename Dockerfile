# ==============================================================================
# JalRakshak AI — OCI Container Definition (AWS Finch / ECS / App Runner)
# Built on Amazon Corretto & Node.js for high-performance serverless containers
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy all source code
COPY backend ./backend
COPY frontend ./frontend

# Build backend and frontend
RUN npm run build --workspace=backend
RUN npm run build --workspace=frontend

# ==============================================================================
# Production Runtime Container
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV AWS_REGION=ap-south-1

# Copy built artifacts and dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --workspace=backend

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/policies ./backend/policies
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3001

CMD ["node", "backend/dist/localServer.js"]
